package services

import (
	"context"
	"log"

	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kazu/prisma/db"
	"jurien.dev/yugen/shared/static"
)

type SavesService struct {
	database *db.PrismaClient
	settings *SettingsService
}

type GetSavesResult struct {
	player int
	guild  int
}

func CreateSavesService(container *di.Container) *SavesService {
	log.Println("Creating Saves Service")
	return &SavesService{
		database: container.Get(static.DiDatabase).(*db.PrismaClient),
		settings: container.Get(static.DiSettings).(*SettingsService),
	}
}

func (service *SavesService) GetPlayerSavesByUserID(userID string) (saves *db.PlayerSavesModel, err error) {
	ctx := context.Background()
	saves, err = service.database.PlayerSaves.FindFirst(
		db.PlayerSaves.UserID.Equals(userID),
	).Exec(ctx)

	if saves == nil {
		saves, err = service.database.PlayerSaves.CreateOne(
			db.PlayerSaves.UserID.Set(userID),
		).Exec(ctx)
	}

	return
}

func (service *SavesService) GetSaves(settings *db.SettingsModel, userID string) (result *GetSavesResult, err error) {
	player, err := service.GetPlayerSavesByUserID(userID)

	result = &GetSavesResult{
		player: int(player.Saves),
		guild:  int(settings.Saves),
	}

	return
}

func (service *SavesService) DeductSaveFromPlayer(userID string, amount float64) (leftover float64, maxSaves float64, err error) {
	player, err := service.GetPlayerSavesByUserID(userID)

	newSaves := player.Saves - 1

	if newSaves < 0 {
		newSaves = 0
	}

	player, err = service.database.PlayerSaves.FindUnique(db.PlayerSaves.ID.Equals(player.ID)).Update(
		db.PlayerSaves.Saves.Set(newSaves),
	).Exec(context.Background())

	leftover = player.Saves
	maxSaves = player.MaxSaves

	return
}

func (service *SavesService) DeductSaveFromGuild(guildID string, settings *db.SettingsModel, amount float64) (leftover float64, maxSaves float64, err error) {
	newSaves := settings.Saves - amount

	if newSaves < 0 {
		newSaves = 0
	}

	settings, err = service.database.Settings.FindUnique(db.Settings.ID.Equals(settings.ID)).Update(
		db.Settings.Saves.Set(newSaves),
	).Exec(context.Background())

	leftover = settings.Saves
	maxSaves = settings.MaxSaves

	return
}

func (service *SavesService) AddSaveToPlayer(userID string, amount float64) (saves float64, maxSaves float64, err error) {
	player, err := service.GetPlayerSavesByUserID(userID)
	if err != nil {
		return
	}

	if player.Saves == player.MaxSaves {
		saves = player.MaxSaves
		maxSaves = player.MaxSaves
		return
	}

	newSaves := player.Saves + amount

	if newSaves > player.MaxSaves {
		newSaves = player.MaxSaves
	}

	player, err = service.database.PlayerSaves.FindUnique(db.PlayerSaves.ID.Equals(player.ID)).Update(
		db.PlayerSaves.Saves.Set(newSaves),
	).Exec(context.Background())
	if err != nil {
		return
	}

	saves = player.Saves
	maxSaves = player.MaxSaves

	return
}

func (service *SavesService) AddSaveToGuild(guildID string, settings *db.SettingsModel, amount float64) (saves float64, maxSaves float64, err error) {
	newSaves := settings.Saves + amount

	if newSaves > settings.MaxSaves {
		newSaves = settings.MaxSaves
	}

	settings, err = service.database.Settings.FindUnique(db.Settings.ID.Equals(settings.ID)).Update(
		db.Settings.Saves.Set(newSaves),
	).Exec(context.Background())
	if err != nil {
		return
	}

	saves = settings.Saves
	maxSaves = settings.MaxSaves

	return
}
