package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var TotalGuilds = promauto.NewGauge(prometheus.GaugeOpts{
	Name: "discord_stat_total_guilds",
	Help: "Amount of guild this bot is a member of",
})
