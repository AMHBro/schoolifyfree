#!/usr/bin/env bun

/**
 * Backend Error Fix Script
 *
 * This script identifies and documents the main backend errors that need to be fixed
 * to resolve the 500 internal server errors when creating teachers or teacher login.
 *
 * Main issues identified:
 * 1. Teacher login using phoneNumber unique constraint instead of phoneNumber_schoolId compound key
 * 2. Teacher creation missing schoolId field
 * 3. Various database queries missing includes and proper error handling
 * 4. Student creation missing schoolId field
 * 5. SystemSettings creation missing school connection
 * 6. Stage, Subject, Schedule, Exam creation missing schoolId
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

console.log(`
🔧 BACKEND ERROR FIX DOCUMENTATION
=================================

The main issues causing 500 errors are:

1. 📱 TEACHER LOGIN ISSUE:
   - Using phoneNumber only instead of phoneNumber_schoolId compound key
   - Fix: Use findFirst() with phoneNumber across all schools

2. 👨‍🏫 TEACHER CREATION ISSUE:
   - Missing schoolId in teacher creation
   - Fix: Extract schoolId from JWT token and include in creation

3. 🎓 STUDENT CREATION ISSUE:
   - Missing schoolId in student creation
   - Fix: Extract schoolId from JWT and add to student data

4. 🏫 MULTI-TENANT SCHEMA ISSUES:
   - All models need schoolId for proper isolation
   - Includes need to be updated for new schema structure

5. 🔐 AUTHENTICATION ISSUES:
   - Need proper JWT verification for school context
   - Need to pass schoolId to all database operations

RECOMMENDED APPROACH:
====================

Instead of manually editing the large index.ts file, we should:

1. Create a new updated version with proper authentication middleware
2. Fix all database operations to include schoolId
3. Update all includes to match the new schema structure
4. Add proper error handling

This will prevent the 500 errors and ensure proper multi-tenant operation.

IMMEDIATE FIXES NEEDED:
=======================

For teacher login to work:
- Change findUnique to findFirst for phoneNumber lookup
- Add proper password validation
- Include school context in response

For teacher creation to work:
- Add JWT authentication verification
- Extract schoolId from token
- Include schoolId in teacher creation
- Update response mapping to handle new schema

TESTING:
========

After fixes:
1. Test teacher login with phone number
2. Test teacher creation from school dashboard
3. Verify proper school isolation
4. Test other CRUD operations

`);

async function main() {
  try {
    console.log("🔍 Checking current database state...\n");

    // Check if we have teachers to test login
    const teacherCount = await prisma.teacher.count();
    console.log(`📊 Teachers in database: ${teacherCount}`);

    if (teacherCount > 0) {
      const sampleTeacher = await prisma.teacher.findFirst({
        include: {
          school: true,
        },
      });

      if (sampleTeacher) {
        console.log(`📱 Sample teacher: ${sampleTeacher.name}`);
        console.log(`📞 Phone: ${sampleTeacher.phoneNumber}`);
        console.log(`🏫 School: ${sampleTeacher.school?.schoolName}`);
        console.log(
          `🔑 Password hash starts with: ${sampleTeacher.password.substring(
            0,
            10
          )}...`
        );
      }
    }

    // Check schools
    const schoolCount = await prisma.school.count();
    console.log(`🏫 Schools in database: ${schoolCount}`);

    if (schoolCount > 0) {
      const sampleSchool = await prisma.school.findFirst();
      if (sampleSchool) {
        console.log(`🏢 Sample school: ${sampleSchool.schoolName}`);
        console.log(`👤 Username: ${sampleSchool.username}`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
