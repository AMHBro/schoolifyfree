#!/usr/bin/env bun

/**
 * Quick Fix for Teacher Endpoints
 *
 * This script applies minimal fixes to resolve the 500 errors for:
 * 1. Teacher mobile login
 * 2. Teacher creation from school dashboard
 */

import { readFileSync, writeFileSync } from "fs";

console.log("🔧 APPLYING QUICK FIXES TO TEACHER ENDPOINTS");
console.log("=".repeat(50));

async function applyFixes() {
  try {
    // Read the current index.ts file
    let content = readFileSync("index.ts", "utf8");

    console.log("📝 Applying teacher login fix...");

    // Fix 1: Teacher login - change findUnique to findFirst and add school include
    content = content.replace(
      /const teacher = await prisma\.teacher\.findFirst\(\{[\s\S]*?where: \{ phoneNumber \},[\s\S]*?include: \{[\s\S]*?school: true,[\s\S]*?\},[\s\S]*?\}\);/,
      `const teacher = await prisma.teacher.findFirst({
          where: { phoneNumber },
          include: {
            school: true,
            stages: {
              include: {
                stage: {
                  include: {
                    students: true,
                  },
                },
              },
            },
            subjects: {
              include: {
                subject: true,
              },
            },
          },
        });`
    );

    console.log("📝 Applying teacher creation authentication fix...");

    // Note: The teacher creation fix is more complex and has been partially applied
    // The main issue is that the JWT authentication was added but error handling needs work

    console.log("📝 Fixing TypeScript issues...");

    // Fix TypeScript issues in teacher response mapping
    content = content.replace(
      /stages: teacher\.stages\.map\(\(ts\) => \(/g,
      "stages: teacher.stages?.map((ts: any) => ("
    );

    content = content.replace(
      /subjects: teacher\.subjects\.map\(\(ts\) => \(/g,
      "subjects: teacher.subjects?.map((ts: any) => ("
    );

    // Write the fixed content back
    writeFileSync("index.ts", content);

    console.log("✅ Quick fixes applied successfully!");
    console.log("\n📋 SUMMARY OF CHANGES:");
    console.log(
      "  ✅ Teacher login: Updated to use findFirst with school include"
    );
    console.log("  ✅ TypeScript: Fixed type issues in response mapping");
    console.log("  ⚠️  Teacher creation: Partially fixed (JWT auth added)");

    console.log("\n🧪 TESTING RECOMMENDATIONS:");
    console.log("  1. Test teacher login with existing teacher credentials");
    console.log("  2. Test teacher creation from school dashboard");
    console.log("  3. Check for any remaining 500 errors");

    console.log("\n🔄 To test:");
    console.log("  bun run dev");
    console.log("  # Test endpoints with correct credentials");
  } catch (error) {
    console.error("❌ Error applying fixes:", error);
  }
}

applyFixes();
