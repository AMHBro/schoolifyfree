import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default central admin
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);

  const centralAdmin = await prisma.centralAdmin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedAdminPassword,
      name: "Central Administrator",
      email: "admin@sms.com",
      isActive: true,
    },
  });

  console.log("✅ Created central admin:", {
    id: centralAdmin.id,
    username: centralAdmin.username,
    name: centralAdmin.name,
  });

  // Create default school
  const hashedSchoolPassword = await bcrypt.hash("school123", 10);

  const defaultSchool = await prisma.school.upsert({
    where: { username: "defaultschool" },
    update: {},
    create: {
      username: "defaultschool",
      password: hashedSchoolPassword,
      schoolName: "Default School",
      schoolCode: "DEFAULT001",
      contactEmail: "school@example.com",
      contactPhone: "+1234567890",
      address: "123 School Street",
      isActive: true,
    },
  });

  console.log("✅ Created default school:", {
    id: defaultSchool.id,
    username: defaultSchool.username,
    schoolName: defaultSchool.schoolName,
  });

  // Helper upsert for stages
  const ensureStage = async (name: string) => {
    return prisma.stage.upsert({
      where: { name_schoolId: { name, schoolId: defaultSchool.id } },
      update: {},
      create: { name, studentCount: 0, schoolId: defaultSchool.id },
    });
  };

  const stage1 = await ensureStage("Stage 1");
  const stage2 = await ensureStage("Stage 2");
  const stage3 = await ensureStage("Stage 3");
  const stage4 = await ensureStage("Stage 4");
  const stage5 = await ensureStage("Stage 5");
  const stage6 = await ensureStage("Stage 6");

  const stages = [stage1, stage2, stage3, stage4, stage5, stage6];
  console.log(
    "✅ Ensured stages:",
    stages.map((s) => s.name)
  );

  // Helper upsert for subjects
  const ensureSubject = async (name: string, stageId: string) => {
    return prisma.subject.upsert({
      where: {
        name_stageId_schoolId: { name, stageId, schoolId: defaultSchool.id },
      },
      update: {},
      create: { name, stageId, schoolId: defaultSchool.id },
    });
  };

  // Create subjects sequentially to avoid pool timeouts
  const subjects: { id: string; name: string; stageId: string }[] = [];
  const subjectPlan: Array<[string, string]> = [
    ["Mathematics", stage1.id],
    ["English", stage1.id],
    ["Science", stage1.id],
    ["Mathematics", stage2.id],
    ["English", stage2.id],
    ["Science", stage2.id],
    ["Mathematics", stage3.id],
    ["Physics", stage3.id],
    ["English", stage3.id],
    ["Mathematics", stage4.id],
    ["Physics", stage4.id],
    ["Literature", stage4.id],
    ["Mathematics", stage5.id],
    ["Physics", stage5.id],
    ["History", stage5.id],
    ["Mathematics", stage6.id],
    ["Physics", stage6.id],
    ["Geography", stage6.id],
    ["Art", stage6.id],
  ];
  for (const [name, stageId] of subjectPlan) {
    const s = await ensureSubject(name, stageId);
    subjects.push(s);
  }
  console.log("✅ Ensured subjects:", subjects.length);

  // Create teachers for the default school (use upsert)
  const hashedTeacherPassword = await bcrypt.hash("teacher123", 10);

  const teacher1 = await prisma.teacher.upsert({
    where: {
      phoneNumber_schoolId: {
        phoneNumber: "+1234567890",
        schoolId: defaultSchool.id,
      },
    },
    update: {},
    create: {
      name: "John Doe",
      age: 35,
      phoneNumber: "+1234567890",
      password: hashedTeacherPassword,
      gender: "male",
      birthdate: new Date("1988-05-15"),
      schoolId: defaultSchool.id,
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: {
      phoneNumber_schoolId: {
        phoneNumber: "+1987654321",
        schoolId: defaultSchool.id,
      },
    },
    update: {},
    create: {
      name: "Jane Smith",
      age: 28,
      phoneNumber: "+1987654321",
      password: hashedTeacherPassword,
      gender: "female",
      birthdate: new Date("1995-08-22"),
      schoolId: defaultSchool.id,
    },
  });

  const teacher3 = await prisma.teacher.upsert({
    where: {
      phoneNumber_schoolId: {
        phoneNumber: "+1122334455",
        schoolId: defaultSchool.id,
      },
    },
    update: {},
    create: {
      name: "Mike Johnson",
      age: 42,
      phoneNumber: "+1122334455",
      password: hashedTeacherPassword,
      gender: "male",
      birthdate: new Date("1981-12-10"),
      schoolId: defaultSchool.id,
    },
  });

  console.log("✅ Ensured teachers:", [
    teacher1.name,
    teacher2.name,
    teacher3.name,
  ]);

  // Students (use upsert by code+school)
  const hashedStudentPassword = await bcrypt.hash("student123", 10);
  const studentPlan = [
    {
      name: "John Smith",
      age: 15,
      gender: "male" as const,
      phoneNumber: "+1555123456",
      code: "STU001",
      stageId: stage4.id,
    },
    {
      name: "Emma Johnson",
      age: 16,
      gender: "female" as const,
      phoneNumber: "+1555234567",
      code: "STU002",
      stageId: stage5.id,
    },
    {
      name: "Michael Brown",
      age: 14,
      gender: "male" as const,
      phoneNumber: "+1555345678",
      code: "STU003",
      stageId: stage3.id,
    },
    {
      name: "Sophia Davis",
      age: 15,
      gender: "female" as const,
      phoneNumber: "+1555456789",
      code: "STU004",
      stageId: stage4.id,
    },
    {
      name: "William Wilson",
      age: 16,
      gender: "male" as const,
      phoneNumber: "+1555567890",
      code: "STU005",
      stageId: stage5.id,
    },
  ];
  const students = [] as { id: string; name: string }[];
  for (const s of studentPlan) {
    const student = await prisma.student.upsert({
      where: { code_schoolId: { code: s.code, schoolId: defaultSchool.id } },
      update: {},
      create: {
        name: s.name,
        age: s.age,
        gender: s.gender,
        phoneNumber: s.phoneNumber,
        code: s.code,
        password: hashedStudentPassword,
        stageId: s.stageId,
        schoolId: defaultSchool.id,
      },
    });
    students.push({ id: student.id, name: student.name });
  }
  console.log(
    "✅ Ensured students:",
    students.map((s) => s.name)
  );

  // Teacher-stage relationships (upsert)
  const ensureTeacherStage = (teacherId: string, stageId: string) =>
    prisma.teacherStage.upsert({
      where: { teacherId_stageId: { teacherId, stageId } },
      update: {},
      create: { teacherId, stageId },
    });

  await Promise.all([
    ensureTeacherStage(teacher1.id, stage1.id),
    ensureTeacherStage(teacher1.id, stage2.id),
    ensureTeacherStage(teacher1.id, stage3.id),
    ensureTeacherStage(teacher2.id, stage4.id),
    ensureTeacherStage(teacher2.id, stage5.id),
    ensureTeacherStage(teacher2.id, stage6.id),
    ensureTeacherStage(teacher3.id, stage1.id),
    ensureTeacherStage(teacher3.id, stage2.id),
    ensureTeacherStage(teacher3.id, stage3.id),
    ensureTeacherStage(teacher3.id, stage4.id),
  ]);

  // Teacher-subject relationships (upsert)
  const ensureTeacherSubject = (teacherId: string, subjectId: string) =>
    prisma.teacherSubject.upsert({
      where: { teacherId_subjectId: { teacherId, subjectId } },
      update: {},
      create: { teacherId, subjectId },
    });

  await Promise.all([
    ensureTeacherSubject(teacher1.id, subjects[0].id), // Math S1
    ensureTeacherSubject(teacher1.id, subjects[2].id), // Science S1
    ensureTeacherSubject(teacher1.id, subjects[3].id), // Math S2

    ensureTeacherSubject(teacher2.id, subjects[1].id), // English S1
    ensureTeacherSubject(teacher2.id, subjects[4].id), // English S2
    ensureTeacherSubject(teacher2.id, subjects[11].id), // Literature S4

    ensureTeacherSubject(teacher3.id, subjects[7].id), // Physics S3
    ensureTeacherSubject(teacher3.id, subjects[10].id), // Physics S4
    ensureTeacherSubject(teacher3.id, subjects[14].id), // History S5
  ]);

  console.log("✅ Ensured teacher relationships");

  // System settings (upsert by schoolId)
  await prisma.systemSettings.upsert({
    where: { schoolId: defaultSchool.id },
    update: {},
    create: {
      countryName: "Palestine",
      ministryName: "Ministry of Education",
      schoolName: defaultSchool.schoolName,
      managerName: "School Manager",
      studyYear: "2024-2025",
      schoolId: defaultSchool.id,
    },
  });

  console.log("✅ Ensured system settings");

  console.log("🎉 Seeding completed successfully!");
  console.log("");
  console.log("📋 Login credentials:");
  console.log("Central Admin - Username: admin, Password: admin123");
  console.log("Default School - Username: defaultschool, Password: school123");
  console.log(
    "Teachers - Phone: +1234567890, +1987654321, +1122334455, Password: teacher123"
  );
  console.log(
    "Students - Codes: STU001, STU002, STU003, STU004, STU005, Password: student123"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
