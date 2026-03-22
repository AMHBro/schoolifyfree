#!/usr/bin/env bun

/**
 * Check and Fix Teacher Assignments Script
 *
 * This script checks if teachers have proper assignments to stages and subjects,
 * and can optionally fix missing assignments.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkTeacherAssignments() {
  try {
    console.log("🔍 CHECKING TEACHER ASSIGNMENTS");
    console.log("=".repeat(50));

    // Get all teachers with their assignments
    const teachers = await prisma.teacher.findMany({
      include: {
        school: true,
        stages: {
          include: {
            stage: true,
          },
        },
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    console.log(`\nFound ${teachers.length} teachers total\n`);

    let teachersWithNoAssignments = 0;
    let teachersWithPartialAssignments = 0;
    let teachersWithFullAssignments = 0;

    for (const teacher of teachers) {
      console.log(`👨‍🏫 ${teacher.name} (${teacher.phoneNumber})`);
      console.log(`   🏫 School: ${teacher.school.schoolName}`);
      console.log(`   📚 Assigned Stages: ${teacher.stages.length}`);
      console.log(`   📖 Assigned Subjects: ${teacher.subjects.length}`);

      if (teacher.stages.length > 0) {
        console.log("   Stages:");
        teacher.stages.forEach((ts, index) => {
          console.log(`     ${index + 1}. ${ts.stage.name}`);
        });
      }

      if (teacher.subjects.length > 0) {
        console.log("   Subjects:");
        teacher.subjects.forEach((ts, index) => {
          console.log(`     ${index + 1}. ${ts.subject.name}`);
        });
      }

      // Categorize teachers
      if (teacher.stages.length === 0 && teacher.subjects.length === 0) {
        console.log(
          "   ❌ STATUS: No assignments (Teacher app will show nothing!)"
        );
        teachersWithNoAssignments++;
      } else if (teacher.stages.length === 0 || teacher.subjects.length === 0) {
        console.log(
          "   ⚠️  STATUS: Partial assignments (Teacher app may have issues)"
        );
        teachersWithPartialAssignments++;
      } else {
        console.log("   ✅ STATUS: Fully assigned");
        teachersWithFullAssignments++;
      }

      console.log();
    }

    // Summary
    console.log("📊 SUMMARY");
    console.log("-".repeat(30));
    console.log(`Total Teachers: ${teachers.length}`);
    console.log(`✅ Fully Assigned: ${teachersWithFullAssignments}`);
    console.log(`⚠️  Partially Assigned: ${teachersWithPartialAssignments}`);
    console.log(`❌ Not Assigned: ${teachersWithNoAssignments}`);

    if (teachersWithNoAssignments > 0 || teachersWithPartialAssignments > 0) {
      console.log(`\n🔧 RECOMMENDATIONS:`);

      if (teachersWithNoAssignments > 0) {
        console.log(
          `1. ${teachersWithNoAssignments} teacher(s) have no assignments - this explains why teacher app shows nothing`
        );
        console.log(
          `   Solution: Assign teachers to stages and subjects from the school dashboard`
        );
      }

      if (teachersWithPartialAssignments > 0) {
        console.log(
          `2. ${teachersWithPartialAssignments} teacher(s) have partial assignments - may cause app issues`
        );
        console.log(
          `   Solution: Ensure all teachers have both stage and subject assignments`
        );
      }

      console.log(`\n💡 HOW TO FIX:`);
      console.log(`1. Go to school dashboard: http://localhost:5174`);
      console.log(`2. Log in as school admin`);
      console.log(`3. Go to Teachers section`);
      console.log(
        `4. Edit each teacher and assign them to stages and subjects`
      );
      console.log(`5. Make sure assignments are saved properly`);
    }

    // Check for assignment inconsistencies
    console.log(`\n🔍 CHECKING FOR INCONSISTENCIES...`);

    for (const teacher of teachers) {
      // Check if teacher's assigned stages and subjects are from the same school
      for (const ts of teacher.stages) {
        if (ts.stage.schoolId !== teacher.schoolId) {
          console.log(
            `❌ ERROR: Teacher ${teacher.name} assigned to stage from different school!`
          );
          console.log(`   Teacher School: ${teacher.school.schoolName}`);
          console.log(`   Stage School: Different school`);
        }
      }

      for (const ts of teacher.subjects) {
        if (ts.subject.schoolId !== teacher.schoolId) {
          console.log(
            `❌ ERROR: Teacher ${teacher.name} assigned to subject from different school!`
          );
          console.log(`   Teacher School: ${teacher.school.schoolName}`);
          console.log(`   Subject School: Different school`);
        }
      }
    }

    console.log(`✅ Assignment consistency check completed\n`);
  } catch (error) {
    console.error("❌ Error checking teacher assignments:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixTeacherAssignments() {
  try {
    console.log("🔧 FIXING TEACHER ASSIGNMENTS");
    console.log("=".repeat(50));

    // This is a basic fix that assigns teachers to the first available stage and subject in their school
    const teachers = await prisma.teacher.findMany({
      include: {
        stages: true,
        subjects: true,
        school: true,
      },
    });

    for (const teacher of teachers) {
      if (teacher.stages.length === 0 || teacher.subjects.length === 0) {
        console.log(`\n🔧 Fixing assignments for ${teacher.name}...`);

        // Get available stages and subjects from teacher's school
        const availableStages = await prisma.stage.findMany({
          where: { schoolId: teacher.schoolId },
        });

        const availableSubjects = await prisma.subject.findMany({
          where: { schoolId: teacher.schoolId },
        });

        // Assign to first stage if no stages assigned
        if (teacher.stages.length === 0 && availableStages.length > 0) {
          const firstStage = availableStages[0];
          if (firstStage) {
            await prisma.teacherStage.create({
              data: {
                teacherId: teacher.id,
                stageId: firstStage.id,
              },
            });
            console.log(`   ✅ Assigned to stage: ${firstStage.name}`);
          }
        }

        // Assign to first subject if no subjects assigned
        if (teacher.subjects.length === 0 && availableSubjects.length > 0) {
          const firstSubject = availableSubjects[0];
          if (firstSubject) {
            await prisma.teacherSubject.create({
              data: {
                teacherId: teacher.id,
                subjectId: firstSubject.id,
              },
            });
            console.log(`   ✅ Assigned to subject: ${firstSubject.name}`);
          }
        }
      }
    }

    console.log(`\n✅ Teacher assignment fixes completed!`);
  } catch (error) {
    console.error("❌ Error fixing teacher assignments:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--fix")) {
    await fixTeacherAssignments();
  } else {
    await checkTeacherAssignments();

    console.log(`\n🔧 TO AUTO-FIX ASSIGNMENTS:`);
    console.log(`bun check-teacher-assignments.ts --fix`);
    console.log(
      `\nNote: Auto-fix will assign teachers to the first available stage/subject in their school.`
    );
    console.log(`For proper assignments, use the school dashboard interface.`);
  }
}

main().catch(console.error);
