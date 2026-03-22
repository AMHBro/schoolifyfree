// Request a new verification code for testing
const axios = require("axios");

console.log("🔄 Requesting New Verification Code\n");
console.log("=" * 50);

async function requestNewCode() {
  // Use the phone number that received the WhatsApp message
  const testData = {
    schoolCode: "DEFAULT01",
    studentCode: "STU001", // Update this with the actual student code if different
  };

  console.log("📋 Requesting new code for:");
  console.log("School Code:", testData.schoolCode);
  console.log("Student Code:", testData.studentCode);
  console.log("");

  try {
    const response = await axios.post(
      "http://localhost:3000/api/mobile/auth/forgot-password",
      testData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ SUCCESS! New verification code requested");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.data, null, 2));

    console.log("\n📱 CHECK YOUR WHATSAPP NOW!");
    console.log("You should receive a new 6-digit code");
    console.log("Then use that new code in your mobile app");
  } catch (error) {
    console.log("❌ ERROR requesting new code!");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Error:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Network Error:", error.message);
    }
  }
}

requestNewCode().catch(console.error);
