package utils

import (
	"log"
	"reflect"
	"strings"

	"github.com/FedorLap2006/disgolf"
)

type CommandsModule interface {
	Commands() []*disgolf.Command
}

func getStructName(m interface{}) string {
	if t := reflect.TypeOf(m); t.Kind() == reflect.Ptr {
		return t.Elem().Name()
	} else {
		return t.Name()
	}
}

func RegisterCommandModules(bot *disgolf.Bot, modules []CommandsModule) {
	for _, m := range modules {
		commandsStr := "command"
		commandsLen := 0

		for _, command := range m.Commands() {
			if command.SubCommands.Count() > 0 {
				commandsLen = commandsLen + command.SubCommands.Count()
				continue
			}

			commandsLen = commandsLen + 1
		}

		if commandsLen != 1 {
			commandsStr = "commands"
		}

		log.Printf("Registering '%s' module with %d %s", strings.Replace(getStructName(m), "Module", "", 1), commandsLen, commandsStr)
		for _, command := range m.Commands() {
			bot.Router.Register(command)
		}
	}
}
