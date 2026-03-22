// Debug script to test the exact Prisma query that's failing in the posts endpoint

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function debugPostsQuery() {
  console.log("🔍 Debugging posts query...\n");

  try {
    // Get our demo teacher
    const teacher = await prisma.teacher.findFirst({
      where: { phoneNumber: "demo123" },
    });

    if (!teacher) {
      console.log("❌ Demo teacher not found");
      return;
    }

    console.log(`✅ Found teacher: ${teacher.name} (${teacher.id})`);

    // Test the exact query from the posts endpoint
    console.log("\n🔍 Testing the posts query...");

    const posts = await prisma.teacherPost.findMany({
      where: { teacherId: teacher.id },
      include: {
        stage: true,
        subject: true,
        teacher: true,
        likes: {
          include: {
            teacher: true,
          },
        },
        comments: {
          include: {
            teacher: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: 0,
      take: 10,
    });

    console.log(`✅ Query successful! Found ${posts.length} posts`);

    if (posts.length === 0) {
      console.log("\n📝 No posts found. This is normal for a new teacher.");
      console.log(
        "   The posts endpoint should return an empty array with success: true"
      );
    }

    // Test the count query too
    const totalCount = await prisma.teacherPost.count({
      where: { teacherId: teacher.id },
    });

    console.log(`✅ Count query successful! Total posts: ${totalCount}`);

    // Test creating a sample post
    console.log("\n📝 Creating a sample post...");

    const stage = await prisma.stage.findFirst({
      where: { name: "Stage 1" },
    });

    const subject = await prisma.subject.findFirst({
      where: { stageId: stage?.id },
    });

    if (stage && subject) {
      const samplePost = await prisma.teacherPost.create({
        data: {
          title: "Sample Post",
          content: "This is a test post to verify the posts functionality.",
          stageId: stage.id,
          subjectId: subject.id,
          teacherId: teacher.id,
        },
        include: {
          stage: true,
          subject: true,
          teacher: true,
          likes: true,
          comments: true,
        },
      });

      console.log(
        `✅ Sample post created: ${samplePost.title} (${samplePost.id})`
      );

      // Now test the query again
      console.log("\n🔍 Testing posts query again...");
      const postsAfter = await prisma.teacherPost.findMany({
        where: { teacherId: teacher.id },
        include: {
          stage: true,
          subject: true,
          teacher: true,
          likes: {
            include: {
              teacher: true,
            },
          },
          comments: {
            include: {
              teacher: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: 0,
        take: 10,
      });

      console.log(
        `✅ Query after creating post: Found ${postsAfter.length} posts`
      );
      console.log("   First post:", {
        id: postsAfter[0]?.id,
        title: postsAfter[0]?.title,
        stage: postsAfter[0]?.stage?.name,
        subject: postsAfter[0]?.subject?.name,
      });
    } else {
      console.log("❌ Could not find stage or subject to create sample post");
    }
  } catch (error) {
    console.error("❌ Error in posts query:", error);
    console.error("Stack trace:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugPostsQuery();
