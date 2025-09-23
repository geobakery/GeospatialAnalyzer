#!/bin/bash
set -e

echo "Starting database restore from custom format dump..."

# Restore the database dump
# use docker image env vars, c.f. https://hub.docker.com/_/postgres#initialization-scripts
pg_restore --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --no-owner -v '/docker-entrypoint-initdb.d/data' 2>&1 || {
    echo "Note: Some warnings are expected during restore (e.g., extensions already exist)"
}

echo "Database restore completed!"
