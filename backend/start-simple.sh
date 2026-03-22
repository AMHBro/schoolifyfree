#!/bin/sh

echo "Starting SMS Backend..."

echo "Generating Prisma client..."
bunx prisma generate || {
    echo "Failed to generate Prisma client, trying with explicit schema..."
    bunx prisma generate --schema=./prisma/schema.prisma
}

echo "Waiting for database to be ready..."
sleep 5

echo "Running database migrations..."
for i in 1 2 3 4 5; do
  echo "Migration attempt $i..."
  if bunx prisma migrate deploy; then
    echo "Migrations completed successfully!"
    break
  else
    echo "Migration attempt $i failed, retrying in 5 seconds..."
    sleep 5
  fi
done

echo "Starting the application..."
exec bun run index.ts 