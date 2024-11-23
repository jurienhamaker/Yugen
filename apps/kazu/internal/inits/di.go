package inits

import (
	"fmt"
	"log"

	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kazu/internal/services"
	localStatic "jurien.dev/yugen/kazu/internal/static"
	"jurien.dev/yugen/kazu/internal/utils"
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
		Name: static.DiAppName,
		Build: func(ctn di.Container) (interface{}, error) {
			return "Kazu", nil
		},
	})

	diBuilder.Add(&di.Def{
		Name: static.DiHelpText,
		Build: func(ctn di.Container) (interface{}, error) {
			return fmt.Sprintf("%s\n\nWant to know how to play the game? Use `/tutorial`!", utils.NoSettingsDescription), nil
		},
	})

	diBuilder.Add(&di.Def{
		Name: static.DiTutorialText,
		Build: func(ctn di.Container) (interface{}, error) {
			return `**How to Play:**
- The first count must be 1.
- Each count afterwards has to be one number higher than the previous count. It can also be an equation when math is enabled.
- A single person can not count twice in a row!
- That's it! Enjoy!

**Saves:**
You can earn saves by voting for Kazu! Each vote is worth 0.25 save & 0.5 on the weekends!
A save can also be donated to the server, this will increase the server saves for collaborative save system.
Donating a save will turn 1 personal save into 0.2 server saves.

**Server Settings:**
- Channel, specify a dedicated channel
- Cooldown, specify a cooldown before users can add a word again
- Math, Wether Kazu will try to parse equations
- Shame role, a role to apply to someone that breaks the chain`, nil
		},
	})

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

	// create vote handler
	diBuilder.Add(&di.Def{
		Name: static.DiVoteHandler,
		Build: func(ctn di.Container) (interface{}, error) {
			return CreateVoteHandler(&ctn), nil
		},
	})

	container, _ = diBuilder.Build()

	return
}
