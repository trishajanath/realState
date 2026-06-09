#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Run database migrations
echo "Running database migrations..."
if [ -f "alembic.ini" ]; then
    # We will try to run alembic upgrade head, if it fails because DB is not ready, we will output a message
    alembic upgrade head || echo "Database migrations upgrade failed or skipped."
else
    echo "alembic.ini not found. Skipping migrations."
fi

# Start the application
echo "Starting FastAPI application with Uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
