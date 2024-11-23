package inits

import (
	"log"

	"github.com/robfig/cron/v3"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/shared/static"
)

func InitCron(container *di.Container) {
	cron := container.Get(static.DiCron).(*cron.Cron)
	cron.Start()
	log.Println("Cron started")
}
