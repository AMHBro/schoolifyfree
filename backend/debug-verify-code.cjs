// Debug verify-code endpoint
const axios = require("axios");

console.log("🔍 Debugging Verify-Code Endpoint\n");
console.log("=" * 50);

// Test data - replace with actual values
const testData = {
  schoolCode: "DEFAULT01", // Replace with your school code
  studentCode: "STU001", // Replace with your student code
  verificationCode: "529244", // The code from your screenshot
};

async function testVerifyCode() {
  console.log("📋 Testing verify-code endpoint with:");
  console.log("School Code:", testData.schoolCode);
  console.log("Student Code:", testData.studentCode);
  console.log("Verification Code:", testData.verificationCode);
  console.log("");

  try {
    const response = await axios.post(
      "http://localhost:3000/api/mobile/auth/verify-code",
      testData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ SUCCESS!");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("❌ ERROR!");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log(
        "Error Response:",
        JSON.stringify(error.response.data, null, 2)
      );

      // Analyze specific errors
      const errorData = error.response.data;
      if (errorData.message) {
        console.log("\n💡 ERROR ANALYSIS:");
        if (errorData.message.includes("School code")) {
          console.log("   ❌ ISSUE: Invalid or missing school code");
          console.log("   🔧 SOLUTION: Check your school code");
        } else if (errorData.message.includes("Student not found")) {
          console.log("   ❌ ISSUE: Student not found with this code");
          console.log("   🔧 SOLUTION: Verify student code");
        } else if (errorData.message.includes("No verification code found")) {
          console.log("   ❌ ISSUE: No verification code in memory");
          console.log("   🔧 SOLUTION: Request a new verification code first");
        } else if (errorData.message.includes("expired")) {
          console.log("   ❌ ISSUE: Verification code has expired");
          console.log("   🔧 SOLUTION: Request a new verification code");
        } else if (errorData.message.includes("Invalid verification code")) {
          console.log("   ❌ ISSUE: Incorrect verification code");
          console.log("   🔧 SOLUTION: Double-check the 6-digit code");
        }
      }
    } else {
      console.log("Network Error:", error.message);
    }
  }
}

async function checkStoredCodes() {
  console.log("\n📋 Checking what verification codes are currently stored...");

  try {
    // This is a simple way to check if the backend is running
    const response = await axios.get("http://localhost:3000/health");
    console.log("✅ Backend is running");
  } catch (error) {
    console.log("❌ Backend is not running or not accessible");
    console.log(
      "💡 Make sure to start your backend with: npm start or bun run dev"
    );
    return;
  }
}

async function runDebug() {
  await checkStoredCodes();
  console.log("\n" + "=" * 50);
  await testVerifyCode();

  console.log("\n" + "=" * 50);
  console.log("🔧 TROUBLESHOOTING STEPS:");
  console.log("1. ✅ Make sure you requested a verification code first");
  console.log("2. ✅ Use the EXACT same schoolCode and studentCode");
  console.log("3. ✅ Enter the 6-digit code from WhatsApp");
  console.log("4. ✅ Don't wait too long (codes expire in 10 minutes)");
  console.log("5. ✅ Check your mobile app is sending all 3 parameters");

  console.log("\n📱 MOBILE APP REQUIREMENTS:");
  console.log("Your mobile app must send:");
  console.log("- schoolCode (same as forgot-password request)");
  console.log("- studentCode (same as forgot-password request)");
  console.log("- verificationCode (6-digit code from WhatsApp)");

  console.log("\n🎯 LIKELY ISSUE:");
  console.log("Your mobile app is probably only sending the verification code");
  console.log("but the backend needs all 3 parameters!");
}

runDebug().catch(console.error);
