package inits

import (
	"log"

	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kazu/internal/services"
	localStatic "jurien.dev/yugen/kazu/internal/static"
	"jurien.dev/yugen/kazu/prisma/db"
	"jurien.dev/yugen/shared/inits"
	"jurien.dev/yugen/shared/static"
)

func InitDI() (container di.Container, err error) {
	diBuilder, _ := di.NewEnhancedBuilder()

	log.Println("Building DI")

	// init database
	diBuilder.Add(&di.Def{
		Name: static.DiDatabase,
		Build: func(ctn di.Container) (interface{}, error) {
			client := db.NewClient()
			err := client.Prisma.Connect()

			return client, err
		},
		Close: func(obj interface{}) error {
			database := obj.(*db.PrismaClient)
			log.Println("Shutting down database connection...")
			database.Disconnect()
			return nil
		},
	})

	// Initialize redis client
	inits.InitSharedDi(diBuilder)

	diBuilder.Add(&di.Def{
		Name: static.DiEmbedColor,
		Build: func(ctn di.Container) (interface{}, error) {
			// #5d7fed
			return 0x5d7fed, nil
		},
	})

	diBuilder.Add(&di.Def{
		Name: static.DiVoteReward,
		Build: func(ctn di.Container) (interface{}, error) {
			return CreateVoteRewardFunc(&ctn), nil
		},
	})

	// init settings service
	diBuilder.Add(&di.Def{
		Name: static.DiSettings,
		Build: func(ctn di.Container) (interface{}, error) {
			return services.CreateSettingsService(&ctn), nil
		},
	})

	// init saves service
	diBuilder.Add(&di.Def{
		Name: localStatic.DiSaves,
		Build: func(ctn di.Container) (interface{}, error) {
			return services.CreateSavesService(&ctn), nil
		},
	})

	// init points service
	diBuilder.Add(&di.Def{
		Name: localStatic.DiPoints,
		Build: func(ctn di.Container) (interface{}, error) {
			return services.CreatePointsService(&ctn), nil
		},
	})

	// init game service
	diBuilder.Add(&di.Def{
		Name: localStatic.DiGame,
		Build: func(ctn di.Container) (interface{}, error) {
			return services.CreateGameService(&ctn), nil
		},
	})

	container, _ = diBuilder.Build()

	return
}
