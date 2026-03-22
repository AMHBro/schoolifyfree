const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateStudentPhone() {
  try {
    // First find the student with school context
    const student = await prisma.student.findFirst({
      where: {
        code: "STU001",
        school: { schoolCode: "DEFAULT01" },
      },
      select: { id: true, schoolId: true, phoneNumber: true, name: true },
    });

    if (!student) {
      console.log("❌ Student not found");
      return;
    }

    console.log("📋 Current student data:", JSON.stringify(student, null, 2));

    // Update using the compound unique key
    // IMPORTANT: Replace '07901234567' with YOUR actual Iraqi WhatsApp number
    const updated = await prisma.student.update({
      where: {
        code_schoolId: {
          code: "STU001",
          schoolId: student.schoolId,
        },
      },
      data: { phoneNumber: "7867972480" }, // Updated to test with specific Iraqi number
      select: { id: true, name: true, phoneNumber: true, code: true },
    });

    console.log(
      "✅ Updated student phone number:",
      JSON.stringify(updated, null, 2)
    );
    console.log("\n🔄 Next steps:");
    console.log(
      "1. Make sure the phone number above is YOUR Iraqi WhatsApp number"
    );
    console.log("2. Try the forgot password flow again");
    console.log("3. Check your WhatsApp for the verification code");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateStudentPhone();
