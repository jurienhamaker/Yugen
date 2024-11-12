package services

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/sarulabs/di/v2"
	"github.com/zekroTJA/shinpuru/pkg/hammertime"
	"github.com/zekrotja/dgrs"
	localStatic "jurien.dev/yugen/kazu/internal/static"
	"jurien.dev/yugen/kazu/internal/utils"
	"jurien.dev/yugen/kazu/prisma/db"
	"jurien.dev/yugen/shared/static"

	"github.com/Pramod-Devireddy/go-exprtk"
)

type GameService struct {
	session  *discordgo.Session
	state    *dgrs.State
	database *db.PrismaClient
	settings *SettingsService
	saves    *SavesService
	points   *PointsService
}

func CreateGameService(container *di.Container) *GameService {
	log.Println("Creating Game Service")
	return &GameService{
		session:  container.Get(static.DiDiscordSession).(*discordgo.Session),
		state:    container.Get(static.DiState).(*dgrs.State),
		database: container.Get(static.DiDatabase).(*db.PrismaClient),
		settings: container.Get(static.DiSettings).(*SettingsService),
		saves:    container.Get(localStatic.DiSaves).(*SavesService),
		points:   container.Get(localStatic.DiPoints).(*PointsService),
	}
}

type ShameOptions struct {
	message  *discordgo.Message
	settings *db.SettingsModel
}

func (service *GameService) Start(guildID string, gameType db.GameType, startingNumber int, recreate bool, shame *ShameOptions) (game *db.GameModel, err error) {
	log.Println(fmt.Sprintf("Trying to start a game for %s", guildID))

	currentGame, exists, err := service.getCurrentGame(guildID)
	if err != nil && err != db.ErrNotFound {
		return
	}

	settings, err := service.settings.GetByGuildId(guildID)
	if err != nil {
		return
	}

	channelID, ok := settings.ChannelID()
	if !ok {
		err = errors.New("No channelID configured")
		return
	}

	channel, err := service.session.Channel(channelID)
	if err != nil {
		return
	}

	if (exists && recreate) || (exists && currentGame.Type != gameType) {
		service.End(currentGame.ID, db.GameStatusFailed, shame)
	}

	number := startingNumber - 1
	game, err = service.database.Game.CreateOne(
		db.Game.Settings.Link(
			db.Settings.ID.Equals(settings.ID),
		),
		db.Game.Type.Set(gameType),
	).Exec(context.Background())
	if err != nil {
		return
	}

	self, err := service.state.SelfUser()
	if err != nil {
		return
	}

	if number < 0 {
		number = 0
	}

	_, err = service.database.History.CreateOne(
		db.History.UserID.Set(self.ID),
		db.History.Game.Link(db.Game.ID.Equals(game.ID)),
		db.History.Number.Set(number),
	).Exec(context.Background())

	if channel.Type == discordgo.ChannelTypeGuildText {
		service.session.ChannelMessageSend(
			channelID,
			fmt.Sprintf(`**A new game has started!**
Start the count from **%d**`, number+1),
		)
	}

	return
}

func (service *GameService) End(gameID int, status db.GameStatus, shame *ShameOptions) (game *db.GameModel, err error) {
	game, err = service.database.Game.FindUnique(
		db.Game.ID.Equals(gameID),
	).Update(
		db.Game.Status.Set(status),
	).Exec(context.Background())

	if shame != nil {
		roleID, okRoleID := shame.settings.ShameRoleID()
		lastShameUserID, okLastShameUserID := shame.settings.LastShameUserID()
		if okLastShameUserID && okRoleID {
			go service.session.GuildMemberRoleRemove(shame.settings.GuildID, lastShameUserID, roleID)
		}

		if okRoleID {
			go service.session.GuildMemberRoleAdd(shame.settings.GuildID, shame.message.Author.ID, roleID)
		}

		_, err = service.settings.Update(shame.settings.ID, db.Settings.LastShameUserID.Set(shame.message.Author.ID))
		if err != nil {
			return
		}
	}

	return
}

func (service *GameService) ParseNumber(message *discordgo.Message, math bool) (i int, err error) {
	if message.Author.Bot {
		i = -1
		err = errors.New("Author is bot")
		return
	}

	if !math {
		i, err = strconv.Atoi(message.Content)
		return
	}

	exprtkObj := exprtk.NewExprtk()
	exprtkObj.SetExpression(message.Content)

	err = exprtkObj.CompileExpression()
	if err != nil {
		return
	}

	i = int(exprtkObj.GetEvaluatedValue())
	return
}

