import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar-looking characters
  let code = "";

  // Generate 3 groups of 4 characters: XXXX-XXXX-XXXX
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 2) code += "-";
  }

  return code;
}

async function fixMissingAccessCodes() {
  try {
    console.log("🔍 Checking for schools with missing access codes...\n");

    // Find schools that are activated but don't have an access code
    const schoolsNeedingFix = await prisma.school.findMany({
      where: {
        accessCode: null,
      },
      select: {
        id: true,
        schoolName: true,
        username: true,
        schoolCode: true,
        accessCodeActivated: true,
      },
    });

    if (schoolsNeedingFix.length === 0) {
      console.log("✅ All schools have access codes!");
      return;
    }

    console.log(
      `📋 Found ${schoolsNeedingFix.length} school(s) without access codes\n`
    );

    let successCount = 0;
    let failCount = 0;

    for (const school of schoolsNeedingFix) {
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
            // If accessCodeActivated was already true, keep it true
            // This preserves the activation state
          },
        });

        console.log(`✅ ${school.schoolName} (${school.username})`);
        console.log(`   School Code: ${school.schoolCode}`);
        console.log(`   Access Code: ${accessCode}`);
        console.log(
          `   Status: ${
            school.accessCodeActivated ? "Activated" : "Not Activated"
          }\n`
        );

        successCount++;
      } catch (error) {
        console.error(`❌ Error fixing ${school.schoolName}:`, error);
        failCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Summary:");
    console.log(`   ✅ Successfully fixed: ${successCount}`);
    if (failCount > 0) {
      console.log(`   ❌ Failed: ${failCount}`);
    }
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("❌ Script error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixMissingAccessCodes();
