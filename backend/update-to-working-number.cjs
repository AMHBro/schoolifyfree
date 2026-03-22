const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateToWorkingNumber() {
  try {
    console.log("📋 Current student phone number: 7867972480");
    console.log("⚠️  This number may not have WhatsApp installed/active");
    console.log("\n🔧 SOLUTIONS:");
    console.log("1. Update with your own Iraqi WhatsApp number for testing");
    console.log("2. Use a verified Iraqi WhatsApp number");
    console.log("3. Ask the number owner to install/activate WhatsApp");

    // Uncomment and modify the line below with a working Iraqi WhatsApp number
    /*
    const updated = await prisma.student.update({
      where: {
        code_schoolId: {
          code: "STU001",
          schoolId: "00000000-0000-0000-0000-000000000001",
        },
      },
      data: { phoneNumber: "YOUR_WORKING_IRAQI_NUMBER" }, // Replace with actual working number
      select: { id: true, name: true, phoneNumber: true, code: true },
    });
    
    console.log("✅ Updated student phone number:", JSON.stringify(updated, null, 2));
    */

    console.log("\n💡 To test immediately:");
    console.log("1. Run: node test-with-your-number.cjs");
    console.log(
      "2. Replace 'YOUR_WHATSAPP_NUMBER' with your actual Iraqi WhatsApp number"
    );
    console.log("3. You should receive the test message on your WhatsApp");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateToWorkingNumber();
