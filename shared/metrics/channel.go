package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var TotalChannels = promauto.NewGauge(prometheus.GaugeOpts{
	Name: "discord_stat_total_channels",
	Help: "Amount of channels this bot is has access to",
})
