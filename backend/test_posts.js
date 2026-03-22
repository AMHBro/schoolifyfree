// Test script to debug the posts endpoint issue

async function testPostsEndpoint() {
  console.log("🧪 Testing Posts Endpoint...\n");

  // Test 1: Unauthenticated request (should return 401)
  console.log("1. Testing unauthenticated request:");
  try {
    const response = await fetch(
      "http://localhost:3000/api/mobile/posts?page=1&limit=10"
    );
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
  } catch (error) {
    console.log(`   Error:`, error.message);
  }

  console.log("\n2. Testing with demo login...");

  // Updated test credentials
  const testCredentials = [
    { phoneNumber: "demo123", password: "demo123" }, // New demo credentials
    { phoneNumber: "demo", password: "demo" },
    { phoneNumber: "1234567890", password: "password" },
    { phoneNumber: "teacher1", password: "password" },
    { phoneNumber: "admin", password: "admin123" },
  ];

  let validToken = null;

  for (const creds of testCredentials) {
    try {
      console.log(`   Trying login with: ${creds.phoneNumber}`);
      const loginResponse = await fetch(
        "http://localhost:3000/api/mobile/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(creds),
        }
      );

      const loginData = await loginResponse.json();
      console.log(`   Login Status: ${loginResponse.status}`);

      if (loginData.success) {
        validToken = loginData.data.token;
        console.log(
          `   ✅ Login successful! Token: ${validToken.substring(0, 20)}...`
        );
        console.log(
          `   Teacher: ${loginData.data.teacher.name} (${loginData.data.teacher.id})`
        );
        break;
      } else {
        console.log(`   ❌ Login failed: ${loginData.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Login error: ${error.message}`);
    }
  }

  if (validToken) {
    console.log("\n3. Testing posts endpoint with valid token:");
    try {
      const postsResponse = await fetch(
        "http://localhost:3000/api/mobile/posts?page=1&limit=10",
        {
          headers: {
            Authorization: `Bearer ${validToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const postsData = await postsResponse.json();
      console.log(`   Status: ${postsResponse.status}`);
      console.log(`   Response:`, JSON.stringify(postsData, null, 2));

      if (postsResponse.status === 500) {
        console.log(
          "\n❌ 500 Error detected! This suggests a database or code issue."
        );
        console.log("   Check the backend console for detailed error logs.");
      } else if (postsResponse.status === 200) {
        console.log("\n✅ Posts endpoint working correctly!");
        console.log(`   Posts found: ${postsData.data?.posts?.length || 0}`);
      }
    } catch (error) {
      console.log(`   ❌ Posts endpoint error: ${error.message}`);
    }
  } else {
    console.log("\n❌ Could not get valid token to test posts endpoint");
    console.log("\n💡 You need to create a teacher in the database first.");
    console.log("   Run: node create_sample_teacher.mjs");
  }
}

// Run the test
testPostsEndpoint().catch(console.error);
