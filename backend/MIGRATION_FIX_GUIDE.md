# Migration Fix Guide

## Problem

You're seeing error `P3009` indicating a failed migration:

```
migrate found failed migrations in the target database, new migrations will not be applied.
The `20250809190437_add_password_reset_codes` migration started at [timestamp] failed
```

## Solution

The issue is that the migration `20250809190437_add_password_reset_codes` tries to make `contactPhone` NOT NULL, but there are existing schools with NULL `contactPhone` values.

**I've fixed the migration file** to handle NULL values automatically. Now you have two options:

### Option 1: Fix the Failed Migration (Recommended - Now Fixed!)

The migration file has been updated to automatically fix NULL values. Simply run:

```bash
# Using npm script (this will fix NULL values first, then apply migrations)
bun run db:fix-migration

# Or manually fix NULL values first, then apply migrations
bun run db:fix-null-phone
bunx prisma migrate resolve --rolled-back 20250809190437_add_password_reset_codes
bunx prisma migrate deploy
bunx prisma generate
```

### Option 2: Reset Migrations (Only for New/Empty Databases)

⚠️ **WARNING**: Only use this if your database is completely empty and has no important data!

```bash
# Using npm script
bun run db:reset-migrations

# Or using the script directly
bun reset-migrations.ts
```

This will:

1. Drop all tables
2. Clear migration history
3. Reapply all migrations fresh

### Option 3: Use the Fix Script

```bash
bun fix-failed-migration.ts
```

This script automatically:

1. Checks migration status
2. Resolves the failed migration
3. Applies all migrations
4. Generates Prisma client

## Verify the Fix

After running any of the above solutions, verify everything is working:

```bash
# Check migration status
bunx prisma migrate status

# Generate Prisma client (if needed)
bunx prisma generate

# Test your application
bun run dev
```

## Why This Happened

When you create a new database and connect it to an existing Prisma project, Prisma tries to apply all migrations. If a migration fails partway through (due to network issues, timeouts, or schema conflicts), it leaves the migration in a "failed" state. This prevents any new migrations from being applied until the failed migration is resolved.

## Prevention

For future database migrations:

- Ensure stable database connectivity
- Test migrations on a staging database first
- Use `prisma migrate deploy` in production (not `migrate dev`)
- Monitor migration execution time for large databases
