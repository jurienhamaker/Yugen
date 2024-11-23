package middlewares

import (
	"os"
	"slices"
	"strings"

	"github.com/FedorLap2006/disgolf"
	"github.com/bwmarrin/discordgo"
	"jurien.dev/yugen/shared/static"
	"jurien.dev/yugen/shared/utils"
)

func checkBase(ctx *disgolf.Ctx) bool {
	interaction := ctx.Interaction

	if interaction == nil {
		return true
	}

	member := interaction.Member
	if member == nil {
		return false
	}

	ownerIds := strings.Split(os.Getenv(static.EnvOwnerIDs), ",")
	if len(ownerIds) > 0 && slices.Contains(ownerIds, interaction.Member.User.ID) {
		return true
	}

	return false
}

func checkAdmin(ctx *disgolf.Ctx) bool {
	base := checkBase(ctx)
	if base {
		return base
	}

	perms := ctx.Interaction.Member.Permissions

	// admin check
	if perms&discordgo.PermissionAdministrator != 0 {
		return true
	}

	// guild manage check
	if perms&discordgo.PermissionManageGuild != 0 {
		return true
	}

	return false
}

func checkModerator(ctx *disgolf.Ctx) bool {
	admin := checkAdmin(ctx)
	if admin {
		return admin
	}

	// moderator check
	perms := ctx.Interaction.Member.Permissions
	return perms&discordgo.PermissionBanMembers != 0
}

func checkResponse(ctx *disgolf.Ctx, pass bool) {
	if !pass {
		err := utils.ForbiddenResponse(ctx)
		if err != nil {
			utils.Logger.Error(err)
		}
		return
	}

	ctx.Next()
}

func GuildOwnerMiddleware(ctx *disgolf.Ctx) {
	pass := checkBase(ctx)
	checkResponse(ctx, pass)
}

func GuildAdminMiddleware(ctx *disgolf.Ctx) {
	pass := checkAdmin(ctx)
	checkResponse(ctx, pass)
}

func GuildModeratorMiddleware(ctx *disgolf.Ctx) {
	pass := checkModerator(ctx)
	checkResponse(ctx, pass)
}
