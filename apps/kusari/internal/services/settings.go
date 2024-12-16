package services

import (
	"context"
	"time"

	"github.com/FedorLap2006/disgolf"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kusari/prisma/db"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

type SettingsService struct {
	database *db.PrismaClient
	bot      *disgolf.Bot
}

func CreateSettingsService(container *di.Container) *SettingsService {
	utils.Logger.Info("Creating Settings Service")
	return &SettingsService{
		database: container.Get(static.DiDatabase).(*db.PrismaClient),
		bot:      container.Get(static.DiBot).(*disgolf.Bot),
	}
}

func (service *SettingsService) GetByGuildId(guildID string) (guildSettings *db.SettingsModel, err error) {
	ctx := context.Background()
	guildSettings, err = service.database.Settings.FindUnique(
		db.Settings.GuildID.Equals(guildID),
	).Exec(ctx)

	if guildSettings == nil {
		guildSettings, err = service.database.Settings.CreateOne(
			db.Settings.GuildID.Set(guildID),
		).Exec(ctx)
	}

	return
}

func (service *SettingsService) SetHighscoreByGuildID(guildID string, highscore int) (result *db.SettingsModel, err error) {
	result, err = service.database.Settings.FindUnique(
		db.Settings.GuildID.Equals(guildID),
	).Update(
		db.Settings.Highscore.Set(highscore),
		db.Settings.HighscoreDate.Set(time.Now()),
	).Exec(context.Background())

	return
}

func (service *SettingsService) Update(settingsID int, params ...db.SettingsSetParam) (settings *db.SettingsModel, err error) {
	settings, err = service.database.Settings.FindUnique(
		db.Settings.ID.Equals(settingsID),
	).Update(params...).Exec(context.Background())

	return
}
