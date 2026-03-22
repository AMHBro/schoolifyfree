const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugTeacherSchoolData() {
  console.log("🔍 Debugging Teacher School Data Assignment...\n");

  try {
    // Get all teachers with their school info
    const teachers = await prisma.teacher.findMany({
      include: {
        school: true,
        stages: {
          include: {
            stage: {
              include: {
                school: true,
              },
            },
          },
        },
        subjects: {
          include: {
            subject: {
              include: {
                school: true,
              },
            },
          },
        },
      },
    });

    console.log(`📊 Found ${teachers.length} teachers total\n`);

    for (const teacher of teachers) {
      console.log(`👨‍🏫 Teacher: ${teacher.name} (${teacher.phoneNumber})`);
      console.log(
        `   School: ${teacher.school.name} (ID: ${teacher.schoolId})`
      );
      console.log(`   Stages assigned: ${teacher.stages.length}`);

      // Check if teacher has stages from different schools
      for (const ts of teacher.stages) {
        const stageSchool = ts.stage.school;
        const isWrongSchool = stageSchool.id !== teacher.schoolId;
        console.log(
          `     - Stage: ${ts.stage.name} from ${stageSchool.name} ${
            isWrongSchool ? "❌ WRONG SCHOOL" : "✅"
          }`
        );
      }

      console.log(`   Subjects assigned: ${teacher.subjects.length}`);

      // Check if teacher has subjects from different schools
      for (const ts of teacher.subjects) {
        const subjectSchool = ts.subject.school;
        const isWrongSchool = subjectSchool.id !== teacher.schoolId;
        console.log(
          `     - Subject: ${ts.subject.name} from ${subjectSchool.name} ${
            isWrongSchool ? "❌ WRONG SCHOOL" : "✅"
          }`
        );
      }

      console.log("");
    }

    // Check for cross-school assignments
    console.log("🔎 Checking for cross-school assignment issues...\n");

    const teacherStages = await prisma.teacherStage.findMany({
      include: {
        teacher: {
          include: { school: true },
        },
        stage: {
          include: { school: true },
        },
      },
    });

    const crossSchoolStageAssignments = teacherStages.filter(
      (ts) => ts.teacher.schoolId !== ts.stage.schoolId
    );

    if (crossSchoolStageAssignments.length > 0) {
      console.log(
        `❌ Found ${crossSchoolStageAssignments.length} cross-school stage assignments:`
      );
      for (const assignment of crossSchoolStageAssignments) {
        console.log(
          `   - Teacher ${assignment.teacher.name} (${assignment.teacher.school.name}) assigned to Stage ${assignment.stage.name} (${assignment.stage.school.name})`
        );
      }
    } else {
      console.log("✅ No cross-school stage assignments found");
    }

    const teacherSubjects = await prisma.teacherSubject.findMany({
      include: {
        teacher: {
          include: { school: true },
        },
        subject: {
          include: { school: true },
        },
      },
    });

    const crossSchoolSubjectAssignments = teacherSubjects.filter(
      (ts) => ts.teacher.schoolId !== ts.subject.schoolId
    );

    if (crossSchoolSubjectAssignments.length > 0) {
      console.log(
        `❌ Found ${crossSchoolSubjectAssignments.length} cross-school subject assignments:`
      );
      for (const assignment of crossSchoolSubjectAssignments) {
        console.log(
          `   - Teacher ${assignment.teacher.name} (${assignment.teacher.school.name}) assigned to Subject ${assignment.subject.name} (${assignment.subject.school.name})`
        );
      }
    } else {
      console.log("✅ No cross-school subject assignments found");
    }

    // Suggest fixes
    if (
      crossSchoolStageAssignments.length > 0 ||
      crossSchoolSubjectAssignments.length > 0
    ) {
      console.log("\n🔧 Suggested fixes:");
      console.log("1. Clean up cross-school assignments");
      console.log(
        "2. Ensure teachers are only assigned to their own school's stages/subjects"
      );
      console.log("3. Run the teacher assignment checker to auto-fix");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTeacherSchoolData();
