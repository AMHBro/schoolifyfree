import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testWithRealToken() {
  try {
    console.log("🔍 Generating a test token for ali_ameer school...\n");

    // Find the school
    const school = await prisma.school.findUnique({
      where: { username: "ali_ameer" },
      select: {
        id: true,
        username: true,
        schoolName: true,
        schoolCode: true,
        accessCode: true,
        accessCodeActivated: true,
      },
    });

    if (!school) {
      console.log("❌ School not found!");
      return;
    }

    console.log("School found:");
    console.log(`  Name: ${school.schoolName}`);
    console.log(`  Username: ${school.username}`);
    console.log(`  Access Code: ${school.accessCode || "NULL"}`);
    console.log(`  Activated: ${school.accessCodeActivated}`);
    console.log("");

    // To test the API, you need to:
    console.log("=" .repeat(70));
    console.log("🧪 To test the /school/profile endpoint:");
    console.log("=" .repeat(70));
    console.log("1. Login to the school dashboard at http://localhost:3002");
    console.log("2. Open DevTools (F12) -> Console tab");
    console.log("3. Run this command to get your token:");
    console.log("");
    console.log("   localStorage.getItem('token')");
    console.log("");
    console.log("4. Copy the token value");
    console.log("5. Then in your terminal, run:");
    console.log("");
    console.log('   curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/school/profile');
    console.log("");
    console.log("6. Check if the response shows:");
    console.log(`   "accessCode": "${school.accessCode || "null"}"`);
    console.log(`   "accessCodeActivated": ${school.accessCodeActivated}`);
    console.log("");
    console.log("=" .repeat(70));
    console.log("🔧 Alternative: Check in Browser DevTools");
    console.log("=" .repeat(70));
    console.log("1. Go to http://localhost:3002/settings");
    console.log("2. Open DevTools -> Network tab");
    console.log("3. Click 'Refresh Status' button");
    console.log("4. Find the 'profile' request in Network tab");
    console.log("5. Click on it and check the Response");
    console.log("6. It should show accessCode and accessCodeActivated: true");
    console.log("=" .repeat(70));

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testWithRealToken();

