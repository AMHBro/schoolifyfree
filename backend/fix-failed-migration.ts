#!/usr/bin/env bun

/**
 * Fix Failed Migration Script
 * 
 * This script resolves the P3009 error by marking the failed migration
 * as rolled back, then applying all migrations fresh.
 * 
 * Usage: bun fix-failed-migration.ts
 */

import { execSync } from "child_process";

const FAILED_MIGRATION = "20250809190437_add_password_reset_codes";

async function fixFailedMigration() {
  console.log("🔧 Fixing failed migration...\n");

  try {
    // Step 1: Fix NULL contactPhone values first
    console.log("📋 Step 1: Fixing NULL contactPhone values...");
    console.log("Running fix-null-contact-phone.ts...\n");
    
    try {
      execSync("bun fix-null-contact-phone.ts", {
        encoding: "utf-8",
        stdio: "inherit",
      });
      console.log("\n✅ NULL values fixed\n");
    } catch (fixError: any) {
      console.log("⚠️  Could not fix NULL values automatically. Continuing anyway...\n");
    }

    // Step 2: Check migration status
    console.log("📊 Step 2: Checking migration status...");
    try {
      const statusOutput = execSync("bunx prisma migrate status", {
        encoding: "utf-8",
        stdio: "pipe",
      });
      console.log(statusOutput);
    } catch (error: any) {
      console.log("Status check output:", error.stdout || error.message);
    }

    // Step 3: Resolve the failed migration by marking it as rolled back
    console.log(`\n🔄 Step 3: Resolving failed migration: ${FAILED_MIGRATION}`);
    console.log("Marking migration as rolled back...");
    
    execSync(
      `bunx prisma migrate resolve --rolled-back ${FAILED_MIGRATION}`,
      {
        encoding: "utf-8",
        stdio: "inherit",
      }
    );

    console.log("✅ Migration marked as rolled back\n");

    // Step 4: Apply all migrations
    console.log("🚀 Step 4: Applying all migrations...");
    execSync("bunx prisma migrate deploy", {
      encoding: "utf-8",
      stdio: "inherit",
    });

    console.log("\n✅ All migrations applied successfully!");

    // Step 5: Generate Prisma client
    console.log("\n📦 Step 5: Generating Prisma client...");
    execSync("bunx prisma generate", {
      encoding: "utf-8",
      stdio: "inherit",
    });

    console.log("\n🎉 Migration fix completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Error fixing migration:", error.message);
    
    if (error.stdout) {
      console.error("Output:", error.stdout);
    }
    if (error.stderr) {
      console.error("Error:", error.stderr);
    }

    console.log("\n💡 Alternative solution:");
    console.log("If the database is completely new and empty, you can:");
    console.log("1. Reset the database: bunx prisma migrate reset --force");
    console.log("2. Or manually delete the _prisma_migrations table and run: bunx prisma migrate deploy");
    
    process.exit(1);
  }
}

fixFailedMigration();

