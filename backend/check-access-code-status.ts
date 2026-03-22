import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAccessCodeStatus() {
  try {
    console.log("🔍 Checking all schools access code status...\n");

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        schoolName: true,
        username: true,
        schoolCode: true,
        accessCode: true,
        accessCodeActivated: true,
        contactPhone: true,
      },
    });

    if (schools.length === 0) {
      console.log("No schools found in database.");
      return;
    }

    console.log(`Found ${schools.length} school(s):\n`);

    schools.forEach((school, index) => {
      console.log(`${index + 1}. ${school.schoolName}`);
      console.log(`   Username: ${school.username}`);
      console.log(`   School Code: ${school.schoolCode}`);
      console.log(`   Access Code: ${school.accessCode || "❌ MISSING"}`);
      console.log(`   Activated: ${school.accessCodeActivated ? "✅ YES" : "❌ NO"}`);
      console.log(`   Phone: ${school.contactPhone}`);
      
      // Check for inconsistency
      if (school.accessCodeActivated && !school.accessCode) {
        console.log(`   ⚠️  INCONSISTENT STATE: Activated but no access code!`);
      } else if (!school.accessCodeActivated && school.accessCode) {
        console.log(`   ℹ️  Has access code but not activated yet (normal state)`);
      } else if (school.accessCodeActivated && school.accessCode) {
        console.log(`   ✅ Fully activated and has access code`);
      } else {
        console.log(`   📝 Not activated yet, no access code`);
      }
      console.log("");
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccessCodeStatus();

