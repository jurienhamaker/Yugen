package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"jurien.dev/yugen/iro/internal/inits"
	"jurien.dev/yugen/shared/static"

	sharedInits "jurien.dev/yugen/shared/inits"
)

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(fmt.Errorf("cannot load .env: %w", err))
	}
}

func main() {
	container, _ := inits.InitDI()
	defer container.DeleteWithSubContainers()

	release := inits.InitDiscordBot(&container)
	defer release()

	api := sharedInits.InitAPI(&container)
	log.Fatal(api.Listen(fmt.Sprintf("%s:%s", os.Getenv(static.EnvApiHost), os.Getenv(static.EnvApiPort))))

	log.Println("Started kazu. Stop with CTRL-C...")
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc
	log.Println("Bot stopped.")
}
