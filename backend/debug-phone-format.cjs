// Debug phone number formatting issue
const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testPhoneFormatting() {
  console.log("🧪 Testing Phone Number Formatting Issue...\n");

  try {
    // Step 1: Request verification code
    console.log("📤 Step 1: Requesting verification code...");
    const response1 = await axios.post(
      `${BASE_URL}/api/mobile/auth/forgot-password`,
      {
        schoolCode: "TEST448",
        studentCode: "STU1918GX",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Verification code request successful!");
    console.log("📱 Response:", JSON.stringify(response1.data, null, 2));

    if (response1.data.data && response1.data.data.verificationCode) {
      const verificationCode = response1.data.data.verificationCode;
      const maskedPhone = response1.data.data.phoneNumber;

      console.log(`\n🔑 Verification Code: ${verificationCode}`);
      console.log(`📱 Masked Phone: ${maskedPhone}`);

      // Try different phone number formats for verification
      const phoneFormats = [
        maskedPhone.replace(/\*/g, ""), // Remove masking: +970786480
        maskedPhone.replace(/\*/g, "7"), // Replace with 7s: +9707867777480
        maskedPhone.replace(/\*/g, "2"), // Replace with 2s: +9707862222480
        "+9707867972480", // Full original number
        "7867972480", // Original format
        "+970-786-7972-480", // With dashes
      ];

      console.log("\n🧪 Testing different phone formats:");

      for (let i = 0; i < phoneFormats.length; i++) {
        const testPhone = phoneFormats[i];
        console.log(`\n📞 Format ${i + 1}: "${testPhone}"`);

        try {
          const response2 = await axios.post(
            `${BASE_URL}/api/mobile/auth/verify-code`,
            {
              phoneNumber: testPhone,
              verificationCode: verificationCode,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          console.log("✅ SUCCESS!");
          console.log("📱 Response:", JSON.stringify(response2.data, null, 2));
          break; // Stop on first success
        } catch (error) {
          if (error.response) {
            console.log(`❌ FAILED: ${error.response.data.message}`);
          } else {
            console.log(`❌ FAILED: ${error.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.log("❌ Error occurred!");
    if (error.response) {
      console.log("📄 Status:", error.response.status);
      console.log(
        "📄 Error Response:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.log("📄 Error:", error.message);
    }
  }
}

// Check server health first
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log("✅ Server is running\n");
    return true;
  } catch (error) {
    console.log("❌ Server is not running. Please start it with: bun run dev");
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testPhoneFormatting();
  }
}

main();
