// Simple test script for mobile authentication endpoints
const BASE_URL = "http://localhost:3000";

async function testMobileAuth() {
  console.log("Testing Mobile Authentication Endpoints...\n");

  try {
    // Test 1: Login with invalid credentials
    console.log("Test 1: Login with invalid credentials");
    const invalidLoginResponse = await fetch(
      `${BASE_URL}/api/mobile/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: "1234567890",
          password: "wrongpassword",
        }),
      }
    );

    const invalidLoginResult = await invalidLoginResponse.json();
    console.log("Status:", invalidLoginResponse.status);
    console.log("Response:", invalidLoginResult);
    console.log("✅ Invalid login test passed\n");

    // Test 2: Login with missing fields
    console.log("Test 2: Login with missing fields");
    const missingFieldsResponse = await fetch(
      `${BASE_URL}/api/mobile/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: "1234567890",
          // missing password
        }),
      }
    );

    const missingFieldsResult = await missingFieldsResponse.json();
    console.log("Status:", missingFieldsResponse.status);
    console.log("Response:", missingFieldsResult);
    console.log("✅ Missing fields test passed\n");

    // Test 3: Verify token without token
    console.log("Test 3: Verify token without authentication");
    const noTokenResponse = await fetch(`${BASE_URL}/api/mobile/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const noTokenResult = await noTokenResponse.json();
    console.log("Status:", noTokenResponse.status);
    console.log("Response:", noTokenResult);
    console.log("✅ No token test passed\n");

    // Test 4: Get profile without authentication
    console.log("Test 4: Get profile without authentication");
    const noAuthProfileResponse = await fetch(
      `${BASE_URL}/api/mobile/auth/profile`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const noAuthProfileResult = await noAuthProfileResponse.json();
    console.log("Status:", noAuthProfileResponse.status);
    console.log("Response:", noAuthProfileResult);
    console.log("✅ No auth profile test passed\n");

    console.log("🎉 All authentication tests completed!");
    console.log("\nNote: To test successful login, you need to:");
    console.log("1. Create a teacher in your dashboard first");
    console.log("2. Use that teacher's phone number and password");
    console.log("3. Update this script with valid credentials");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the tests
testMobileAuth();
