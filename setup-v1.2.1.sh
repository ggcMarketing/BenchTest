#!/bin/bash

# ParX v1.2.1 Setup Script
# This script sets up the development environment for ParX v1.2.1

set -e

echo "========================================="
echo "ParX v1.2.1 Setup"
echo "========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js is not installed. Required for local development."
else
    echo "✓ Node.js $(node --version)"
fi

if ! command -v python3 &> /dev/null; then
    echo "⚠️  Python 3 is not installed. Required for analytics engine."
else
    echo "✓ Python $(python3 --version)"
fi

echo "✓ Docker $(docker --version)"
echo "✓ Docker Compose $(docker-compose --version)"
echo ""

# Create necessary directories
echo "Creating directories..."
mkdir -p logs
mkdir -p data/files
echo "✓ Directories created"
echo ""

# Start infrastructure
echo "Starting infrastructure (PostgreSQL, TimescaleDB, Redis)..."
docker-compose -f docker-compose.v1.2.1.yml up -d postgres timescaledb redis

echo "Waiting for databases to be ready..."
sleep 10

# Run migrations
echo ""
echo "Running database migrations..."
docker-compose -f docker-compose.v1.2.1.yml run --rm migration

echo ""
echo "========================================="
echo "✓ Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start all services:"
echo "   docker-compose -f docker-compose.v1.2.1.yml up -d"
echo ""
echo "2. Check service health:"
echo "   curl http://localhost:3000/health  # Admin API"
echo "   curl http://localhost:3001/health  # Data Router"
echo "   curl http://localhost:3002/health  # Collector"
echo "   curl http://localhost:3003/health  # Storage Engine"
echo "   curl http://localhost:3004/health  # Analytics Engine"
echo ""
echo "3. View logs:"
echo "   docker-compose -f docker-compose.v1.2.1.yml logs -f"
echo ""
echo "For more information, see README-v1.2.1.md"
echo ""
