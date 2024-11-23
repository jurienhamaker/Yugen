# Simple Makefile for a Go project

iro:
	@echo "Starting Iro..."
	cd apps/iro && make watch 

kazu:
	@echo "Starting Kazu..."
	cd apps/kazu && make watch 

build-kazu:
	@echo "Building Kazu..."
	cd apps/kazu && make build-prod

.PHONY: iro kazu
