import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSchoolByName() {
  try {
    console.log("🔍 Searching for 'aliameer' school...\n");

    // Search for school by username or school name
    const schools = await prisma.school.findMany({
      where: {
        OR: [
          { username: { contains: "ali", mode: "insensitive" } },
          { schoolName: { contains: "ali", mode: "insensitive" } },
          { schoolCode: { contains: "ALI", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        schoolName: true,
        schoolCode: true,
        accessCode: true,
        accessCodeActivated: true,
        contactPhone: true,
        isActive: true,
      },
    });

    if (schools.length === 0) {
      console.log("❌ No schools found matching 'ali'");
      console.log("\n🔍 Showing ALL schools instead:\n");
      
      const allSchools = await prisma.school.findMany({
        select: {
          id: true,
          username: true,
          schoolName: true,
          schoolCode: true,
          accessCode: true,
          accessCodeActivated: true,
          contactPhone: true,
          isActive: true,
        },
      });

      allSchools.forEach((school, index) => {
        console.log(`${index + 1}. ${school.schoolName}`);
        console.log(`   ID: ${school.id}`);
        console.log(`   Username: ${school.username}`);
        console.log(`   School Code: ${school.schoolCode}`);
        console.log(`   Access Code: ${school.accessCode || "❌ MISSING"}`);
        console.log(`   Activated: ${school.accessCodeActivated ? "✅ YES" : "❌ NO"}`);
        console.log(`   Phone: ${school.contactPhone}`);
        console.log(`   Active: ${school.isActive ? "Yes" : "No"}`);
        console.log("");
      });
      
      return;
    }

    console.log(`Found ${schools.length} matching school(s):\n`);

    schools.forEach((school, index) => {
      console.log(`${index + 1}. ${school.schoolName}`);
      console.log(`   ID: ${school.id}`);
      console.log(`   Username: ${school.username}`);
      console.log(`   School Code: ${school.schoolCode}`);
      console.log(`   Access Code: ${school.accessCode || "❌ MISSING"}`);
      console.log(`   Activated: ${school.accessCodeActivated ? "✅ YES" : "❌ NO"}`);
      console.log(`   Phone: ${school.contactPhone}`);
      console.log(`   Active: ${school.isActive ? "Yes" : "No"}`);
      
      // Check for inconsistency
      if (school.accessCodeActivated && !school.accessCode) {
        console.log(`   ⚠️  INCONSISTENT STATE: Activated but no access code!`);
      } else if (school.accessCodeActivated && school.accessCode) {
        console.log(`   ✅ Fully activated and has access code`);
      } else if (!school.accessCodeActivated && school.accessCode) {
        console.log(`   ℹ️  Has access code but not activated yet`);
      } else {
        console.log(`   📝 Not activated, no access code`);
      }
      console.log("");
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchoolByName();

