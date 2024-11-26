package inits

import (
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/inits"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

func InitDI() (container di.Container, err error) {
	diBuilder, _ := di.NewEnhancedBuilder()

	utils.Logger.Info("Building DI")

	diBuilder.Add(&di.Def{
		Name: static.DiAppName,
		Build: func(ctn di.Container) (interface{}, error) {
			return "Iro", nil
		},
	})

	// Initialize shared DI
	inits.InitSharedDi(diBuilder)

	diBuilder.Add(&di.Def{
		Name: static.DiEmbedColor,
		Build: func(ctn di.Container) (interface{}, error) {
			// #df3565
			return 0xdf3565, nil
		},
	})

	diBuilder.Add(&di.Def{
		Name: static.DiVoteReward,
		Build: func(ctn di.Container) (interface{}, error) {
			return CreateVoteRewardFunc(&ctn), nil
		},
	})

	container, _ = diBuilder.Build()

	return
}
