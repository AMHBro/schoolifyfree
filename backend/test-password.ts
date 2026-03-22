import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testPassword() {
  try {
    console.log("🔐 Testing password verification...");

    const school = await prisma.school.findUnique({
      where: { username: "defaultschool" },
    });

    if (!school) {
      console.log("❌ School not found");
      return;
    }

    console.log(`✅ Found school: ${school.schoolName}`);
    console.log(`📝 Username: ${school.username}`);
    console.log(`🔒 Password hash: ${school.password}`);
    console.log(`✅ Active: ${school.isActive}`);

    // Test password verification
    const testPassword = "school123";
    const isValid = await bcrypt.compare(testPassword, school.password);

    console.log(
      `🧪 Testing password "${testPassword}": ${
        isValid ? "✅ VALID" : "❌ INVALID"
      }`
    );

    // Also test with a wrong password
    const wrongPassword = "wrongpassword";
    const isWrong = await bcrypt.compare(wrongPassword, school.password);
    console.log(
      `🧪 Testing wrong password "${wrongPassword}": ${
        isWrong ? "✅ VALID" : "❌ INVALID"
      }`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
