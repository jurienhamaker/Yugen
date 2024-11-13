package inits

import (
	"github.com/FedorLap2006/disgolf"
	"github.com/go-redis/redis/v8"
	"github.com/sarulabs/di/v2"
	"github.com/zekrotja/dgrs"
	"jurien.dev/yugen/shared/static"
)

func InitState(container di.Container) (state *dgrs.State, err error) {
	bot := container.Get(static.DiBot).(*disgolf.Bot)
	redis := container.Get(static.DiRedis).(*redis.Client)

	return dgrs.New(dgrs.Options{
		RedisClient:    redis,
		DiscordSession: bot,
		FetchAndStore:  true,
	})
}
