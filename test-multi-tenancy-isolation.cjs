const axios = require("axios");

// Configuration
const API_URL = "http://localhost:3000";

// Test data - different schools with different teachers
const testData = {
  school1: {
    name: "School Alpha",
    adminPhoneNumber: "1111111111",
    stageName: "Grade Alpha",
    subjectName: "Math Alpha",
    teacherPhoneNumber: "2222222222",
    teacherName: "Teacher Alpha",
  },
  school2: {
    name: "School Beta",
    adminPhoneNumber: "3333333333",
    stageName: "Grade Beta",
    subjectName: "Math Beta",
    teacherPhoneNumber: "4444444444",
    teacherName: "Teacher Beta",
  },
};

// Store created IDs
let school1Data = {};
let school2Data = {};

async function testMultiTenancyIsolation() {
  console.log("🔒 Testing Multi-Tenancy Data Isolation...\n");

  try {
    // Step 1: Create two separate schools
    console.log("📚 Step 1: Creating two separate schools...");

    const school1Response = await axios.post(`${API_URL}/api/schools`, {
      name: testData.school1.name,
      adminPhoneNumber: testData.school1.adminPhoneNumber,
      adminPassword: "admin123",
    });
    school1Data.schoolId = school1Response.data.data.id;
    console.log(
      `✅ Created School 1: ${testData.school1.name} (ID: ${school1Data.schoolId})`
    );

    const school2Response = await axios.post(`${API_URL}/api/schools`, {
      name: testData.school2.name,
      adminPhoneNumber: testData.school2.adminPhoneNumber,
      adminPassword: "admin123",
    });
    school2Data.schoolId = school2Response.data.data.id;
    console.log(
      `✅ Created School 2: ${testData.school2.name} (ID: ${school2Data.schoolId})\n`
    );

    // Step 2: Login as school1 admin and create data
    console.log("🔑 Step 2: Setting up School 1 data...");

    const school1Login = await axios.post(`${API_URL}/api/auth/login`, {
      phoneNumber: testData.school1.adminPhoneNumber,
      password: "admin123",
    });
    const school1Token = school1Login.data.data.token;
    const school1Headers = { Authorization: `Bearer ${school1Token}` };

    // Create stage for school 1
    const stage1Response = await axios.post(
      `${API_URL}/api/stages`,
      {
        name: testData.school1.stageName,
      },
      { headers: school1Headers }
    );
    school1Data.stageId = stage1Response.data.data.id;
    console.log(`📖 Created stage in School 1: ${testData.school1.stageName}`);

    // Create subject for school 1
    const subject1Response = await axios.post(
      `${API_URL}/api/subjects`,
      {
        name: testData.school1.subjectName,
        stageId: school1Data.stageId,
      },
      { headers: school1Headers }
    );
    school1Data.subjectId = subject1Response.data.data.id;
    console.log(
      `📝 Created subject in School 1: ${testData.school1.subjectName}`
    );

    // Create teacher for school 1
    const teacher1Response = await axios.post(
      `${API_URL}/api/teachers`,
      {
        name: testData.school1.teacherName,
        phoneNumber: testData.school1.teacherPhoneNumber,
        password: "teacher123",
        age: 30,
        gender: "Male",
      },
      { headers: school1Headers }
    );
    school1Data.teacherId = teacher1Response.data.data.id;
    console.log(
      `👨‍🏫 Created teacher in School 1: ${testData.school1.teacherName}\n`
    );

    // Step 3: Login as school2 admin and create data
    console.log("🔑 Step 3: Setting up School 2 data...");

    const school2Login = await axios.post(`${API_URL}/api/auth/login`, {
      phoneNumber: testData.school2.adminPhoneNumber,
      password: "admin123",
    });
    const school2Token = school2Login.data.data.token;
    const school2Headers = { Authorization: `Bearer ${school2Token}` };

    // Create stage for school 2
    const stage2Response = await axios.post(
      `${API_URL}/api/stages`,
      {
        name: testData.school2.stageName,
      },
      { headers: school2Headers }
    );
    school2Data.stageId = stage2Response.data.data.id;
    console.log(`📖 Created stage in School 2: ${testData.school2.stageName}`);

    // Create subject for school 2
    const subject2Response = await axios.post(
      `${API_URL}/api/subjects`,
      {
        name: testData.school2.subjectName,
        stageId: school2Data.stageId,
      },
      { headers: school2Headers }
    );
    school2Data.subjectId = subject2Response.data.data.id;
    console.log(
      `📝 Created subject in School 2: ${testData.school2.subjectName}`
    );

    // Create teacher for school 2
    const teacher2Response = await axios.post(
      `${API_URL}/api/teachers`,
      {
        name: testData.school2.teacherName,
        phoneNumber: testData.school2.teacherPhoneNumber,
        password: "teacher123",
        age: 35,
        gender: "Female",
      },
      { headers: school2Headers }
    );
    school2Data.teacherId = teacher2Response.data.data.id;
    console.log(
      `👩‍🏫 Created teacher in School 2: ${testData.school2.teacherName}\n`
    );

    // Step 4: Test teacher mobile login isolation
    console.log("🧪 Step 4: Testing teacher mobile login isolation...");

    // Login as School 1 teacher
    const teacher1LoginResponse = await axios.post(
      `${API_URL}/api/mobile/auth/login`,
      {
        phoneNumber: testData.school1.teacherPhoneNumber,
        password: "teacher123",
      }
    );

    if (teacher1LoginResponse.data.success) {
      const teacher1Data = teacher1LoginResponse.data.data.teacher;
      console.log(`✅ School 1 teacher login successful`);
      console.log(`   - Teacher: ${teacher1Data.name}`);
      console.log(`   - Stages visible: ${teacher1Data.stages.length}`);
      console.log(`   - Subjects visible: ${teacher1Data.subjects.length}`);

      // Check if any data from School 2 is visible
      const hasSchool2Data =
        teacher1Data.stages.some(
          (stage) => stage.name === testData.school2.stageName
        ) ||
        teacher1Data.subjects.some(
          (subject) => subject.name === testData.school2.subjectName
        );

      if (hasSchool2Data) {
        console.log(
          `❌ ISOLATION BREACH: School 1 teacher can see School 2 data!`
        );
      } else {
        console.log(
          `✅ ISOLATION OK: School 1 teacher only sees School 1 data`
        );
      }
    }

    // Login as School 2 teacher
    const teacher2LoginResponse = await axios.post(
      `${API_URL}/api/mobile/auth/login`,
      {
        phoneNumber: testData.school2.teacherPhoneNumber,
        password: "teacher123",
      }
    );

    if (teacher2LoginResponse.data.success) {
      const teacher2Data = teacher2LoginResponse.data.data.teacher;
      console.log(`✅ School 2 teacher login successful`);
      console.log(`   - Teacher: ${teacher2Data.name}`);
      console.log(`   - Stages visible: ${teacher2Data.stages.length}`);
      console.log(`   - Subjects visible: ${teacher2Data.subjects.length}`);

      // Check if any data from School 1 is visible
      const hasSchool1Data =
        teacher2Data.stages.some(
          (stage) => stage.name === testData.school1.stageName
        ) ||
        teacher2Data.subjects.some(
          (subject) => subject.name === testData.school1.subjectName
        );

      if (hasSchool1Data) {
        console.log(
          `❌ ISOLATION BREACH: School 2 teacher can see School 1 data!`
        );
      } else {
        console.log(
          `✅ ISOLATION OK: School 2 teacher only sees School 2 data`
        );
      }
    }

    console.log("\n🎉 Multi-tenancy isolation test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testMultiTenancyIsolation();
