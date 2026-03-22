// Debug the 500 error in reset password endpoint
const axios = require("axios");

console.log("🔍 DEBUGGING RESET PASSWORD 500 ERROR\n");

async function debugError() {
  try {
    const response = await axios.post(
      "http://localhost:3000/api/mobile/auth/reset-password",
      {
        phoneNumber: "7867972480",
        newPassword: "newpassword123",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Success:", response.data);
  } catch (error) {
    console.log("❌ Error Details:");
    console.log("Status:", error.response?.status);
    console.log("Data:", error.response?.data);
    console.log("Headers:", error.response?.headers);

    if (error.response?.status === 500) {
      console.log("\n💡 This is a server-side error. Check backend logs for:");
      console.log("1. Database connection issues");
      console.log("2. Prisma query errors");
      console.log("3. bcrypt hashing errors");
      console.log("4. Student not found in database");
      console.log("5. Phone number formatting issues");
    }
  }
}

debugError().catch(console.error);
