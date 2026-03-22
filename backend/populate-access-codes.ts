import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * Generate a secure random access code with at least 10 characters
 * including uppercase, lowercase, numbers, and special characters ($%@)
 */
function generateAccessCode(): string {
  const length = 12; // Use 12 characters for better security
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const specialChars = "$%@#&*";
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  let accessCode = "";

  // Ensure at least one of each type
  accessCode += uppercaseChars[crypto.randomInt(uppercaseChars.length)];
  accessCode += lowercaseChars[crypto.randomInt(lowercaseChars.length)];
  accessCode += numberChars[crypto.randomInt(numberChars.length)];
  accessCode += specialChars[crypto.randomInt(specialChars.length)];

  // Fill the rest randomly
  for (let i = accessCode.length; i < length; i++) {
    accessCode += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the access code
  return accessCode
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

async function populateAccessCodes() {
  try {
    console.log("🔍 Finding schools without access codes...\n");

    // Find all schools that don't have an access code
    const schoolsWithoutCode = await prisma.school.findMany({
      where: {
        accessCode: null,
      },
      select: {
        id: true,
        schoolName: true,
        username: true,
        schoolCode: true,
      },
    });

    if (schoolsWithoutCode.length === 0) {
      console.log("✅ All schools already have access codes!");
      return;
    }

    console.log(
      `📋 Found ${schoolsWithoutCode.length} school(s) without access codes\n`
    );

    let successCount = 0;
    let failCount = 0;

    for (const school of schoolsWithoutCode) {
      try {
        let accessCode = generateAccessCode();
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure the access code is unique
        while (attempts < maxAttempts) {
          const existing = await prisma.school.findUnique({
            where: { accessCode },
          });

          if (!existing) {
            break; // Code is unique
          }

          accessCode = generateAccessCode();
          attempts++;
        }

        if (attempts >= maxAttempts) {
          console.error(
            `❌ Failed to generate unique access code for ${school.schoolName} after ${maxAttempts} attempts`
          );
          failCount++;
          continue;
        }

        // Update the school with the new access code
        await prisma.school.update({
          where: { id: school.id },
          data: {
            accessCode,
            accessCodeActivated: false, // Default to not activated
          },
        });

        console.log(`✅ ${school.schoolName} (${school.username})`);
        console.log(`   School Code: ${school.schoolCode}`);
        console.log(`   Access Code: ${accessCode}`);
        console.log(`   Status: Not Activated\n`);

        successCount++;
      } catch (error) {
        console.error(
          `❌ Error updating ${school.schoolName}:`,
          error instanceof Error ? error.message : error
        );
        failCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount} school(s)`);
    if (failCount > 0) {
      console.log(`   ❌ Failed: ${failCount} school(s)`);
    }
    console.log("=".repeat(60) + "\n");

    // Show a sample of updated schools
    const updatedSchools = await prisma.school.findMany({
      where: {
        accessCode: {
          not: null,
        },
      },
      select: {
        schoolName: true,
        username: true,
        accessCode: true,
        accessCodeActivated: true,
      },
      take: 5,
    });

    if (updatedSchools.length > 0) {
      console.log("📋 Sample of schools with access codes:");
      updatedSchools.forEach((school) => {
        console.log(`\n   School: ${school.schoolName}`);
        console.log(`   Username: ${school.username}`);
        console.log(`   Access Code: ${school.accessCode}`);
        console.log(
          `   Activated: ${school.accessCodeActivated ? "Yes" : "No"}`
        );
      });
    }
  } catch (error) {
    console.error("❌ Error populating access codes:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateAccessCodes()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
