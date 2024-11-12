# Simple Makefile for a Go project

iro:
	@echo "Starting Iro..."
	cd apps/iro && make watch 

kazu:
	@echo "Starting Kazu..."
	cd apps/kazu && make watch 

.PHONY: iro kazu
