package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var TotalUsers = promauto.NewGauge(prometheus.GaugeOpts{
	Name: "discord_stat_total_users",
	Help: "Amount of users this bot can see",
})
