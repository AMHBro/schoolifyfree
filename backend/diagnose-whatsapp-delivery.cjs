// Comprehensive WhatsApp delivery diagnostic script
const axios = require("axios");
require("dotenv").config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TEST_PHONE = "7867972480";

console.log("🔍 WhatsApp Delivery Diagnostic Tool\n");
console.log("=".repeat(60));

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

const formattedPhone = formatPhoneNumber(TEST_PHONE);

console.log("📱 Testing Phone Number:", TEST_PHONE);
console.log("🔧 Formatted for WhatsApp:", formattedPhone);
console.log("=".repeat(60));

// Step 1: Check if phone number is registered with WhatsApp
async function checkPhoneRegistration() {
  console.log(
    "\n📋 Step 1: Checking if phone number is registered with WhatsApp"
  );

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/contacts`,
      {
        messaging_product: "whatsapp",
        contacts: [formattedPhone],
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Phone registration check completed!");
    console.log("📱 Result:", JSON.stringify(response.data, null, 2));

    // Check if the phone is registered
    if (response.data.contacts && response.data.contacts.length > 0) {
      const contact = response.data.contacts[0];
      if (contact.status === "valid") {
        console.log("✅ Phone number is registered with WhatsApp!");
        return true;
      } else {
        console.log("❌ Phone number is NOT registered with WhatsApp!");
        console.log(
          "💡 SOLUTION: Make sure WhatsApp is installed and active on",
          formattedPhone
        );
        return false;
      }
    }

    return false;
  } catch (error) {
    console.log("⚠️ Phone registration check failed");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Error:", JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 400) {
        console.log(
          "\n💡 This endpoint might not be available for your WhatsApp API plan"
        );
        console.log("   Proceeding with other checks...");
      }
    }
    return null; // Unknown status
  }
}

// Step 2: Send a simple text message and check detailed response
async function sendTestMessage() {
  console.log("\n📋 Step 2: Sending test message with detailed tracking");

  const message = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "text",
    text: {
      body: "🧪 DELIVERY TEST: If you receive this message, your WhatsApp API delivery is working correctly! Please reply with 'OK' to confirm.",
    },
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      message,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ API Request successful!");
    console.log(
      "📱 WhatsApp API Response:",
      JSON.stringify(response.data, null, 2)
    );

    if (response.data.messages && response.data.messages.length > 0) {
      const messageId = response.data.messages[0].id;
      console.log("📨 Message ID:", messageId);
      console.log("🔍 You can use this ID to track delivery status");

      // Wait a moment then check message status
      console.log("\n⏳ Waiting 10 seconds to check delivery status...");
      await new Promise((resolve) => setTimeout(resolve, 10000));

      return messageId;
    }

    return null;
  } catch (error) {
    console.log("❌ Message sending failed!");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Error:", JSON.stringify(error.response.data, null, 2));

      // Analyze specific error codes
      const errorData = error.response.data;
      if (errorData.error) {
        console.log("\n💡 ERROR ANALYSIS:");
        if (errorData.error.code === 131047) {
          console.log("   - Message was rejected due to user restrictions");
          console.log("   - The user may have blocked your number");
        } else if (errorData.error.code === 131026) {
          console.log("   - Message failed due to policy violation");
        } else if (errorData.error.code === 131051) {
          console.log(
            "   - User is not reachable (offline too long or invalid number)"
          );
        }
      }
    }
    return null;
  }
}

// Step 3: Check business phone number info
async function checkBusinessPhone() {
  console.log(
    "\n📋 Step 3: Checking your WhatsApp Business phone number details"
  );

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}`,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        },
      }
    );

    console.log("✅ Business phone info retrieved!");
    console.log(
      "📱 Your WhatsApp Business Number:",
      response.data.display_phone_number
    );
    console.log("📊 Quality Rating:", response.data.quality_rating);
    console.log(
      "✅ Verification Status:",
      response.data.code_verification_status
    );

    if (response.data.quality_rating === "RED") {
      console.log("⚠️ WARNING: Your business number has a RED quality rating!");
      console.log("   This may affect message delivery. Contact Meta support.");
    }

    return response.data;
  } catch (error) {
    console.log("❌ Failed to get business phone info");
    if (error.response) {
      console.log("Error:", JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Step 4: Test with a different known working WhatsApp number
async function suggestAlternativeTest() {
  console.log("\n📋 Step 4: Alternative testing suggestions");

  console.log("🔧 TROUBLESHOOTING STEPS:");
  console.log("1. ✅ Test with a different WhatsApp number you control");
  console.log(
    "2. ✅ Ask someone to send a message to your business number first"
  );
  console.log(
    "3. ✅ Check if",
    formattedPhone,
    "has WhatsApp installed and active"
  );
  console.log("4. ✅ Verify the phone number is not blocked by WhatsApp");
  console.log(
    "5. ✅ Ensure the number hasn't been offline for more than 30 days"
  );

  console.log("\n💡 IMMEDIATE SOLUTIONS TO TRY:");
  console.log("A. Use your own WhatsApp number for testing");
  console.log("B. Ask the owner of", formattedPhone, "to:");
  console.log("   - Check if WhatsApp is installed and updated");
  console.log("   - Send any message to your business number first");
  console.log("   - Check if they accidentally blocked your business");
  console.log("   - Verify they accepted WhatsApp's latest Terms of Service");
}

// Main diagnostic function
async function runDiagnostics() {
  const phoneRegistered = await checkPhoneRegistration();
  console.log("\n" + "=".repeat(60));

  const messageId = await sendTestMessage();
  console.log("\n" + "=".repeat(60));

  const businessInfo = await checkBusinessPhone();
  console.log("\n" + "=".repeat(60));

  await suggestAlternativeTest();

  console.log("\n" + "=".repeat(60));
  console.log("📊 DIAGNOSTIC SUMMARY:");
  console.log(
    "Phone Registration:",
    phoneRegistered === true
      ? "✅ CONFIRMED"
      : phoneRegistered === false
      ? "❌ NOT REGISTERED"
      : "⚠️ UNKNOWN"
  );
  console.log("API Request:", messageId ? "✅ SUCCESS" : "❌ FAILED");
  console.log("Business Account:", businessInfo ? "✅ ACTIVE" : "❌ ISSUE");

  if (!phoneRegistered && phoneRegistered !== null) {
    console.log("\n🎯 PRIMARY ISSUE IDENTIFIED:");
    console.log(
      "   The phone number",
      formattedPhone,
      "is not registered with WhatsApp!"
    );
    console.log("   SOLUTION: Install and activate WhatsApp on this number.");
  } else if (messageId && phoneRegistered !== false) {
    console.log("\n🎯 LIKELY ISSUES:");
    console.log("   1. Phone is offline or has been offline for >30 days");
    console.log("   2. Your business number may be blocked by this user");
    console.log(
      "   3. User needs to message your business first to open 24-hour window"
    );
  }

  console.log("\n📞 FOR IMMEDIATE TESTING:");
  console.log(
    "   Replace",
    TEST_PHONE,
    "with your own WhatsApp number in this script"
  );
  console.log(
    "   Or ask someone with an active WhatsApp to test with their number"
  );
  console.log("=".repeat(60));
}

runDiagnostics().catch(console.error);
