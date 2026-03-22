// Test script for mobile authentication endpoints with students in stages
const BASE_URL = "http://localhost:3000";

async function testMobileAuthWithStudents() {
  console.log("Testing Mobile Authentication Endpoints with Students...\n");

  try {
    // Note: You'll need to update these credentials with actual teacher data from your database
    const testCredentials = {
      phoneNumber: "+1234567890", // Update with actual teacher phone number
      password: "password123", // Update with actual teacher password
    };

    console.log(
      "⚠️  Make sure you have a teacher with these credentials in your database:"
    );
    console.log(`Phone: ${testCredentials.phoneNumber}`);
    console.log(`Password: ${testCredentials.password}`);
    console.log(
      "And that the teacher is assigned to stages that have students\n"
    );

    // Test 1: Login and check if students are included in stages
    console.log("Test 1: Login and verify students are included in stages");
    const loginResponse = await fetch(`${BASE_URL}/api/mobile/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testCredentials),
    });

    const loginResult = await loginResponse.json();
    console.log("Status:", loginResponse.status);

    if (loginResponse.status === 200 && loginResult.success) {
      console.log("✅ Login successful!");
      console.log("Teacher:", loginResult.data.teacher.name);
      console.log("Stages count:", loginResult.data.teacher.stages.length);

      // Check if stages have students
      loginResult.data.teacher.stages.forEach((stage, index) => {
        console.log(`Stage ${index + 1}: ${stage.name}`);
        console.log(`  Students count: ${stage.students?.length || 0}`);
        if (stage.students && stage.students.length > 0) {
          stage.students.forEach((student, studentIndex) => {
            console.log(
              `  Student ${studentIndex + 1}: ${student.name} (${student.code})`
            );
          });
        } else {
          console.log("  No students in this stage");
        }
      });

      const token = loginResult.data.token;
      console.log("✅ Students data included in login response\n");

      // Test 2: Get profile and verify students are included
      console.log("Test 2: Get profile and verify students are included");
      const profileResponse = await fetch(
        `${BASE_URL}/api/mobile/auth/profile`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const profileResult = await profileResponse.json();
      console.log("Status:", profileResponse.status);

      if (profileResponse.status === 200 && profileResult.success) {
        console.log("✅ Profile fetch successful!");
        console.log("Teacher:", profileResult.data.teacher.name);
        console.log("Stages count:", profileResult.data.teacher.stages.length);

        // Check if stages have students in profile
        profileResult.data.teacher.stages.forEach((stage, index) => {
          console.log(`Stage ${index + 1}: ${stage.name}`);
          console.log(`  Students count: ${stage.students?.length || 0}`);
          if (stage.students && stage.students.length > 0) {
            stage.students.forEach((student, studentIndex) => {
              console.log(
                `  Student ${studentIndex + 1}: ${student.name} (${
                  student.code
                })`
              );
            });
          } else {
            console.log("  No students in this stage");
          }
        });

        console.log("✅ Students data included in profile response\n");
      } else {
        console.log("❌ Profile fetch failed:", profileResult);
      }

      // Test 3: Verify token
      console.log("Test 3: Verify token");
      const verifyResponse = await fetch(`${BASE_URL}/api/mobile/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const verifyResult = await verifyResponse.json();
      console.log("Status:", verifyResponse.status);
      console.log("Response:", verifyResult);
      console.log("✅ Token verification test passed\n");
    } else {
      console.log("❌ Login failed. Please check credentials and database:");
      console.log(loginResult);
    }

    console.log("🎉 All authentication with students tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Instructions for running the test
console.log("📋 To run this test successfully:");
console.log("1. Make sure your backend server is running (npm run dev)");
console.log(
  "2. Create a teacher in your dashboard with phone '+1234567890' and password 'password123'"
);
console.log("3. Assign the teacher to one or more stages");
console.log("4. Add some students to those stages");
console.log("5. Run this test: node test-auth-with-students.js\n");

// Run the tests
testMobileAuthWithStudents();
