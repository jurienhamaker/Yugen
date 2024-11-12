package inits

import (
	"github.com/zekrotja/ken"
	"jurien.dev/yugen/shared/slashcommands"
)

func InitSlashCommands(ken *ken.Ken) (err error) {
	err = ken.RegisterCommands(new(slashcommands.Vote))

	return
}
