#!/bin/bash
set -e

# Function to display commands being run
function announce() {
    echo "→ $@"
}

# Wait for database to be ready
announce "Waiting for database to be ready..."
until pg_isready -h db -U postgres; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

# Set environment if not set
if [ -z "$NODE_ENV" ]; then
  export NODE_ENV=development
fi

# Create database if it doesn't exist
announce "Creating database if it doesn't exist..."
PGPASSWORD=postgres psql -h db -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'flexibill'" | grep -q 1 || \
  PGPASSWORD=postgres psql -h db -U postgres -c "CREATE DATABASE flexibill"

# Set database configuration
announce "Setting database configuration..."
PGPASSWORD=postgres psql -h db -U postgres -d flexibill -c "SET timezone = 'UTC';"
PGPASSWORD=postgres psql -h db -U postgres -d flexibill -c "SET client_encoding = 'UTF8';"

# Initialize schema
announce "Initializing database schema..."
PGPASSWORD=postgres psql -h db -U postgres -d flexibill -f /docker-entrypoint-initdb.d/initSchema.sql

# Seed test data in development
if [ "$NODE_ENV" = "development" ]; then
  announce "Seeding test data..."
  PGPASSWORD=postgres psql -h db -U postgres -d flexibill \
    -c "SET environment = 'development';" \
    -f /docker-entrypoint-initdb.d/seedData.sql
fi

# Verify database setup
announce "Verifying database setup..."
PGPASSWORD=postgres psql -h db -U postgres -d flexibill -c "\dt"

announce "Database initialization complete!"

# Keep container running if specified
if [ "${1}" = "keep-alive" ]; then
  announce "Keeping container alive..."
  tail -f /dev/null
fi