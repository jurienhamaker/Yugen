package services

import (
	"context"
	"log"

	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kazu/prisma/db"
	"jurien.dev/yugen/shared/static"
)

type PointsService struct {
	database *db.PrismaClient
}

func CreatePointsService(container *di.Container) *PointsService {
	log.Println("Creating Points Service")
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
