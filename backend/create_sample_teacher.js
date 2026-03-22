// Script to create a sample teacher for testing the posts endpoint

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createSampleTeacher() {
  console.log("🏫 Creating sample teacher for testing...\n");

  try {
    // First, let's create a stage if it doesn't exist
    let stage = await prisma.stage.findFirst({
      where: { name: "Stage 1" },
    });

    if (!stage) {
      console.log("📚 Creating Stage 1...");
      stage = await prisma.stage.create({
        data: {
          name: "Stage 1",
        },
      });
      console.log(`✅ Created stage: ${stage.name} (${stage.id})`);
    } else {
      console.log(`✅ Found existing stage: ${stage.name} (${stage.id})`);
    }

    // Create a subject if it doesn't exist
    let subject = await prisma.subject.findFirst({
      where: {
        name: "Mathematics",
        stageId: stage.id,
      },
    });

    if (!subject) {
      console.log("📖 Creating Mathematics subject...");
      subject = await prisma.subject.create({
        data: {
          name: "Mathematics",
          stageId: stage.id,
        },
      });
      console.log(`✅ Created subject: ${subject.name} (${subject.id})`);
    } else {
      console.log(`✅ Found existing subject: ${subject.name} (${subject.id})`);
    }

    // Check if teacher already exists
    const existingTeacher = await prisma.teacher.findFirst({
      where: { phoneNumber: "demo123" },
    });

    if (existingTeacher) {
      console.log("✅ Teacher already exists!");
      console.log(`   Phone: demo123`);
      console.log(`   Password: demo123`);
      console.log(`   Name: ${existingTeacher.name}`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("demo123", 10);

    // Create the teacher
    console.log("👨‍🏫 Creating demo teacher...");
    const teacher = await prisma.teacher.create({
      data: {
        name: "Demo Teacher",
        phoneNumber: "demo123",
        password: hashedPassword,
        age: 30,
        gender: "male",
      },
    });

    // Associate teacher with stage
    console.log("🔗 Associating teacher with stage...");
    await prisma.teacherStage.create({
      data: {
        teacherId: teacher.id,
        stageId: stage.id,
      },
    });

    // Associate teacher with subject
    console.log("🔗 Associating teacher with subject...");
    await prisma.teacherSubject.create({
      data: {
        teacherId: teacher.id,
        subjectId: subject.id,
      },
    });

    console.log("\n✅ Sample teacher created successfully!");
    console.log("\n📱 Test credentials:");
    console.log("   Phone Number: demo123");
    console.log("   Password: demo123");
    console.log(`   Teacher ID: ${teacher.id}`);
    console.log(`   Stage: ${stage.name}`);
    console.log(`   Subject: ${subject.name}`);

    console.log(
      "\n🧪 You can now test the posts endpoint with these credentials!"
    );
  } catch (error) {
    console.error("❌ Error creating sample teacher:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleTeacher();
