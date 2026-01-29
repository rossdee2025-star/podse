#!/bin/bash
# Svenska Learning Docker Runner
# Run this script in WSL to start all services

set -e

echo "=========================================="
echo "  Podverse Svenska Learning - Docker"
echo "=========================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.docker template..."
    cp .env.docker .env
    echo ""
    echo "IMPORTANT: Edit .env and add your API keys:"
    echo "  - DEEPSEEK_API_KEY"
    echo "  - KIMI_API_KEY"
    echo ""
    read -p "Press Enter after editing .env to continue..."
fi

# Build and start containers
echo "Building Docker images..."
docker-compose build

echo ""
echo "Starting services..."
docker-compose up -d

echo ""
echo "=========================================="
echo "  Services Started!"
echo "=========================================="
echo ""
echo "  Web App:     http://localhost:3000"
echo "  Whisper API: http://localhost:8080"
echo ""
echo "  Svenska Learning: http://localhost:3000/svenska-learning/{episodeId}"
echo ""
echo "  View logs:   docker-compose logs -f"
echo "  Stop:        docker-compose down"
echo ""
