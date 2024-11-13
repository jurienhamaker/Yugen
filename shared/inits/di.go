package inits

import (
	"log"
	"os"

	"github.com/FedorLap2006/disgolf"
	"github.com/go-redis/redis/v8"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/static"
)

func InitSharedDi(diBuilder *di.EnhancedBuilder) {
	diBuilder.Add(&di.Def{
		Name: static.DiRedis,
		Build: func(ctn di.Container) (interface{}, error) {
			return redis.NewClient(&redis.Options{
				Addr: os.Getenv(static.EnvRedisHost),
				DB:   0,
			}), nil
		},
	})

	diBuilder.Add(&di.Def{
		Name: static.DiState,
		Build: func(ctn di.Container) (interface{}, error) {
			return InitState(ctn)
		},
	})

	diBuilder.Add(&di.Def{
		Name: static.DiBot,
		Build: func(ctn di.Container) (interface{}, error) {
			return disgolf.New(os.Getenv(static.EnvDiscordToken))
		},
		Close: func(obj interface{}) error {
			bot := obj.(*disgolf.Bot)
			log.Println("Shutting down bot...")
			bot.Close()
			return nil
		},
	})
}
