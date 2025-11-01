#!/bin/bash
set -e

echo "Waiting for PostgreSQL to start..."
sleep 5

# Create database and user if they don't exist
su - postgres -c "psql -c \"CREATE DATABASE capyxperks;\" || true"
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\" || true"

echo "PostgreSQL initialized successfully"

# Initialize database schema
cd /app/backend
python -c "from database import init_db; init_db()" || true

echo "Database schema initialized"

