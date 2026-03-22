#!/bin/bash

echo "🚀 Simple Backend Start"
echo "Environment: ${NODE_ENV:-development}"
echo "Port: ${PORT:-3000}"
echo "Database URL set: $([ -n "$DATABASE_URL" ] && echo "YES" || echo "NO")"

# Start the application directly
echo "Starting application..."
bun run start 