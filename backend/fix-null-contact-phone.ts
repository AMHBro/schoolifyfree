#!/usr/bin/env bun

/**
 * Fix NULL Contact Phone Values
 * 
 * This script fixes NULL contactPhone values in the schools table
 * before applying the migration that requires it to be NOT NULL.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixNullContactPhone() {
  console.log("🔧 Fixing NULL contactPhone values...\n");

  try {
    // Find all schools with NULL contactPhone
    const schoolsWithNullPhone = await prisma.$queryRaw<
      Array<{ id: string; username: string; schoolName: string }>
    >`
      SELECT id, username, "schoolName"
      FROM schools
      WHERE "contactPhone" IS NULL
    `;

    if (schoolsWithNullPhone.length === 0) {
      console.log("✅ No schools with NULL contactPhone found.");
      return;
    }

    console.log(`Found ${schoolsWithNullPhone.length} school(s) with NULL contactPhone:\n`);

    // Update each school with a placeholder phone number
    for (const school of schoolsWithNullPhone) {
      // Generate a unique placeholder phone number
      // Format: +0000000000X where X is the last digit of the UUID
      const placeholderPhone = `+0000000000${school.id.slice(-1)}`;
      
      console.log(`  - ${school.schoolName} (${school.username})`);
      console.log(`    Setting contactPhone to: ${placeholderPhone}`);

      await prisma.$executeRaw`
        UPDATE schools
        SET "contactPhone" = ${placeholderPhone}
        WHERE id = ${school.id}
      `;
    }

    console.log(`\n✅ Updated ${schoolsWithNullPhone.length} school(s) with placeholder phone numbers.`);
    console.log("\n⚠️  Note: These are placeholder values. Update them with real phone numbers in your application.\n");
  } catch (error: any) {
    console.error("❌ Error fixing NULL contactPhone:", error.message);
    
    // Try using raw SQL queries directly
    console.log("\n🔄 Trying raw SQL approach...\n");
    
    try {
      // First, check for NULL values using raw SQL
      const schoolsWithNull = await prisma.$queryRaw<
        Array<{ id: string; username: string; schoolName: string }>
      >`
        SELECT id, username, "schoolName"
        FROM schools
        WHERE "contactPhone" IS NULL
      `;

      if (schoolsWithNull.length === 0) {
        console.log("✅ No schools with NULL contactPhone found.");
        return;
      }

      console.log(`Found ${schoolsWithNull.length} school(s) with NULL contactPhone:\n`);

      // Update each school using raw SQL
      for (const school of schoolsWithNull) {
        const placeholderPhone = `+0000000000${school.id.slice(-1)}`;
        
        console.log(`  - ${school.schoolName} (${school.username})`);
        console.log(`    Setting contactPhone to: ${placeholderPhone}`);

        await prisma.$executeRaw`
          UPDATE schools
          SET "contactPhone" = ${placeholderPhone}
          WHERE id = ${school.id}
        `;
      }

      console.log(`\n✅ Updated ${schoolsWithNull.length} school(s) with placeholder phone numbers.`);
      console.log("\n⚠️  Note: These are placeholder values. Update them with real phone numbers in your application.\n");
    } catch (sqlError: any) {
      console.error("❌ SQL Error:", sqlError.message);
      console.error("\n💡 Try running this SQL manually in your database:");
      console.error('   UPDATE schools SET "contactPhone" = \'PLACEHOLDER\' || id::text WHERE "contactPhone" IS NULL;');
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixNullContactPhone();

