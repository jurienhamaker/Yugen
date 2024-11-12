package inits

import (
	"log"
	"os"

	"github.com/bwmarrin/discordgo"
	"github.com/go-redis/redis/v8"
	"github.com/sarulabs/di/v2"
	"github.com/zekrotja/ken"
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
		Name: static.DiDiscordSession,
		Build: func(ctn di.Container) (interface{}, error) {
			return discordgo.New("")
		},
		Close: func(obj interface{}) error {
			session := obj.(*discordgo.Session)
			log.Println("Shutting down bot...")
			session.Close()
			return nil
		},
	})

	// Initialize command handler
	diBuilder.Add(&di.Def{
		Name: static.DiCommandHandler,
		Build: func(ctn di.Container) (interface{}, error) {
			return InitCommandHandler(&ctn)
		},
		Close: func(obj interface{}) error {
			return obj.(*ken.Ken).Unregister()
		},
	})
}
