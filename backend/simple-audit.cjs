const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function simpleAudit() {
  console.log("🔍 Simple Multi-Tenancy Audit...\n");

  try {
    // Get schools
    const schools = await prisma.school.findMany({
      select: { id: true, schoolName: true },
    });

    console.log(`📚 Found ${schools.length} schools:`);
    schools.forEach((school) => {
      console.log(`   - ${school.schoolName} (${school.id})`);
    });
    console.log("");

    // Check cross-school teacher assignments
    console.log("👨‍🏫 Checking teacher assignments...");
    const teacherStages = await prisma.teacherStage.findMany({
      include: {
        teacher: true,
        stage: true,
      },
    });

    const crossStageAssignments = teacherStages.filter(
      (ts) => ts.teacher.schoolId !== ts.stage.schoolId
    );

    const teacherSubjects = await prisma.teacherSubject.findMany({
      include: {
        teacher: true,
        subject: true,
      },
    });

    const crossSubjectAssignments = teacherSubjects.filter(
      (ts) => ts.teacher.schoolId !== ts.subject.schoolId
    );

    console.log(
      `Cross-school stage assignments: ${crossStageAssignments.length}`
    );
    console.log(
      `Cross-school subject assignments: ${crossSubjectAssignments.length}`
    );

    if (crossStageAssignments.length > 0) {
      console.log("\n❌ Cross-school stage violations:");
      crossStageAssignments.forEach((v) => {
        console.log(
          `   - Teacher ${v.teacher.name} (school: ${v.teacher.schoolId}) -> Stage ${v.stage.name} (school: ${v.stage.schoolId})`
        );
      });
    }

    if (crossSubjectAssignments.length > 0) {
      console.log("\n❌ Cross-school subject violations:");
      crossSubjectAssignments.forEach((v) => {
        console.log(
          `   - Teacher ${v.teacher.name} (school: ${v.teacher.schoolId}) -> Subject ${v.subject.name} (school: ${v.subject.schoolId})`
        );
      });
    }

    // Check for orphaned teachers (no assignments)
    console.log("\n👤 Checking for teachers without assignments...");
    const teachers = await prisma.teacher.findMany({
      include: {
        stages: true,
        subjects: true,
      },
    });

    const orphanedTeachers = teachers.filter(
      (t) => t.stages.length === 0 && t.subjects.length === 0
    );

    console.log(`Teachers without assignments: ${orphanedTeachers.length}`);

    if (orphanedTeachers.length > 0) {
      console.log("\n👤 Teachers without assignments:");
      orphanedTeachers.forEach((t) => {
        console.log(
          `   - ${t.name} (${t.phoneNumber}) in school: ${t.schoolId}`
        );
      });
    }

    // Summary
    const totalViolations =
      crossStageAssignments.length + crossSubjectAssignments.length;

    console.log("\n📊 AUDIT SUMMARY:");
    console.log(`Total cross-school violations: ${totalViolations}`);
    console.log(`Teachers without assignments: ${orphanedTeachers.length}`);

    if (totalViolations > 0) {
      console.log("\n🚨 ISSUE: Cross-school data contamination detected!");
      console.log(
        "This explains why teachers can see data from other schools."
      );
      console.log("\n📋 RECOMMENDATIONS:");
      console.log("1. ❗ IMMEDIATE: Consider separate databases per school");
      console.log("2. 🔧 SHORT-TERM: Run more aggressive cleanup scripts");
      console.log(
        "3. 🛡️ LONG-TERM: Add database constraints to prevent violations"
      );
    } else if (orphanedTeachers.length > 0) {
      console.log("\n⚠️ ISSUE: Teachers without assignments will see no data");
      console.log(
        "Need to assign these teachers to their school's stages/subjects"
      );
    } else {
      console.log("\n✅ Multi-tenancy appears clean at the data level");
      console.log(
        "If still seeing cross-school data, check API filtering logic"
      );
    }
  } catch (error) {
    console.error("❌ Audit failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleAudit();
