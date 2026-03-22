// Check what students exist in the database
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkStudents() {
  console.log("📋 CHECKING STUDENTS IN DATABASE\n");

  try {
    // Get all students
    const students = await prisma.student.findMany({
      include: {
        school: true,
      },
    });

    console.log(`Found ${students.length} students:`);

    students.forEach((student, index) => {
      console.log(`\n${index + 1}. ${student.name}`);
      console.log(`   ID: ${student.id}`);
      console.log(`   Code: ${student.code}`);
      console.log(`   Phone: ${student.phoneNumber}`);
      console.log(
        `   School: ${student.school?.schoolCode} (${student.school?.name})`
      );
    });

    // Test the same query that's failing
    console.log("\n🔍 Testing problematic query...");

    try {
      const testStudent = await prisma.student.findFirst({
        where: {
          code: "STU001",
          school: {
            schoolCode: "DEFAULT01",
          },
        },
      });

      console.log(
        "✅ Query works! Found:",
        testStudent ? testStudent.name : "No student"
      );
    } catch (error) {
      console.log("❌ Query failed:", error.message);
    }
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudents().catch(console.error);
