package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"jurien.dev/yugen/iro/internal/inits"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Panic(err)
	}

	container, _ := inits.InitDI()

	inits.InitDiscordSession(&container)

	log.Println("Started, press CTRL-C to close")
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc
}
