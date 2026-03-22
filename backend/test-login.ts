import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function testLogin() {
  try {
    // Find the school
    const school = await prisma.school.findUnique({
      where: { username: "defaultschool" },
    });

    console.log(
      "School found:",
      school
        ? {
            id: school.id,
            username: school.username,
            schoolName: school.schoolName,
            isActive: school.isActive,
            hasPassword: !!school.password,
          }
        : "Not found"
    );

    if (school) {
      // Test password comparison
      const testPassword = "school123";
      const isValid = await bcrypt.compare(testPassword, school.password);
      console.log("Password test result:", isValid);

      // Test with different password
      const isValid2 = await bcrypt.compare("wrongpassword", school.password);
      console.log("Wrong password test result:", isValid2);

      // Show hash info
      console.log(
        "Stored hash starts with:",
        school.password.substring(0, 20) + "..."
      );

      // Test creating a new hash
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log("New hash starts with:", newHash.substring(0, 20) + "...");
      const newHashTest = await bcrypt.compare(testPassword, newHash);
      console.log("New hash test result:", newHashTest);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
