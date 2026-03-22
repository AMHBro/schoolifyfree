const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function auditMultiTenancy() {
  console.log("🔍 Comprehensive Multi-Tenancy Audit...\n");

  try {
    // Get all schools
    const schools = await prisma.school.findMany({
      select: { id: true, schoolName: true },
    });

    console.log(`📚 Found ${schools.length} schools:`);
    schools.forEach((school) => {
      console.log(`   - ${school.schoolName} (${school.id})`);
    });
    console.log("");

    // 1. Check Teachers
    console.log("👨‍🏫 TEACHER VIOLATIONS:");
    const teacherViolations = await prisma.teacherStage.findMany({
      include: {
        teacher: { include: { school: true } },
        stage: { include: { school: true } },
      },
      where: {
        teacher: { schoolId: { not: null } },
        stage: { schoolId: { not: null } },
      },
    });

    const teacherStageViolations = teacherViolations.filter(
      (tv) => tv.teacher.schoolId !== tv.stage.schoolId
    );

    if (teacherStageViolations.length > 0) {
      console.log(
        `❌ ${teacherStageViolations.length} teacher-stage violations found:`
      );
      teacherStageViolations.forEach((v) => {
        console.log(
          `   - Teacher ${v.teacher.name} (${v.teacher.school?.name}) assigned to Stage ${v.stage.name} (${v.stage.school?.name})`
        );
      });
    } else {
      console.log("✅ No teacher-stage violations");
    }

    const teacherSubjectViolations = await prisma.teacherSubject.findMany({
      include: {
        teacher: { include: { school: true } },
        subject: { include: { school: true } },
      },
      where: {
        teacher: { schoolId: { not: null } },
        subject: { schoolId: { not: null } },
      },
    });

    const subjectViolations = teacherSubjectViolations.filter(
      (tv) => tv.teacher.schoolId !== tv.subject.schoolId
    );

    if (subjectViolations.length > 0) {
      console.log(
        `❌ ${subjectViolations.length} teacher-subject violations found:`
      );
      subjectViolations.forEach((v) => {
        console.log(
          `   - Teacher ${v.teacher.name} (${v.teacher.school?.name}) assigned to Subject ${v.subject.name} (${v.subject.school?.name})`
        );
      });
    } else {
      console.log("✅ No teacher-subject violations");
    }

    // 2. Check Students
    console.log("\n👨‍🎓 STUDENT VIOLATIONS:");
    const students = await prisma.student.findMany({
      include: {
        school: true,
        stage: { include: { school: true } },
      },
    });

    const studentViolations = students.filter(
      (s) => s.schoolId !== s.stage.schoolId
    );

    if (studentViolations.length > 0) {
      console.log(`❌ ${studentViolations.length} student violations found:`);
      studentViolations.forEach((v) => {
        console.log(
          `   - Student ${v.name} (${v.school?.name}) in Stage ${v.stage.name} (${v.stage.school?.name})`
        );
      });
    } else {
      console.log("✅ No student violations");
    }

    // 3. Check Subjects
    console.log("\n📝 SUBJECT VIOLATIONS:");
    const subjects = await prisma.subject.findMany({
      include: {
        school: true,
        stage: { include: { school: true } },
      },
    });

    const subjectStageViolations = subjects.filter(
      (s) => s.schoolId !== s.stage.schoolId
    );

    if (subjectStageViolations.length > 0) {
      console.log(
        `❌ ${subjectStageViolations.length} subject-stage violations found:`
      );
      subjectStageViolations.forEach((v) => {
        console.log(
          `   - Subject ${v.name} (${v.school?.name}) in Stage ${v.stage.name} (${v.stage.school?.name})`
        );
      });
    } else {
      console.log("✅ No subject-stage violations");
    }

    // 4. Check Schedules
    console.log("\n📅 SCHEDULE VIOLATIONS:");
    const schedules = await prisma.schedule.findMany({
      include: {
        school: true,
        stage: { include: { school: true } },
        subject: { include: { school: true } },
        teacher: { include: { school: true } },
      },
    });

    const scheduleViolations = schedules.filter((s) => {
      const schoolIds = [
        s.schoolId,
        s.stage.schoolId,
        s.subject.schoolId,
        s.teacher.schoolId,
      ];
      return new Set(schoolIds).size > 1; // More than one unique school ID means violation
    });

    if (scheduleViolations.length > 0) {
      console.log(`❌ ${scheduleViolations.length} schedule violations found:`);
      scheduleViolations.forEach((v) => {
        console.log(
          `   - Schedule mixing schools: Stage(${v.stage.school?.name}), Subject(${v.subject.school?.name}), Teacher(${v.teacher.school?.name})`
        );
      });
    } else {
      console.log("✅ No schedule violations");
    }

    // 5. Summary and recommendations
    const totalViolations =
      teacherStageViolations.length +
      subjectViolations.length +
      studentViolations.length +
      subjectStageViolations.length +
      scheduleViolations.length;

    console.log("\n📊 AUDIT SUMMARY:");
    console.log(`Total violations found: ${totalViolations}`);

    if (totalViolations > 0) {
      console.log("\n🚨 CRITICAL: Multi-tenancy violations detected!");
      console.log("📋 RECOMMENDATIONS:");
      console.log("1. Run cleanup scripts to fix data violations");
      console.log("2. Consider migrating to separate databases per school");
      console.log("3. Implement stricter validation at the API level");
      console.log("4. Add database constraints to prevent future violations");
    } else {
      console.log(
        "\n✅ Multi-tenancy isolation appears to be working correctly"
      );
      console.log(
        "🔍 If you're still seeing cross-school data, the issue may be in:"
      );
      console.log("   - API endpoint filtering logic");
      console.log("   - Frontend data display logic");
      console.log("   - Caching issues");
    }

    // 6. School-by-school breakdown
    console.log("\n🏫 SCHOOL-BY-SCHOOL BREAKDOWN:");
    for (const school of schools) {
      console.log(`\n📚 ${school.schoolName} (${school.id}):`);

      const schoolTeachers = await prisma.teacher.count({
        where: { schoolId: school.id },
      });
      const schoolStudents = await prisma.student.count({
        where: { schoolId: school.id },
      });
      const schoolStages = await prisma.stage.count({
        where: { schoolId: school.id },
      });
      const schoolSubjects = await prisma.subject.count({
        where: { schoolId: school.id },
      });

      console.log(`   Teachers: ${schoolTeachers}`);
      console.log(`   Students: ${schoolStudents}`);
      console.log(`   Stages: ${schoolStages}`);
      console.log(`   Subjects: ${schoolSubjects}`);
    }
  } catch (error) {
    console.error("❌ Audit failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

auditMultiTenancy();
