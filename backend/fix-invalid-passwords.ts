import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function fixInvalidPasswords() {
  try {
    console.log("🔧 FIXING INVALID PASSWORD HASHES");
    console.log("=".repeat(50));

    // Define the correct passwords
    const passwords = {
      school: "school123",
      admin: "admin123",
      teacher: "teacher123",
    };

    // Check and fix school passwords
    console.log("\n📚 CHECKING SCHOOL PASSWORDS");
    console.log("-".repeat(30));

    const schools = await prisma.school.findMany();

    for (const school of schools) {
      console.log(`\n🏫 School: ${school.schoolName} (${school.username})`);
      console.log(`🔒 Current Hash: ${school.password}`);

      // Check if hash is valid
      const isValidHash =
        school.password.startsWith("$2b$") && school.password.length >= 60;

      if (!isValidHash) {
        console.log("❌ Invalid hash detected, fixing...");

        // Generate correct hash
        const correctPassword =
          school.username === "defaultschool"
            ? passwords.school
            : passwords.school;
        const newHash = await bcrypt.hash(correctPassword, 10);

        // Update the password
        await prisma.school.update({
          where: { id: school.id },
          data: { password: newHash },
        });

        console.log(`✅ Password updated for ${school.schoolName}`);
        console.log(`🔒 New Hash: ${newHash}`);

        // Test the new password
        const testResult = await bcrypt.compare(correctPassword, newHash);
        console.log(
          `🧪 Verification Test: ${testResult ? "✅ SUCCESS" : "❌ FAILED"}`
        );
      } else {
        console.log("✅ Hash is valid, no fix needed");

        // Test current password
        const testResult = await bcrypt.compare(
          passwords.school,
          school.password
        );
        console.log(
          `🧪 Current Password Test: ${testResult ? "✅ VALID" : "❌ INVALID"}`
        );
      }
    }

    // Check and fix central admin passwords
    console.log("\n👤 CHECKING CENTRAL ADMIN PASSWORDS");
    console.log("-".repeat(30));

    const admins = await prisma.centralAdmin.findMany();

    for (const admin of admins) {
      console.log(`\n👤 Admin: ${admin.name} (${admin.username})`);
      console.log(`🔒 Current Hash: ${admin.password}`);

      // Check if hash is valid
      const isValidHash =
        admin.password.startsWith("$2b$") && admin.password.length >= 60;

      if (!isValidHash) {
        console.log("❌ Invalid hash detected, fixing...");

        // Generate correct hash
        const correctPassword = passwords.admin;
        const newHash = await bcrypt.hash(correctPassword, 10);

        // Update the password
        await prisma.centralAdmin.update({
          where: { id: admin.id },
          data: { password: newHash },
        });

        console.log(`✅ Password updated for ${admin.name}`);
        console.log(`🔒 New Hash: ${newHash}`);

        // Test the new password
        const testResult = await bcrypt.compare(correctPassword, newHash);
        console.log(
          `🧪 Verification Test: ${testResult ? "✅ SUCCESS" : "❌ FAILED"}`
        );
      } else {
        console.log("✅ Hash is valid, no fix needed");

        // Test current password
        const testResult = await bcrypt.compare(
          passwords.admin,
          admin.password
        );
        console.log(
          `🧪 Current Password Test: ${testResult ? "✅ VALID" : "❌ INVALID"}`
        );
      }
    }

    // Check and fix teacher passwords (if any have invalid hashes)
    console.log("\n👨‍🏫 CHECKING TEACHER PASSWORDS");
    console.log("-".repeat(30));

    const teachers = await prisma.teacher.findMany();
    let teacherCount = 0;

    for (const teacher of teachers) {
      teacherCount++;
      if (teacherCount <= 5) {
        // Only show first 5 teachers to avoid spam
        console.log(`\n👨‍🏫 Teacher: ${teacher.name}`);
        console.log(`🔒 Current Hash: ${teacher.password.substring(0, 20)}...`);

        // Check if hash is valid
        const isValidHash =
          teacher.password.startsWith("$2b$") && teacher.password.length >= 60;

        if (!isValidHash) {
          console.log("❌ Invalid hash detected, fixing...");

          // Generate correct hash
          const newHash = await bcrypt.hash(passwords.teacher, 10);

          // Update the password
          await prisma.teacher.update({
            where: { id: teacher.id },
            data: { password: newHash },
          });

          console.log(`✅ Password updated for ${teacher.name}`);

          // Test the new password
          const testResult = await bcrypt.compare(passwords.teacher, newHash);
          console.log(
            `🧪 Verification Test: ${testResult ? "✅ SUCCESS" : "❌ FAILED"}`
          );
        } else {
          console.log("✅ Hash is valid");

          // Test current password
          const testResult = await bcrypt.compare(
            passwords.teacher,
            teacher.password
          );
          console.log(
            `🧪 Current Password Test: ${
              testResult ? "✅ VALID" : "❌ INVALID"
            }`
          );
        }
      }
    }

    if (teacherCount > 5) {
      console.log(
        `\n... and ${
          teacherCount - 5
        } more teachers (all should have valid hashes)`
      );
    }

    console.log("\n" + "=".repeat(50));
    console.log("🏁 PASSWORD FIX COMPLETE");
    console.log("\n📝 SUMMARY:");
    console.log("   - School password: school123");
    console.log("   - Admin password: admin123");
    console.log("   - Teacher password: teacher123");
    console.log("\n🧪 NEXT STEPS:");
    console.log("   1. Run the comprehensive test again to verify all fixes");
    console.log("   2. Test the login endpoints");
    console.log("   3. Update any documentation with the correct passwords");
  } catch (error) {
    console.error("❌ Error during password fix:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixInvalidPasswords();
