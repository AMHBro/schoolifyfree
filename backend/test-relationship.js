const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testStageSubjectRelationship() {
  try {
    console.log("Testing Stage-Subject Relationship...\n");

    // Get all stages with their subjects
    const stages = await prisma.stage.findMany({
      include: {
        subjects: true,
        students: true,
      },
    });

    console.log("Stages with their subjects:");
    stages.forEach((stage) => {
      console.log(
        `- ${stage.name}: ${stage.subjects.length} subjects, ${stage.students.length} students`
      );
      stage.subjects.forEach((subject) => {
        console.log(`  * ${subject.name}`);
      });
    });

    console.log("\n");

    // Get all subjects with their stage
    const subjects = await prisma.subject.findMany({
      include: {
        stage: true,
      },
    });

    console.log("Subjects with their stage:");
    subjects.forEach((subject) => {
      console.log(`- ${subject.name} (Stage: ${subject.stage.name})`);
    });

    console.log("\nRelationship test completed successfully!");
  } catch (error) {
    console.error("Error testing relationship:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testStageSubjectRelationship().catch(console.error);
