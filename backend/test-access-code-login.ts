import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testAccessCodeLogin() {
  try {
    console.log("🔍 Testing access code login functionality...\n");

    // Get all schools with access codes
    const schools = await prisma.school.findMany({
      where: {
        accessCode: { not: null },
      },
      select: {
        schoolName: true,
        accessCode: true,
        accessCodeActivated: true,
        isActive: true,
      },
    });

    if (schools.length === 0) {
      console.log("❌ No schools with access codes found!");
      return;
    }

    console.log(`Found ${schools.length} school(s) with access codes:\n`);

    schools.forEach((school, index) => {
      console.log(`${index + 1}. ${school.schoolName}`);
      console.log(`   Access Code: ${school.accessCode}`);
      console.log(`   Status: ${school.accessCodeActivated ? "✅ Activated (Can login)" : "⚠️  Not Activated (Cannot login)"}`);
      console.log(`   School Active: ${school.isActive ? "Yes" : "No"}`);
      
      if (school.accessCodeActivated && school.isActive) {
        console.log(`   \n   ✅ Ready for login! Use this access code in the login page:\n   📋 ${school.accessCode}\n`);
      } else if (!school.accessCodeActivated && school.accessCode) {
        console.log(`   ⚠️  Access code exists but not activated. School needs to activate from Settings.\n`);
      } else if (!school.isActive) {
        console.log(`   ❌ School is disabled. Contact admin to re-enable.\n`);
      }
      console.log("");
    });

    console.log("\n" + "=".repeat(70));
    console.log("📝 To test login:");
    console.log("   1. Go to the school login page");
    console.log("   2. Click on 'Login with Access Code' tab");
    console.log("   3. Enter one of the access codes listed above");
    console.log("   4. Should get authenticated without WhatsApp verification");
    console.log("=".repeat(70) + "\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAccessCodeLogin();

