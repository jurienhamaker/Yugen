package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var InteractionEventTotal = promauto.NewCounterVec(prometheus.CounterOpts{
	Name: "discord_event_on_interaction_total",
	Help: "Amount of interactions called by users",
}, []string{"interaction", "command"})

var TotalInteractions = promauto.NewGauge(prometheus.GaugeOpts{
	Name: "discord_stat_total_interactions",
	Help: "Amount of interactions",
})
