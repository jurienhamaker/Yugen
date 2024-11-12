package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"jurien.dev/yugen/kazu/internal/inits"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Panic(err)
	}

	container, _ := inits.InitDI()
	defer container.DeleteWithSubContainers()

	release := inits.InitDiscordSession(&container)
	defer release()

	log.Println("Started kazu. Stop with CTRL-C...")
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc
	log.Println("Bot stopped.")
}
