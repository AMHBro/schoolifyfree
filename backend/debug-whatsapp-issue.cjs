// Debug script to identify WhatsApp API issues
const axios = require("axios");
require("dotenv").config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log("🔍 WhatsApp API Debug Tool\n");
console.log("=".repeat(50));

// Step 1: Check environment configuration
console.log("📋 Step 1: Environment Configuration Check");
console.log(`WHATSAPP_TOKEN: ${WHATSAPP_TOKEN ? "SET ✅" : "NOT SET ❌"}`);
console.log(
  `WHATSAPP_PHONE_NUMBER_ID: ${
    WHATSAPP_PHONE_NUMBER_ID ? "SET ✅" : "NOT SET ❌"
  }`
);

if (WHATSAPP_TOKEN) {
  console.log(`Token length: ${WHATSAPP_TOKEN.length} characters`);
  console.log(`Token starts with: ${WHATSAPP_TOKEN.substring(0, 10)}...`);
}

if (WHATSAPP_PHONE_NUMBER_ID) {
  console.log(`Phone Number ID: ${WHATSAPP_PHONE_NUMBER_ID}`);
}

console.log("\n" + "=".repeat(50) + "\n");

// Step 2: Test token validity
async function testTokenValidity() {
  console.log("📋 Step 2: Token Validity Check");

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.log("❌ Cannot test token - missing credentials");
    return false;
  }

  try {
    // Test with a simple API call to check token validity
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        },
      }
    );

    console.log("✅ Token is valid!");
    console.log(
      "📱 Phone Number Info:",
      JSON.stringify(response.data, null, 2)
    );
    return true;
  } catch (error) {
    console.log("❌ Token validation failed!");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Error:", JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 401) {
        console.log(
          "\n💡 ISSUE IDENTIFIED: Your WhatsApp access token is expired or invalid!"
        );
        console.log(
          "🔧 SOLUTION: Generate a new access token from Meta Developer Console:"
        );
        console.log("   1. Go to https://developers.facebook.com/apps");
        console.log("   2. Select your app");
        console.log("   3. Go to WhatsApp > API Setup");
        console.log("   4. Generate a new temporary access token");
        console.log("   5. Update your .env file with the new token");
      } else if (error.response.status === 404) {
        console.log("\n💡 ISSUE IDENTIFIED: Phone Number ID is incorrect!");
        console.log(
          "🔧 SOLUTION: Check your Phone Number ID in Meta Developer Console"
        );
      }
    } else {
      console.log("Network Error:", error.message);
    }
    return false;
  }
}

// Step 3: Test message sending with Iraq formatting
async function testMessageSending() {
  console.log("📋 Step 3: Message Sending Test");

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.log("❌ Cannot test message sending - missing credentials");
    return;
  }

  // Test with the specific phone number from the user
  const testPhoneNumber = "7867972480"; // Iraqi WhatsApp number to test

  // Format phone number for Iraq
  function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return "";

    let cleaned = phoneNumber.replace(/\D/g, "");

    if (cleaned.startsWith("964")) {
      return `+${cleaned}`;
    }

    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }

    return `+964${cleaned}`;
  }

  const formattedPhone = formatPhoneNumber(testPhoneNumber);
  console.log(`Original phone: ${testPhoneNumber}`);
  console.log(`Formatted phone: ${formattedPhone}`);

  const testMessage = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "text",
    text: {
      body: "🧪 Test message from SMS app - Forgot Password Debug\n\nIf you receive this, your WhatsApp API is working correctly!",
    },
  };

  try {
    console.log("📤 Sending test message...");

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      testMessage,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Message sent successfully!");
    console.log("📱 Response:", JSON.stringify(response.data, null, 2));
    console.log("\n🔍 Check your WhatsApp now!");
  } catch (error) {
    console.log("❌ Message sending failed!");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Error:", JSON.stringify(error.response.data, null, 2));

      const errorData = error.response.data;
      if (
        errorData.error &&
        errorData.error.error_data &&
        errorData.error.error_data.details
      ) {
        console.log("\n💡 DETAILED ERROR:", errorData.error.error_data.details);
      }

      if (error.response.status === 400) {
        console.log("\n💡 POSSIBLE ISSUES:");
        console.log("   1. Phone number format is incorrect");
        console.log("   2. Phone number is not registered with WhatsApp");
        console.log(
          "   3. Phone number is not verified with your WhatsApp Business account"
        );
      }
    } else {
      console.log("Network Error:", error.message);
    }
  }
}

// Step 4: Check if phone number is registered with WhatsApp
async function checkPhoneNumberStatus() {
  console.log("📋 Step 4: Phone Number Registration Check");

  // This endpoint checks if a phone number is registered with WhatsApp
  // Note: This might not be available in all WhatsApp API versions
  const testPhoneNumber = "+9647867972480";

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/contacts`,
      {
        messaging_product: "whatsapp",
        contacts: [testPhoneNumber],
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Phone number check completed!");
    console.log("📱 Result:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("⚠️ Phone number check not available or failed");
    if (error.response) {
      console.log("Status:", error.response.status);
    }
  }
}

// Run all tests
async function runAllTests() {
  const tokenValid = await testTokenValidity();
  console.log("\n" + "=".repeat(50) + "\n");

  if (tokenValid) {
    await testMessageSending();
    console.log("\n" + "=".repeat(50) + "\n");
    await checkPhoneNumberStatus();
  } else {
    console.log("⚠️ Skipping message tests due to invalid token");
  }

  console.log("\n" + "=".repeat(50));
  console.log("🔧 TROUBLESHOOTING CHECKLIST:");
  console.log("1. ✅ Generate a new access token from Meta Developer Console");
  console.log("2. ✅ Ensure the phone number is registered with WhatsApp");
  console.log("3. ✅ Verify the phone number format (+964XXXXXXXXX for Iraq)");
  console.log(
    "4. ✅ Check that the phone number is added to your WhatsApp Business account"
  );
  console.log(
    "5. ✅ Make sure your WhatsApp Business API is approved and active"
  );
  console.log("\n📚 Helpful Links:");
  console.log("- Meta Developer Console: https://developers.facebook.com/apps");
  console.log(
    "- WhatsApp Business API Setup: https://developers.facebook.com/docs/whatsapp/getting-started"
  );
  console.log("=".repeat(50));
}

runAllTests().catch(console.error);
