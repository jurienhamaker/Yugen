package services

import (
	"context"
	"strconv"

	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kazu/prisma/db"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

type PointsService struct {
	database *db.PrismaClient
}

func CreatePointsService(container *di.Container) *PointsService {
	utils.Logger.Info("Creating Points Service")
	return &PointsService{
		database: container.Get(static.DiDatabase).(*db.PrismaClient),
	}
}

func (service *PointsService) GetPlayer(guildID string, userID string, setInGuild bool) (player *db.PlayerStatsModel, err error) {
	created := false
	player, err = service.database.PlayerStats.FindFirst(
		db.PlayerStats.UserID.Equals(userID),
		db.PlayerStats.GuildID.Equals(guildID),
	).Exec(context.Background())

	if err == db.ErrNotFound {
		created = true
		player, err = service.database.PlayerStats.CreateOne(
			db.PlayerStats.UserID.Set(userID),
			db.PlayerStats.GuildID.Set(guildID),
			db.PlayerStats.InGuild.Set(true),
		).Exec(context.Background())
	}

	if err != nil {
		return
	}

	if setInGuild && !created {
		player, err = service.database.PlayerStats.FindUnique(
			db.PlayerStats.ID.Equals(player.ID),
		).Update(
			db.PlayerStats.InGuild.Set(true),
		).Exec(context.Background())
	}

	return
}

func (service *PointsService) AddGamePoints(guildID string, userID string) (err error) {
	player, err := service.GetPlayer(guildID, userID, true)
	if err != nil {
		return
	}

	_, err = service.database.PlayerStats.FindUnique(
		db.PlayerStats.ID.Equals(player.ID),
	).Update(
		db.PlayerStats.Points.Increment(1),
	).Exec(context.Background())

	return
}

func (service *PointsService) ResetLeaderboardByGuildID(guildID string) (err error) {
	_, err = service.database.PlayerStats.FindMany(
		db.PlayerStats.GuildID.Equals(guildID),
	).Update(
		db.PlayerStats.Points.Set(0),
	).Exec(context.Background())

	if err == db.ErrNotFound {
		err = nil
	}

	return
}

type GetLeaderboardItemsByGuildIDResponse struct {
	Items []db.PlayerStatsModel
	Err   error
}

type GetLeaderboardTotalByGuildIDResponse struct {
	Total int
	Err   error
}

func (service *PointsService) GetLeaderboardByGuildID(guildID string, page int) (items []db.PlayerStatsModel, total int, err error) {
	itemsChannel := make(chan GetLeaderboardItemsByGuildIDResponse)
	totalChannel := make(chan GetLeaderboardTotalByGuildIDResponse)

	go service.getLeaderboardItemsByGuildID(guildID, page, itemsChannel)
	go service.getLeaderboardTotalByGuildID(guildID, totalChannel)

	itemsResult := <-itemsChannel
	totalResult := <-totalChannel

	items = itemsResult.Items
	total = totalResult.Total

	err = itemsResult.Err
	if totalResult.Err != nil && err == nil {
		err = totalResult.Err
	}

	return
}

func (service *PointsService) getLeaderboardItemsByGuildID(guildID string, page int, channel chan GetLeaderboardItemsByGuildIDResponse) {
	defer close(channel)
	result := new(GetLeaderboardItemsByGuildIDResponse)

	items, err := service.database.PlayerStats.FindMany(
		db.PlayerStats.GuildID.Equals(guildID),
		db.PlayerStats.InGuild.Equals(true),
	).OrderBy(
		db.PlayerStats.Points.Order(db.DESC),
	).Take(10).Skip((page - 1) * 10).Exec(context.Background())

	result.Items = items
	result.Err = err

	channel <- *result
}

func (service *PointsService) getLeaderboardTotalByGuildID(guildID string, channel chan GetLeaderboardTotalByGuildIDResponse) {
	defer close(channel)
	result := new(GetLeaderboardTotalByGuildIDResponse)

	var res []struct {
		Count string `json:"count"`
	}

	err := service.database.Prisma.QueryRaw(
		`SELECT count(*) as count FROM "PlayerStats" WHERE "guildId" = $1 AND "inGuild" = true`,
		guildID,
	).Exec(context.Background(), &res)

	count := 0
	if len(res) > 0 {
		count, err = strconv.Atoi(res[0].Count)
	}

	result.Total = count
	result.Err = err

	channel <- *result
}
