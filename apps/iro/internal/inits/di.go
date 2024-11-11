package inits

import (
	"log"

	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/inits"
)

func InitDI() (container di.Container, err error) {
	diBuilder, _ := di.NewEnhancedBuilder()

	log.Println("Building DI")

	// Initialize redis client
	inits.InitSharedDi(diBuilder)

	container, _ = diBuilder.Build()

	return
}
