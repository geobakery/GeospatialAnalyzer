#!/bin/bash
set -e

echo "Starting database restore from custom format dump..."

# Restore the database dump
pg_restore -U "postgres" -d "postgres" -v '/docker-entrypoint-initdb.d/data' 2>&1 || {
    echo "Note: Some warnings are expected during restore (e.g., extensions already exist)"
}

echo "Database restore completed!"