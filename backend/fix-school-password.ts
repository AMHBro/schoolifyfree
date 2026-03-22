import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function fixSchoolPassword() {
  try {
    // Hash the correct password
    const hashedPassword = await bcrypt.hash("school123", 10);

    // Update the school password
    const updatedSchool = await prisma.school.update({
      where: { username: "defaultschool" },
      data: { password: hashedPassword },
    });

    console.log("✅ Updated school password for:", updatedSchool.username);

    // Test the login
    const testPassword = "school123";
    const isValid = await bcrypt.compare(testPassword, updatedSchool.password);
    console.log("✅ Password test result:", isValid);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSchoolPassword();
