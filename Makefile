# Variables
CONTAINER_NAME = kodi-card-frontend
IMAGE_NAME     = nginx:alpine
PORT           = 3000
DIST_DIR       = $(PWD)/dist

.PHONY: help install build dev run stop restart clean logs status

# Default target
help:
	@echo "Available commands:"
	@echo "  make install - Install npm dependencies"
	@echo "  make build   - Build the production frontend assets"
	@echo "  make dev     - Run npm local development server"
	@echo "  make start	  - Start server


# NPM Tasks
install:
	@echo "📦 Installing npm dependencies..."
	npm install

build:
	@echo "🏗️ Building frontend assets via npm..."
	npm run build

dev:
	@echo "⚡ Starting local npm dev server..."
	npm run dev

# Docker Tasks
start:
	npm run start


