package inits

import (
	"fmt"
	"log"
	"time"

	"github.com/sarulabs/di/v2"
	"github.com/zekroTJA/shinpuru/pkg/hammertime"
	"github.com/zekrotja/dgrs"
	"jurien.dev/yugen/kazu/internal/services"
	localStatic "jurien.dev/yugen/kazu/internal/static"
	"jurien.dev/yugen/shared/static"
)

func CreateVoteHandler(container *di.Container) func(userID string, source string) error {
	saves := container.Get(localStatic.DiSaves).(*services.SavesService)
	state := container.Get(static.DiState).(*dgrs.State)

	return func(userID string, source string) error {
		user, err := state.User(userID)
		if err != nil {
			return err
		}

		log.Printf("Processing vote for %s from %s", userID, source)
		_, _, err = saves.AddSaveToPlayer(user.ID, 1)
		return err
	}
}

func CreateVoteRewardFunc(container *di.Container) func(userID string) string {
	voteReward := func(userID string) string {
		saves := container.Get(localStatic.DiSaves).(*services.SavesService)
		player, err := saves.GetPlayerSavesByUserID(userID)
		if err != nil {
			return ""
		}

		lastVoteTime, ok := player.LastVoteTime()
		if !ok {
			lastVoteTime = time.Now().Add(-time.Hour * 24)
		}

		voteTime := lastVoteTime.Add(time.Hour * 12)
		voteTimeText := "**right now**!"
		if voteTime.After(time.Now()) {
			voteTimeText = fmt.Sprintf("again **%s**", hammertime.Format(voteTime, hammertime.Span))
		}

		amount := "0.25"
		weekday := time.Now().Weekday()
		if weekday == time.Saturday || weekday == time.Sunday {
			amount = "0.5"
		}
		return fmt.Sprintf(`
You will receive **%s** saves for **each vote**

You can vote %s`, amount, voteTimeText)
	}

	return voteReward
}
