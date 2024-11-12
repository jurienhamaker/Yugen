package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/zekrotja/ken"
	"jurien.dev/yugen/kazu/internal/inits"
	"jurien.dev/yugen/shared/static"

	sharedInits "jurien.dev/yugen/shared/inits"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Panic(err)
	}

	container, _ := inits.InitDI()
	// init all commands
	container.Get(static.DiCommandHandler)
	defer container.DeleteWithSubContainers()

	release := inits.InitDiscordSession(&container)
	defer release()

	api := sharedInits.InitAPI(&container)
	log.Fatal(api.Listen(fmt.Sprintf("%s:%s", os.Getenv(static.EnvApiHost), os.Getenv(static.EnvApiPort))))

	ken := container.Get(static.DiCommandHandler).(*ken.Ken)
	defer ken.Unregister()

	log.Println("Started kazu. Stop with CTRL-C...")
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc
	log.Println("Bot stopped.")
}
