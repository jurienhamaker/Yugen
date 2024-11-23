//go:generate go run github.com/steebchen/prisma-client-go generate --schema=../../prisma/schema.prisma

package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"jurien.dev/yugen/kazu/internal/inits"

	sharedInits "jurien.dev/yugen/shared/inits"
	"jurien.dev/yugen/shared/utils"
)

func init() {
	godotenv.Load()
	utils.CreateLogger("kazu-go")
}

func main() {
	defer utils.Logger.Sync()

	container, _ := inits.InitDI()
	defer container.DeleteWithSubContainers()

	release := inits.InitDiscordBot(&container)
	defer release()

	// start Cron
	sharedInits.InitCron(&container)

	// start Api
	sharedInits.InitAPI(&container)

	utils.Logger.Info("Started kazu. Stop with CTRL-C...")

	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc
}
