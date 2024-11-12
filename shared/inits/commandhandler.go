package inits

import (
	"fmt"
	"log"

	"github.com/bwmarrin/discordgo"
	"github.com/go-redis/redis/v8"
	"github.com/sarulabs/di/v2"
	"github.com/zekroTJA/shinpuru/pkg/rediscmdstore"
	"github.com/zekrotja/dgrs"
	"github.com/zekrotja/ken"
	"github.com/zekrotja/ken/middlewares/cmdhelp"
	"github.com/zekrotja/ken/state"
	"github.com/zekrotja/ken/store"
	"jurien.dev/yugen/shared/static"
)

type ObjectProvider struct {
	container *di.Container
}

func (o *ObjectProvider) Get(key string) interface{} {
	return o.container.Get(key)
}

func InitCommandHandler(container *di.Container) (k *ken.Ken, err error) {
	log.Println("Creating command handler")

	session := container.Get(static.DiDiscordSession).(*discordgo.Session)
	st := container.Get(static.DiState).(*dgrs.State)
	rd, _ := container.Get(static.DiRedis).(*redis.Client)

	var cmdStore store.CommandStore
	if rd != nil {
		cmdStore = rediscmdstore.New(rd, fmt.Sprintf("kazu:cmdstore:%s", "release"))
	}

	var DependencyProvider ken.ObjectProvider = &ObjectProvider{
		container: container,
	}

	k, err = ken.New(session, ken.Options{
		State:              state.NewDgrs(st),
		CommandStore:       cmdStore,
		DependencyProvider: DependencyProvider,
		OnSystemError:      systemErrorHandler,
		OnCommandError:     commandErrorHandler,
		OnEventError:       eventErrorHandler,
		EmbedColors: ken.EmbedColors{
			Default: static.ColorEmbedDefault,
			Error:   static.ColorEmbedError,
		},
	})
	if err != nil {
		return
	}

	err = k.RegisterMiddlewares(
		cmdhelp.New("help"),
	)

	InitSlashCommands(k)

	return
}

func systemErrorHandler(context string, err error, args ...interface{}) {
	log.Println("Ken System Error", context)
}

func eventErrorHandler(context string, err error) {
	log.Println("Ken Event Error", context)
}

func commandErrorHandler(err error, ctx *ken.Ctx) {
	// Is ignored if interaction has already been responded
	ctx.Defer()

	if err == ken.ErrNotDMCapable {
		ctx.FollowUpError("This command can not be used in DMs.", "").Send()
		return
	}

	log.Println("Unexpected command result", ctx.Command.Name(), err)
	ctx.FollowUpError(
		fmt.Sprintf("The command execution failed unexpectedly:\n```\n%s\n```", err.Error()),
		"Command execution failed").Send()
}
