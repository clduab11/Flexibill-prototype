#!/bin/bash

# Make the script exit on any error
set -e

# Function to display commands being run
function announce() {
    echo "→ $@"
}

# Function to check if Docker is running
function check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Error: Docker is not running or not accessible"
        exit 1
    fi
}

# Function to clean up Docker resources
function cleanup() {
    announce "Cleaning up Docker resources..."
    docker-compose down -v --remove-orphans
}

# Function to build Docker images
function build() {
    announce "Building Docker images..."
    docker-compose build --no-cache
}

# Function to start services
function start() {
    announce "Starting services..."
    docker-compose up -d
    
    announce "Waiting for database to be ready..."
    until docker-compose exec -T db pg_isready; do
        echo "Database is unavailable - sleeping"
        sleep 1
    done
    
    announce "Running database migrations..."
    docker-compose exec api npm run migrate
    
    announce "Services are ready!"
    docker-compose logs -f api
}

# Function to stop services
function stop() {
    announce "Stopping services..."
    docker-compose down
}

# Function to show logs
function logs() {
    announce "Showing logs..."
    docker-compose logs -f "$@"
}

# Function to run tests in Docker
function test() {
    announce "Running tests..."
    docker-compose run --rm api npm test "$@"
}

# Function to run development environment
function dev() {
    announce "Starting development environment..."
    docker-compose up --build
}

# Function to show help
function show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build       - Build Docker images"
    echo "  start       - Start services"
    echo "  stop        - Stop services"
    echo "  dev         - Start development environment"
    echo "  test        - Run tests"
    echo "  logs        - Show logs"
    echo "  cleanup     - Clean up Docker resources"
    echo "  help        - Show this help message"
}

# Check if Docker is running
check_docker

# Parse command line arguments
case "$1" in
    build)
        build
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    dev)
        dev
        ;;
    test)
        shift
        test "$@"
        ;;
    logs)
        shift
        logs "$@"
        ;;
    cleanup)
        cleanup
        ;;
    help|"")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac