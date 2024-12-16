package inits

import (
	"fmt"
	"time"

	"github.com/FedorLap2006/disgolf"
	"github.com/sarulabs/di/v2"
	"github.com/zekroTJA/shinpuru/pkg/hammertime"
	"jurien.dev/yugen/kazu/internal/services"
	localStatic "jurien.dev/yugen/kazu/internal/static"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

func CreateVoteHandler(container *di.Container) func(userID string, source string) error {
	saves := container.Get(localStatic.DiSaves).(*services.SavesService)
	bot := container.Get(static.DiBot).(*disgolf.Bot)

	return func(userID string, source string) error {
		user, err := bot.User(userID)
		if err != nil {
			utils.Logger.Error(err)
			return err
		}

		utils.Logger.With(
			"userID", userID,
			"source", source,
		).Infof("Processing vote for %s from %s", userID, source)

		amount := 0.25
		weekday := time.Now().Weekday()
		if weekday == time.Saturday || weekday == time.Sunday {
			amount = 0.5
		}
		_, _, err = saves.AddSaveToPlayer(user.ID, amount)
		return err
	}
}

func CreateVoteRewardFunc(container *di.Container) func(userID string) string {
	voteReward := func(userID string) string {
		saves := container.Get(localStatic.DiSaves).(*services.SavesService)
		player, err := saves.GetPlayerSavesByUserID(userID)
		if err != nil {
			utils.Logger.Error(err)
			return ""
		}

		lastVoteTime, ok := player.LastVoteTime()
		if !ok {
			lastVoteTime = time.Now().Add(-time.Hour * 24)
		}

		voteTime := lastVoteTime.Add(time.Hour * 12)
		voteTimeText := "**right now**!"
		if voteTime.After(time.Now()) {
			voteTimeText = fmt.Sprintf("again **%s**", hammertime.Format(voteTime, hammertime.Span))
		}

		amount := "0.25"
		weekday := time.Now().Weekday()
		if weekday == time.Saturday || weekday == time.Sunday {
			amount = "0.5"
		}
		return fmt.Sprintf(`
You will receive **%s** saves for **each vote**

You can vote %s`, amount, voteTimeText)
	}

	return voteReward
}
