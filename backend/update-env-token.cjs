// Update your .env file with the working token
const fs = require("fs");

console.log("🔧 Updating .env with your working WhatsApp token...\n");

const newToken =
  "EAAR3I1ynndgBPGNUzKPY24QKKZCsChbIg4xlQMPVnna1zuOIgnYBoixY22ZBSxkdV69JUKHP6e8GwEZCSZAhxbdUWKfdAfeHC7I6EJgjmCn9adPNaYZCutKHqspkU0q5m8vkOcJGLVRxZACUFTUFKtWTm9TBjK2UC4E3nwbAjwmuIFyoep5jW4RIcMgGwgLG85N99ZAd8dI0iD1xrci5yR2d1ZCn66Dx46Xm8xZBWdZCMMbgZDZD";

try {
  // Read current .env file
  let envContent = "";
  if (fs.existsSync(".env")) {
    envContent = fs.readFileSync(".env", "utf8");
    console.log("✅ Found existing .env file");
  } else {
    console.log("⚠️  No .env file found, will create one");
  }

  // Update or add WHATSAPP_TOKEN
  const lines = envContent.split("\n");
  let tokenUpdated = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("WHATSAPP_TOKEN=")) {
      lines[i] = `WHATSAPP_TOKEN=${newToken}`;
      tokenUpdated = true;
      console.log("✅ Updated existing WHATSAPP_TOKEN");
      break;
    }
  }

  if (!tokenUpdated) {
    lines.push(`WHATSAPP_TOKEN=${newToken}`);
    console.log("✅ Added new WHATSAPP_TOKEN");
  }

  // Write back to .env
  fs.writeFileSync(".env", lines.join("\n"));
  console.log("✅ .env file updated successfully!");

  console.log("\n🎯 SUMMARY:");
  console.log("✅ Your working WhatsApp token has been saved to .env");
  console.log("✅ Your forgot password system will now use this token");
  console.log("✅ All API calls will use the validated token");

  console.log("\n🚀 NEXT STEPS:");
  console.log("1. Test your forgot password system with the mobile app");
  console.log("2. The backend will now use your working token automatically");
  console.log("3. Remember: Users must message your business number first");
} catch (error) {
  console.error("❌ Error updating .env file:", error.message);
}