func (service *GameService) AddNumber(guildID string, number int, message *discordgo.Message, settings *db.SettingsModel) {
	game, exists, err := service.getCurrentGame(guildID)
	if err != nil {
		log.Println(err)
		return
	}

	if !exists {
		return
	}

	history, err := service.getLastHistory(game)
	if err != nil {
		log.Println(err)
		return
	}

	isNextNumber := number == history.Number+1
	isSameUser := message.Author.ID == history.UserID && os.Getenv(static.Env) != "development"

	if !isNextNumber || isSameUser {
		failReason := fmt.Sprintf("<@%s> counted twice in a row!", message.Author.ID)

		if !isNextNumber {
			failReason = fmt.Sprintf(`%d is not the next number!`, number)
		}

		if err != nil {
			log.Println(err)
			return
		}

		saves, err := service.saves.GetSaves(settings, message.Author.ID)
		if err != nil {
			log.Println(err)
			return
		}

		service.session.MessageReactionAdd(message.ChannelID, message.ID, "❌")

		if saves.player >= 1 {
			leftoverSaves, err := service.saves.DeductSaveFromPlayer(message.Author.ID, 1)
			if err != nil {
				log.Println(err)
				return
			}

			go service.session.ChannelMessageSendReply(
				message.ChannelID,
				fmt.Sprintf(
					`%s
Used **1 of your own** saves, You have **%d/2** saves left.`,
					failReason,
					leftoverSaves,
				),
				message.Reference(),
			)
			return
		}

		if saves.guild >= 1 {
			leftoverSaves, maxSaves, err := service.saves.DeductSaveFromGuild(message.GuildID, settings, 1)
			if err != nil {
				return
			}

			go service.session.ChannelMessageSendReply(
				message.ChannelID,
				fmt.Sprintf(
					`%s
Used **1 server** save, There are **%d/%d** server saves left.`,
					failReason,
					leftoverSaves,
					maxSaves,
				),
				message.Reference(),
			)
			return
		}

		count, err := service.getCount(game.ID)
		if err != nil {
			log.Println(err)
			return
		}

		isHighscore, _, err := service.checkStreak(settings, game, count)
		if err != nil {
			log.Println(err)
			return
		}

		highScoreText := ""
		if isHighscore {
			highScoreText = "\n**A new highscore has been set! 🎉**"
		}

		go service.session.ChannelMessageSendReply(
			message.ChannelID,
			fmt.Sprintf(
				`%s
**The game has ended on a streak of %d!**%s

**Want to save the game?** Make sure to **/vote** for Kazu and earn yourself saves to save the game!`,
				failReason,
				count,
				highScoreText,
			),
			message.Reference(),
		)

		shame := ShameOptions{
			message:  message,
			settings: settings,
		}
		service.Start(guildID, db.GameTypeNormal, 1, true, &shame)
		return
	}

	cooldown, err := service.checkCooldown(
		message.Author.ID,
		game.ID,
		settings.Cooldown,
	)
	if err != nil && err != db.ErrNotFound {
		log.Println(err)
		return
	}

	if cooldown.After(time.Now()) {
		go service.replyAndDelete(
			message,
			fmt.Sprintf("You're on a cooldown, you can try again %s", hammertime.Format(cooldown, hammertime.Span)),
			true,
			"🕒",
		)
		return
	}

	go service.points.AddGamePoints(guildID, message.Author.ID)
	_, err = service.database.History.CreateOne(
		db.History.UserID.Set(message.Author.ID),
		db.History.Game.Link(db.Game.ID.Equals(game.ID)),
		db.History.Number.Set(number),
		db.History.MessageID.Set(message.ID),
	).Exec(context.Background())
	if err != nil {
		log.Println(err)
		return
	}

	count, err := service.getCount(game.ID)
	if err != nil {
		log.Println(err)
		return
	}

	isHighscore, isGameHighscored, err := service.checkStreak(settings, game, count)

	if isGameHighscored {
		service.session.MessageReactionAdd(message.ChannelID, message.ID, "🎉")
		go service.settings.ResetShame(guildID)
	}

	emoji := "✅"
	if isHighscore {
		emoji = "☑️"
	}
	service.session.MessageReactionAdd(message.ChannelID, message.ID, emoji)
	service.checkSpecialReactions(message, number)
}

func (service *GameService) IsEqualToLast(message *discordgo.Message, settings *db.SettingsModel, isDelete bool) (ok bool, number int) {
	ok = true
	number = -1

	game, exists, err := service.getCurrentGame(message.GuildID)
	if err != nil || !exists {
		log.Println("Couldnt find game", err)
		return
	}

	history, err := service.getLastHistory(game)
	if err != nil {
		log.Println("Couldnt find last history", err)
		return
	}

	messageID, messageIDOk := history.MessageID()
	if !messageIDOk {
		return
	}

	if messageID != message.ID {
		return
	}

	number = history.Number

	if isDelete {
		ok = false
		return
	}

	parsedNumber, err := service.ParseNumber(message, settings.Math)
	if err != nil {
		ok = false
		return
	}

	log.Println("Checking is equal", message.Content)
	if parsedNumber != number {
		ok = false
	}

	return
}

