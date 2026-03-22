#!/bin/bash

# Script to apply the schedule time migration
# This script is safe to run on production

echo "======================================"
echo "Schedule Time Feature Migration"
echo "======================================"
echo ""
echo "This migration will add startTime and endTime fields to the schedules table."
echo "This is a SAFE migration that:"
echo "  - Adds two nullable columns"
echo "  - Does NOT delete any data"
echo "  - Preserves all existing schedules"
echo ""

read -p "Do you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "Checking Prisma client..."
npx prisma generate

echo ""
echo "Applying migration..."
npx prisma migrate deploy

echo ""
echo "Checking migration status..."
npx prisma migrate status

echo ""
echo "======================================"
echo "Migration complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Restart your backend server"
echo "2. Test the schedule feature in the dashboard"
echo "3. Start adding time ranges to your schedules"
echo ""

