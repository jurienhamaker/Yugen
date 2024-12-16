package slashcommands

import (
	"github.com/FedorLap2006/disgolf"
	"github.com/sarulabs/di/v2"
	"jurien.dev/yugen/kusari/internal/services"
	"jurien.dev/yugen/shared/middlewares"
	"jurien.dev/yugen/shared/static"
)

type SettingsModule struct {
	container *di.Container
	settings  *services.SettingsService

	subCommands []*disgolf.Command
}

func GetSettingsModule(container *di.Container) *SettingsModule {
	showModule := GetSettingsShowModule(container)
	channelModule := GetSettingsChannelModule(container)
	botUpdatesModule := GetSettingsBotUpdatesModule(container)
	cooldownModule := GetSettingsCooldownModule(container)
	resetModule := GetSettingsResetModule(container)

	subCommands := []*disgolf.Command{}
	subCommands = append(subCommands, showModule.Commands()...)
	subCommands = append(subCommands, channelModule.Commands()...)
	subCommands = append(subCommands, botUpdatesModule.Commands()...)
	subCommands = append(subCommands, cooldownModule.Commands()...)
	subCommands = append(subCommands, resetModule.Commands()...)

	return &SettingsModule{
		container: container,
		settings:  container.Get(static.DiSettings).(*services.SettingsService),

		subCommands: subCommands,
	}
}

func (m *SettingsModule) Commands() []*disgolf.Command {
	return []*disgolf.Command{
		{
			Name:        "settings",
			Description: "Settings command group",
			Middlewares: []disgolf.Handler{
				disgolf.HandlerFunc(middlewares.GuildModeratorMiddleware),
			},
			SubCommands: disgolf.NewRouter(m.subCommands),
		},
	}
}
