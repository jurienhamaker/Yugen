package inits

import (
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/inits"
	"jurien.dev/yugen/shared/utils"
)

func InitDI() (container di.Container, err error) {
	diBuilder, _ := di.NewEnhancedBuilder()

	utils.Logger.Info("Building DI")

	// Initialize redis client
	inits.InitSharedDi(diBuilder)

	container, _ = diBuilder.Build()

	return
}
