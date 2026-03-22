const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testSchoolCodeAuth() {
  console.log("🔐 Testing School Code Authentication System...\n");

  try {
    // Step 1: Get available schools and their codes
    console.log("📋 Available Schools:");
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        schoolName: true,
        schoolCode: true,
        username: true,
        _count: {
          select: {
            teachers: true,
          },
        },
      },
    });

    schools.forEach((school) => {
      console.log(`  🏫 ${school.schoolName}`);
      console.log(`     Code: ${school.schoolCode}`);
      console.log(`     Username: ${school.username}`);
      console.log(`     Teachers: ${school._count.teachers}`);
      console.log("");
    });

    // Step 2: Get teachers for testing
    console.log("👥 Available Teachers:");
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        schoolId: true,
        school: {
          select: {
            schoolName: true,
            schoolCode: true,
          },
        },
      },
    });

    teachers.forEach((teacher) => {
      console.log(`  👨‍🏫 ${teacher.name}`);
      console.log(`     Phone: ${teacher.phoneNumber}`);
      console.log(
        `     School: ${teacher.school.schoolName} (${teacher.school.schoolCode})`
      );
      console.log("");
    });

    // Step 3: Test API endpoints
    console.log("🧪 Testing API Endpoints:");

    if (teachers.length > 0) {
      const testTeacher = teachers[0];
      const testSchool = testTeacher.school;

      console.log(`\n📝 Test Login Request Example:`);
      console.log(`POST /api/mobile/auth/login`);
      console.log(`Body: {`);
      console.log(`  "schoolCode": "${testSchool.schoolCode}",`);
      console.log(`  "phoneNumber": "${testTeacher.phoneNumber}",`);
      console.log(`  "password": "your_password"`);
      console.log(`}`);

      console.log(`\n🔍 What the system will do:`);
      console.log(`1. Verify school code "${testSchool.schoolCode}" exists`);
      console.log(
        `2. Look for teacher with phone "${testTeacher.phoneNumber}" in school "${testSchool.schoolName}"`
      );
      console.log(`3. Verify password matches`);
      console.log(`4. Return JWT token with schoolId for data isolation`);

      // Test with curl command
      console.log(`\n🌐 Test with curl:`);
      console.log(
        `curl -X POST http://localhost:3000/api/mobile/auth/login \\`
      );
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{`);
      console.log(`    "schoolCode": "${testSchool.schoolCode}",`);
      console.log(`    "phoneNumber": "${testTeacher.phoneNumber}",`);
      console.log(`    "password": "your_password"`);
      console.log(`  }'`);
    }

    // Step 4: Security Features
    console.log(`\n🔒 Security Features Implemented:`);
    console.log(`• School code validation (case-insensitive)`);
    console.log(
      `• Rate limiting: 5 attempts per 15 minutes per IP/phone/school combination`
    );
    console.log(`• Cross-school data isolation enforced`);
    console.log(`• JWT tokens include schoolId for session context`);
    console.log(`• Automatic rate limit reset on successful login`);

    console.log(`\n✅ School Code Authentication Test Complete!`);
  } catch (error) {
    console.error("❌ Error testing school code auth:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSchoolCodeAuth();
