// Use built-in fetch in Node.js 18+ or try to import
const fetch = globalThis.fetch;

async function testLoginWithSchoolCode() {
  console.log("🧪 Testing School Code Login Endpoint...\n");

  const baseUrl = "http://localhost:3000";

  // Test data
  const testCases = [
    {
      name: "Valid Login - Default School",
      data: {
        schoolCode: "DEFAULT01",
        phoneNumber: "+1234567890",
        password: "teacher123",
      },
      expectSuccess: true,
    },
    {
      name: "Invalid School Code",
      data: {
        schoolCode: "INVALID01",
        phoneNumber: "+1234567890",
        password: "teacher123",
      },
      expectSuccess: false,
    },
    {
      name: "Missing School Code",
      data: {
        phoneNumber: "+1234567890",
        password: "teacher123",
      },
      expectSuccess: false,
    },
    {
      name: "Valid School Code but Wrong Teacher",
      data: {
        schoolCode: "DEFAULT01",
        phoneNumber: "+9999999999",
        password: "teacher123",
      },
      expectSuccess: false,
    },
  ];

  for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}`);
    console.log(`   Data: ${JSON.stringify(testCase.data, null, 2)}`);

    try {
      const response = await fetch(`${baseUrl}/api/mobile/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testCase.data),
      });

      const result = await response.json();

      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${result.success}`);
      console.log(`   Message: ${result.message}`);

      if (testCase.expectSuccess === result.success) {
        console.log(`   ✅ Test passed!`);
      } else {
        console.log(
          `   ❌ Test failed! Expected success: ${testCase.expectSuccess}, got: ${result.success}`
        );
      }

      if (result.success && result.data?.teacher) {
        console.log(`   👨‍🏫 Teacher: ${result.data.teacher.name}`);
        console.log(`   🎯 Stages: ${result.data.teacher.stages?.length || 0}`);
        console.log(
          `   📚 Subjects: ${result.data.teacher.subjects?.length || 0}`
        );
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }

    console.log("");
  }

  console.log("🎯 Testing complete!\n");

  // Test rate limiting
  console.log("🚦 Testing Rate Limiting...\n");
  const rateLimitData = {
    schoolCode: "DEFAULT01",
    phoneNumber: "+1234567890",
    password: "wrongpassword",
  };

  for (let i = 1; i <= 7; i++) {
    console.log(`   Attempt ${i}/7`);

    try {
      const response = await fetch(`${baseUrl}/api/mobile/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rateLimitData),
      });

      const result = await response.json();
      console.log(`   Status: ${response.status} - ${result.message}`);

      if (response.status === 429) {
        console.log(`   ✅ Rate limiting working! Blocked after ${i} attempts`);
        break;
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }

    // Small delay between attempts
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n✅ All tests completed!");
}

testLoginWithSchoolCode().catch(console.error);
