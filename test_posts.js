// Test script to debug the posts endpoint issue

const API_BASE_URL = "http://localhost:3000";

async function createSamplePosts() {
  try {
    // First, get all teachers, stages, and subjects
    const teachersResponse = await fetch(`${API_BASE_URL}/api/teachers`);
    const teachers = await teachersResponse.json();

    const stagesResponse = await fetch(`${API_BASE_URL}/api/stages`);
    const stages = await stagesResponse.json();

    const subjectsResponse = await fetch(`${API_BASE_URL}/api/subjects/all`);
    const subjects = await subjectsResponse.json();

    console.log("Found:", {
      teachers: teachers.length,
      stages: stages.length,
      subjects: subjects.length,
    });

    if (teachers.length === 0 || stages.length === 0 || subjects.length === 0) {
      console.log(
        "No teachers, stages, or subjects found. Please create some first."
      );
      return;
    }

    // Sample posts with realistic teacher content
    const samplePosts = [
      {
        title: "Mathematics Homework Assignment - Week 3",
        content:
          "Dear students, for this week's homework, please complete exercises 1-15 from Chapter 4. Focus on algebraic equations and remember to show your work. Due date: Friday. If you have any questions, feel free to ask during our next class session.",
        teacherId: teachers[0]?.id,
        stageId: stages[0]?.id,
        subjectId:
          subjects.find((s) => s.name.toLowerCase().includes("math"))?.id ||
          subjects[0]?.id,
      },
      {
        title: "Science Lab Safety Reminder",
        content:
          "Important reminder for all students: Safety goggles are mandatory during lab sessions. Please bring your lab notebooks and wear closed-toe shoes. We'll be conducting experiments on chemical reactions next week.",
        teacherId: teachers[1]?.id || teachers[0]?.id,
        stageId: stages[1]?.id || stages[0]?.id,
        subjectId:
          subjects.find(
            (s) =>
              s.name.toLowerCase().includes("science") ||
              s.name.toLowerCase().includes("physics") ||
              s.name.toLowerCase().includes("chemistry")
          )?.id ||
          subjects[1]?.id ||
          subjects[0]?.id,
      },
      {
        title: "English Literature Essay Guidelines",
        content:
          "Students, your essays on Shakespeare's Romeo and Juliet are due next Tuesday. Remember to include proper citations and analyze at least three themes. Minimum 500 words, maximum 800 words. Good luck!",
        teacherId: teachers[2]?.id || teachers[0]?.id,
        stageId: stages[0]?.id,
        subjectId:
          subjects.find(
            (s) =>
              s.name.toLowerCase().includes("english") ||
              s.name.toLowerCase().includes("literature")
          )?.id ||
          subjects[2]?.id ||
          subjects[0]?.id,
      },
      {
        title: "Field Trip Permission Slips Due",
        content:
          "Parents and students, please remember to submit your signed permission slips for the upcoming museum visit. The trip is scheduled for next Friday from 9 AM to 3 PM. Bring lunch money or a packed lunch.",
        teacherId: teachers[0]?.id,
        stageId: stages[1]?.id || stages[0]?.id,
        subjectId: subjects[0]?.id,
      },
      {
        title: "Midterm Exam Schedule Released",
        content:
          "The midterm examination schedule has been posted on the notice board. Math exam: Monday 10 AM, Science: Tuesday 2 PM, English: Wednesday 9 AM. Study hard and prepare well!",
        teacherId: teachers[1]?.id || teachers[0]?.id,
        stageId: stages[0]?.id,
        subjectId: subjects[0]?.id,
      },
      {
        title: "Group Project Teams Announced",
        content:
          "I've posted the team assignments for our group project on the classroom board. Each team has 4-5 members. Project presentations will be held the week after next. Please coordinate with your team members.",
        teacherId: teachers[2]?.id || teachers[0]?.id,
        stageId: stages[1]?.id || stages[0]?.id,
        subjectId: subjects[1]?.id || subjects[0]?.id,
      },
      {
        title: "Parent-Teacher Conference Reminder",
        content:
          "Dear parents, our quarterly parent-teacher conferences are scheduled for next week. Please check your email for your appointment time. Looking forward to discussing your child's progress.",
        teacherId: teachers[0]?.id,
        stageId: stages[0]?.id,
        subjectId: subjects[0]?.id,
      },
      {
        title: "Extra Credit Opportunity",
        content:
          "Students who want to improve their grades can participate in the extra credit assignment. Write a 300-word essay on 'The Importance of Education in Modern Society'. Deadline: End of this month.",
        teacherId: teachers[1]?.id || teachers[0]?.id,
        stageId: stages[2]?.id || stages[0]?.id,
        subjectId: subjects[2]?.id || subjects[0]?.id,
      },
      {
        title: "Class Canceled - Make-up Session Scheduled",
        content:
          "Due to unforeseen circumstances, today's class is canceled. We will have a make-up session on Friday at 2 PM. Please adjust your schedules accordingly. Thank you for your understanding.",
        teacherId: teachers[2]?.id || teachers[0]?.id,
        stageId: stages[0]?.id,
        subjectId: subjects[0]?.id,
      },
      {
        title: "Study Tips for Final Exams",
        content:
          "As we approach final exams, here are some study tips: 1) Create a study schedule, 2) Form study groups, 3) Practice past papers, 4) Get adequate sleep, 5) Stay hydrated. Best of luck to everyone!",
        teacherId: teachers[0]?.id,
        stageId: stages[1]?.id || stages[0]?.id,
        subjectId: subjects[1]?.id || subjects[0]?.id,
      },
    ];

    console.log("Creating sample posts...");

    for (let i = 0; i < samplePosts.length; i++) {
      const post = samplePosts[i];
      try {
        const response = await fetch(`${API_BASE_URL}/api/mobile/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer dummy-token-for-teacher-${post.teacherId}`, // This won't work without proper auth
          },
          body: JSON.stringify(post),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Created post ${i + 1}: "${post.title}"`);
        } else {
          console.log(
            `❌ Failed to create post ${i + 1}: ${response.status} ${
              response.statusText
            }`
          );
          // Try creating directly via database if mobile endpoint requires auth
          console.log(`Attempting direct creation for post: "${post.title}"`);
        }
      } catch (error) {
        console.log(`❌ Error creating post ${i + 1}:`, error.message);
      }
    }

    console.log("Sample posts creation completed!");
  } catch (error) {
    console.error("Error creating sample posts:", error);
  }
}

// Run the function
createSamplePosts();
