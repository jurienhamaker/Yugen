package inits

import (
	"github.com/bwmarrin/discordgo"
	"github.com/go-redis/redis/v8"
	"github.com/sarulabs/di/v2"
	"github.com/zekrotja/dgrs"
	"jurien.dev/yugen/shared/static"
)

func InitState(container di.Container) (state *dgrs.State, err error) {
	session := container.Get(static.DiDiscordSession).(*discordgo.Session)
	redis := container.Get(static.DiRedis).(*redis.Client)

	return dgrs.New(dgrs.Options{
		RedisClient:    redis,
		DiscordSession: session,
		FetchAndStore:  true,
	})
}
