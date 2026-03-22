const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixCrossSchoolAssignments() {
  console.log("🔧 Fixing Cross-School Teacher Assignments...\n");

  try {
    // Step 1: Remove cross-school stage assignments
    console.log("1️⃣ Removing cross-school stage assignments...");

    const teacherStages = await prisma.teacherStage.findMany({
      include: {
        teacher: true,
        stage: true,
      },
    });

    const crossSchoolStageAssignments = teacherStages.filter(
      (ts) => ts.teacher.schoolId !== ts.stage.schoolId
    );

    console.log(
      `   Found ${crossSchoolStageAssignments.length} cross-school stage assignments to remove`
    );

    for (const assignment of crossSchoolStageAssignments) {
      console.log(
        `   Removing: Teacher ${assignment.teacher.name} from Stage ${assignment.stage.name}`
      );
      await prisma.teacherStage.delete({
        where: {
          teacherId_stageId: {
            teacherId: assignment.teacherId,
            stageId: assignment.stageId,
          },
        },
      });
    }

    // Step 2: Remove cross-school subject assignments
    console.log("\n2️⃣ Removing cross-school subject assignments...");

    const teacherSubjects = await prisma.teacherSubject.findMany({
      include: {
        teacher: true,
        subject: true,
      },
    });

    const crossSchoolSubjectAssignments = teacherSubjects.filter(
      (ts) => ts.teacher.schoolId !== ts.subject.schoolId
    );

    console.log(
      `   Found ${crossSchoolSubjectAssignments.length} cross-school subject assignments to remove`
    );

    for (const assignment of crossSchoolSubjectAssignments) {
      console.log(
        `   Removing: Teacher ${assignment.teacher.name} from Subject ${assignment.subject.name}`
      );
      await prisma.teacherSubject.delete({
        where: {
          teacherId_subjectId: {
            teacherId: assignment.teacherId,
            subjectId: assignment.subjectId,
          },
        },
      });
    }

    // Step 3: Add correct assignments for teachers who now have no assignments
    console.log(
      "\n3️⃣ Adding proper assignments for teachers with no assignments..."
    );

    const teachersWithoutAssignments = await prisma.teacher.findMany({
      where: {
        AND: [{ stages: { none: {} } }, { subjects: { none: {} } }],
      },
      include: {
        school: true,
      },
    });

    console.log(
      `   Found ${teachersWithoutAssignments.length} teachers without assignments`
    );

    for (const teacher of teachersWithoutAssignments) {
      console.log(
        `   Adding assignments for Teacher ${teacher.name} in ${teacher.school.name}...`
      );

      // Get stages from teacher's school
      const schoolStages = await prisma.stage.findMany({
        where: { schoolId: teacher.schoolId },
        take: 2, // Assign to first 2 stages
      });

      // Get subjects from teacher's school
      const schoolSubjects = await prisma.subject.findMany({
        where: { schoolId: teacher.schoolId },
        take: 2, // Assign to first 2 subjects
      });

      // Create stage assignments
      for (const stage of schoolStages) {
        try {
          await prisma.teacherStage.create({
            data: {
              teacherId: teacher.id,
              stageId: stage.id,
            },
          });
          console.log(`     ✅ Assigned to Stage: ${stage.name}`);
        } catch (error) {
          console.log(`     ⚠️ Stage assignment already exists: ${stage.name}`);
        }
      }

      // Create subject assignments
      for (const subject of schoolSubjects) {
        try {
          await prisma.teacherSubject.create({
            data: {
              teacherId: teacher.id,
              subjectId: subject.id,
            },
          });
          console.log(`     ✅ Assigned to Subject: ${subject.name}`);
        } catch (error) {
          console.log(
            `     ⚠️ Subject assignment already exists: ${subject.name}`
          );
        }
      }
    }

    console.log("\n✅ Cross-school assignment cleanup completed!");
    console.log("🔒 Multi-tenancy isolation should now be properly enforced.");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCrossSchoolAssignments();
