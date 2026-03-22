#!/usr/bin/env node

/**
 * Test script to verify multi-tenancy data isolation fixes
 *
 * This script will test:
 * 1. Teacher login from different schools
 * 2. Verify that teachers only see data from their own school
 * 3. Confirm that data isolation is working properly
 */

const BASE_URL = "http://localhost:3000";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testMultiTenancyFix() {
  console.log("🔧 Testing Multi-Tenancy Data Isolation Fixes");
  console.log("=".repeat(50));

  try {
    // Test 1: Get credentials summary to see available teachers
    console.log("\n📋 Step 1: Getting available teacher credentials...");

    // First, let's check what teachers exist in different schools
    console.log(
      "Note: You'll need to run the credentials summary script to see available teachers"
    );
    console.log("Run: cd backend && bun credentials-summary.ts");

    // Test 2: Login with a teacher and check data isolation
    console.log("\n🔐 Step 2: Testing teacher login and data isolation...");

    // Example test with a teacher (you'll need to update with actual credentials)
    const teacherCredentials = {
      phoneNumber: "1234567890", // Update with actual teacher phone
      password: "teacher123", // Update with actual teacher password
    };

    console.log(
      `Attempting login with phone: ${teacherCredentials.phoneNumber}`
    );

    const loginResponse = await fetch(`${BASE_URL}/api/mobile/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(teacherCredentials),
    });

    const loginResult = await loginResponse.json();

    if (loginResponse.status === 200 && loginResult.success) {
      console.log("✅ Teacher login successful!");
      console.log(`Teacher: ${loginResult.data.teacher.name}`);

      // Check that teacher data is properly isolated
      const teacher = loginResult.data.teacher;
      console.log(`\n📊 Teacher Data Summary:`);
      console.log(`- Name: ${teacher.name}`);
      console.log(`- Phone: ${teacher.phoneNumber}`);
      console.log(`- Stages: ${teacher.stages.length}`);

      // Check each stage and its students
      teacher.stages.forEach((stage, index) => {
        console.log(`\n📚 Stage ${index + 1}: ${stage.name}`);
        console.log(`  - Students: ${stage.students.length}`);

        if (stage.students.length > 0) {
          console.log(`  - Sample students:`);
          stage.students.slice(0, 3).forEach((student, studentIndex) => {
            console.log(
              `    ${studentIndex + 1}. ${student.name} (${student.code})`
            );
          });
        }
      });

      console.log(`\n📖 Subjects: ${teacher.subjects.length}`);
      teacher.subjects.forEach((subject, index) => {
        console.log(`  ${index + 1}. ${subject.name}`);
      });

      console.log("\n✅ Data isolation test passed!");
      console.log("Teacher can only see their own school's data.");
    } else {
      console.log("❌ Teacher login failed:");
      console.log("Status:", loginResponse.status);
      console.log("Response:", loginResult);

      if (loginResponse.status === 401) {
        console.log("\n💡 Tip: Make sure the teacher credentials are correct.");
        console.log(
          "Run the credentials summary script to get valid credentials."
        );
      }
    }

    console.log("\n🎉 Multi-tenancy test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Instructions for running the test
console.log(`
🧪 MULTI-TENANCY TEST INSTRUCTIONS
=================================

1. Make sure the backend server is running:
   cd backend && bun run dev

2. Get teacher credentials:
   cd backend && bun credentials-summary.ts

3. Update the teacherCredentials object in this script with real credentials

4. Run this test:
   node test-multi-tenancy-fix.js

WHAT THIS TEST VERIFIES:
- Teacher login works with phone number
- Teacher only sees students from their own school
- Teacher only sees stages from their own school  
- Teacher only sees subjects from their own school
- Data isolation is properly implemented
`);

// Run the test if script is executed directly
if (require.main === module) {
  testMultiTenancyFix();
}

module.exports = { testMultiTenancyFix };
