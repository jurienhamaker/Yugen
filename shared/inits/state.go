package inits

import (
	"log"
	"reflect"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/go-redis/redis/v8"
	"github.com/sarulabs/di/v2"
	"github.com/zekroTJA/shinpuru/pkg/timeutil"
	"github.com/zekrotja/dgrs"
	"jurien.dev/yugen/shared/static"
)

type CacheLifetime struct {
	General string
	Member  string
	User    string
}

func getLifetimes(lifetimes CacheLifetime) (dgrs.Lifetimes, bool, error) {
	var target dgrs.Lifetimes

	vlt := reflect.ValueOf(lifetimes)
	vtg := reflect.ValueOf(&target)

	set := false

	for i := 0; i < vlt.NumField(); i++ {
		ds := vlt.Field(i).String()

		if ds == "" {
			continue
		}

		d, err := timeutil.ParseDuration(ds)
		if err != nil {
			return dgrs.Lifetimes{}, false, err
		}

		if d == 0 {
			continue
		}

		vtg.Elem().FieldByName(vlt.Type().Field(i).Name).Set(reflect.ValueOf(d))
		set = true
	}

	return target, set, nil
}

func InitState(container di.Container) (state *dgrs.State, err error) {
	session := container.Get(static.DiDiscordSession).(*discordgo.Session)
	redis := container.Get(static.DiRedis).(*redis.Client)
	lifetimes := container.Get(static.DiCacheLifetimes).(CacheLifetime)

	parsedLifetimes, set, err := getLifetimes(lifetimes)
	if err != nil {
		return nil, err
	}

	if !set {
		parsedLifetimes.General = 7 * 24 * time.Hour
		log.Println("No cache lifetimes have been set; applying default duration for all fields")
	}

	// When a value for `General` is set, all 0 value durations
	// will be set to the vaue of `General`. So it is effectively
	// the default caching duration, if not further specified.
	parsedLifetimes.OverrrideZero = true

	return dgrs.New(dgrs.Options{
		RedisClient:    redis,
		DiscordSession: session,
		FetchAndStore:  true,
		Lifetimes:      parsedLifetimes,
	})
}
