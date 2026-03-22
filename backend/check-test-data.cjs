// Check if we have test data for forgot password feature
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkTestData() {
  try {
    console.log("🔍 Checking test data...\n");

    // Check schools
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        schoolCode: true,
        schoolName: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    console.log("🏫 Schools:");
    schools.forEach((school) => {
      console.log(
        `  - ${school.schoolCode}: ${school.schoolName} (${school._count.students} students)`
      );
    });

    if (schools.length === 0) {
      console.log("  ❌ No schools found");
      return;
    }

    console.log("\n👨‍🎓 Students with phone numbers:");

    // Check students with phone numbers
    const studentsWithPhones = await prisma.student.findMany({
      where: {
        phoneNumber: {
          not: "",
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        phoneNumber: true,
        school: {
          select: {
            schoolCode: true,
            schoolName: true,
          },
        },
      },
      take: 10, // Limit to first 10
    });

    if (studentsWithPhones.length === 0) {
      console.log("  ❌ No students with phone numbers found");
      console.log(
        "  💡 You need to add phone numbers to student records for forgot password to work"
      );
    } else {
      studentsWithPhones.forEach((student) => {
        console.log(
          `  - ${student.code} (${student.school.schoolCode}): ${student.name} - ${student.phoneNumber}`
        );
      });

      console.log(
        `\n✅ Found ${studentsWithPhones.length} students with phone numbers`
      );
      console.log("\n🧪 You can test with:");
      console.log(`   School Code: ${studentsWithPhones[0].school.schoolCode}`);
      console.log(`   Student Code: ${studentsWithPhones[0].code}`);
    }
  } catch (error) {
    console.error("❌ Error checking test data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestData();
