import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Checking database...");

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        username: true,
        schoolName: true,
        isActive: true,
      },
    });

    console.log("📚 Schools in database:");
    schools.forEach((school) => {
      console.log(`- ID: ${school.id}`);
      console.log(`  Username: ${school.username}`);
      console.log(`  School Name: ${school.schoolName}`);
      console.log(`  Active: ${school.isActive}`);
      console.log("");
    });

    const centralAdmins = await prisma.centralAdmin.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        isActive: true,
      },
    });

    console.log("👤 Central Admins in database:");
    centralAdmins.forEach((admin) => {
      console.log(`- ID: ${admin.id}`);
      console.log(`  Username: ${admin.username}`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  Active: ${admin.isActive}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
