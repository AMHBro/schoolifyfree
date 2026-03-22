import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testSchoolProfileAPI() {
  try {
    console.log("🔍 Testing /school/profile API endpoint data...\n");

    // Get aliameer school directly from database
    const school = await prisma.school.findUnique({
      where: { username: "ali_ameer" },
      select: {
        id: true,
        username: true,
        schoolName: true,
        schoolCode: true,
        accessCode: true,
        accessCodeActivated: true,
        contactEmail: true,
        contactPhone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!school) {
      console.log("❌ School not found!");
      return;
    }

    console.log("📊 Database Data (what /school/profile SHOULD return):\n");
    console.log("School Info:");
    console.log(`  Name: ${school.schoolName}`);
    console.log(`  Username: ${school.username}`);
    console.log(`  School Code: ${school.schoolCode}`);
    console.log(`  Access Code: ${school.accessCode || "NULL"}`);
    console.log(`  Access Code Activated: ${school.accessCodeActivated}`);
    console.log(`  Phone: ${school.contactPhone}`);
    console.log(`  Active: ${school.isActive}`);
    console.log("");

    if (school.accessCode && school.accessCodeActivated) {
      console.log("✅ School is FULLY ACTIVATED with access code!");
      console.log(`   Access Code: ${school.accessCode}`);
      console.log("");
      console.log("Expected UI State in Settings Page:");
      console.log("  - Status: ✅ Activated");
      console.log("  - Access Code: Should display the code above");
      console.log("  - Button: 'Deactivate Company Access' (red button)");
    } else if (school.accessCode && !school.accessCodeActivated) {
      console.log("⚠️  School has access code but NOT activated");
      console.log(`   Access Code: ${school.accessCode}`);
    } else if (!school.accessCode && school.accessCodeActivated) {
      console.log("❌ INCONSISTENT STATE: Activated but no access code!");
    } else {
      console.log("📝 School not activated, no access code");
    }

    console.log("\n" + "=".repeat(70));
    console.log("🔧 Troubleshooting Steps if UI shows wrong data:");
    console.log("=".repeat(70));
    console.log("1. Make sure backend is running on port 3000:");
    console.log("   cd backend && bun run index.ts");
    console.log("");
    console.log("2. In the school dashboard, open browser DevTools:");
    console.log("   - Go to Network tab");
    console.log("   - Refresh the Settings page");
    console.log("   - Find the request to '/school/profile'");
    console.log("   - Check the Response - it should match the data above");
    console.log("");
    console.log("3. If the response is different, the school dashboard might be:");
    console.log("   - Connected to a different backend");
    console.log("   - Using a different database");
    console.log("   - Cached old data (clear browser cache)");
    console.log("");
    console.log("4. Clear browser cache completely:");
    console.log("   - Chrome/Brave: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete");
    console.log("   - Select 'All time' and clear cache");
    console.log("");
    console.log("5. Try in Incognito/Private mode to rule out caching");
    console.log("=".repeat(70) + "\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSchoolProfileAPI();

