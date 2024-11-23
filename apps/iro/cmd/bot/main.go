package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"jurien.dev/yugen/iro/internal/inits"

	sharedInits "jurien.dev/yugen/shared/inits"
	"jurien.dev/yugen/shared/utils"
)

func init() {
	godotenv.Load()
	utils.CreateLogger("iro")
}

func main() {
	defer utils.Logger.Sync()

	container, _ := inits.InitDI()
	defer container.DeleteWithSubContainers()

	release := inits.InitDiscordBot(&container)
	defer release()

	sharedInits.InitAPI(&container)

	utils.Logger.Info("Started iro. Stop with CTRL-C...")
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc
}
