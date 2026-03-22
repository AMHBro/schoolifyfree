import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function comprehensivePasswordTest() {
  try {
    console.log("🔐 COMPREHENSIVE PASSWORD VERIFICATION TEST");
    console.log("=".repeat(50));

    // Test 1: Check School passwords
    console.log("\n📚 TESTING SCHOOL PASSWORDS");
    console.log("-".repeat(30));

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        username: true,
        schoolName: true,
        password: true,
        isActive: true,
      },
    });

    for (const school of schools) {
      console.log(`\n🏫 School: ${school.schoolName} (${school.username})`);
      console.log(`🔒 Password Hash: ${school.password}`);
      console.log(`✅ Active: ${school.isActive}`);

      // Check if hash format is valid
      const isValidHash =
        school.password.startsWith("$2b$") && school.password.length > 50;
      console.log(`🔍 Hash Format Valid: ${isValidHash ? "✅ YES" : "❌ NO"}`);

      if (!isValidHash) {
        console.log("⚠️  ISSUE: Invalid hash format detected!");
        console.log("   Expected: $2b$10$[52+ characters]");
        console.log(`   Found: ${school.password}`);
      }

      // Test password verification
      const testPassword = "school123";
      try {
        const isValid = await bcrypt.compare(testPassword, school.password);
        console.log(
          `🧪 Password "${testPassword}": ${
            isValid ? "✅ VALID" : "❌ INVALID"
          }`
        );
      } catch (error) {
        console.log(
          `🧪 Password "${testPassword}": ❌ ERROR - ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Test generating correct hash
      console.log("🔧 Generating correct hash for comparison:");
      const correctHash = await bcrypt.hash(testPassword, 10);
      console.log(`   New Hash: ${correctHash.substring(0, 20)}...`);
      const newHashTest = await bcrypt.compare(testPassword, correctHash);
      console.log(
        `   New Hash Test: ${newHashTest ? "✅ VALID" : "❌ INVALID"}`
      );
    }

    // Test 2: Check Central Admin passwords
    console.log("\n👤 TESTING CENTRAL ADMIN PASSWORDS");
    console.log("-".repeat(30));

    const admins = await prisma.centralAdmin.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        password: true,
        isActive: true,
      },
    });

    for (const admin of admins) {
      console.log(`\n👤 Admin: ${admin.name} (${admin.username})`);
      console.log(`🔒 Password Hash: ${admin.password}`);
      console.log(`✅ Active: ${admin.isActive}`);

      // Check if hash format is valid
      const isValidHash =
        admin.password.startsWith("$2b$") && admin.password.length > 50;
      console.log(`🔍 Hash Format Valid: ${isValidHash ? "✅ YES" : "❌ NO"}`);

      if (!isValidHash) {
        console.log("⚠️  ISSUE: Invalid hash format detected!");
        console.log("   Expected: $2b$10$[52+ characters]");
        console.log(`   Found: ${admin.password}`);
      }

      // Test password verification
      const testPassword = "admin123";
      try {
        const isValid = await bcrypt.compare(testPassword, admin.password);
        console.log(
          `🧪 Password "${testPassword}": ${
            isValid ? "✅ VALID" : "❌ INVALID"
          }`
        );
      } catch (error) {
        console.log(
          `🧪 Password "${testPassword}": ❌ ERROR - ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Test generating correct hash
      console.log("🔧 Generating correct hash for comparison:");
      const correctHash = await bcrypt.hash(testPassword, 10);
      console.log(`   New Hash: ${correctHash.substring(0, 20)}...`);
      const newHashTest = await bcrypt.compare(testPassword, correctHash);
      console.log(
        `   New Hash Test: ${newHashTest ? "✅ VALID" : "❌ INVALID"}`
      );
    }

    // Test 3: Demonstrate bcrypt functionality
    console.log("\n🔬 BCRYPT FUNCTIONALITY TEST");
    console.log("-".repeat(30));

    const testPasswords = ["school123", "admin123", "teacher123"];

    for (const password of testPasswords) {
      console.log(`\n🔐 Testing password: "${password}"`);

      // Generate hash
      const hash = await bcrypt.hash(password, 10);
      console.log(`   Generated Hash: ${hash}`);
      console.log(`   Hash Length: ${hash.length}`);
      console.log(`   Hash Prefix: ${hash.substring(0, 7)}`);

      // Test verification
      const isValid = await bcrypt.compare(password, hash);
      console.log(`   Verification: ${isValid ? "✅ SUCCESS" : "❌ FAILED"}`);

      // Test wrong password
      const wrongTest = await bcrypt.compare(password + "wrong", hash);
      console.log(
        `   Wrong Password Test: ${
          wrongTest ? "❌ FAILED" : "✅ SUCCESS (correctly rejected)"
        }`
      );
    }

    console.log("\n" + "=".repeat(50));
    console.log("🏁 PASSWORD TEST COMPLETE");
    console.log("\n💡 RECOMMENDATIONS:");
    console.log("   - If any hash format is invalid, run the fix script");
    console.log("   - All passwords should use bcrypt with $2b$ prefix");
    console.log("   - Hash length should be 60+ characters");
    console.log("   - Test login endpoints after any password fixes");
  } catch (error) {
    console.error("❌ Error during password test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensivePasswordTest();