func (service *GameService) getCurrentGame(guildID string) (game *db.GameModel, exists bool, err error) {
	exists = true
	game, err = service.database.Game.FindFirst(
		db.Game.GuildID.Equals(guildID),
		db.Game.Status.Equals(db.GameStatusInProgress),
	).OrderBy(
		db.Game.CreatedAt.Order(db.SortOrderDesc),
	).Exec(context.Background())

	if err == db.ErrNotFound {
		exists = false
	}

	return
}

func (service *GameService) getLastHistory(game *db.GameModel) (*db.HistoryModel, error) {
	if game == nil || game.Status != db.GameStatusInProgress {
		return nil, errors.New("Game is not in progress")
	}

	history, err := service.database.History.FindFirst(
		db.History.Game.Where(db.Game.ID.Equals(game.ID)),
	).OrderBy(
		db.History.CreatedAt.Order(db.SortOrderDesc),
	).Exec(context.Background())

	return history, err
}

func (service *GameService) getCount(gameID int) (count int, err error) {
	var res []struct {
		Count string `json:"count"`
	}

	err = service.database.Prisma.QueryRaw(
		`SELECT count(*) as count FROM "History" WHERE "gameId" = $1`,
		gameID,
	).Exec(context.Background(), &res)
	if err != nil {
		return
	}

	if len(res) > 0 {
		count, err = strconv.Atoi(res[0].Count)
		count = count - 1
	}

	return
}

func (service *GameService) checkStreak(settings *db.SettingsModel, game *db.GameModel, count int) (isHighscore bool, isGameHighscored bool, err error) {
	isHighscore = false
	isGameHighscored = false

	if count > settings.Highscore {
		isHighscore = true
		go service.settings.SetHighscoreByGuildID(settings.GuildID, count)

		if !game.IsHighscored {
			isGameHighscored = true

			go service.database.Game.FindUnique(
				db.Game.ID.Equals(game.ID),
			).Update(
				db.Game.IsHighscored.Set(true),
			).Exec(context.Background())
		}
	}

	return
}

func (service *GameService) checkCooldown(userID string, gameID int, settingsCooldown int) (cooldown time.Time, err error) {
	if settingsCooldown == 0 {
		cooldown = time.Now().Add(-time.Minute * 10)
		return
	}

	minutes := -time.Minute * time.Duration(settingsCooldown)
	lastHistory, err := service.database.History.FindFirst(
		db.History.UserID.Equals(userID),
		db.History.GameID.Equals(gameID),
		db.History.CreatedAt.After(time.Now().Add(minutes)),
	).Select(
		db.History.CreatedAt.Field(),
	).Exec(context.Background())

	if err == db.ErrNotFound {
		cooldown = time.Now().Add(-time.Minute * 10)
		return
	}

	if err != nil {
		return
	}

	cooldown = lastHistory.CreatedAt.Add(time.Minute * time.Duration(settingsCooldown))
	return
}

func (service *GameService) replyAndDelete(message *discordgo.Message, messageToSend string, deleteAfter bool, emoji string) {
	if len(emoji) > 0 {
		service.session.MessageReactionAdd(message.ChannelID, message.ID, emoji)
	}

	sentMessage, err := service.session.ChannelMessageSendReply(
		message.ChannelID,
		messageToSend,
		message.Reference(),
	)
	if err != nil {
		log.Println(err)
		return
	}

	if deleteAfter {
		time.AfterFunc(time.Second*5, func() {
			service.session.ChannelMessageDelete(sentMessage.ChannelID, sentMessage.ID)
		})
	}
}

func (service *GameService) checkSpecialReactions(message *discordgo.Message, number int) {
	if number > 10 && utils.IsPalindrome(strconv.Itoa(number)) {
		go service.session.MessageReactionAdd(message.ChannelID, message.ID, "🪞")
	}

	if number == 4 {
		go service.session.MessageReactionAdd(message.ChannelID, message.ID, "🍀")
	}

	if number == 69 {
		go service.session.MessageReactionAdd(message.ChannelID, message.ID, "niceone:1260697303224815696")
	}

	if number == 100 {
		go service.session.MessageReactionAdd(message.ChannelID, message.ID, "💯")
	}

	if number == 360 {
		go service.session.MessageReactionAdd(message.ChannelID, message.ID, "⚪")
	}

	if number == 420 {
		go service.session.MessageReactionAdd(message.ChannelID, message.ID, "🍃")
	}

	if number == 666 {
		go service.session.MessageReactionAdd(message.ChannelID, message.ID, "🤘")
	}

	if number == 777 {
		go service.session.MessageReactionAdd(message.ChannelID, message.ID, "🎰")
	}

	if number == 1000 {
		go service.session.MessageReactionAdd(message.ChannelID, message.ID, "1000:1262411624019525684")
	}

	if number == 10_000 {
		go service.session.MessageReactionAdd(message.ChannelID, message.ID, "10000:1262411765996851200")
	}

	if number == 100_000 {
		go service.session.MessageReactionAdd(message.ChannelID, message.ID, "100000:1262411649407647904")
	}
}
