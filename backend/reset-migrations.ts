#!/usr/bin/env bun

/**
 * Reset Migrations Script (For New/Empty Databases)
 * 
 * WARNING: This script is only for NEW databases with no important data.
 * It will delete the migration history and reapply all migrations.
 * 
 * Usage: bun reset-migrations.ts
 */

import { execSync } from "child_process";

async function resetMigrations() {
  console.log("⚠️  WARNING: This will reset all migration history!");
  console.log("Only use this on a NEW database with no important data.\n");

  try {
    // Step 1: Generate Prisma client first
    console.log("📦 Generating Prisma client...");
    execSync("bunx prisma generate", {
      encoding: "utf-8",
      stdio: "inherit",
    });

    // Step 2: Use migrate reset (this will drop all tables and reapply migrations)
    console.log("\n🔄 Resetting database and applying migrations...");
    console.log("This will drop all tables and reapply all migrations...\n");
    
    execSync("bunx prisma migrate reset --force --skip-seed", {
      encoding: "utf-8",
      stdio: "inherit",
    });

    console.log("\n✅ Database reset and migrations applied successfully!");
  } catch (error: any) {
    console.error("\n❌ Error resetting migrations:", error.message);
    
    if (error.stdout) {
      console.error("Output:", error.stdout);
    }
    if (error.stderr) {
      console.error("Error:", error.stderr);
    }

    console.log("\n💡 Alternative: Try the fix-failed-migration.ts script instead");
    process.exit(1);
  }
}

resetMigrations();


