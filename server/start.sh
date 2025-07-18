#!/bin/bash

# InstructAI Server Startup Script
# This script helps with local development and deployment

echo "🚀 InstructAI Server Startup Script"
echo "======================================"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service to be ready on port $port..."
    
    while ! nc -z localhost $port; do
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ $service failed to start after $max_attempts attempts"
            exit 1
        fi
        echo "🔄 Attempt $attempt/$max_attempts: $service not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    echo "✅ $service is ready!"
}

# Check required tools
echo "🔍 Checking required tools..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command_exists nc; then
    echo "❌ netcat (nc) is not installed. Please install it first."
    exit 1
fi

echo "✅ All required tools are available"

# Parse command line arguments
MODE="dev"
REBUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            MODE="$2"
            shift 2
            ;;
        --rebuild)
            REBUILD=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--mode dev|prod] [--rebuild] [--help]"
            echo ""
            echo "Options:"
            echo "  --mode dev|prod    Set the deployment mode (default: dev)"
            echo "  --rebuild         Rebuild the Docker image"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

echo "📋 Configuration:"
echo "   Mode: $MODE"
echo "   Rebuild: $REBUILD"

# Set profile based on mode
if [ "$MODE" = "prod" ]; then
    export SPRING_PROFILES_ACTIVE=prod
    echo "🏭 Running in production mode"
else
    export SPRING_PROFILES_ACTIVE=dev
    echo "🛠️  Running in development mode"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Rebuild if requested
if [ "$REBUILD" = true ]; then
    echo "🔨 Rebuilding Docker image..."
    docker-compose build --no-cache
fi

# Start services
echo "🚀 Starting services..."
docker-compose up -d postgres redis

# Wait for database and Redis to be ready
wait_for_service "PostgreSQL" 5432
wait_for_service "Redis" 6379

# Start the application
echo "🚀 Starting InstructAI application..."
docker-compose up -d app

# Wait for application to be ready
wait_for_service "InstructAI App" 8007

echo ""
echo "🎉 InstructAI is now running!"
echo "=============================="
echo "📍 Application URL: http://localhost:8007"
echo "📍 Socket.IO URL: http://localhost:9092"
echo "📍 Health Check: http://localhost:8007/actuator/health"
echo "📍 Redis Commander: http://localhost:8081"
echo ""
echo "📊 To view logs: docker-compose logs -f app"
echo "🛑 To stop: docker-compose down"
echo ""

# Check application health
echo "🔍 Checking application health..."
if curl -s -f http://localhost:8007/actuator/health > /dev/null; then
    echo "✅ Application is healthy!"
else
    echo "⚠️  Application health check failed. Check logs with: docker-compose logs app"
fi

echo ""
echo "🏁 Setup complete!"
