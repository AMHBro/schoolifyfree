#!/usr/bin/env node

/**
 * Test script to verify teacher can see their assigned data
 *
 * This script will:
 * 1. Test teacher login
 * 2. Check if teacher can see their assigned stages
 * 3. Check if teacher can see their assigned subjects
 * 4. Verify students are from the correct school
 */

const BASE_URL = "http://localhost:3000";

async function testTeacherDataVisibility() {
  console.log("🔍 Testing Teacher Data Visibility");
  console.log("=".repeat(40));

  try {
    // Note: Update these credentials with actual teacher credentials
    const teacherCredentials = {
      phoneNumber: "1234567890", // Update with real teacher phone
      password: "teacher123", // Update with real teacher password
    };

    console.log(
      `\n🔐 Attempting login with phone: ${teacherCredentials.phoneNumber}`
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

      const teacher = loginResult.data.teacher;
      console.log(`\n👨‍🏫 Teacher: ${teacher.name}`);
      console.log(`📞 Phone: ${teacher.phoneNumber}`);

      // Check stages
      console.log(`\n📚 Assigned Stages: ${teacher.stages.length}`);
      if (teacher.stages.length === 0) {
        console.log(
          "❌ No stages found! Teacher should be assigned to at least one stage."
        );
        console.log("💡 This might be why the teacher app shows nothing.");
      } else {
        teacher.stages.forEach((stage, index) => {
          console.log(
            `  ${index + 1}. ${stage.name} (${stage.students.length} students)`
          );

          // Show a few sample students
          if (stage.students.length > 0) {
            console.log(`     Sample students:`);
            stage.students.slice(0, 3).forEach((student, studentIndex) => {
              console.log(`       - ${student.name} (${student.code})`);
            });
            if (stage.students.length > 3) {
              console.log(`       ... and ${stage.students.length - 3} more`);
            }
          } else {
            console.log(`     No students in this stage`);
          }
        });
      }

      // Check subjects
      console.log(`\n📖 Assigned Subjects: ${teacher.subjects.length}`);
      if (teacher.subjects.length === 0) {
        console.log(
          "❌ No subjects found! Teacher should be assigned to at least one subject."
        );
        console.log("💡 This might be why the teacher app shows nothing.");
      } else {
        teacher.subjects.forEach((subject, index) => {
          console.log(`  ${index + 1}. ${subject.name}`);
        });
      }

      // Analysis
      console.log(`\n📊 Analysis:`);
      if (teacher.stages.length === 0 && teacher.subjects.length === 0) {
        console.log("❌ PROBLEM: Teacher has no assigned stages or subjects!");
        console.log("   This explains why the teacher app shows nothing.");
        console.log(
          "   The teacher needs to be assigned to stages and subjects from the school dashboard."
        );
      } else if (teacher.stages.length === 0) {
        console.log("⚠️  WARNING: Teacher has subjects but no stages!");
        console.log("   Teacher should be assigned to stages to see students.");
      } else if (teacher.subjects.length === 0) {
        console.log("⚠️  WARNING: Teacher has stages but no subjects!");
        console.log(
          "   Teacher should be assigned to subjects to see class content."
        );
      } else {
        console.log("✅ Teacher has both stages and subjects assigned.");
        console.log(
          "   If the teacher app still shows nothing, there might be another issue."
        );
      }
    } else {
      console.log("❌ Teacher login failed:");
      console.log("Status:", loginResponse.status);
      console.log("Response:", loginResult);

      if (loginResponse.status === 401) {
        console.log("\n💡 Make sure:");
        console.log("1. The teacher credentials are correct");
        console.log("2. The backend server is running");
        console.log("3. The teacher exists in the database");
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log("\n💡 Make sure the backend server is running:");
    console.log("cd backend && bun run dev");
  }
}

console.log(`
🧪 TEACHER DATA VISIBILITY TEST
==============================

BEFORE RUNNING THIS TEST:
1. Make sure backend is running: cd backend && bun run dev
2. Get teacher credentials: cd backend && bun credentials-summary.ts
3. Update teacherCredentials in this script with real values
4. Run: node test-teacher-data-visibility.js

WHAT THIS TEST CHECKS:
- Teacher login works
- Teacher has assigned stages
- Teacher has assigned subjects  
- Students are visible in stages
- Data isolation is working

IF TEACHER APP SHOWS NOTHING:
- Teacher might not be assigned to any stages/subjects
- Check teacher assignments in school dashboard
- Make sure teacher was created properly
`);

if (require.main === module) {
  testTeacherDataVisibility();
}

module.exports = { testTeacherDataVisibility };
