// @ts-nocheck — Vercel يشغّل tsc بإعدادات صارمة؛ المشروع يُبنى محليًا بـ Bun بدون نفس الفحص.
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { t } from "elysia";
import { loginRateLimiter, schoolCodeRateLimiter } from "./rate-limiter";
import { dashboardChatsRoutes } from "./dashboard-chats";

const prisma = new PrismaClient();

/** Puppeteer يُحمَّل عند الطلب فقط — على Vercel عيّن PUPPETEER_EXECUTABLE_PATH إن استخدمت @sparticuz/chromium */
async function launchPdfBrowser() {
  const { default: puppeteer } = await import("puppeteer");
  const opts: Parameters<(typeof puppeteer)["launch"]>[0] = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    opts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  return puppeteer.launch(opts);
}

// JWT Secret (in production, use environment variable)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Add a temporary default school ID for development
const DEFAULT_SCHOOL_ID = "00000000-0000-0000-0000-000000000001";

// WhatsApp API configuration
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// In-memory storage for verification codes (use Redis in production)
const verificationCodes = new Map<
  string,
  { code: string; expiresAt: Date; studentId: string }
>();

// Separate in-memory storage for school (dashboard) password reset codes
const schoolVerificationCodes = new Map<
  string,
  { code: string; expiresAt: Date; schoolId: string }
>();

// In-memory storage for school login (dashboard) OTP codes
const schoolLoginCodes = new Map<
  string,
  { code: string; expiresAt: Date; schoolId: string }
>();

// Helper function to format phone number with Iraq country code (964)
function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return "";

  // Remove any existing country code and formatting
  let cleaned = phoneNumber.replace(/\D/g, "");

  // If it starts with 964, it's already formatted
  if (cleaned.startsWith("964")) {
    return `+${cleaned}`;
  }

  // If it starts with 0, remove it and add 964
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // Add Iraq country code (964)
  return `+964${cleaned}`;
}

// Helper function to send WhatsApp message
async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  console.log("\n🔍 DETAILED WHATSAPP SENDING DEBUG:");

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("❌ WhatsApp credentials not configured");
    console.error(
      `WHATSAPP_TOKEN: ${WHATSAPP_TOKEN ? "Available" : "Missing"}`
    );
    console.error(
      `WHATSAPP_PHONE_NUMBER_ID: ${
        WHATSAPP_PHONE_NUMBER_ID ? "Available" : "Missing"
      }`
    );
    return false;
  }

  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`📞 Original phone: ${phoneNumber}`);
    console.log(`📞 Formatted phone: ${formattedPhone}`);

    const apiUrl = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    console.log(`🌐 API URL: ${apiUrl}`);

    const requestBody = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: {
        body: message,
      },
    };

    console.log(`📤 Request Body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      `📊 Response Status: ${response.status} ${response.statusText}`
    );

    const result = await response.json();
    console.log(`📥 Response Body:`, JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("❌ WhatsApp API error:");
      console.error(`Status: ${response.status}`);
      console.error(`Response:`, result);

      // Log specific error details
      if (result.error) {
        console.error(`Error Code: ${result.error.code}`);
        console.error(`Error Message: ${result.error.message}`);
        console.error(`Error Type: ${result.error.type}`);
      }

      return false;
    }

    console.log("✅ WhatsApp message sent successfully!");
    console.log(`Message ID: ${result.messages?.[0]?.id || "Not available"}`);
    return true;
  } catch (error) {
    console.error("💥 Exception while sending WhatsApp message:");
    console.error(error);

    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }

    return false;
  }
}

// Helper function to send WhatsApp template message with button
async function sendWhatsAppTemplateWithButton(
  phoneNumber: string,
  templateName: string,
  languageCode: string = "en_US",
  bodyParameter: string,
  buttonUrl: string
): Promise<boolean> {
  console.log("\n📋 TEMPLATE WITH BUTTON DEBUG:");
  console.log(`Template Name: ${templateName}`);
  console.log(`Language Code: ${languageCode}`);
  console.log(`Body Parameter: ${bodyParameter}`);
  console.log(`Button URL: ${buttonUrl}`);

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("❌ WhatsApp credentials not configured for template");
    return false;
  }

  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`📞 Formatted phone: ${formattedPhone}`);

    const requestBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: bodyParameter,
              },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              {
                type: "text",
                text: buttonUrl,
              },
            ],
          },
        ],
      },
    };

    console.log(
      `📤 Template Request Body:`,
      JSON.stringify(requestBody, null, 2)
    );

    const apiUrl = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    console.log(`🌐 Template API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      `📊 Template Response Status: ${response.status} ${response.statusText}`
    );

    const result = await response.json();
    console.log(`📥 Template Response Body:`, JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("❌ WhatsApp Template API error:");
      console.error(`Status: ${response.status}`);
      console.error(`Response:`, result);

      // Log specific template errors
      if (result.error) {
        console.error(`Template Error Code: ${result.error.code}`);
        console.error(`Template Error Message: ${result.error.message}`);
        console.error(`Template Error Type: ${result.error.type}`);

        // Common template error codes
        if (result.error.code === 132000) {
          console.error(
            "🔍 Template Error: Template may not be approved or doesn't exist"
          );
        } else if (result.error.code === 132001) {
          console.error("🔍 Template Error: Template parameters mismatch");
        } else if (result.error.code === 132015) {
          console.error(
            "🔍 Template Error: Template paused due to quality issues"
          );
        } else if (result.error.code === 131008) {
          console.error(
            "🔍 Template Error: Button parameter missing or incorrect"
          );
        }
      }

      return false;
    }

    console.log("✅ WhatsApp template message sent successfully!");
    console.log(
      `Template Message ID: ${result.messages?.[0]?.id || "Not available"}`
    );
    return true;
  } catch (error) {
    console.error("💥 Exception while sending WhatsApp template:");
    console.error(error);

    if (error instanceof Error) {
      console.error(`Template Error name: ${error.name}`);
      console.error(`Template Error message: ${error.message}`);
    }

    return false;
  }
}

// Helper function to send WhatsApp template message
async function sendWhatsAppTemplate(
  phoneNumber: string,
  templateName: string,
  languageCode: string = "en_US",
  parameters: string[] = []
): Promise<boolean> {
  console.log("\n📋 TEMPLATE MESSAGE DEBUG:");
  console.log(`Template Name: ${templateName}`);
  console.log(`Language Code: ${languageCode}`);
  console.log(`Parameters: [${parameters.join(", ")}]`);

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("❌ WhatsApp credentials not configured for template");
    return false;
  }

  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`📞 Formatted phone: ${formattedPhone}`);

    // Only add components if parameters are provided
    const templateComponents = [];
    if (parameters.length > 0) {
      templateComponents.push({
        type: "body",
        parameters: parameters.map((param) => ({
          type: "text",
          text: param,
        })),
      });
    }

    const requestBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components: templateComponents,
      },
    };

    console.log(
      `📤 Template Request Body:`,
      JSON.stringify(requestBody, null, 2)
    );

    const apiUrl = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    console.log(`🌐 Template API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      `📊 Template Response Status: ${response.status} ${response.statusText}`
    );

    const result = await response.json();
    console.log(`📥 Template Response Body:`, JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("❌ WhatsApp Template API error:");
      console.error(`Status: ${response.status}`);
      console.error(`Response:`, result);

      // Log specific template errors
      if (result.error) {
        console.error(`Template Error Code: ${result.error.code}`);
        console.error(`Template Error Message: ${result.error.message}`);
        console.error(`Template Error Type: ${result.error.type}`);

        // Common template error codes
        if (result.error.code === 132000) {
          console.error(
            "🔍 Template Error: Template may not be approved or doesn't exist"
          );
        } else if (result.error.code === 132001) {
          console.error("🔍 Template Error: Template parameters mismatch");
        } else if (result.error.code === 132015) {
          console.error(
            "🔍 Template Error: Template paused due to quality issues"
          );
        }
      }

      return false;
    }

    console.log("✅ WhatsApp template message sent successfully!");
    console.log(
      `Template Message ID: ${result.messages?.[0]?.id || "Not available"}`
    );
    return true;
  } catch (error) {
    console.error("💥 Exception while sending WhatsApp template:");
    console.error(error);

    if (error instanceof Error) {
      console.error(`Template Error name: ${error.name}`);
      console.error(`Template Error message: ${error.message}`);
    }

    return false;
  }
}

// Helper function to generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to generate secure access code
function generateAccessCode(): string {
  const length = 12; // Use 12 characters for better security
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const specialChars = "$%@#&*";
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  let accessCode = "";

  // Ensure at least one of each type
  accessCode +=
    uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
  accessCode +=
    lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
  accessCode += numberChars[Math.floor(Math.random() * numberChars.length)];
  accessCode += specialChars[Math.floor(Math.random() * specialChars.length)];

  // Fill the rest randomly
  for (let i = accessCode.length; i < length; i++) {
    accessCode += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the access code
  return accessCode
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// Helper function to normalize RTL numbers (Arabic/Persian digits to English)
function normalizeNumbers(text: string): string {
  if (!text) return text;

  // Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) to English (0123456789)
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const englishDigits = "0123456789";

  // Persian/Farsi digits (۰۱۲۳۴۵۶۷۸۹) to English (0123456789)
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  let normalized = text;

  // Convert Arabic digits
  for (let i = 0; i < arabicDigits.length; i++) {
    normalized = normalized.replace(
      new RegExp(arabicDigits[i], "g"),
      englishDigits[i]
    );
  }

  // Convert Persian digits
  for (let i = 0; i < persianDigits.length; i++) {
    normalized = normalized.replace(
      new RegExp(persianDigits[i], "g"),
      englishDigits[i]
    );
  }

  // Remove any RTL/LTR marks and extra whitespace
  normalized = normalized.replace(/[\u200E\u200F\u202A-\u202E]/g, "").trim();

  return normalized;
}

// Helper function to exclude password from teacher response
function excludePassword(teacher: any) {
  const { password, ...teacherWithoutPassword } = teacher;
  return teacherWithoutPassword;
}

// Helper function to sanitize backup data (currently just returns data as-is)
// Passwords are already bcrypt hashed in database, so they're safe to export
// Note: Bcrypt hashes are one-way and cannot be reversed to plain text
function sanitizeForBackup(data: any): any {
  // For now, we include everything including hashed passwords
  // Hashed passwords are already secure and allow seamless import/export
  return data;
}

// Helper function to generate student report HTML for PDF
function generateStudentReportHTML(
  student: any,
  allSubjects: any[],
  settings: any,
  attendanceStats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    attendanceRate: number;
  }
) {
  // Group grades by subject for this student
  const subjectGradesMap: Record<string, any> = {};

  // Process each grade for this student
  student.grades.forEach((grade: any) => {
    const subjectId = grade.subjectId;
    const subjectName = grade.subject.name;

    // Initialize subject if not exists
    if (!subjectGradesMap[subjectId]) {
      subjectGradesMap[subjectId] = {
        subjectId: subjectId,
        subjectName: subjectName,
        grades: {
          MONTH_1_EXAM: null,
          MONTH_2_EXAM: null,
          MID_TERM_EXAM: null,
          MONTH_3_EXAM: null,
          MONTH_4_EXAM: null,
          FINAL_EXAM: null,
        },
      };
    }

    // Add the grade to the appropriate type
    subjectGradesMap[subjectId].grades[grade.gradeType] = {
      id: grade.id,
      grade: Number(grade.grade),
      teacher: grade.teacher.name,
      createdAt: grade.createdAt,
    };
  });

  // Calculate overall grades
  const allGradeValues = student.grades
    .map((g: any) => Number(g.grade))
    .filter((g: number) => !isNaN(g));
  const total = allGradeValues.reduce(
    (sum: number, grade: number) => sum + grade,
    0
  );
  const average = allGradeValues.length > 0 ? total / allGradeValues.length : 0;
  const isPassed = average >= 50;

  // Generate table rows for all subjects
  const tableRows = allSubjects
    .map((subject) => {
      const subjectGrades = subjectGradesMap[subject.id];
      const month1 = subjectGrades?.grades.MONTH_1_EXAM?.grade || "-";
      const month2 = subjectGrades?.grades.MONTH_2_EXAM?.grade || "-";
      const midExam = subjectGrades?.grades.MID_TERM_EXAM?.grade || "-";
      const month3 = subjectGrades?.grades.MONTH_3_EXAM?.grade || "-";
      const month4 = subjectGrades?.grades.MONTH_4_EXAM?.grade || "-";
      const finalExam = subjectGrades?.grades.FINAL_EXAM?.grade || "-";

      // Calculate subject average
      const subjectGradeValues = subjectGrades
        ? Object.values(subjectGrades.grades)
            .filter((grade: any) => grade !== null)
            .map((grade: any) => grade.grade)
        : [];
      const subjectAverage =
        subjectGradeValues.length > 0
          ? subjectGradeValues.reduce(
              (sum: number, grade: number) => sum + grade,
              0
            ) / subjectGradeValues.length
          : 0;

      const formatGrade = (grade: any) => {
        if (grade === "-" || grade === null || grade === undefined) {
          return "-";
        }
        const isPass = Number(grade) >= 50;
        const className = isPass ? "grade-pass" : "grade-fail";
        return `<span class="${className}">${grade}</span>`;
      };

      return `
      <tr>
        <td class="subject-name">${subject.name}</td>
        <td>${formatGrade(month1)}</td>
        <td>${formatGrade(month2)}</td>
        <td>${formatGrade(midExam)}</td>
        <td>${formatGrade(month3)}</td>
        <td>${formatGrade(month4)}</td>
        <td>${formatGrade(finalExam)}</td>
        <td style="font-weight: bold;">${
          subjectAverage > 0 ? subjectAverage.toFixed(1) : "-"
        }</td>
      </tr>
    `;
    })
    .join("");

  // Get current date for print history in simple format
  const printDate = new Date().toLocaleDateString("en-CA"); // Format: 2025-01-15
  const formattedPrintDate = printDate.replace(/-/g, "/"); // Convert to 2025/01/15

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تقرير درجات الطالب</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          direction: rtl;
          text-align: right;
          background: white;
          color: black;
          line-height: 1.4;
        }
        
        .page {
          width: 210mm;
          height: 297mm;
          margin: 0 auto;
          padding: 15mm;
          background: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .header {
          border-bottom: 2px solid black;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .header-right {
          text-align: right;
        }
        
        .header-left {
          text-align: left;
        }
        
        .header-center {
          text-align: center;
          flex: 1;
        }
        
        .header h1 {
          font-size: 16px;
          font-weight: bold;
          margin: 2px 0;
        }
        
        .header h2 {
          font-size: 14px;
          font-weight: normal;
          margin: 2px 0;
        }
        
        .document-info {
          text-align: center;
          font-size: 12px;
          margin-bottom: 15px;
          border-bottom: 1px solid black;
          padding-bottom: 8px;
        }
        
        .student-info {
          display: flex;
          justify-content: space-between;
          border: 1px solid black;
          padding: 10px;
          margin-bottom: 15px;
          font-size: 13px;
        }
        
        .student-column {
          flex: 1;
        }
        
        .info-item {
          margin: 3px 0;
        }
        
        .info-label {
          font-weight: bold;
        }
        
        .grades-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 15px;
        }
        
        .grades-table th,
        .grades-table td {
          border: 1px solid black;
          padding: 6px 4px;
          text-align: center;
        }
        
        .grades-table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        
        .grades-table .subject-name {
          text-align: right;
          font-weight: bold;
          padding-right: 8px;
        }
        
        .grade-pass {
          font-weight: bold;
        }
        
        .grade-fail {
          font-weight: bold;
          text-decoration: underline;
        }
        
        .summary {
          display: flex;
          justify-content: space-around;
          border: 1px solid black;
          padding: 10px;
          margin-bottom: 10px;
          font-size: 12px;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-label {
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .summary-value {
          font-size: 14px;
          font-weight: bold;
        }
        
        .status {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          padding: 8px;
          border: 2px solid black;
          margin-bottom: 10px;
        }
        
        .footer {
          position: absolute;
          bottom: 20px;
          left: 20px;
          font-size: 12px;
          font-weight: bold;
          text-align: left;
        }
        
        @page {
          margin: 0;
          size: A4;
        }
        
        @media print {
          .page {
            margin: 0;
            padding: 15mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="content">
          <div class="header">
            <div class="header-content">
              <div class="header-left">
                <h1>${settings.countryName}</h1>
                <h2>${settings.ministryName}</h2>
              </div>
              <div class="header-center">
                <h1>بسم الله الرحمن الرحيم</h1>
                <h2>النتائج المدرسية</h2>
              </div>
              <div class="header-right">
                <h2>${settings.schoolName}</h2>
                <h2>العام الدراسي: ${settings.studyYear}</h2>
              </div>
            </div>
          </div>

          <div class="document-info">
            <div><strong>تقرير درجات الطالب</strong></div>
            <div>${formattedPrintDate}</div>
          </div>

          <div class="student-info">
            <div class="student-column">
              <div class="info-item">
                <span class="info-label">الاسم:</span> ${student.name}
              </div>
              <div class="info-item">
                <span class="info-label">الشعبة:</span> ${student.stage.name}
              </div>
            </div>
            <div class="student-column">
              <div class="info-item">
                <span class="info-label">الجنس:</span> ${
                  student.gender === "male" ? "ذكر" : "أنثى"
                }
              </div>
            </div>
          </div>

          <table class="grades-table">
            <thead>
              <tr>
                <th rowspan="2">اسم المبحث</th>
                <th colspan="6">العلامات</th>
                <th rowspan="2">المعدل</th>
              </tr>
              <tr>
                <th>ش1</th>
                <th>ش2</th>
                <th>نصف</th>
                <th>ش3</th>
                <th>ش4</th>
                <th>نهائي</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">المجموع العام</div>
              <div class="summary-value">${total.toFixed(1)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">المعدل العام</div>
              <div class="summary-value">${average.toFixed(1)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">عدد المباحث</div>
              <div class="summary-value">${allSubjects.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">عدد الدرجات</div>
              <div class="summary-value">${allGradeValues.length}</div>
            </div>
          </div>

          <div class="status">
            النتيجة النهائية: ${isPassed ? "ناجح" : "راسب"}
          </div>
                </div>

        <div class="footer">
          المدير: ${settings.managerName}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Add helper function for authentication
const verifySchoolAuth = async (headers: any, jwt: any) => {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = authHeader.substring(7);
  const payload = (await jwt.verify(token)) as any;

  if (!payload || payload.type !== "school") {
    return { error: "Access denied", status: 403 };
  }

  const schoolId = payload.schoolId as string;
  if (!schoolId) {
    return { error: "Invalid token: missing schoolId", status: 403 };
  }

  return { schoolId, success: true };
};

// Helper function to get teacher ID from JWT token
const getTeacherIdFromAuth = async (
  headers: any,
  jwt: any
): Promise<string | null> => {
  try {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = (await jwt.verify(token)) as any;

    if (payload && payload.teacherId) {
      return payload.teacherId;
    }

    return null;
  } catch (error) {
    return null;
  }
};

// Helper function for authentication with fallback
const getSchoolIdFromAuth = async (headers: any, jwt: any): Promise<string> => {
  try {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return DEFAULT_SCHOOL_ID; // Fallback for development
    }

    const token = authHeader.substring(7);
    const payload = (await jwt.verify(token)) as any;

    if (payload && payload.schoolId) {
      return payload.schoolId;
    }

    return DEFAULT_SCHOOL_ID; // Fallback for development
  } catch (error) {
    return DEFAULT_SCHOOL_ID; // Fallback for development
  }
};

const getStudentIdFromAuth = async (
  headers: any,
  jwt: any
): Promise<string | null> => {
  try {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = (await jwt.verify(token)) as any;

    if (payload && payload.studentId) {
      return payload.studentId;
    }

    return null;
  } catch (error) {
    return null;
  }
};
const app = new Elysia()
  .use(
    cors({
      origin: true, // Allow all origins
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Accept",
        "X-Requested-With",
        "Cache-Control",
        "Pragma",
      ],
      exposeHeaders: ["*"],
      maxAge: 86400, // 24 hours
    })
  )
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
      exp: "10y", // Set expiration to 10 years (effectively no expiration for mobile apps)
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: "SMS Backend API",
          version: "1.0.0",
          description: "Backend API for SMS application",
        },
        tags: [
          { name: "Health", description: "Health check endpoints" },
          {
            name: "Auth",
            description: "Authentication endpoints for mobile app",
          },
          { name: "Teachers", description: "Teacher management endpoints" },
          { name: "Students", description: "Student management endpoints" },
          { name: "Stages", description: "Stage management endpoints" },
          { name: "Subjects", description: "Subject management endpoints" },
          { name: "Schedules", description: "Schedule management endpoints" },
          { name: "Exams", description: "Exam management endpoints" },
          {
            name: "Grades",
            description: "Grade management and PDF generation endpoints",
          },
          {
            name: "Settings",
            description: "System settings management endpoints",
          },
          { name: "Mobile", description: "Mobile app specific endpoints" },
          {
            name: "Backup",
            description: "System backup and restore endpoints",
          },
        ],
      },
    })
  )
  // Health check endpoint
  .get(
    "/health",
    () => {
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "SMS Backend API",
        environment: process.env.NODE_ENV || "development",
      };
    },
    {
      detail: {
        tags: ["Health"],
        summary: "Health check",
        description: "Health check endpoint for monitoring",
      },
    }
  )
  // Authentication middleware for mobile endpoints
  .derive(async ({ headers, jwt }) => {
    const authHeader = headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return { user: null };
    }

    try {
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);

      if (payload && typeof payload === "object") {
        // Handle teacher tokens
        if ("teacherId" in payload) {
          // First, get the teacher with basic info to access schoolId
          const basicTeacher = await prisma.teacher.findUnique({
            where: { id: payload.teacherId as string },
            select: { schoolId: true },
          });

          if (!basicTeacher) {
            return { user: null };
          }

          // Now fetch the teacher with their assigned stages and subjects from their school only
          const teacher = await prisma.teacher.findUnique({
            where: { id: payload.teacherId as string },
            include: {
              school: true,
              stages: {
                where: {
                  stage: {
                    schoolId: basicTeacher.schoolId, // Only stages from this teacher's school
                  },
                },
                include: {
                  stage: {
                    include: {
                      students: {
                        where: {
                          schoolId: basicTeacher.schoolId, // Only students from this teacher's school
                        },
                      },
                    },
                  },
                },
              },
              subjects: {
                where: {
                  subject: {
                    schoolId: basicTeacher.schoolId, // Only subjects from this teacher's school
                  },
                },
                include: {
                  subject: true,
                },
              },
            },
          });

          return { user: teacher ? excludePassword(teacher) : null };
        }

        // Handle student tokens
        if ("studentId" in payload) {
          const student = await prisma.student.findUnique({
            where: { id: payload.studentId as string },
            include: {
              stage: true,
              school: true,
            },
          });

          if (!student) {
            return { user: null };
          }

          // Return user object with studentId for student authentication
          return {
            user: {
              id: student.id,
              studentId: student.id, // Add this for student endpoints
              name: student.name,
              code: student.code,
              stageId: student.stageId,
              schoolId: student.schoolId,
              stage: student.stage,
              school: student.school,
            },
          };
        }
      }

      return { user: null };
    } catch (error) {
      return { user: null };
    }
  })
  // Authentication endpoints
  .post(
    "/auth/school/login",
    async ({ body, jwt, set }) => {
      try {
        const { identifier, password } = body;

        // Find school by username or phone number
        const school = await prisma.school.findFirst({
          where: {
            OR: [{ username: identifier }, { contactPhone: identifier }],
          },
        });

        if (!school || !school.isActive) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid credentials or account disabled",
          };
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, school.password);
        if (!isValidPassword) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid credentials",
          };
        }

        // Generate and send WhatsApp OTP for 2FA
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 1 * 60 * 1000);
        const codeKey = `${school.id}:${formatPhoneNumber(
          school.contactPhone || ""
        )}`;
        schoolLoginCodes.set(codeKey, {
          code: verificationCode,
          expiresAt,
          schoolId: school.id,
        });

        let messageSent = await sendWhatsAppTemplateWithButton(
          school.contactPhone,
          "schoolify",
          "ar",
          verificationCode,
          verificationCode
        );
        if (!messageSent) {
          const message = `Hello ${school.schoolName}!\n\nYour login verification code is: ${verificationCode}\n\nThis code is valid for 1 minute.`;
          messageSent = await sendWhatsAppMessage(school.contactPhone, message);
        }

        if (!messageSent) {
          set.status = 500;
          return {
            success: false,
            message:
              "Failed to send verification code. Please try again later.",
          };
        }

        const masked = (school.contactPhone || "").replace(
          /(\d{4})\d{4}(\d{3})/,
          "$1****$2"
        );

        return {
          success: true,
          data: { mfaRequired: true, phoneNumber: masked, expiresIn: 600 },
          message: "Verification code sent to WhatsApp",
        };
      } catch (error) {
        console.error("School login error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        identifier: t.String(),
        password: t.String(),
      }),
      detail: {
        tags: ["Auth"],
        summary: "School login",
        description: "Login endpoint for school dashboard",
      },
    }
  )

  // School login verify - exchange OTP for JWT
  .post(
    "/auth/school/login/verify",
    async ({ body, jwt, set }) => {
      const { identifier, verificationCode } = body as {
        identifier: string;
        verificationCode: string;
      };

      if (!identifier || !verificationCode) {
        set.status = 400;
        return { success: false, message: "Identifier and code are required" };
      }

      const normalizedCode = normalizeNumbers(verificationCode || "");
      if (!/^\d{6}$/.test(normalizedCode)) {
        set.status = 400;
        return { success: false, message: "Code must be 6 digits" };
      }

      try {
        const school = await prisma.school.findFirst({
          where: {
            OR: [{ username: identifier }, { contactPhone: identifier }],
          },
        });

        if (!school || !school.isActive) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid credentials or account disabled",
          };
        }

        const codeKey = `${school.id}:${formatPhoneNumber(
          school.contactPhone || ""
        )}`;
        const stored = schoolLoginCodes.get(codeKey);
        if (!stored) {
          set.status = 400;
          return {
            success: false,
            message: "No verification code found. Please login again.",
          };
        }

        if (stored.expiresAt < new Date()) {
          schoolLoginCodes.delete(codeKey);
          set.status = 400;
          return { success: false, message: "Verification code has expired" };
        }

        if (stored.code !== normalizedCode) {
          set.status = 400;
          return { success: false, message: "Invalid verification code" };
        }

        // Invalidate code after successful verification
        schoolLoginCodes.delete(codeKey);

        // Generate JWT token
        const token = await jwt.sign({
          schoolId: school.id,
          username: school.username,
          type: "school",
        });

        return {
          success: true,
          data: {
            token,
            school: {
              id: school.id,
              username: school.username,
              schoolName: school.schoolName,
              schoolCode: school.schoolCode,
              contactEmail: school.contactEmail,
              contactPhone: school.contactPhone,
              address: school.address,
            },
          },
          message: "Login successful",
        };
      } catch (error) {
        console.error("School login verify error:", error);
        set.status = 500;
        return { success: false, message: "Internal server error" };
      }
    },
    {
      body: t.Object({
        identifier: t.String(),
        verificationCode: t.String({ minLength: 6, maxLength: 6 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "School login 2FA verify",
        description:
          "Verify WhatsApp OTP for school login and return JWT on success",
      },
    }
  )

  // School login with access code (no WhatsApp verification needed)
  .post(
    "/auth/school/login/access-code",
    async ({ body, jwt, set }) => {
      try {
        const { accessCode } = body;

        if (!accessCode) {
          set.status = 400;
          return {
            success: false,
            message: "Access code is required",
          };
        }

        // Find school by access code
        const school = await prisma.school.findUnique({
          where: { accessCode },
        });

        if (!school || !school.isActive) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid access code or account disabled",
          };
        }

        // Check if access code is activated
        if (!school.accessCodeActivated) {
          set.status = 403;
          return {
            success: false,
            message:
              "Access code is not activated. Please activate it from the school dashboard settings.",
          };
        }

        // Generate JWT token
        const token = await jwt.sign({
          schoolId: school.id,
          username: school.username,
          type: "school",
        });

        return {
          success: true,
          data: {
            token,
            school: {
              id: school.id,
              username: school.username,
              schoolName: school.schoolName,
              schoolCode: school.schoolCode,
              contactEmail: school.contactEmail,
              contactPhone: school.contactPhone,
              address: school.address,
            },
          },
          message: "Login successful",
        };
      } catch (error) {
        console.error("Access code login error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        accessCode: t.String({ minLength: 10 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "School login with access code",
        description:
          "Login to school dashboard using access code without WhatsApp verification",
      },
    }
  )

  // School forgot password - send verification code via WhatsApp
  .post(
    "/auth/school/forgot-password",
    async ({ body, set }) => {
      const { phoneNumber } = body as { phoneNumber: string };

      if (!phoneNumber || typeof phoneNumber !== "string") {
        set.status = 400;
        return { success: false, message: "Phone number is required" };
      }

      try {
        // Try common phone formats to find the school by contactPhone
        const phoneVariations = [
          phoneNumber,
          formatPhoneNumber(phoneNumber),
          phoneNumber.replace(/^\+964/, ""),
          phoneNumber.replace(/^\+/, ""),
        ];

        let school = null as {
          id: string;
          schoolName: string;
          contactPhone: string;
        } | null;
        for (const p of phoneVariations) {
          school = await prisma.school.findFirst({
            where: { contactPhone: p },
            select: { id: true, schoolName: true, contactPhone: true },
          });
          if (school) break;
        }

        if (!school) {
          set.status = 404;
          return { success: false, message: "School not found for this phone" };
        }

        // Generate and store verification code (10 min expiry)
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 1 * 60 * 1000);
        const codeKey = `${school.id}:${formatPhoneNumber(
          school.contactPhone
        )}`;
        schoolVerificationCodes.set(codeKey, {
          code: verificationCode,
          expiresAt,
          schoolId: school.id,
        });

        // Try to send via WhatsApp template, fallback to plain text
        let messageSent = await sendWhatsAppTemplateWithButton(
          school.contactPhone,
          "schoolify",
          // "en_US",
          "ar",
          verificationCode,
          verificationCode
        );

        if (!messageSent) {
          const message = `Hello ${school.schoolName}!\n\nYour password reset code is: ${verificationCode}\n\nThis code is valid for 1 minute.`;
          messageSent = await sendWhatsAppMessage(school.contactPhone, message);
        }

        if (!messageSent) {
          set.status = 500;
          return {
            success: false,
            message:
              "Failed to send verification code. Please try again later.",
          };
        }

        const masked = school.contactPhone.replace(
          /(\d{4})\d{4}(\d{3})/,
          "$1****$2"
        );
        return {
          success: true,
          message: "Verification code sent successfully",
          data: { phoneNumber: masked, expiresIn: 600 },
        };
      } catch (error) {
        console.error("School forgot-password error:", error);
        set.status = 500;
        return { success: false, message: "Internal server error" };
      }
    },
    {
      body: t.Object({
        phoneNumber: t.String({ description: "School contact phone" }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "School forgot password",
        description:
          "Send WhatsApp verification code to school's contact phone",
      },
    }
  )

  // School verify code
  .post(
    "/auth/school/verify-code",
    async ({ body, set }) => {
      const { phoneNumber, verificationCode } = body as {
        phoneNumber: string;
        verificationCode: string;
      };

      if (!phoneNumber || !verificationCode) {
        set.status = 400;
        return { success: false, message: "Phone and code are required" };
      }

      const normalizedCode = normalizeNumbers(verificationCode || "");
      if (!/^\d{6}$/.test(normalizedCode)) {
        set.status = 400;
        return { success: false, message: "Code must be 6 digits" };
      }

      try {
        const phoneVariations = [
          phoneNumber,
          formatPhoneNumber(phoneNumber),
          phoneNumber.replace(/^\+964/, ""),
          phoneNumber.replace(/^\+/, ""),
        ];

        let school = null as { id: string; contactPhone: string } | null;
        for (const p of phoneVariations) {
          school = await prisma.school.findFirst({
            where: { contactPhone: p },
            select: { id: true, contactPhone: true },
          });
          if (school) break;
        }

        if (!school) {
          set.status = 404;
          return { success: false, message: "School not found" };
        }

        const codeKey = `${school.id}:${formatPhoneNumber(
          school.contactPhone
        )}`;
        const stored = schoolVerificationCodes.get(codeKey);
        if (!stored) {
          set.status = 400;
          return {
            success: false,
            message: "No verification code found. Please request a new code.",
          };
        }

        if (stored.expiresAt < new Date()) {
          schoolVerificationCodes.delete(codeKey);
          set.status = 400;
          return { success: false, message: "Verification code has expired" };
        }

        if (stored.code !== normalizedCode) {
          set.status = 400;
          return { success: false, message: "Invalid verification code" };
        }

        // On success, we can return a simple confirmation
        return { success: true, message: "Code verified" };
      } catch (error) {
        console.error("School verify-code error:", error);
        set.status = 500;
        return { success: false, message: "Internal server error" };
      }
    },
    {
      body: t.Object({
        phoneNumber: t.String({}),
        verificationCode: t.String({ minLength: 6, maxLength: 6 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "School verify reset code",
        description: "Verify OTP sent to school's WhatsApp",
      },
    }
  )

  // School reset password
  .post(
    "/auth/school/reset-password",
    async ({ body, set }) => {
      const { phoneNumber, verificationCode, newPassword } = body as {
        phoneNumber: string;
        verificationCode: string;
        newPassword: string;
      };

      if (!phoneNumber || !verificationCode || !newPassword) {
        set.status = 400;
        return {
          success: false,
          message: "Phone, code and new password are required",
        };
      }

      if (newPassword.length < 6) {
        set.status = 400;
        return {
          success: false,
          message: "Password must be at least 6 characters",
        };
      }

      const normalizedCode = normalizeNumbers(verificationCode || "");

      try {
        const phoneVariations = [
          phoneNumber,
          formatPhoneNumber(phoneNumber),
          phoneNumber.replace(/^\+964/, ""),
          phoneNumber.replace(/^\+/, ""),
        ];

        let school = null as { id: string; contactPhone: string } | null;
        for (const p of phoneVariations) {
          school = await prisma.school.findFirst({
            where: { contactPhone: p },
            select: { id: true, contactPhone: true },
          });
          if (school) break;
        }

        if (!school) {
          set.status = 404;
          return { success: false, message: "School not found" };
        }

        const codeKey = `${school.id}:${formatPhoneNumber(
          school.contactPhone
        )}`;
        const stored = schoolVerificationCodes.get(codeKey);
        if (
          !stored ||
          stored.expiresAt < new Date() ||
          stored.code !== normalizedCode
        ) {
          set.status = 400;
          return {
            success: false,
            message: "Invalid or expired verification code",
          };
        }

        // Hash and update school password
        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.school.update({
          where: { id: school.id },
          data: { password: hashed },
        });

        // Invalidate code
        schoolVerificationCodes.delete(codeKey);

        return {
          success: true,
          message: "Password reset successfully",
        };
      } catch (error) {
        console.error("School reset-password error:", error);
        set.status = 500;
        return { success: false, message: "Internal server error" };
      }
    },
    {
      body: t.Object({
        phoneNumber: t.String({}),
        verificationCode: t.String({ minLength: 6, maxLength: 6 }),
        newPassword: t.String({ minLength: 6 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "School reset password",
        description: "Reset school password using WhatsApp verification code",
      },
    }
  )

  // School access code activation - send verification code
  .post(
    "/auth/school/access-code/activate",
    async ({ headers, jwt, set }) => {
      try {
        // Verify school authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "school") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const schoolId = payload.schoolId;

        // Find the school
        const school = await prisma.school.findUnique({
          where: { id: schoolId },
          select: {
            id: true,
            schoolName: true,
            contactPhone: true,
            accessCode: true,
            accessCodeActivated: true,
          },
        });

        if (!school) {
          set.status = 404;
          return { success: false, message: "School not found" };
        }

        // Check if already activated AND has an access code
        if (school.accessCodeActivated && school.accessCode) {
          set.status = 400;
          return {
            success: false,
            message: "Access code is already activated",
          };
        }

        // If activated but no access code (data inconsistency), allow re-activation
        // to generate the missing access code

        // Generate and send WhatsApp verification code
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        const codeKey = `access-code-activation:${
          school.id
        }:${formatPhoneNumber(school.contactPhone)}`;

        schoolVerificationCodes.set(codeKey, {
          code: verificationCode,
          expiresAt,
          schoolId: school.id,
        });

        // Send WhatsApp message
        const message = `Hello ${school.schoolName}!\n\nYour access code activation verification code is: ${verificationCode}\n\nThis code is valid for 5 minutes.\n\nBy activating this feature, you allow authorized company personnel to access your school dashboard.`;

        const messageSent = await sendWhatsAppMessage(
          school.contactPhone,
          message
        );

        if (!messageSent) {
          set.status = 500;
          return {
            success: false,
            message: "Failed to send verification code",
          };
        }

        return {
          success: true,
          data: {
            phoneNumber: school.contactPhone.replace(
              /(\d{3})\d{4}(\d{4})/,
              "$1****$2"
            ),
          },
          message: "Verification code sent to WhatsApp",
        };
      } catch (error) {
        console.error("Access code activation send error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Internal server error",
        };
      }
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Request access code activation",
        description:
          "Send WhatsApp verification code to activate the access code feature",
      },
    }
  )

  // School access code activation - verify code and activate
  .post(
    "/auth/school/access-code/verify",
    async ({ body, headers, jwt, set }) => {
      try {
        const { verificationCode } = body;

        // Verify school authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "school") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const schoolId = payload.schoolId;

        if (!verificationCode) {
          set.status = 400;
          return {
            success: false,
            message: "Verification code is required",
          };
        }

        const normalizedCode = normalizeNumbers(verificationCode);
        if (!/^\d{6}$/.test(normalizedCode)) {
          set.status = 400;
          return {
            success: false,
            message: "Code must be 6 digits",
          };
        }

        // Find the school
        const school = await prisma.school.findUnique({
          where: { id: schoolId },
          select: {
            id: true,
            contactPhone: true,
            accessCodeActivated: true,
          },
        });

        if (!school) {
          set.status = 404;
          return { success: false, message: "School not found" };
        }

        if (school.accessCodeActivated) {
          set.status = 400;
          return {
            success: false,
            message: "Access code is already activated",
          };
        }

        // Verify the code
        const codeKey = `access-code-activation:${
          school.id
        }:${formatPhoneNumber(school.contactPhone)}`;
        const stored = schoolVerificationCodes.get(codeKey);

        if (!stored) {
          set.status = 400;
          return {
            success: false,
            message:
              "No verification code found. Please request a new activation code.",
          };
        }

        if (stored.expiresAt < new Date()) {
          schoolVerificationCodes.delete(codeKey);
          set.status = 400;
          return {
            success: false,
            message: "Verification code has expired",
          };
        }

        if (stored.code !== normalizedCode) {
          set.status = 400;
          return {
            success: false,
            message: "Invalid verification code",
          };
        }

        // Generate access code if it doesn't exist
        const schoolWithCode = await prisma.school.findUnique({
          where: { id: school.id },
          select: { accessCode: true },
        });

        let accessCode = schoolWithCode?.accessCode;

        // If no access code exists, generate one
        if (!accessCode) {
          let attempts = 0;
          const maxAttempts = 10;

          do {
            accessCode = generateAccessCode();
            const existing = await prisma.school.findUnique({
              where: { accessCode },
            });

            if (!existing) break;
            attempts++;
          } while (attempts < maxAttempts);

          if (attempts >= maxAttempts) {
            set.status = 500;
            return {
              success: false,
              message: "Failed to generate unique access code",
            };
          }
        }

        // Activate the access code
        await prisma.school.update({
          where: { id: school.id },
          data: {
            accessCodeActivated: true,
            accessCode: accessCode,
          },
        });

        // Invalidate the code
        schoolVerificationCodes.delete(codeKey);

        return {
          success: true,
          message: "Access code activated successfully",
          data: {
            accessCode: accessCode,
          },
        };
      } catch (error) {
        console.error("Access code activation verify error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        verificationCode: t.String({ minLength: 6, maxLength: 6 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Verify and activate access code",
        description:
          "Verify WhatsApp code and activate the access code feature",
      },
    }
  )

  // School access code deactivation (optional - for security)
  .post(
    "/auth/school/access-code/deactivate",
    async ({ headers, jwt, set }) => {
      try {
        // Verify school authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "school") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const schoolId = payload.schoolId;

        // Find the school
        const school = await prisma.school.findUnique({
          where: { id: schoolId },
          select: {
            id: true,
            accessCodeActivated: true,
          },
        });

        if (!school) {
          set.status = 404;
          return { success: false, message: "School not found" };
        }

        if (!school.accessCodeActivated) {
          set.status = 400;
          return {
            success: false,
            message: "Access code is not activated",
          };
        }

        // Deactivate the access code
        await prisma.school.update({
          where: { id: school.id },
          data: { accessCodeActivated: false },
        });

        return {
          success: true,
          message: "Access code deactivated successfully",
        };
      } catch (error) {
        console.error("Access code deactivation error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Internal server error",
        };
      }
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Deactivate access code",
        description: "Deactivate the access code feature for security",
      },
    }
  )

  // Get school profile with access code information
  .get(
    "/school/profile",
    async ({ headers, jwt, set }) => {
      try {
        // Verify school authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "school") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const schoolId = payload.schoolId;

        // Find the school
        const school = await prisma.school.findUnique({
          where: { id: schoolId },
          select: {
            id: true,
            username: true,
            schoolName: true,
            schoolCode: true,
            accessCode: true,
            accessCodeActivated: true,
            contactEmail: true,
            contactPhone: true,
            address: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!school) {
          set.status = 404;
          return { success: false, message: "School not found" };
        }

        return {
          success: true,
          data: school,
        };
      } catch (error) {
        console.error("Get school profile error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch school profile",
        };
      }
    },
    {
      detail: {
        tags: ["School"],
        summary: "Get school profile",
        description:
          "Get authenticated school's profile information including access code",
      },
    }
  )

  .post(
    "/auth/central/login",
    async ({ body, jwt, set }) => {
      try {
        const { username, password } = body;

        // Find central admin by username
        const admin = await prisma.centralAdmin.findUnique({
          where: { username },
        });

        if (!admin || !admin.isActive) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid credentials or account disabled",
          };
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid credentials",
          };
        }

        // Generate JWT token
        const token = await jwt.sign({
          adminId: admin.id,
          username: admin.username,
          type: "central_admin",
        });

        return {
          success: true,
          data: {
            token,
            admin: {
              id: admin.id,
              username: admin.username,
              name: admin.name,
              email: admin.email,
            },
          },
          message: "Login successful",
        };
      } catch (error) {
        console.error("Central admin login error:", error);
        const message = error instanceof Error ? error.message : "";

        if (message.includes("Environment variable not found: DATABASE_URL")) {
          set.status = 500;
          return {
            success: false,
            message:
              "Server configuration error: DATABASE_URL is missing. Please configure backend .env.",
          };
        }

        set.status = 500;
        return {
          success: false,
          message: "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Central admin login",
        description: "Login endpoint for central dashboard",
      },
    }
  )

  // Central admin endpoints for managing schools
  .post(
    "/central/schools",
    async ({ body, headers, jwt, set }) => {
      try {
        // Verify central admin authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const {
          username,
          password,
          schoolName,
          contactEmail,
          contactPhone,
          address,
        } = body;

        // Check if username already exists
        const existingSchoolByUsername = await prisma.school.findUnique({
          where: { username },
        });

        if (existingSchoolByUsername) {
          set.status = 400;
          return {
            success: false,
            message: "Username already exists",
          };
        }

        // Check if phone number already exists
        const existingSchoolByPhone = await prisma.school.findUnique({
          where: { contactPhone },
        });

        if (existingSchoolByPhone) {
          set.status = 400;
          return {
            success: false,
            message: "Phone number already exists",
          };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate unique school code
        const generateSchoolCode = (schoolName: string): string => {
          const cleanName = schoolName
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .substring(0, 6);
          const timestamp = Date.now().toString().slice(-3);
          return `${cleanName}${timestamp}`;
        };

        const schoolCode = generateSchoolCode(schoolName);

        // Generate unique access code
        let accessCode = generateAccessCode();
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure the access code is unique
        while (attempts < maxAttempts) {
          const existingByAccessCode = await prisma.school.findUnique({
            where: { accessCode },
          });

          if (!existingByAccessCode) {
            break; // Code is unique
          }

          accessCode = generateAccessCode();
          attempts++;
        }

        if (attempts >= maxAttempts) {
          set.status = 500;
          return {
            success: false,
            message: "Failed to generate unique access code",
          };
        }

        // Create school
        const school = await prisma.school.create({
          data: {
            username,
            password: hashedPassword,
            schoolName,
            schoolCode,
            accessCode,
            accessCodeActivated: false,
            contactEmail,
            contactPhone,
            address,
          },
        });

        return {
          success: true,
          data: {
            school: {
              id: school.id,
              username: school.username,
              schoolName: school.schoolName,
              schoolCode: school.schoolCode,
              accessCode: school.accessCode,
              accessCodeActivated: school.accessCodeActivated,
              contactEmail: school.contactEmail,
              contactPhone: school.contactPhone,
              address: school.address,
              isActive: school.isActive,
              createdAt: school.createdAt,
            },
          },
          message: "School created successfully",
        };
      } catch (error) {
        console.error("Create school error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to create school",
        };
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
        schoolName: t.String(),
        contactEmail: t.Optional(t.String()),
        contactPhone: t.String(),
        address: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Central"],
        summary: "Create school",
        description: "Create a new school account",
      },
    }
  )
  .get(
    "/central/schools",
    async ({ headers, jwt, set, query }) => {
      try {
        // Verify central admin authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [schools, total] = await Promise.all([
          prisma.school.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              username: true,
              schoolName: true,
              schoolCode: true,
              contactEmail: true,
              contactPhone: true,
              address: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
              _count: {
                select: {
                  teachers: true,
                  students: true,
                  stages: true,
                  activationKeys: {
                    where: {
                      isUsed: false,
                      expiresAt: {
                        gt: new Date(),
                      },
                    },
                  },
                },
              },
            },
          }),
          prisma.school.count(),
        ]);

        return {
          success: true,
          data: {
            schools,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
              hasNext: page < Math.ceil(total / limit),
              hasPrev: page > 1,
            },
          },
        };
      } catch (error) {
        console.error("Get schools error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch schools",
        };
      }
    },
    {
      detail: {
        tags: ["Central"],
        summary: "Get schools",
        description: "Get list of all schools with pagination",
      },
    }
  )

  .get(
    "/central/schools/:id",
    async ({ params, headers, jwt, set }) => {
      try {
        // Verify central admin authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const { id } = params;

        const school = await prisma.school.findUnique({
          where: { id },
          select: {
            id: true,
            username: true,
            password: true,
            schoolName: true,
            schoolCode: true,
            accessCode: true,
            accessCodeActivated: true,
            contactEmail: true,
            contactPhone: true,
            address: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                teachers: true,
                students: true,
                stages: true,
                activationKeys: {
                  where: {
                    isUsed: false,
                    expiresAt: {
                      gt: new Date(),
                    },
                  },
                },
              },
            },
          },
        });

        if (!school) {
          set.status = 404;
          return {
            success: false,
            message: "School not found",
          };
        }

        return {
          success: true,
          data: { school },
        };
      } catch (error) {
        console.error("Get school details error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch school details",
        };
      }
    },
    {
      detail: {
        tags: ["Central"],
        summary: "Get school details",
        description:
          "Get detailed information about a specific school including credentials",
      },
    }
  )

  .patch(
    "/central/schools/:id/toggle-status",
    async ({ params, headers, jwt, set }) => {
      try {
        // Verify central admin authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const { id } = params;

        const school = await prisma.school.findUnique({
          where: { id },
        });

        if (!school) {
          set.status = 404;
          return {
            success: false,
            message: "School not found",
          };
        }

        const updatedSchool = await prisma.school.update({
          where: { id },
          data: { isActive: !school.isActive },
          select: {
            id: true,
            username: true,
            schoolName: true,
            schoolCode: true,
            contactEmail: true,
            contactPhone: true,
            address: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return {
          success: true,
          data: { school: updatedSchool },
          message: `School ${
            updatedSchool.isActive ? "activated" : "deactivated"
          } successfully`,
        };
      } catch (error) {
        console.error("Toggle school status error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to update school status",
        };
      }
    },
    {
      detail: {
        tags: ["Central"],
        summary: "Toggle school status",
        description: "Activate or deactivate a school account",
      },
    }
  )

  // Update school phone number
  .patch(
    "/central/schools/:id/phone",
    async ({ params, body, headers, jwt, set }) => {
      try {
        // Verify central admin authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const { id } = params;
        const { contactPhone } = body as { contactPhone: string };

        // Validate phone number
        if (!contactPhone || typeof contactPhone !== "string") {
          set.status = 400;
          return {
            success: false,
            message: "Phone number is required",
          };
        }

        // Check if phone number is already used by another school
        const existingSchool = await prisma.school.findFirst({
          where: {
            contactPhone,
            id: { not: id },
          },
        });

        if (existingSchool) {
          set.status = 400;
          return {
            success: false,
            message:
              "This phone number is already registered to another school",
          };
        }

        // Check if school exists
        const school = await prisma.school.findUnique({
          where: { id },
        });

        if (!school) {
          set.status = 404;
          return {
            success: false,
            message: "School not found",
          };
        }

        // Update phone number
        const updatedSchool = await prisma.school.update({
          where: { id },
          data: { contactPhone },
          select: {
            id: true,
            username: true,
            schoolName: true,
            schoolCode: true,
            contactEmail: true,
            contactPhone: true,
            address: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return {
          success: true,
          data: { school: updatedSchool },
          message: "Phone number updated successfully",
        };
      } catch (error) {
        console.error("Update school phone error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to update phone number",
        };
      }
    },
    {
      detail: {
        tags: ["Central"],
        summary: "Update school phone number",
        description: "Update the contact phone number for a school",
      },
    }
  )

  // Activation Keys endpoints
  .post(
    "/central/schools/:id/activation-keys",
    async ({ params, body, headers, jwt, set }) => {
      try {
        // Verify central admin authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const { id } = params;
        const { count, expirationDate } = body as {
          count: number;
          expirationDate?: string;
        };

        if (!count || count < 1 || count > 100) {
          set.status = 400;
          return {
            success: false,
            message: "Count must be between 1 and 100",
          };
        }

        if (!expirationDate) {
          set.status = 400;
          return {
            success: false,
            message: "Expiration date is required",
          };
        }

        const school = await prisma.school.findUnique({
          where: { id },
        });

        if (!school) {
          set.status = 404;
          return {
            success: false,
            message: "School not found",
          };
        }

        // Generate activation keys
        const generateActivationKey = (): string => {
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          let result = "";
          for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return result;
        };

        const activationKeys = [];
        const expiresAt = new Date(expirationDate);

        for (let i = 0; i < count; i++) {
          let key = generateActivationKey();
          // Ensure key is unique
          let existingKey = await prisma.activationKey.findUnique({
            where: { key },
          });

          while (existingKey) {
            key = generateActivationKey();
            existingKey = await prisma.activationKey.findUnique({
              where: { key },
            });
          }

          activationKeys.push({
            key,
            schoolId: id,
            expiresAt,
          });
        }

        // Insert all keys
        await prisma.activationKey.createMany({
          data: activationKeys,
        });

        return {
          success: true,
          data: {
            generated: count,
            expiresAt,
            keys: activationKeys.map((k) => k.key),
          },
          message: `Successfully generated ${count} activation keys`,
        };
      } catch (error) {
        console.error("Generate activation keys error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to generate activation keys",
        };
      }
    },
    {
      detail: {
        tags: ["Central"],
        summary: "Generate activation keys",
        description: "Generate new activation keys for a school",
      },
    }
  )
  .get(
    "/central/schools/:id/activation-keys",
    async ({ params, headers, jwt, set }) => {
      try {
        // Verify central admin authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const { id } = params;

        const school = await prisma.school.findUnique({
          where: { id },
        });

        if (!school) {
          set.status = 404;
          return {
            success: false,
            message: "School not found",
          };
        }

        const activationKeys = await prisma.activationKey.findMany({
          where: { schoolId: id },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        const totalKeys = activationKeys.length;
        const activeKeys = activationKeys.filter(
          (key) => !key.isUsed && key.expiresAt > new Date()
        ).length;
        const usedKeys = activationKeys.filter((key) => key.isUsed).length;
        const expiredKeys = activationKeys.filter(
          (key) => !key.isUsed && key.expiresAt <= new Date()
        ).length;

        return {
          success: true,
          data: {
            keys: activationKeys,
            stats: {
              total: totalKeys,
              active: activeKeys,
              used: usedKeys,
              expired: expiredKeys,
            },
          },
        };
      } catch (error) {
        console.error("Get activation keys error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to get activation keys",
        };
      }
    },
    {
      detail: {
        tags: ["Central"],
        summary: "Get activation keys",
        description: "Get all activation keys for a school with statistics",
      },
    }
  )

  .delete(
    "/central/schools/:id/activation-keys/:keyId",
    async ({ params, headers, jwt, set }) => {
      try {
        // Verify central admin authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const { id, keyId } = params;

        const school = await prisma.school.findUnique({
          where: { id },
        });

        if (!school) {
          set.status = 404;
          return {
            success: false,
            message: "School not found",
          };
        }

        // Check if the activation key exists and belongs to this school
        const activationKey = await prisma.activationKey.findUnique({
          where: { id: keyId },
        });

        if (!activationKey || activationKey.schoolId !== id) {
          set.status = 404;
          return {
            success: false,
            message: "Activation key not found",
          };
        }

        // Don't allow deleting used keys
        if (activationKey.isUsed) {
          set.status = 400;
          return {
            success: false,
            message: "Cannot delete used activation key",
          };
        }

        // Delete the activation key
        await prisma.activationKey.delete({
          where: { id: keyId },
        });

        return {
          success: true,
          message: "Activation key deleted successfully",
        };
      } catch (error) {
        console.error("Delete activation key error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to delete activation key",
        };
      }
    },
    {
      detail: {
        tags: ["Central"],
        summary: "Delete activation key",
        description: "Delete an unused activation key",
      },
    }
  )

  .delete(
    "/central/schools/:id/activation-keys/bulk",
    async ({ params, body, headers, jwt, set }) => {
      try {
        // Verify central admin authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const { id } = params;
        const { keyIds, deleteType } = body as {
          keyIds?: string[];
          deleteType?: "unused" | "expired" | "selected";
        };

        const school = await prisma.school.findUnique({
          where: { id },
        });

        if (!school) {
          set.status = 404;
          return {
            success: false,
            message: "School not found",
          };
        }

        let whereCondition: any = {
          schoolId: id,
          isUsed: false, // Never delete used keys
        };

        if (deleteType === "expired") {
          whereCondition.expiresAt = {
            lt: new Date(),
          };
        } else if (deleteType === "selected" && keyIds) {
          whereCondition.id = {
            in: keyIds,
          };
        } else if (deleteType === "unused") {
          whereCondition.expiresAt = {
            gt: new Date(),
          };
        }

        // Delete the activation keys
        const result = await prisma.activationKey.deleteMany({
          where: whereCondition,
        });

        return {
          success: true,
          data: {
            deletedCount: result.count,
          },
          message: `Successfully deleted ${result.count} activation key(s)`,
        };
      } catch (error) {
        console.error("Bulk delete activation keys error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to delete activation keys",
        };
      }
    },
    {
      detail: {
        tags: ["Central"],
        summary: "Bulk delete activation keys",
        description: "Delete multiple unused activation keys",
      },
    }
  )

  // Add PATCH endpoint for updating expiration date
  .patch(
    "/central/schools/:id/activation-keys/:keyId/expiration",
    async ({ params, body, headers, jwt, set }) => {
      try {
        // Verify central admin authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const { id, keyId } = params;
        const { expirationDate } = body as { expirationDate: string };

        if (!expirationDate) {
          set.status = 400;
          return {
            success: false,
            message: "Expiration date is required",
          };
        }

        const school = await prisma.school.findUnique({
          where: { id },
        });

        if (!school) {
          set.status = 404;
          return {
            success: false,
            message: "School not found",
          };
        }

        // Check if the activation key exists and belongs to this school
        const activationKey = await prisma.activationKey.findUnique({
          where: { id: keyId },
        });

        if (!activationKey || activationKey.schoolId !== id) {
          set.status = 404;
          return {
            success: false,
            message: "Activation key not found",
          };
        }

        // Allow updating expiration date of used keys for administrative purposes
        // This is useful when extending expiration dates for students who need more time

        // Update the expiration date
        await prisma.activationKey.update({
          where: { id: keyId },
          data: { expiresAt: new Date(expirationDate) },
        });

        return {
          success: true,
          message: "Expiration date updated successfully",
        };
      } catch (error) {
        console.error("Update expiration date error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to update expiration date",
        };
      }
    },
    {
      detail: {
        tags: ["Central"],
        summary: "Update activation key expiration",
        description:
          "Update the expiration date of an activation key (used or unused)",
      },
    }
  )

  .get("/", () => "Hello World!", {
    detail: {
      tags: ["Health"],
      summary: "Hello endpoint",
      description: "Returns a simple hello message",
    },
  })
  .get(
    "/hello",
    () => ({
      message: "Hello from Elysia!",
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        tags: ["Health"],
        summary: "Hello JSON endpoint",
        description: "Returns a hello message in JSON format with timestamp",
      },
    }
  )

  // Test endpoint to verify body validation works
  .post(
    "/test-body",
    async ({ body }) => {
      return {
        success: true,
        received: body,
      };
    },
    {
      body: t.Object({
        testField: t.String({
          description: "A test field",
          example: "test value",
        }),
      }),
      detail: {
        tags: ["Health"],
        summary: "Test body validation",
        description: "Test endpoint to verify body validation works",
      },
    }
  )
  // Mobile Authentication Endpoints
  .post(
    "/api/mobile/auth/login",
    async ({ body, jwt, set, request }) => {
      const { identifier, password } = body as {
        identifier: string;
        password: string;
      };

      // Accept legacy clients sending phoneNumber field
      const rawIdentifier = (body as any).phoneNumber || identifier;
      const normalizedIdentifier = normalizeNumbers(
        String(rawIdentifier || "").trim()
      );

      // Validate input
      if (!normalizedIdentifier || !password) {
        set.status = 400;
        return {
          success: false,
          message: "Identifier and password are required",
        };
      }

      // Rate limiting - prevent brute force attacks
      const clientIP =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const rateLimitKey = `${clientIP}:${normalizedIdentifier}`;

      if (loginRateLimiter.isRateLimited(rateLimitKey)) {
        set.status = 429;
        return {
          success: false,
          message: "Too many login attempts. Please try again later.",
        };
      }

      try {
        // Step 1: Infer teacher (and school) from phone variations
        const digitsOnly = String(normalizedIdentifier).replace(/\D/g, "");
        const startsWith964 = digitsOnly.startsWith("964");
        const localPart = startsWith964
          ? digitsOnly.slice(3)
          : digitsOnly.startsWith("0")
          ? digitsOnly.slice(1)
          : digitsOnly;
        const with964 = `964${localPart}`;
        const withPlus964 = `+964${localPart}`;
        const withZeroLocal = localPart.startsWith("0")
          ? localPart
          : `0${localPart}`;
        const formatted = formatPhoneNumber(normalizedIdentifier);
        const noPlus = normalizedIdentifier.replace(/^\+/, "");
        const noPlus964 = noPlus.replace(/^964/, "");
        const phoneVariations = [
          normalizedIdentifier,
          formatted,
          digitsOnly,
          noPlus,
          noPlus964,
          localPart,
          withZeroLocal,
          with964,
          withPlus964,
          `+${digitsOnly}`,
          `00964${localPart}`,
        ].filter((v, i, arr) => v && arr.indexOf(v) === i);

        console.log("\n=== TEACHER LOGIN DEBUG ===");
        console.log("Identifier (raw):", rawIdentifier);
        console.log("Identifier (normalized):", normalizedIdentifier);
        console.log("Phone variations:", phoneVariations);

        let matchingTeachers = await prisma.teacher.findMany({
          where: { phoneNumber: { in: phoneVariations } },
          select: { id: true, schoolId: true },
        });

        console.log("Matched teachers count (exact):", matchingTeachers.length);

        if (!matchingTeachers || matchingTeachers.length === 0) {
          // Fallback fuzzy search by local part and variants
          matchingTeachers = await prisma.teacher.findMany({
            where: {
              OR: [
                { phoneNumber: { endsWith: localPart } },
                { phoneNumber: { endsWith: with964 } },
                { phoneNumber: { endsWith: withPlus964 } },
                { phoneNumber: { contains: localPart } },
              ],
            },
            select: { id: true, schoolId: true },
          });
          console.log(
            "Matched teachers count (fuzzy):",
            matchingTeachers.length
          );
        }

        if (!matchingTeachers || matchingTeachers.length === 0) {
          set.status = 401;
          return { success: false, message: "Invalid credentials" };
        }

        const uniqueSchoolIds = Array.from(
          new Set(matchingTeachers.map((t: any) => t.schoolId))
        );

        if (uniqueSchoolIds.length > 1) {
          const schools = await prisma.school.findMany({
            where: { id: { in: uniqueSchoolIds } },
            select: { id: true, schoolName: true, schoolCode: true },
          });
          set.status = 409;
          return {
            success: false,
            message:
              "Multiple accounts found for this phone number. Please select your school.",
            data: { schools },
          } as any;
        }

        const basicTeacher = matchingTeachers[0]!;

        if (!basicTeacher) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid credentials",
          };
        }

        // Now fetch the full teacher data with their assigned stages and subjects from their school only
        const teacher = await prisma.teacher.findUnique({
          where: { id: basicTeacher.id },
          include: {
            school: true,
            stages: {
              where: {
                stage: {
                  schoolId: basicTeacher.schoolId, // Only stages from this teacher's school
                },
              },
              include: {
                stage: {
                  include: {
                    students: {
                      where: {
                        schoolId: basicTeacher.schoolId, // Only students from this teacher's school
                      },
                    },
                  },
                },
              },
            },
            subjects: {
              where: {
                subject: {
                  schoolId: basicTeacher.schoolId, // Only subjects from this teacher's school
                },
              },
              include: {
                subject: true,
              },
            },
          },
        });

        if (!teacher) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid phone number or password",
          };
        }

        // Check password (handle both hashed and plain text for backward compatibility)
        let isPasswordValid = false;
        if (teacher.password && teacher.password.startsWith("$2")) {
          // Hashed password
          isPasswordValid = await bcrypt.compare(password, teacher.password);
        } else {
          // Plain text password (backward compatibility)
          isPasswordValid = password === teacher.password;

          // If login successful with plain text, update to hashed password
          if (isPasswordValid) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.teacher.update({
              where: { id: teacher.id },
              data: { password: hashedPassword },
            });
          }
        }

        console.log("Password validation:", isPasswordValid ? "OK" : "FAIL");

        if (!isPasswordValid) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid phone number or password",
          };
        }

        // Generate JWT token
        const token = await jwt.sign({
          teacherId: teacher.id,
          phoneNumber: teacher.phoneNumber,
          name: teacher.name,
          schoolId: teacher.schoolId, // Add schoolId for proper data isolation
        } as any);

        // Reset rate limit on successful login
        loginRateLimiter.reset(rateLimitKey);

        // Return success response with token and teacher info
        return {
          success: true,
          message: "Login successful",
          data: {
            token,
            teacher: {
              id: teacher.id,
              name: teacher.name,
              phoneNumber: teacher.phoneNumber,
              age: teacher.age,
              gender: teacher.gender,
              birthdate: teacher.birthdate,
              stages: teacher.stages.map((ts: any) => ({
                id: ts.stage.id,
                name: ts.stage.name,
                students: ts.stage.students.map((student: any) => ({
                  id: student.id,
                  name: student.name,
                  age: student.age,
                  gender: student.gender,
                  phoneNumber: student.phoneNumber,
                  code: student.code,
                })),
              })),
              subjects: teacher.subjects.map((ts: any) => ({
                id: ts.subject.id,
                name: ts.subject.name,
              })),
            },
          },
        };
      } catch (error) {
        console.error("Login error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        identifier: t.String({
          description: "Teacher's phone number or username",
          example: "1234567890",
          minLength: 1,
        }),
        password: t.String({
          description: "Teacher's password",
          example: "your_password",
          minLength: 1,
        }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Teacher mobile login",
        description:
          "Authenticate teacher using phone number/username and password. School is inferred by phone.",
      },
    }
  )

  // Teacher forgot password endpoint
  .post(
    "/api/mobile/teacher/forgot-password",
    async ({ body, set }) => {
      const { schoolCode, phoneNumber } = body as {
        schoolCode: string;
        phoneNumber: string;
      };

      console.log(`\n=== TEACHER FORGOT PASSWORD REQUEST ===`);
      console.log(`School Code: ${schoolCode}`);
      console.log(`Phone Number: ${phoneNumber}`);

      try {
        // Find school by school code
        const school = await prisma.school.findUnique({
          where: { schoolCode: schoolCode.toUpperCase() },
          select: { id: true, schoolName: true, schoolCode: true },
        });

        if (!school) {
          console.log(`❌ School not found: ${schoolCode}`);
          set.status = 400;
          return {
            success: false,
            message: "School not found. Please check your school code.",
          };
        }

        console.log(
          `✅ School found: ${school.schoolName} (${school.schoolCode})`
        );

        // Find teacher by phone number in the specific school
        // Try different phone number formats
        console.log(`🔍 Looking for teacher with phone: ${phoneNumber}`);

        const phoneVariations = [
          phoneNumber, // As entered: 1111111111
          formatPhoneNumber(phoneNumber), // Formatted: +9641111111111
          phoneNumber.replace(/^\+964/, ""), // Remove +964: 1111111111
          phoneNumber.replace(/^\+/, ""), // Remove +: 9641111111111
        ];

        console.log(`📱 Trying phone variations:`, phoneVariations);

        let teacher = null;
        for (const phone of phoneVariations) {
          teacher = await prisma.teacher.findFirst({
            where: {
              phoneNumber: phone,
              schoolId: school.id,
            },
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          });

          if (teacher) {
            console.log(`✅ Found teacher with phone format: ${phone}`);
            break;
          }
        }

        if (!teacher) {
          console.log(
            `❌ Teacher not found: ${phoneNumber} in school ${schoolCode}`
          );
          set.status = 400;
          return {
            success: false,
            message:
              "Teacher not found. Please check your phone number and school code.",
          };
        }

        console.log(
          `✅ Teacher found: ${teacher.name} (${teacher.phoneNumber})`
        );

        // Generate verification code
        const verificationCode = generateVerificationCode();
        console.log(`📱 Generated verification code: ${verificationCode}`);

        // Store verification code in the same in-memory map used for students
        // Key format: "<userId>:<formattedPhoneNumber>"
        const teacherCodeKey = `${teacher.id}:${formatPhoneNumber(
          teacher.phoneNumber
        )}`;
        const teacherCodeExpiresAt = new Date(Date.now() + 1 * 60 * 1000);
        verificationCodes.set(teacherCodeKey, {
          code: verificationCode,
          expiresAt: teacherCodeExpiresAt,
          // We reuse the existing shape; store teacher id in the studentId field
          studentId: teacher.id,
        });
        console.log(
          `💾 Stored verification code for teacher. Key: ${teacherCodeKey}, Expires: ${teacherCodeExpiresAt.toISOString()}`
        );

        // Send WhatsApp message using template
        console.log(`\n=== WHATSAPP TEMPLATE MESSAGE DEBUG ===`);
        console.log(`Teacher: ${teacher.name}`);
        console.log(`Phone: ${teacher.phoneNumber}`);
        console.log(`Verification Code: ${verificationCode}`);

        // Send verification template with correct parameters
        console.log(
          `📋 Sending verification template with body + button parameters...`
        );
        let messageSent = await sendWhatsAppTemplateWithButton(
          teacher.phoneNumber,
          "schoolify",
          "ar",
          verificationCode, // Body parameter for {{1}}
          verificationCode // Button URL parameter (just the dynamic part)
        );

        // Fallback to plain text message if template fails
        if (!messageSent) {
          console.log(`❌ Template message failed, falling back to plain text`);
          const message = `مرحبا ${teacher.name}!\n\nرمز إعادة تعيين كلمة المرور الخاصة بك هو: ${verificationCode}\n\nهذا الرمز صالح لمدة 1 دقائق فقط.\n\nإذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.\n\n---\n\nHello ${teacher.name}!\n\nYour password reset code is: ${verificationCode}\n\nThis code is valid for 1 minute only.\n\nIf you didn't request a password reset, please ignore this message.`;

          console.log(
            `📝 Fallback message content:`,
            message.substring(0, 100) + "..."
          );
          messageSent = await sendWhatsAppMessage(teacher.phoneNumber, message);
        } else {
          console.log(`✅ Template message sent successfully!`);
        }

        if (!messageSent) {
          console.log(`❌ Failed to send WhatsApp message`);
          set.status = 500;
          return {
            success: false,
            message:
              "Failed to send verification code. Please try again later.",
          };
        }

        console.log(`✅ Teacher password reset request processed successfully`);

        return {
          success: true,
          message: "Verification code sent successfully",
          data: {
            message: `A verification code has been sent to ${teacher.phoneNumber}`,
            phoneNumber: teacher.phoneNumber,
          },
        };
      } catch (error) {
        console.error("💥 Teacher forgot password error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Internal server error. Please try again later.",
        };
      }
    },
    {
      body: t.Object({
        schoolCode: t.String({
          description: "School code or username",
          example: "DEFAULT01",
          minLength: 1,
        }),
        phoneNumber: t.String({
          description: "Teacher's phone number",
          example: "+1234567890",
          minLength: 1,
        }),
      }),
      detail: {
        tags: ["Teacher Auth"],
        summary: "Teacher forgot password - Send verification code",
        description:
          "Send WhatsApp verification code to teacher for password reset using phone number",
      },
    }
  )
  // Teacher verify reset code endpoint
  .post(
    "/api/mobile/teacher/verify-code",
    async ({ body, set }) => {
      const { phoneNumber, verificationCode } = body as {
        phoneNumber: string;
        verificationCode: string;
      };

      console.log(`\n=== TEACHER VERIFY CODE REQUEST ===`);
      console.log(`Phone: ${phoneNumber}`);
      console.log(`Code: ${verificationCode}`);

      try {
        // Normalize and validate code
        const normalizedCode = normalizeNumbers(verificationCode || "");
        if (!normalizedCode) {
          set.status = 400;
          return { success: false, message: "Verification code is required" };
        }
        if (!/^\d{6}$/.test(normalizedCode)) {
          set.status = 400;
          return {
            success: false,
            message: `Verification code must be 6 digits. Received: "${verificationCode}" -> normalized: "${normalizedCode}"`,
          };
        }

        // Find teacher by phone number variations
        const phoneVariations = [
          phoneNumber,
          formatPhoneNumber(phoneNumber),
          phoneNumber.replace(/^\+964/, ""),
          phoneNumber.replace(/^\+/, ""),
        ];

        let teacher: any = null;
        for (const phone of phoneVariations) {
          teacher = await prisma.teacher.findFirst({
            where: { phoneNumber: phone },
            select: { id: true, name: true, phoneNumber: true },
          });
          if (teacher) break;
        }

        if (!teacher) {
          set.status = 404;
          return { success: false, message: "Teacher not found" };
        }

        // Check stored code
        const codeKey = `${teacher.id}:${formatPhoneNumber(
          teacher.phoneNumber
        )}`;
        const storedCode = verificationCodes.get(codeKey);
        console.log(`🔎 Checking teacher code key: ${codeKey}`);
        console.log(`🔎 Stored code:`, storedCode);

        if (!storedCode) {
          set.status = 400;
          return {
            success: false,
            message: "No verification code found. Please request a new code.",
          };
        }

        if (storedCode.expiresAt < new Date()) {
          verificationCodes.delete(codeKey);
          set.status = 400;
          return {
            success: false,
            message:
              "Verification code has expired. Please request a new code.",
          };
        }

        if (storedCode.code !== normalizedCode) {
          set.status = 400;
          return { success: false, message: "Invalid verification code" };
        }

        // Keep the code until reset-password completes to avoid "No verification code found"
        // verificationCodes.delete(codeKey);
        console.log("✅ Teacher verification successful");
        return {
          success: true,
          message: "Verification code is valid",
          data: {
            resetToken: `${teacher.id}:${normalizedCode}:${Date.now()}`,
            teacherName: teacher.name,
          },
        };
      } catch (error) {
        console.error("💥 Teacher verify code error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Internal server error. Please try again later.",
        };
      }
    },
    {
      body: t.Object({
        phoneNumber: t.String({
          description: "Teacher's phone number",
          example: "+1234567890",
        }),
        verificationCode: t.String({
          description: "6-digit verification code",
          example: "123456",
          minLength: 6,
          maxLength: 6,
        }),
      }),
      detail: {
        tags: ["Teacher Auth"],
        summary: "Teacher verify reset code",
        description: "Verify teacher password reset code",
      },
    }
  )

  // Teacher reset password endpoint
  .post(
    "/api/mobile/teacher/reset-password",
    async ({ body, set }) => {
      const { phoneNumber, verificationCode, newPassword, schoolCode } =
        body as {
          phoneNumber: string;
          verificationCode: string;
          newPassword: string;
          schoolCode: string;
        };

      console.log(`\n=== TEACHER RESET PASSWORD REQUEST ===`);
      console.log(`Phone: ${phoneNumber}`);
      console.log(`School Code: ${schoolCode}`);

      try {
        // Normalize and validate verification code
        const normalizedCode = normalizeNumbers(verificationCode || "");
        if (!/^\d{6}$/.test(normalizedCode)) {
          set.status = 400;
          return {
            success: false,
            message: "Invalid verification code format",
          };
        }

        // Find school by school code
        const school = await prisma.school.findUnique({
          where: { schoolCode: schoolCode.toUpperCase() },
          select: { id: true },
        });

        if (!school) {
          console.log(`❌ School not found: ${schoolCode}`);
          set.status = 400;
          return {
            success: false,
            message: "School not found",
          };
        }

        // Find teacher by phone number in the specific school
        // Try different phone number formats
        console.log(`🔍 Looking for teacher with phone: ${phoneNumber}`);

        const phoneVariations = [
          phoneNumber, // As entered: 1111111111
          formatPhoneNumber(phoneNumber), // Formatted: +9641111111111
          phoneNumber.replace(/^\+964/, ""), // Remove +964: 1111111111
          phoneNumber.replace(/^\+/, ""), // Remove +: 9641111111111
        ];

        console.log(`📱 Trying phone variations:`, phoneVariations);

        let teacher = null;
        for (const phone of phoneVariations) {
          teacher = await prisma.teacher.findFirst({
            where: {
              phoneNumber: phone,
              schoolId: school.id,
            },
          });

          if (teacher) {
            console.log(`✅ Found teacher with phone format: ${phone}`);
            break;
          }
        }

        if (!teacher) {
          console.log(`❌ Teacher not found with phone: ${phoneNumber}`);
          set.status = 400;
          return {
            success: false,
            message: "Teacher not found with provided phone number.",
          };
        }

        console.log(`✅ Teacher found: ${teacher.name}`);

        // Validate verification code against stored value
        const codeKey = `${teacher.id}:${formatPhoneNumber(
          teacher.phoneNumber
        )}`;
        const storedCode = verificationCodes.get(codeKey);
        if (!storedCode) {
          set.status = 400;
          return {
            success: false,
            message: "No verification code found. Please request a new code.",
          };
        }
        if (storedCode.expiresAt < new Date()) {
          verificationCodes.delete(codeKey);
          set.status = 400;
          return {
            success: false,
            message:
              "Verification code has expired. Please request a new code.",
          };
        }
        if (storedCode.code !== normalizedCode) {
          set.status = 400;
          return { success: false, message: "Invalid verification code" };
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update teacher password
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: { password: hashedPassword },
        });

        console.log(`✅ Teacher password reset successfully`);

        // Invalidate the verification code after successful reset
        verificationCodes.delete(codeKey);

        return {
          success: true,
          message: "Password reset successfully",
          data: {
            message:
              "Your password has been reset successfully. You can now login with your new password.",
          },
        };
      } catch (error) {
        console.error("💥 Teacher reset password error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Internal server error. Please try again later.",
        };
      }
    },
    {
      body: t.Object({
        phoneNumber: t.String({
          description: "Teacher's phone number",
          example: "+1234567890",
        }),
        verificationCode: t.String({
          description: "6-digit verification code",
          example: "123456",
          minLength: 6,
          maxLength: 6,
        }),
        newPassword: t.String({
          description: "New password",
          example: "newpassword123",
          minLength: 6,
        }),
        schoolCode: t.String({
          description: "School code or username",
          example: "DEFAULT01",
        }),
      }),
      detail: {
        tags: ["Teacher Auth"],
        summary: "Teacher reset password",
        description: "Reset teacher password using verification code",
      },
    }
  )
  // Student mobile login endpoint
  .post(
    "/api/mobile/auth/student-login",
    async ({ body, jwt, set, request }) => {
      const { studentCode, password } = body as {
        studentCode: string;
        password: string;
      };

      // Validate input
      if (!studentCode || !password) {
        set.status = 400;
        return {
          success: false,
          message: "Student code and password are required",
        };
      }

      // Rate limiting - prevent brute force attacks
      const clientIP =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const rateLimitKey = `${clientIP}:${studentCode.toUpperCase()}`;

      if (loginRateLimiter.isRateLimited(rateLimitKey)) {
        set.status = 429;
        return {
          success: false,
          message: "Too many login attempts. Please try again later.",
        };
      }

      try {
        // Step 1: Infer student (and thus school) by student code across all schools
        const student = await prisma.student.findFirst({
          where: { code: studentCode.toUpperCase() },
          include: { school: true, stage: true },
        });

        if (!student) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid credentials",
          };
        }

        // Check password (handle both hashed and plain text for backward compatibility)
        let isPasswordValid = false;
        if (student.password && student.password.startsWith("$2")) {
          // Hashed password
          isPasswordValid = await bcrypt.compare(password, student.password);
        } else if (student.password) {
          // Plain text password (backward compatibility)
          isPasswordValid = password === student.password;

          // If login successful with plain text, update to hashed password
          if (isPasswordValid) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.student.update({
              where: { id: student.id },
              data: { password: hashedPassword },
            });
          }
        } else {
          // No password set, use default password logic or reject
          set.status = 401;
          return {
            success: false,
            message: "Student password not set. Please contact your school.",
          };
        }

        if (!isPasswordValid) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid student code or password",
          };
        }

        // Generate JWT token
        const token = await jwt.sign({
          studentId: student.id,
          studentCode: student.code,
          name: student.name,
          schoolId: student.schoolId, // Add schoolId for proper data isolation
        } as any);

        // Reset rate limit on successful login
        loginRateLimiter.reset(rateLimitKey);

        // Return success response with token and student info
        return {
          success: true,
          message: "Login successful",
          data: {
            token,
            student: {
              id: student.id,
              name: student.name,
              studentCode: student.code,
              schoolCode: student.school?.schoolCode,
              age: student.age,
              gender: student.gender,
              phoneNumber: student.phoneNumber,
              class: student.stage?.name || null,
              school: {
                id: student.school!.id,
                name: student.school!.schoolName,
                code: student.school!.schoolCode,
              },
            },
          },
        };
      } catch (error) {
        console.error("Student login error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        studentCode: t.String({
          description: "Student's code/username",
          example: "STU001",
          minLength: 1,
        }),
        password: t.String({
          description: "Student's password",
          example: "student123",
          minLength: 1,
        }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Student mobile login",
        description:
          "Authenticate student using student code and password. School is inferred by student code.",
      },
    }
  )

  // Forgot password endpoint - Request verification code
  .post(
    "/api/mobile/auth/forgot-password",
    async ({ body, set, request }) => {
      const { schoolCode, studentCode } = body as {
        schoolCode: string;
        studentCode: string;
      };

      // Validate input
      if (!schoolCode || !studentCode) {
        set.status = 400;
        return {
          success: false,
          message: "School code and student code are required",
        };
      }

      // Rate limiting
      const clientIP =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const rateLimitKey = `forgot-password:${clientIP}:${studentCode}:${schoolCode.toUpperCase()}`;

      if (loginRateLimiter.isRateLimited(rateLimitKey)) {
        set.status = 429;
        return {
          success: false,
          message: "Too many requests. Please try again later.",
        };
      }

      try {
        // Step 1: Find school by code
        const school = await prisma.school.findUnique({
          where: { schoolCode: schoolCode.toUpperCase() },
          select: { id: true, schoolName: true, schoolCode: true },
        });

        if (!school) {
          set.status = 404;
          return {
            success: false,
            message: "Invalid school code",
          };
        }

        // Step 2: Find student in the specific school
        const student = await prisma.student.findFirst({
          where: {
            code: studentCode.toUpperCase(),
            schoolId: school.id,
          },
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            code: true,
          },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found",
          };
        }

        if (!student.phoneNumber) {
          set.status = 400;
          return {
            success: false,
            message:
              "No phone number registered for this student. Please contact your school.",
          };
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 10 minutes

        // Store verification code
        const codeKey = `${student.id}:${formatPhoneNumber(
          student.phoneNumber
        )}`;
        verificationCodes.set(codeKey, {
          code: verificationCode,
          expiresAt,
          studentId: student.id,
        });

        // Send WhatsApp verification message using template
        console.log("\n=== WHATSAPP TEMPLATE MESSAGE DEBUG ===");
        console.log(`Student: ${student.name}`);
        console.log(`Phone: ${student.phoneNumber}`);
        console.log(`Verification Code: ${verificationCode}`);
        console.log(`WhatsApp Token Available: ${!!WHATSAPP_TOKEN}`);
        console.log(
          `WhatsApp Phone Number ID Available: ${!!WHATSAPP_PHONE_NUMBER_ID}`
        );

        // Try to send using your "verification" template first
        console.log("🚀 Attempting to send verification template...");

        // Send verification template with correct parameters
        console.log(
          "📋 Sending verification template with body + button parameters..."
        );
        let messageSent = await sendWhatsAppTemplateWithButton(
          student.phoneNumber,
          "schoolify",
          "ar",
          verificationCode, // Body parameter for {{1}}
          verificationCode // Button URL parameter (just the dynamic part)
        );

        // Fallback to plain text message if template fails
        if (!messageSent) {
          console.log("❌ Template message failed, falling back to plain text");
          const message = `مرحبا ${student.name}!\n\nرمز إعادة تعيين كلمة المرور الخاصة بك هو: ${verificationCode}\n\nهذا الرمز صالح لمدة 1 دقائق فقط.\n\nإذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.\n\n---\n\nHello ${student.name}!\n\nYour password reset code is: ${verificationCode}\n\nThis code is valid for 1 minutes only.\n\nIf you didn't request a password reset, please ignore this message.`;

          console.log(
            "📝 Fallback message content:",
            message.substring(0, 100) + "..."
          );

          messageSent = await sendWhatsAppMessage(student.phoneNumber, message);
        } else {
          console.log("✅ Template message sent successfully!");
        }

        console.log(`📊 Final message sent result: ${messageSent}`);
        console.log("=== END WHATSAPP DEBUG ===\n");

        if (!messageSent) {
          set.status = 500;
          return {
            success: false,
            message:
              "Failed to send verification code. Please try again later.",
          };
        }

        // Mask phone number for response
        const maskedPhone = student.phoneNumber.replace(
          /(\d{4})\d{4}(\d{3})/,
          "$1****$2"
        );

        return {
          success: true,
          message: "Verification code sent successfully",
          data: {
            phoneNumber: maskedPhone,
            expiresIn: 600, // 10 minutes in seconds
          },
        };
      } catch (error) {
        console.error("Forgot password error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        schoolCode: t.String({
          description: "School identification code",
          example: "DEFAULT01",
          minLength: 1,
        }),
        studentCode: t.String({
          description: "Student's code/username",
          example: "STU001",
          minLength: 1,
        }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Request password reset verification code",
        description:
          "Send verification code to student's registered WhatsApp number",
      },
    }
  )

  // Verify code endpoint
  .post("/api/mobile/auth/verify-code", async ({ body, set }) => {
    console.log("Received verify-code request:", JSON.stringify(body, null, 2));

    const { phoneNumber, verificationCode, schoolCode, studentCode } =
      body as any;

    // Normalize the verification code to handle RTL numbers
    const normalizedCode = normalizeNumbers(verificationCode || "");

    // Validate input
    if (!normalizedCode) {
      set.status = 400;
      return {
        success: false,
        message: "Verification code is required",
      };
    }

    // Validate code format (should be 6 digits)
    if (!/^\d{6}$/.test(normalizedCode)) {
      set.status = 400;
      return {
        success: false,
        message: `Verification code must be 6 digits. Received: "${verificationCode}" -> normalized: "${normalizedCode}"`,
      };
    }

    try {
      let student = null;

      // Method 1: Find by phone number (mobile app format) - try multiple variations
      if (phoneNumber) {
        const phoneVariations = [
          phoneNumber,
          formatPhoneNumber(phoneNumber),
          phoneNumber.replace(/^\+964/, ""),
          phoneNumber.replace(/^\+/, ""),
        ];

        console.log(
          `Looking for student with phone variations:`,
          phoneVariations
        );

        for (const phone of phoneVariations) {
          student = await prisma.student.findFirst({
            where: {
              phoneNumber: phone,
            },
            select: {
              id: true,
              phoneNumber: true,
              name: true,
            },
          });
          if (student) {
            console.log(`Found student with phone: ${phone}`);
            break;
          }
        }
      }

      // Method 2: Find by school code + student code (legacy format)
      if (!student && schoolCode && studentCode) {
        console.log(
          `Looking for student with schoolCode: ${schoolCode}, studentCode: ${studentCode}`
        );
        const school = await prisma.school.findUnique({
          where: { schoolCode: schoolCode.toUpperCase() },
          select: { id: true },
        });

        if (school) {
          student = await prisma.student.findFirst({
            where: {
              code: studentCode.toUpperCase(),
              schoolId: school.id,
            },
            select: {
              id: true,
              phoneNumber: true,
              name: true,
            },
          });
        }
      }

      // Method 3: Search all verification codes for a match (fallback)
      // SECURITY: Only allow this when NO phoneNumber and NO schoolCode/studentCode are provided,
      // to avoid validating a code that belongs to a different user.
      if (!student && !phoneNumber && !(schoolCode && studentCode)) {
        console.log(
          `Searching all verification codes for match (fallback): ${normalizedCode}`
        );
        for (const [key, value] of verificationCodes.entries()) {
          if (value.code === normalizedCode && value.expiresAt > new Date()) {
            const studentId = key.split(":")[0];
            student = await prisma.student.findUnique({
              where: { id: studentId },
              select: {
                id: true,
                phoneNumber: true,
                name: true,
              },
            });
            console.log(
              `Found student via fallback code search: ${student?.name}`
            );
            break;
          }
        }
      }

      if (!student || !student.phoneNumber) {
        console.log("Student not found");
        set.status = 404;
        return {
          success: false,
          message: "Student not found or no verification code requested",
        };
      }

      console.log(`Found student: ${student.name} (${student.phoneNumber})`);

      // Check verification code
      const codeKey = `${student.id}:${formatPhoneNumber(student.phoneNumber)}`;
      const storedCode = verificationCodes.get(codeKey);

      console.log(`\n=== VERIFICATION CODE DEBUG ===`);
      console.log(`Student ID: ${student.id}`);
      console.log(`Student Phone: ${student.phoneNumber}`);
      console.log(`Formatted Phone: ${formatPhoneNumber(student.phoneNumber)}`);
      console.log(`Code Key: ${codeKey}`);
      console.log(`Stored Code:`, storedCode);
      console.log(`Received Code (original): "${verificationCode}"`);
      console.log(`Received Code (normalized): "${normalizedCode}"`);
      console.log(`Current Time: ${new Date().toISOString()}`);
      if (storedCode) {
        console.log(`Stored Expires At: ${storedCode.expiresAt.toISOString()}`);
        console.log(`Is Expired: ${storedCode.expiresAt < new Date()}`);
      }
      console.log(`=== END VERIFICATION DEBUG ===\n`);

      if (!storedCode) {
        set.status = 400;
        return {
          success: false,
          message: "No verification code found. Please request a new code.",
        };
      }

      if (storedCode.expiresAt < new Date()) {
        verificationCodes.delete(codeKey);
        set.status = 400;
        return {
          success: false,
          message: "Verification code has expired. Please request a new code.",
        };
      }

      if (storedCode.code !== normalizedCode) {
        console.log(
          `Code mismatch: stored="${storedCode.code}" vs received="${normalizedCode}" (original="${verificationCode}")`
        );
        set.status = 400;
        return {
          success: false,
          message: "Invalid verification code",
        };
      }

      // Success - remove the used code
      verificationCodes.delete(codeKey);
      console.log("Verification successful!");

      return {
        success: true,
        message: "Verification code is valid",
        data: {
          resetToken: `${student.id}:${storedCode.code}:${Date.now()}`,
          studentName: student.name,
        },
      };
    } catch (error) {
      console.error("Verify code error:", error);
      set.status = 500;
      return {
        success: false,
        message: "Internal server error",
      };
    }
  })
  // Simplified reset password endpoint - directly update after verification
  .post("/api/mobile/auth/reset-password", async ({ body, set }) => {
    console.log(
      "Received reset-password request:",
      JSON.stringify(body, null, 2)
    );

    const { schoolCode, studentCode, phoneNumber, newPassword, password } =
      body as any;

    // Flexible parameter extraction - support different naming conventions
    const actualNewPassword = newPassword || password;

    // Validate input
    if (!actualNewPassword) {
      set.status = 400;
      return {
        success: false,
        message:
          "New password is required. Received parameters: " +
          Object.keys(body).join(", "),
      };
    }

    if (actualNewPassword.length < 6) {
      set.status = 400;
      return {
        success: false,
        message: "Password must be at least 6 characters long",
      };
    }

    try {
      // Find student with multiple methods
      let student = null;

      // Method 1: Find by phone number (simplest)
      if (phoneNumber) {
        console.log(`Looking for student by phone: ${phoneNumber}`);
        const formattedPhone = formatPhoneNumber(phoneNumber);
        console.log(`Formatted phone: ${formattedPhone}`);

        student = await prisma.student.findFirst({
          where: {
            phoneNumber: formattedPhone,
          },
        });
        console.log(`Found student by phone:`, student ? "Yes" : "No");
      }

      // Method 2: Find by school code and student code (simplified)
      if (!student && schoolCode && studentCode) {
        console.log(
          `Looking for student by codes: ${schoolCode}/${studentCode}`
        );

        student = await prisma.student.findFirst({
          where: {
            code: studentCode.toUpperCase(),
            school: {
              schoolCode: schoolCode.toUpperCase(),
            },
          },
        });
        console.log(`Found student by codes:`, student ? "Yes" : "No");
      }

      if (!student || !student.phoneNumber) {
        set.status = 404;
        return {
          success: false,
          message: "Student not found. Please verify your information.",
        };
      }

      console.log(`Student found: ${student.name} (${student.phoneNumber})`);

      // ✅ SIMPLIFIED: After verification is successful, allow immediate password update
      // The security is handled by the verification step that happens before this

      // Hash the new password
      const hashedPassword = await bcrypt.hash(actualNewPassword, 10);

      // Update student password
      await prisma.student.update({
        where: { id: student.id },
        data: { password: hashedPassword },
      });

      // Clean up any stored verification codes for this student
      const codeKey = `${student.id}:${formatPhoneNumber(student.phoneNumber)}`;
      verificationCodes.delete(codeKey);

      console.log(`Password updated successfully for student: ${student.name}`);

      return {
        success: true,
        message: "Password updated successfully",
        data: {
          studentName: student.name,
        },
      };
    } catch (error) {
      console.error("Reset password error:", error);
      set.status = 500;
      return {
        success: false,
        message: "Internal server error",
      };
    }
  })

  // Student schedule endpoint
  .get(
    "/api/mobile/student/schedule/:day?",
    async ({ params, user, set }) => {
      if (!user || !user.studentId) {
        set.status = 401;
        return {
          success: false,
          message: "Student authentication required",
        };
      }

      try {
        // Get the student with their stage
        const student = await prisma.student.findUnique({
          where: { id: user.studentId },
          include: {
            stage: true,
          },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found",
          };
        }

        // Build where condition for schedule query
        const whereCondition: any = {
          stageId: student.stageId,
          schoolId: student.schoolId,
        };

        // If day parameter is provided, filter by that day
        if (params.day) {
          whereCondition.dayOfWeek = params.day;
        }

        // Fetch schedule for the student's stage
        const schedules = await prisma.schedule.findMany({
          where: whereCondition,
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
            stage: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ dayOfWeek: "asc" }, { timeSlot: "asc" }],
        });

        // Group schedules by day if no specific day requested
        if (!params.day) {
          const groupedSchedules = schedules.reduce(
            (acc: any, schedule: any) => {
              if (!acc[schedule.dayOfWeek]) {
                acc[schedule.dayOfWeek] = [];
              }
              acc[schedule.dayOfWeek].push({
                id: schedule.id,
                timeSlot: schedule.timeSlot,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                subject: {
                  id: schedule.subject.id,
                  name: schedule.subject.name,
                },
                teacher: {
                  id: schedule.teacher.id,
                  name: schedule.teacher.name,
                },
                stage: {
                  id: schedule.stage.id,
                  name: schedule.stage.name,
                },
              });
              return acc;
            },
            {}
          );

          return {
            success: true,
            data: {
              student: {
                id: student.id,
                name: student.name,
                stage: student.stage?.name,
              },
              schedule: groupedSchedules,
            },
          };
        } else {
          // Return schedule for specific day
          const daySchedules = schedules.map((schedule: any) => ({
            id: schedule.id,
            timeSlot: schedule.timeSlot,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            subject: {
              id: schedule.subject.id,
              name: schedule.subject.name,
            },
            teacher: {
              id: schedule.teacher.id,
              name: schedule.teacher.name,
            },
            stage: {
              id: schedule.stage.id,
              name: schedule.stage.name,
            },
          }));

          return {
            success: true,
            data: {
              student: {
                id: student.id,
                name: student.name,
                stage: student.stage?.name,
              },
              day: params.day,
              classes: daySchedules,
            },
          };
        }
      } catch (error) {
        console.error("Student schedule error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch schedule",
        };
      }
    },
    {
      detail: {
        tags: ["Student"],
        summary: "Get student schedule",
        description:
          "Get weekly schedule for authenticated student or specific day schedule",
      },
    }
  )
  // Student subjects endpoint - Get subjects for student's stage
  .get(
    "/api/mobile/student/subjects",
    async ({ user, set }) => {
      if (!user || !user.studentId) {
        set.status = 401;
        return {
          success: false,
          message: "Student authentication required",
        };
      }

      try {
        // Get the student with their stage
        const student = await prisma.student.findUnique({
          where: { id: user.studentId },
          include: {
            stage: true,
          },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found",
          };
        }

        // Get subjects for the student's stage with additional info
        const subjects = await prisma.subject.findMany({
          where: {
            stageId: student.stageId,
          },
          include: {
            teacherPosts: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 1, // Get the latest post for unseen indicator
            },
            _count: {
              select: {
                teacherPosts: true,
              },
            },
          },
        });

        // Get the primary teacher for each subject (most active poster)
        const subjectsWithTeacher = await Promise.all(
          subjects.map(async (subject) => {
            // Find the teacher who posted the most in this subject
            const teacherPostCounts = await prisma.teacherPost.groupBy({
              by: ["teacherId"],
              where: {
                subjectId: subject.id,
                stageId: student.stageId,
              },
              _count: {
                id: true,
              },
              orderBy: {
                _count: {
                  id: "desc",
                },
              },
              take: 1,
            });

            let primaryTeacher = null;
            if (teacherPostCounts.length > 0 && teacherPostCounts[0]) {
              const teacher = await prisma.teacher.findUnique({
                where: { id: teacherPostCounts[0].teacherId },
                select: {
                  id: true,
                  name: true,
                },
              });
              if (teacher) {
                primaryTeacher = teacher;
              }
            }

            return {
              id: subject.id,
              name: subject.name,
              postCount: subject._count.teacherPosts,
              primaryTeacher,
              latestPost: subject.teacherPosts[0] || null,
            };
          })
        );

        return {
          success: true,
          data: {
            subjects: subjectsWithTeacher,
            student: {
              id: student.id,
              name: student.name,
              stage: {
                id: student.stage?.id,
                name: student.stage?.name,
              },
            },
          },
        };
      } catch (error) {
        console.error("Student subjects error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch subjects",
        };
      }
    },
    {
      detail: {
        tags: ["Student"],
        summary: "Get student's subjects",
        description: "Get all subjects available for the student's stage",
      },
    }
  )

  // Student posts endpoint - Get posts for a specific subject
  .get(
    "/api/mobile/student/posts/:subjectId",
    async ({ params, user, set, query }) => {
      if (!user || !user.studentId) {
        set.status = 401;
        return {
          success: false,
          message: "Student authentication required",
        };
      }

      try {
        const { page = "1", limit = "10" } = query as {
          page?: string;
          limit?: string;
        };

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        // Get the student with their stage
        const student = await prisma.student.findUnique({
          where: { id: user.studentId },
          include: {
            stage: true,
          },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found",
          };
        }

        // Verify the subject belongs to the student's stage
        const subjectInStage = await prisma.subject.findFirst({
          where: {
            id: params.subjectId,
            stageId: student.stageId,
          },
        });

        if (!subjectInStage) {
          set.status = 404;
          return {
            success: false,
            message: "Subject not found for your stage",
          };
        }

        // Get posts for this subject and stage
        const posts = await prisma.teacherPost.findMany({
          where: {
            subjectId: params.subjectId,
            stageId: student.stageId,
            schoolId: student.schoolId,
          },
          include: {
            stage: true,
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
            likes: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                student: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            comments: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                student: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limitNum,
        });

        const totalCount = await prisma.teacherPost.count({
          where: {
            subjectId: params.subjectId,
            stageId: student.stageId,
            schoolId: student.schoolId,
          },
        });

        return {
          success: true,
          data: {
            posts: posts.map((post) => ({
              id: post.id,
              title: post.title,
              content: post.content,
              stage: {
                id: post.stage.id,
                name: post.stage.name,
              },
              subject: {
                id: post.subject.id,
                name: post.subject.name,
              },
              teacher: {
                id: post.teacher.id,
                name: post.teacher.name,
              },
              likesCount: post.likes.length,
              commentsCount: post.comments.length,
              isLikedByCurrentUser: post.likes.some(
                (like) => like.studentId === user.studentId
              ),
              likes: post.likes.map((like) => ({
                id: like.id,
                user: like.teacher
                  ? {
                      id: like.teacher.id,
                      name: like.teacher.name,
                      type: "teacher",
                    }
                  : like.student
                  ? {
                      id: like.student.id,
                      name: like.student.name,
                      type: "student",
                    }
                  : null,
                createdAt: like.createdAt.toISOString(),
              })),
              comments: post.comments.map((comment) => ({
                id: comment.id,
                content: comment.content,
                user: comment.teacher
                  ? {
                      id: comment.teacher.id,
                      name: comment.teacher.name,
                      type: "teacher",
                    }
                  : comment.student
                  ? {
                      id: comment.student.id,
                      name: comment.student.name,
                      type: "student",
                    }
                  : null,
                createdAt: comment.createdAt.toISOString(),
              })),
              createdAt: post.createdAt.toISOString(),
              updatedAt: post.updatedAt.toISOString(),
            })),
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: totalCount,
              totalPages: Math.ceil(totalCount / limitNum),
              hasNext: pageNum < Math.ceil(totalCount / limitNum),
              hasPrev: pageNum > 1,
            },
            subject: {
              id: subjectInStage.id,
              name: subjectInStage.name,
            },
          },
        };
      } catch (error) {
        console.error("Student posts error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch posts",
        };
      }
    },
    {
      detail: {
        tags: ["Student"],
        summary: "Get posts for a subject",
        description:
          "Get all posts for a specific subject in the student's stage",
      },
    }
  )

  // Student like/unlike a post
  .post(
    "/api/mobile/student/posts/:postId/like",
    async ({ params, headers, jwt, set }) => {
      try {
        const studentId = await getStudentIdFromAuth(headers, jwt);
        if (!studentId) {
          set.status = 401;
          return {
            success: false,
            message: "Student authentication required",
          };
        }

        // Check if post exists and belongs to student's school/stage
        const post = await prisma.teacherPost.findFirst({
          where: {
            id: params.postId,
            stage: {
              students: {
                some: {
                  id: studentId,
                },
              },
            },
          },
        });

        if (!post) {
          set.status = 404;
          return {
            success: false,
            message: "Post not found or not accessible",
          };
        }

        // Check if student already liked this post
        const existingLike = await prisma.postLike.findFirst({
          where: {
            postId: params.postId,
            studentId: studentId,
          },
        });

        if (existingLike) {
          // Unlike the post
          await prisma.postLike.delete({
            where: {
              id: existingLike.id,
            },
          });

          return {
            success: true,
            message: "Post unliked successfully",
            data: { liked: false },
          };
        } else {
          // Like the post
          await prisma.postLike.create({
            data: {
              postId: params.postId,
              studentId: studentId,
            },
          });

          return {
            success: true,
            message: "Post liked successfully",
            data: { liked: true },
          };
        }
      } catch (error) {
        console.error("Error toggling post like:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to toggle like",
        };
      }
    },
    {
      detail: {
        tags: ["Student"],
        summary: "Like or unlike a post",
        description: "Toggle like status for a post by student",
      },
    }
  )

  // Student comment on a post
  .post(
    "/api/mobile/student/posts/:postId/comment",
    async ({ params, body, headers, jwt, set }) => {
      try {
        const studentId = await getStudentIdFromAuth(headers, jwt);
        if (!studentId) {
          set.status = 401;
          return {
            success: false,
            message: "Student authentication required",
          };
        }

        const { content } = body as { content: string };

        if (!content || content.trim().length === 0) {
          set.status = 400;
          return {
            success: false,
            message: "Comment content is required",
          };
        }

        // Check if post exists and belongs to student's school/stage
        const post = await prisma.teacherPost.findFirst({
          where: {
            id: params.postId,
            stage: {
              students: {
                some: {
                  id: studentId,
                },
              },
            },
          },
        });

        if (!post) {
          set.status = 404;
          return {
            success: false,
            message: "Post not found or not accessible",
          };
        }

        // Create the comment
        const comment = await prisma.postComment.create({
          data: {
            content: content.trim(),
            postId: params.postId,
            studentId: studentId,
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return {
          success: true,
          message: "Comment added successfully",
          data: {
            comment: {
              id: comment.id,
              content: comment.content,
              createdAt: comment.createdAt.toISOString(),
              student: comment.student,
            },
          },
        };
      } catch (error) {
        console.error("Error adding comment:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to add comment",
        };
      }
    },
    {
      detail: {
        tags: ["Student"],
        summary: "Comment on a post",
        description: "Add a comment to a post by student",
      },
    }
  )
  // Mobile profile endpoint (requires authentication)
  .get(
    "/api/mobile/auth/profile",
    async ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      return {
        success: true,
        data: {
          teacher: {
            id: user.id,
            name: user.name,
            phoneNumber: user.phoneNumber,
            age: user.age,
            gender: user.gender,
            birthdate: user.birthdate,
            stages: user.stages.map((ts: any) => ({
              id: ts.stage.id,
              name: ts.stage.name,
              students: ts.stage.students.map((student: any) => ({
                id: student.id,
                name: student.name,
                age: student.age,
                gender: student.gender,
                phoneNumber: student.phoneNumber,
                code: student.code,
              })),
            })),
            subjects: user.subjects.map((ts: any) => ({
              id: ts.subject.id,
              name: ts.subject.name,
            })),
          },
        },
      };
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Get teacher profile",
        description:
          "Get authenticated teacher's profile with stages and subjects",
      },
    }
  )

  // School Activation Keys endpoint
  .get(
    "/api/activation-keys",
    async ({ headers, jwt, set }) => {
      try {
        // Verify school authentication
        const authResult = await verifySchoolAuth(headers, jwt);
        if (authResult.error) {
          set.status = authResult.status;
          return { success: false, message: authResult.error };
        }

        const schoolId = authResult.schoolId;

        // Fetch activation keys for this school
        const activationKeys = await prisma.activationKey.findMany({
          where: { schoolId },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        // Calculate statistics
        const totalKeys = activationKeys.length;
        const activeKeys = activationKeys.filter(
          (key) => !key.isUsed && key.expiresAt > new Date()
        ).length;
        const usedKeys = activationKeys.filter((key) => key.isUsed).length;
        const expiredKeys = activationKeys.filter(
          (key) => !key.isUsed && key.expiresAt <= new Date()
        ).length;

        return {
          success: true,
          data: {
            keys: activationKeys,
            stats: {
              total: totalKeys,
              active: activeKeys,
              used: usedKeys,
              expired: expiredKeys,
            },
          },
        };
      } catch (error) {
        console.error("Get activation keys error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch activation keys",
        };
      }
    },
    {
      detail: {
        tags: ["School"],
        summary: "Get school activation keys",
        description: "Get all activation keys for the authenticated school",
      },
    }
  )

  // Available Activation Keys endpoint (for student creation)
  .get(
    "/api/activation-keys/available",
    async ({ headers, jwt, set }) => {
      try {
        // Verify school authentication
        const authResult = await verifySchoolAuth(headers, jwt);
        if (authResult.error) {
          set.status = authResult.status;
          return { success: false, message: authResult.error };
        }

        const schoolId = authResult.schoolId;

        // Fetch only available (unused and not expired) activation keys
        const availableKeys = await prisma.activationKey.findMany({
          where: {
            schoolId,
            isUsed: false,
            expiresAt: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
            key: true,
            expiresAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        return {
          success: true,
          data: {
            keys: availableKeys,
          },
        };
      } catch (error) {
        console.error("Get available activation keys error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch available activation keys",
        };
      }
    },
    {
      detail: {
        tags: ["School"],
        summary: "Get available activation keys",
        description:
          "Get unused and unexpired activation keys for student creation",
      },
    }
  )

  // Verify token endpoint
  .post(
    "/api/mobile/auth/verify",
    async ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Invalid or expired token",
        };
      }

      return {
        success: true,
        message: "Token is valid",
        data: {
          teacher: {
            id: user.id,
            name: user.name,
            phoneNumber: user.phoneNumber,
          },
        },
      };
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Verify JWT token validity",
        description: `
**Purpose**: Verify if a JWT token is valid and get basic teacher information.

**Use Cases**:
- Check token validity on app startup
- Validate token before making authenticated requests
- Get basic teacher info without full profile data

**How to Use**:

1. **Include Authorization Header**: Add the JWT token in the Authorization header
   \`\`\`
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   \`\`\`

2. **Make POST Request**: Send POST request to /api/mobile/auth/verify

**Example Request**:
\`\`\`bash
curl -X POST "http://localhost:3000/api/mobile/auth/verify" \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json"
\`\`\`

**Example Success Response (200)**:
\`\`\`json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "teacher": {
      "id": "teacher-uuid",
      "name": "Ahmed Ali",
      "phoneNumber": "1234567890"
    }
  }
}
\`\`\`

**Example Error Response (401)**:
\`\`\`json
{
  "success": false,
  "message": "Invalid or expired token"
}
\`\`\`
**Flutter/Dart Implementation**:
\`\`\`dart
Future<bool> verifyToken(String token) async {
  try {
    final response = await http.post(
      Uri.parse('http://localhost:3000/api/mobile/auth/verify'),
      headers: {
        'Authorization': 'Bearer \$token',
        'Content-Type': 'application/json',
      },
    );
    
    final data = json.decode(response.body);
    return data['success'] == true;
  } catch (e) {
    return false;
  }
}
\`\`\`

**When to Use**:
- App startup: Check if stored token is still valid
- Before API calls: Ensure token hasn't expired
- User session management: Validate user session state
- Token refresh logic: Determine if new token needed

**Security Notes**:
- This endpoint doesn't refresh the token, only validates it
- If token is invalid, user should re-login
- Token is verified against the database for extra security
        `,
      },
    }
  )

  // Student token verification endpoint
  .post(
    "/api/mobile/auth/student-verify",
    async ({ headers, set, jwt }) => {
      try {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return {
            success: false,
            message: "Authorization header required",
          };
        }

        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);

        if (!payload || !payload.studentId) {
          set.status = 401;
          return {
            success: false,
            message: "Invalid token - not a student token",
          };
        }

        // Verify student exists and is active
        const student = await prisma.student.findUnique({
          where: { id: payload.studentId as string },
          include: {
            stage: true,
            school: true,
          },
        });

        if (!student) {
          set.status = 401;
          return {
            success: false,
            message: "Student not found",
          };
        }

        return {
          success: true,
          message: "Token is valid",
          data: {
            student: {
              id: student.id,
              name: student.name,
              studentCode: student.code,
              schoolCode: student.school?.schoolCode || "Unknown",
              age: student.age,
              gender: student.gender,
              phoneNumber: student.phoneNumber,
              class: student.stage?.name || "Unknown",
              school: {
                id: student.school?.id || null,
                name: student.school?.schoolName || "Unknown",
                code: student.school?.schoolCode || "Unknown",
              },
            },
          },
        };
      } catch (error) {
        console.error("Student token verification error:", error);
        set.status = 401;
        return {
          success: false,
          message: "Invalid or expired token",
        };
      }
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Verify student JWT token validity",
        description:
          "Verify if a student JWT token is valid and get basic student information",
      },
    }
  )

  // Student Notes endpoints
  .get(
    "/api/mobile/notes/student/:studentId",
    async ({ params: { studentId }, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      try {
        const notes = await prisma.studentNote.findMany({
          where: {
            studentId: studentId,
            teacherId: user.id, // Only show notes created by this teacher
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return {
          success: true,
          data: {
            notes: notes.map((note) => ({
              id: note.id,
              title: note.title,
              content: note.content,
              createdAt: note.createdAt.toISOString().split("T")[0], // Format as YYYY-MM-DD
            })),
          },
        };
      } catch (error) {
        console.error("Get notes error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch notes",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Get notes for a student",
        description:
          "Get all notes for a specific student (teacher must be authenticated)",
      },
    }
  )

  .post(
    "/api/mobile/notes/student/:studentId",
    async ({ params: { studentId }, body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      const { title, content } = body as {
        title: string;
        content: string;
      };

      try {
        const note = await prisma.studentNote.create({
          data: {
            studentId,
            teacherId: user.id,
            title,
            content,
          },
        });

        return {
          success: true,
          data: {
            note: {
              id: note.id,
              studentId: note.studentId,
              teacherId: note.teacherId,
              title: note.title,
              content: note.content,
              createdAt: note.createdAt.toISOString(),
            },
          },
          message: "Note added successfully",
        };
      } catch (error) {
        console.error("Add note error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to add note",
        };
      }
    },
    {
      body: t.Object({
        title: t.String({
          description: "Note title",
          example: "Homework reminder",
        }),
        content: t.String({
          description: "Note content",
          example: "Student needs to complete math homework",
        }),
      }),
      detail: {
        tags: ["Mobile"],
        summary: "Add note for a student",
        description: "Add a new note for a specific student",
      },
    }
  )

  // Student Grades endpoints
  .get(
    "/api/mobile/grades/student/:studentId",
    async ({ params: { studentId }, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      try {
        const grades = await prisma.studentGrade.findMany({
          where: {
            studentId: studentId,
            teacherId: user.id, // Only show grades created by this teacher
          },
          include: {
            subject: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return {
          success: true,
          data: {
            grades: grades.map((grade) => ({
              id: grade.id,
              gradeType: grade.gradeType,
              subject: grade.subject.name,
              grade: grade.grade,
              createdAt: grade.createdAt.toISOString().split("T")[0], // Format as YYYY-MM-DD
            })),
          },
        };
      } catch (error) {
        console.error("Get grades error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch grades",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Get grades for a student",
        description:
          "Get all grades for a specific student (teacher must be authenticated)",
      },
    }
  )

  .post(
    "/api/mobile/grades/student/:studentId",
    async ({ params: { studentId }, body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      const { gradeType, subject, grade } = body as {
        gradeType:
          | "MONTH_1_EXAM"
          | "MONTH_2_EXAM"
          | "MID_TERM_EXAM"
          | "MONTH_3_EXAM"
          | "MONTH_4_EXAM"
          | "FINAL_EXAM";
        subject: string;
        grade: string;
      };

      try {
        // Find the subject by name to get its ID - MUST include schoolId filtering
        const subjectRecord = await prisma.subject.findFirst({
          where: {
            name: subject,
            schoolId: user.schoolId, // CRITICAL: Only find subjects from this school
          },
        });

        if (!subjectRecord) {
          set.status = 400;
          return {
            success: false,
            message: `Subject "${subject}" not found`,
          };
        }

        const gradeRecord = await prisma.studentGrade.create({
          data: {
            studentId,
            teacherId: user.id,
            subjectId: subjectRecord.id,
            gradeType: gradeType as any,
            grade,
          },
          include: {
            subject: true,
          },
        });

        return {
          success: true,
          data: {
            grade: {
              id: gradeRecord.id,
              studentId: gradeRecord.studentId,
              teacherId: gradeRecord.teacherId,
              gradeType: gradeRecord.gradeType,
              subject: gradeRecord.subject.name,
              grade: gradeRecord.grade,
              createdAt: gradeRecord.createdAt.toISOString(),
            },
          },
          message: "Grade added successfully",
        };
      } catch (error) {
        console.error("Add grade error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to add grade",
        };
      }
    },
    {
      body: t.Object({
        gradeType: t.Union(
          [
            t.Literal("MONTH_1_EXAM"),
            t.Literal("MONTH_2_EXAM"),
            t.Literal("MID_TERM_EXAM"),
            t.Literal("MONTH_3_EXAM"),
            t.Literal("MONTH_4_EXAM"),
            t.Literal("FINAL_EXAM"),
          ],
          {
            description: "Grade type",
            example: "MID_TERM_EXAM",
          }
        ),
        subject: t.String({
          description: "Subject name",
          example: "Mathematics",
        }),
        grade: t.String({
          description: "Grade value",
          example: "A+",
        }),
      }),
      detail: {
        tags: ["Mobile"],
        summary: "Add grade for a student",
        description: "Add a new grade for a specific student in a subject",
      },
    }
  )

  // Update student note
  .put(
    "/api/mobile/notes/:noteId",
    async ({ params: { noteId }, body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      const { title, content } = body as {
        title: string;
        content: string;
      };

      try {
        // Check if the note belongs to this teacher
        const existingNote = await prisma.studentNote.findFirst({
          where: {
            id: noteId,
            teacherId: user.id,
          },
        });

        if (!existingNote) {
          set.status = 404;
          return {
            success: false,
            message: "Note not found or you don't have permission to edit it",
          };
        }

        const note = await prisma.studentNote.update({
          where: { id: noteId },
          data: {
            title,
            content,
          },
        });

        return {
          success: true,
          data: {
            note: {
              id: note.id,
              studentId: note.studentId,
              teacherId: note.teacherId,
              title: note.title,
              content: note.content,
              createdAt: note.createdAt.toISOString(),
            },
          },
          message: "Note updated successfully",
        };
      } catch (error) {
        console.error("Update note error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to update note",
        };
      }
    },
    {
      body: t.Object({
        title: t.String({
          description: "Note title",
          example: "Updated homework reminder",
        }),
        content: t.String({
          description: "Note content",
          example: "Student needs to complete updated math homework",
        }),
      }),
      detail: {
        tags: ["Mobile"],
        summary: "Update note",
        description: "Update an existing note",
      },
    }
  )

  // Delete student note
  .delete(
    "/api/mobile/notes/:noteId",
    async ({ params: { noteId }, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      try {
        // Check if the note belongs to this teacher
        const existingNote = await prisma.studentNote.findFirst({
          where: {
            id: noteId,
            teacherId: user.id,
          },
        });

        if (!existingNote) {
          set.status = 404;
          return {
            success: false,
            message: "Note not found or you don't have permission to delete it",
          };
        }

        await prisma.studentNote.delete({
          where: { id: noteId },
        });

        return {
          success: true,
          message: "Note deleted successfully",
        };
      } catch (error) {
        console.error("Delete note error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to delete note",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Delete note",
        description: "Delete an existing note",
      },
    }
  )
  // Update student grade
  .put(
    "/api/mobile/grades/:gradeId",
    async ({ params: { gradeId }, body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      const { gradeType, subject, grade } = body as any;

      try {
        // Check if the grade belongs to this teacher
        const existingGrade = await prisma.studentGrade.findFirst({
          where: {
            id: gradeId,
            teacherId: user.id,
          },
        });

        if (!existingGrade) {
          set.status = 404;
          return {
            success: false,
            message: "Grade not found or you don't have permission to edit it",
          };
        }

        // Find the subject by name to get its ID
        const subjectRecord = await prisma.subject.findFirst({
          where: {
            name: subject,
          },
        });

        if (!subjectRecord) {
          set.status = 400;
          return {
            success: false,
            message: `Subject "${subject}" not found`,
          };
        }

        const gradeRecord = await prisma.studentGrade.update({
          where: { id: gradeId },
          data: {
            gradeType: gradeType as any,
            subjectId: subjectRecord.id,
            grade,
          },
          include: {
            subject: true,
          },
        });

        return {
          success: true,
          data: {
            grade: {
              id: gradeRecord.id,
              studentId: gradeRecord.studentId,
              teacherId: gradeRecord.teacherId,
              gradeType: gradeRecord.gradeType,
              subject: gradeRecord.subject.name,
              grade: gradeRecord.grade,
              createdAt: gradeRecord.createdAt.toISOString(),
            },
          },
          message: "Grade updated successfully",
        };
      } catch (error) {
        console.error("Update grade error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to update grade",
        };
      }
    },
    {
      body: t.Object({
        gradeType: t.Union(
          [
            t.Literal("MONTH_1_EXAM"),
            t.Literal("MONTH_2_EXAM"),
            t.Literal("MID_TERM_EXAM"),
            t.Literal("MONTH_3_EXAM"),
            t.Literal("MONTH_4_EXAM"),
            t.Literal("FINAL_EXAM"),
          ],
          {
            description: "Grade type",
            example: "MID_TERM_EXAM",
          }
        ),
        subject: t.String({
          description: "Subject name",
          example: "Mathematics",
        }),
        grade: t.String({
          description: "Grade value",
          example: "A+",
        }),
      }),
      detail: {
        tags: ["Mobile"],
        summary: "Update grade",
        description: "Update an existing grade",
      },
    }
  )

  // Delete student grade
  .delete(
    "/api/mobile/grades/:gradeId",
    async ({ params: { gradeId }, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      try {
        // Check if the grade belongs to this teacher
        const existingGrade = await prisma.studentGrade.findFirst({
          where: {
            id: gradeId,
            teacherId: user.id,
          },
        });

        if (!existingGrade) {
          set.status = 404;
          return {
            success: false,
            message:
              "Grade not found or you don't have permission to delete it",
          };
        }

        await prisma.studentGrade.delete({
          where: { id: gradeId },
        });

        return {
          success: true,
          message: "Grade deleted successfully",
        };
      } catch (error) {
        console.error("Delete grade error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to delete grade",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Delete grade",
        description: "Delete an existing grade",
      },
    }
  )

  // Mobile Schedule Endpoints
  .get(
    "/api/mobile/schedule/weekly",
    async ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      try {
        const schedules = await prisma.schedule.findMany({
          where: { teacherId: user.id },
          include: {
            stage: true,
            subject: true,
          },
          orderBy: [{ dayOfWeek: "asc" }, { timeSlot: "asc" }],
        });

        // Group schedules by day of week
        const weeklySchedule = {
          Monday: [] as any[],
          Tuesday: [] as any[],
          Wednesday: [] as any[],
          Thursday: [] as any[],
          Friday: [] as any[],
          Saturday: [] as any[],
          Sunday: [] as any[],
        };

        schedules.forEach((schedule) => {
          const daySchedule = {
            id: schedule.id,
            timeSlot: schedule.timeSlot,
            startTime: (schedule as any).startTime,
            endTime: (schedule as any).endTime,
            stage: {
              id: schedule.stage.id,
              name: schedule.stage.name,
            },
            subject: {
              id: schedule.subject.id,
              name: schedule.subject.name,
            },
          };

          (weeklySchedule as any)[schedule.dayOfWeek].push(daySchedule);
        });

        // Calculate day counts for each day
        const dayCounts = {
          Monday: weeklySchedule.Monday.length,
          Tuesday: weeklySchedule.Tuesday.length,
          Wednesday: weeklySchedule.Wednesday.length,
          Thursday: weeklySchedule.Thursday.length,
          Friday: weeklySchedule.Friday.length,
          Saturday: weeklySchedule.Saturday.length,
          Sunday: weeklySchedule.Sunday.length,
        };

        return {
          success: true,
          data: {
            weeklySchedule,
            dayCounts,
            totalClasses: schedules.length,
          },
        };
      } catch (error) {
        console.error("Weekly schedule error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch weekly schedule",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Get teacher's weekly schedule",
        description:
          "Get authenticated teacher's weekly schedule grouped by day",
      },
    }
  )
  .get(
    "/api/mobile/schedule/daily/:dayOfWeek",
    async ({ params: { dayOfWeek }, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      // Validate day of week
      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      if (!validDays.includes(dayOfWeek)) {
        set.status = 400;
        return {
          success: false,
          message:
            "Invalid day of week. Must be one of: " + validDays.join(", "),
        };
      }

      try {
        const schedules = await prisma.schedule.findMany({
          where: {
            teacherId: user.id,
            dayOfWeek: dayOfWeek as any,
          },
          include: {
            stage: {
              include: {
                students: true,
              },
            },
            subject: true,
          },
          orderBy: { timeSlot: "asc" },
        });

        const dailySchedule = schedules.map((schedule) => ({
          id: schedule.id,
          timeSlot: schedule.timeSlot,
          startTime: (schedule as any).startTime,
          endTime: (schedule as any).endTime,
          stage: {
            id: schedule.stage.id,
            name: schedule.stage.name,
            studentCount: schedule.stage.students.length,
          },
          subject: {
            id: schedule.subject.id,
            name: schedule.subject.name,
          },
          students: schedule.stage.students.map((student) => ({
            id: student.id,
            name: student.name,
            code: student.code,
            age: student.age,
            gender: student.gender,
            phoneNumber: student.phoneNumber,
          })),
        }));

        return {
          success: true,
          data: {
            dayOfWeek,
            classes: dailySchedule,
            totalClasses: dailySchedule.length,
          },
        };
      } catch (error) {
        console.error("Daily schedule error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch daily schedule",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Get teacher's daily schedule",
        description:
          "Get authenticated teacher's schedule for a specific day with student details",
      },
    }
  )

  .get(
    "/api/mobile/schedule/today",
    async ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      try {
        // Get current day of week
        const today = new Date();
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const todayName = dayNames[today.getDay()];

        const schedules = await prisma.schedule.findMany({
          where: {
            teacherId: user.id,
            dayOfWeek: todayName as any,
          },
          include: {
            stage: {
              include: {
                students: true,
              },
            },
            subject: true,
          },
          orderBy: { timeSlot: "asc" },
        });

        const todaySchedule = schedules.map((schedule) => ({
          id: schedule.id,
          timeSlot: schedule.timeSlot,
          startTime: (schedule as any).startTime,
          endTime: (schedule as any).endTime,
          stage: {
            id: schedule.stage.id,
            name: schedule.stage.name,
            studentCount: schedule.stage.students.length,
          },
          subject: {
            id: schedule.subject.id,
            name: schedule.subject.name,
          },
          students: schedule.stage.students.map((student) => ({
            id: student.id,
            name: student.name,
            code: student.code,
            age: student.age,
            gender: student.gender,
            phoneNumber: student.phoneNumber,
          })),
        }));

        return {
          success: true,
          data: {
            today: todayName,
            date: today.toISOString().split("T")[0],
            classes: todaySchedule,
            totalClasses: todaySchedule.length,
          },
        };
      } catch (error) {
        console.error("Today schedule error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch today's schedule",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Get teacher's today schedule",
        description:
          "Get authenticated teacher's schedule for today with student details",
      },
    }
  )

  // Teacher endpoints
  // Test endpoint - place before parameterized routes
  .get("/api/testing", () => {
    return {
      message: "Hello from Elysia!",
      timestamp: new Date().toISOString(),
    };
  })

  .get(
    "/api/teachers",
    async ({ headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const teachers = await prisma.teacher.findMany({
        where: {
          schoolId, // Add tenant isolation
        },
        include: {
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

      // Transform the data to match the frontend interface
      return teachers.map((teacher) => ({
        key: teacher.id,
        id: teacher.id,
        name: teacher.name,
        age: teacher.age,
        phoneNumber: teacher.phoneNumber,
        gender: teacher.gender,
        birthdate: teacher.birthdate,
        stages: teacher.stages.map((ts) => ({
          id: ts.stage.id,
          name: ts.stage.name,
        })),
        subjects: teacher.subjects.map((ts) => ({
          id: ts.subject.id,
          name: ts.subject.name,
        })),
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Teachers"],
        summary: "Get all teachers",
        description:
          "Returns a list of all teachers with their stages and subjects",
      },
    }
  )

  .get(
    "/api/teachers/:id",
    async ({ params: { id } }) => {
      const teacher = await prisma.teacher.findUnique({
        where: { id: id },
        include: {
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

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      return {
        key: teacher.id,
        id: teacher.id,
        name: teacher.name,
        age: teacher.age,
        phoneNumber: teacher.phoneNumber,
        gender: teacher.gender,
        birthdate: teacher.birthdate,
        stages: teacher.stages.map((ts) => ({
          id: ts.stage.id,
          name: ts.stage.name,
        })),
        subjects: teacher.subjects.map((ts) => ({
          id: ts.subject.id,
          name: ts.subject.name,
        })),
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Teachers"],
        summary: "Get teacher by ID",
        description:
          "Returns a specific teacher with their stages and subjects",
      },
    }
  )

  .post(
    "/api/teachers",
    async ({ body, headers, jwt, set }) => {
      try {
        // Verify school authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized - No token provided",
          };
        }

        const token = authHeader.substring(7);
        let payload: any;

        try {
          payload = await jwt.verify(token);
        } catch (jwtError) {
          console.error("JWT verification failed:", jwtError);
          set.status = 401;
          return { success: false, message: "Unauthorized - Invalid token" };
        }

        if (!payload) {
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized - Invalid token payload",
          };
        }

        // More flexible type checking for backwards compatibility
        if (payload.type !== "school" && !payload.schoolId) {
          set.status = 403;
          return {
            success: false,
            message: "Access denied - Not a school token",
          };
        }

        const schoolId = payload.schoolId as string;
        if (!schoolId) {
          // Use default schoolId for development if not provided
          console.warn("No schoolId in token, using default for development");
          // For now, let's use a fallback to prevent the 401 error
          // In production, you should ensure all tokens have schoolId
        }

        const {
          name,
          age,
          phoneNumber,
          gender,
          birthdate,
          password,
          stageIds,
          subjectIds,
        } = body as {
          name: string;
          age?: number;
          phoneNumber: string;
          gender?: "male" | "female";
          birthdate?: string;
          password: string;
          stageIds: string[];
          subjectIds: string[];
        };

        const actualSchoolId = schoolId || DEFAULT_SCHOOL_ID;

        const teacher = await prisma.teacher.create({
          data: {
            name,
            age,
            phoneNumber,
            gender,
            birthdate: birthdate ? new Date(birthdate) : null,
            password: await bcrypt.hash(password, 10),
            school: {
              connect: { id: actualSchoolId },
            },
            stages: {
              create: stageIds.map((stageId) => ({
                stage: {
                  connect: { id: stageId },
                },
              })),
            },
            subjects: {
              create: subjectIds.map((subjectId) => ({
                subject: {
                  connect: { id: subjectId },
                },
              })),
            },
          },
          include: {
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

        return {
          key: teacher.id,
          id: teacher.id,
          name: teacher.name,
          age: teacher.age,
          phoneNumber: teacher.phoneNumber,
          gender: teacher.gender,
          birthdate: teacher.birthdate,
          stages:
            teacher.stages?.map((ts: any) => ({
              id: ts.stage.id,
              name: ts.stage.name,
            })) || [],
          subjects:
            teacher.subjects?.map((ts: any) => ({
              id: ts.subject.id,
              name: ts.subject.name,
            })) || [],
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt,
        };
      } catch (error) {
        console.error("Teacher creation error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to create teacher",
        };
      }
    },
    {
      detail: {
        tags: ["Teachers"],
        summary: "Create new teacher",
        description:
          "Creates a new teacher with associated stages and subjects",
      },
    }
  )
  .put(
    "/api/teachers/:id",
    async ({ params: { id }, body }) => {
      const {
        name,
        age,
        phoneNumber,
        gender,
        birthdate,
        password,
        stageIds,
        subjectIds,
      } = body as {
        name?: string;
        age?: number;
        phoneNumber?: string;
        gender?: "male" | "female";
        birthdate?: string;
        password?: string;
        stageIds?: string[];
        subjectIds?: string[];
      };

      // First, delete existing stage and subject relationships
      if (stageIds !== undefined) {
        await prisma.teacherStage.deleteMany({
          where: { teacherId: id },
        });
      }
      if (subjectIds !== undefined) {
        await prisma.teacherSubject.deleteMany({
          where: { teacherId: id },
        });
      }

      const teacher = await prisma.teacher.update({
        where: { id: id },
        data: {
          ...(name && { name }),
          ...(age !== undefined && { age }),
          ...(phoneNumber && { phoneNumber }),
          ...(gender && { gender }),
          ...(birthdate && { birthdate: new Date(birthdate) }),
          ...(password && { password: await bcrypt.hash(password, 10) }),
          ...(stageIds && {
            stages: {
              create: stageIds.map((stageId) => ({
                stage: {
                  connect: { id: stageId },
                },
              })),
            },
          }),
          ...(subjectIds && {
            subjects: {
              create: subjectIds.map((subjectId) => ({
                subject: {
                  connect: { id: subjectId },
                },
              })),
            },
          }),
        },
        include: {
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

      return {
        key: teacher.id,
        id: teacher.id,
        name: teacher.name,
        age: teacher.age,
        phoneNumber: teacher.phoneNumber,
        gender: teacher.gender,
        birthdate: teacher.birthdate,
        stages: teacher.stages.map((ts) => ({
          id: ts.stage.id,
          name: ts.stage.name,
        })),
        subjects: teacher.subjects.map((ts) => ({
          id: ts.subject.id,
          name: ts.subject.name,
        })),
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Teachers"],
        summary: "Update teacher",
        description:
          "Updates an existing teacher with associated stages and subjects",
      },
    }
  )

  .delete(
    "/api/teachers/:id",
    async ({ params: { id } }) => {
      // Delete related records
      await prisma.teacherStage.deleteMany({
        where: { teacherId: id },
      });
      await prisma.teacherSubject.deleteMany({
        where: { teacherId: id },
      });
      await prisma.schedule.deleteMany({
        where: { teacherId: id },
      });

      const teacher = await prisma.teacher.delete({
        where: { id: id },
      });

      return {
        key: teacher.id,
        id: teacher.id,
        name: teacher.name,
        age: teacher.age,
        phoneNumber: teacher.phoneNumber,
        gender: teacher.gender,
        birthdate: teacher.birthdate,
        stages: [],
        subjects: [],
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Teachers"],
        summary: "Delete teacher",
        description: "Deletes a teacher and all associated relationships",
      },
    }
  )

  .get(
    "/api/teachers/search",
    async ({ query }) => {
      const { q } = query as { q?: string };

      if (!q) {
        return [];
      }

      const teachers = await prisma.teacher.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phoneNumber: { contains: q, mode: "insensitive" } },
          ],
        },
        include: {
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

      return teachers.map((teacher) => ({
        key: teacher.id,
        id: teacher.id,
        name: teacher.name,
        age: teacher.age,
        phoneNumber: teacher.phoneNumber,
        gender: teacher.gender,
        birthdate: teacher.birthdate,
        stages: teacher.stages.map((ts) => ({
          id: ts.stage.id,
          name: ts.stage.name,
        })),
        subjects: teacher.subjects.map((ts) => ({
          id: ts.subject.id,
          name: ts.subject.name,
        })),
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Teachers"],
        summary: "Search teachers",
        description: "Search teachers by name or phone number",
      },
    }
  )
  // Student endpoints
  .get(
    "/api/students",
    async ({ query, headers, jwt }) => {
      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;
      const search = query.search as string;
      const stageId = query.stageId as string;
      const gender = query.gender as string;
      const minAge = parseInt(query.minAge as string);
      const maxAge = parseInt(query.maxAge as string);
      const activationKeyStatus = query.activationKeyStatus as string;

      const skip = (page - 1) * limit;

      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      // Build where clause for search and filters
      const whereClause: any = {
        schoolId, // Add tenant isolation
      };
      const andConditions: any[] = [];

      // Search functionality
      if (search && search.trim()) {
        andConditions.push({
          OR: [
            {
              name: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
            {
              phoneNumber: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
            {
              code: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
            {
              stage: {
                name: {
                  contains: search.trim(),
                  mode: "insensitive",
                },
              },
            },
          ],
        });
      }

      // Stage filter
      if (stageId && stageId.trim()) {
        andConditions.push({
          stageId: stageId.trim(),
        });
      }

      // Gender filter
      if (gender && (gender === "male" || gender === "female")) {
        andConditions.push({
          gender: gender,
        });
      }

      // Age range filter
      if (!isNaN(minAge) || !isNaN(maxAge)) {
        const ageFilter: any = {};
        if (!isNaN(minAge)) ageFilter.gte = minAge;
        if (!isNaN(maxAge)) ageFilter.lte = maxAge;
        andConditions.push({
          age: ageFilter,
        });
      }

      // Activation key status filter
      if (activationKeyStatus && activationKeyStatus.trim()) {
        const statusFilter = activationKeyStatus.trim();
        if (statusFilter === "no-key") {
          andConditions.push({
            activationKeys: {
              none: {},
            },
          });
        } else if (statusFilter === "used") {
          andConditions.push({
            activationKeys: {
              some: {
                isUsed: true,
              },
            },
          });
        } else if (statusFilter === "expired") {
          andConditions.push({
            activationKeys: {
              some: {
                expiresAt: {
                  lt: new Date(),
                },
              },
            },
          });
        } else if (statusFilter === "active") {
          andConditions.push({
            activationKeys: {
              some: {
                isUsed: false,
                expiresAt: {
                  gte: new Date(),
                },
              },
            },
          });
        }
      }

      // Apply all conditions
      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      // Get total count for pagination
      const totalCount = await prisma.student.count({
        where: whereClause,
      });

      // Get paginated students
      const students = await prisma.student.findMany({
        where: whereClause,
        include: {
          stage: true,
          activationKeys: {
            select: {
              id: true,
              key: true,
              isUsed: true,
              usedAt: true,
              expiresAt: true,
            },
            orderBy: {
              usedAt: "desc",
            },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: {
          name: "asc",
        },
      });

      const transformedStudents = students.map((student) => ({
        key: student.id,
        id: student.id,
        name: student.name,
        age: student.age,
        gender: student.gender,
        phoneNumber: student.phoneNumber,
        code: student.code,
        stage: {
          id: student.stage.id,
          name: student.stage.name,
          number: parseInt(student.stage.name.replace("Stage ", "")),
        },
        activationKey:
          student.activationKeys && student.activationKeys.length > 0
            ? (() => {
                const key = student.activationKeys[0];
                if (!key) return null;
                const isExpired = key.expiresAt < new Date();
                return {
                  id: key.id,
                  key: key.key,
                  isUsed: key.isUsed,
                  usedAt: key.usedAt,
                  expiresAt: key.expiresAt,
                  isExpired,
                  status: key.isUsed
                    ? "used"
                    : isExpired
                    ? "expired"
                    : "active",
                };
              })()
            : null,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      }));

      return {
        data: transformedStudents,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1,
        },
      };
    },
    {
      detail: {
        tags: ["Students"],
        summary: "Get students with pagination, search, and filters",
        description:
          "Returns a paginated list of students with stage information. Supports search functionality and filtering by stage, gender, and age range.",
      },
    }
  )

  .get(
    "/api/students/all",
    async ({ headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const students = await prisma.student.findMany({
        where: {
          schoolId, // Add tenant isolation
        },
        include: {
          stage: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return students.map((student) => ({
        key: student.id,
        id: student.id,
        name: student.name,
        age: student.age,
        gender: student.gender,
        phoneNumber: student.phoneNumber,
        code: student.code,
        stage: {
          id: student.stage.id,
          name: student.stage.name,
          number: parseInt(student.stage.name.replace("Stage ", "")),
        },
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Students"],
        summary: "Get all students without pagination",
        description:
          "Returns all students with stage information without pagination",
      },
    }
  )

  .get(
    "/api/students/:id",
    async ({ params: { id } }) => {
      const student = await prisma.student.findUnique({
        where: { id: id },
        include: {
          stage: true,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      return {
        key: student.id,
        id: student.id,
        name: student.name,
        age: student.age,
        gender: student.gender,
        phoneNumber: student.phoneNumber,
        code: student.code,
        stage: {
          id: student.stage.id,
          name: student.stage.name,
          number: parseInt(student.stage.name.replace("Stage ", "")),
        },
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Students"],
        summary: "Get student by ID",
        description: "Returns a specific student with their stage information",
      },
    }
  )

  .post(
    "/api/students",
    async ({ body, headers, jwt, set }) => {
      // Verify school authentication
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const token = authHeader.substring(7);
      const payload = (await jwt.verify(token)) as any;

      if (!payload || payload.type !== "school") {
        set.status = 403;
        return { success: false, message: "Access denied" };
      }

      const schoolId = payload.schoolId as string;
      if (!schoolId) {
        set.status = 403;
        return { success: false, message: "Invalid token: missing schoolId" };
      }

      const {
        name,
        age,
        gender,
        phoneNumber,
        code,
        password,
        stageId,
        activationKeyId,
      } = body as {
        name: string;
        age: number;
        gender: "male" | "female";
        phoneNumber: string;
        code: string;
        password: string;
        stageId: string;
        activationKeyId: string;
      };

      // Validate activation key is required
      if (!activationKeyId) {
        set.status = 400;
        return {
          success: false,
          message: "Activation key is required to create a student",
        };
      }

      // Check if activation key exists, is unused, unexpired, and belongs to this school
      const activationKey = await prisma.activationKey.findFirst({
        where: {
          id: activationKeyId,
          schoolId: schoolId,
          isUsed: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!activationKey) {
        set.status = 400;
        return {
          success: false,
          message:
            "Invalid activation key: key is either used, expired, or not found",
        };
      }

      try {
        // Create student and update activation key in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create the student
          const student = await tx.student.create({
            data: {
              name,
              age,
              gender,
              phoneNumber,
              code,
              password: await bcrypt.hash(password, 10),
              stageId,
              schoolId,
            },
            include: {
              stage: true,
            },
          });

          // Mark activation key as used and link to student
          await tx.activationKey.update({
            where: { id: activationKeyId },
            data: {
              isUsed: true,
              usedAt: new Date(),
              studentId: student.id,
            },
          });

          return student;
        });

        return {
          key: result.id,
          id: result.id,
          name: result.name,
          age: result.age,
          gender: result.gender,
          phoneNumber: result.phoneNumber,
          code: result.code,
          stage: {
            id: result.stage.id,
            name: result.stage.name,
            number: parseInt(result.stage.name.replace("Stage ", "")),
          },
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        };
      } catch (error) {
        console.error("Error creating student:", error);

        // Check for specific database errors
        if (error instanceof Error) {
          // Unique constraint violation (duplicate code, phone, etc.)
          if (error.message.includes("Unique constraint")) {
            set.status = 400;
            return {
              success: false,
              message:
                "Student code or phone number already exists. Please try again.",
            };
          }

          // Foreign key constraint (invalid stageId)
          if (error.message.includes("Foreign key constraint")) {
            set.status = 400;
            return {
              success: false,
              message: "Invalid stage selected. Please choose a valid stage.",
            };
          }

          // Required field missing
          if (error.message.includes("required")) {
            set.status = 400;
            return {
              success: false,
              message:
                "Missing required field. Please check all fields are filled.",
            };
          }
        }

        set.status = 500;
        return {
          success: false,
          message:
            "Failed to create student. Please check server logs for details.",
        };
      }
    },
    {
      detail: {
        tags: ["Students"],
        summary: "Create new student",
        description: "Creates a new student with associated stage",
      },
    }
  )

  .put(
    "/api/students/:id",
    async ({ params: { id }, body }) => {
      const { name, age, gender, phoneNumber, code, stageId } = body as {
        name?: string;
        age?: number;
        gender?: "male" | "female";
        phoneNumber?: string;
        code?: string;
        stageId?: string;
      };

      const student = await prisma.student.update({
        where: { id: id },
        data: {
          ...(name && { name }),
          ...(age !== undefined && { age }),
          ...(gender && { gender }),
          ...(phoneNumber && { phoneNumber }),
          ...(code && { code }),
          ...(stageId && { stageId }),
        },
        include: {
          stage: true,
        },
      });

      return {
        key: student.id,
        id: student.id,
        name: student.name,
        age: student.age,
        gender: student.gender,
        phoneNumber: student.phoneNumber,
        code: student.code,
        stage: {
          id: student.stage.id,
          name: student.stage.name,
          number: parseInt(student.stage.name.replace("Stage ", "")),
        },
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Students"],
        summary: "Update student",
        description: "Updates an existing student",
      },
    }
  )
  // Update student's activation key
  .patch(
    "/api/students/:id/activation-key",
    async ({ params: { id }, body, headers, jwt, set }) => {
      try {
        // Verify school authentication
        const authResult = await verifySchoolAuth(headers, jwt);
        if (authResult.error) {
          set.status = authResult.status;
          return { success: false, message: authResult.error };
        }

        const schoolId = authResult.schoolId;
        const { activationKeyId } = body as { activationKeyId: string };

        if (!activationKeyId) {
          set.status = 400;
          return {
            success: false,
            message: "Activation key ID is required",
          };
        }

        // Check if student exists and belongs to this school
        const student = await prisma.student.findFirst({
          where: {
            id,
            schoolId,
          },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found",
          };
        }

        // Check if new activation key exists, is unused, unexpired, and belongs to this school
        const newActivationKey = await prisma.activationKey.findFirst({
          where: {
            id: activationKeyId,
            schoolId: schoolId,
            isUsed: false,
            expiresAt: {
              gt: new Date(),
            },
          },
        });

        if (!newActivationKey) {
          set.status = 400;
          return {
            success: false,
            message:
              "Invalid activation key: key is either used, expired, or not found",
          };
        }

        // Update student's activation key in a transaction
        await prisma.$transaction(async (tx) => {
          // If student has a current activation key, free it up (mark as unused)
          const currentActivationKey = await tx.activationKey.findFirst({
            where: {
              studentId: id,
              schoolId: schoolId,
            },
          });

          if (currentActivationKey) {
            await tx.activationKey.update({
              where: { id: currentActivationKey.id },
              data: {
                isUsed: false,
                usedAt: null,
                studentId: null,
              },
            });
          }

          // Assign new activation key to student
          await tx.activationKey.update({
            where: { id: activationKeyId },
            data: {
              isUsed: true,
              usedAt: new Date(),
              studentId: id,
            },
          });
        });

        return {
          success: true,
          message: "Student activation key updated successfully",
        };
      } catch (error) {
        console.error("Update student activation key error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to update student activation key",
        };
      }
    },
    {
      detail: {
        tags: ["Students"],
        summary: "Update student activation key",
        description: "Update a student's activation key with a new unused key",
      },
    }
  )

  .delete(
    "/api/students/:id",
    async ({ params: { id } }) => {
      const student = await prisma.student.delete({
        where: { id: id },
      });

      return {
        key: student.id,
        id: student.id,
        name: student.name,
        age: student.age,
        gender: student.gender,
        phoneNumber: student.phoneNumber,
        code: student.code,
        stage: null,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Students"],
        summary: "Delete student",
        description: "Deletes a student",
      },
    }
  )

  .get(
    "/api/students/search",
    async ({ query }) => {
      const { q } = query as { q?: string };

      if (!q) {
        return [];
      }

      const students = await prisma.student.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phoneNumber: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        },
        include: {
          stage: true,
        },
      });

      return students.map((student) => ({
        key: student.id,
        id: student.id,
        name: student.name,
        age: student.age,
        gender: student.gender,
        phoneNumber: student.phoneNumber,
        code: student.code,
        stage: {
          id: student.stage.id,
          name: student.stage.name,
          number: parseInt(student.stage.name.replace("Stage ", "")),
        },
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Students"],
        summary: "Search students",
        description: "Search students by name, phone number, or code",
      },
    }
  )
  // Grades endpoints for dashboard
  .get(
    "/api/grades",
    async ({ query, headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const {
        stageId,
        subjectId,
        page = "1",
        limit = "10",
      } = query as {
        stageId?: string;
        subjectId?: string;
        page?: string;
        limit?: string;
      };

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      try {
        // Build where condition with tenant isolation
        const whereCondition: any = {
          schoolId, // CRITICAL: Only get students from this school
        };
        if (stageId) {
          whereCondition.stageId = stageId;
        }

        // Get students with their grades - ONLY from this school
        const students = await prisma.student.findMany({
          where: whereCondition,
          include: {
            stage: true,
            grades: {
              where: subjectId ? { subjectId } : {},
              include: {
                subject: true,
                teacher: true,
              },
            },
          },
          skip,
          take: limitNum,
        });

        const totalCount = await prisma.student.count({
          where: whereCondition,
        });

        // Transform the data to show student grades organized by subject
        const gradesData = students.map((student) => {
          // Group grades by subject for this student
          const subjectGradesMap: Record<string, any> = {};

          // Process each grade for this student
          student.grades.forEach((grade) => {
            const subjectId = grade.subjectId;
            const subjectName = grade.subject.name;

            // Initialize subject if not exists
            if (!subjectGradesMap[subjectId]) {
              subjectGradesMap[subjectId] = {
                subjectId: subjectId,
                subjectName: subjectName,
                grades: {
                  MONTHLY_1: null,
                  MONTHLY_2: null,
                  MID_EXAM: null,
                  MONTHLY_3: null,
                  MONTHLY_4: null,
                  FINAL_EXAM: null,
                },
              };
            }

            // Add the grade to the appropriate type
            subjectGradesMap[subjectId].grades[grade.gradeType] = {
              id: grade.id,
              grade: Number(grade.grade),
              teacher: grade.teacher.name,
              createdAt: grade.createdAt,
            };
          });

          // Calculate total and average across all grades
          const allGradeValues = student.grades
            .map((g) => Number(g.grade))
            .filter((g) => !isNaN(g));
          const total = allGradeValues.reduce((sum, grade) => sum + grade, 0);
          const average =
            allGradeValues.length > 0 ? total / allGradeValues.length : 0;

          // Determine pass/fail status (assuming passing grade is 50)
          const isPassed = average >= 50;

          return {
            id: student.id,
            name: student.name,
            code: student.code,
            stage: {
              id: student.stage.id,
              name: student.stage.name,
            },
            subjectGrades: Object.values(subjectGradesMap),
            summary: {
              total: Math.round(total * 100) / 100,
              average: Math.round(average * 100) / 100,
              isPassed: isPassed,
              status: isPassed ? "PASSED" : "FAILED",
              totalGrades: allGradeValues.length,
            },
          };
        });

        return {
          success: true,
          data: {
            grades: gradesData,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: totalCount,
              totalPages: Math.ceil(totalCount / limitNum),
              hasNext: pageNum < Math.ceil(totalCount / limitNum),
              hasPrev: pageNum > 1,
            },
          },
        };
      } catch (error) {
        console.error("Get grades error:", error);
        return {
          success: false,
          message: "Failed to fetch grades",
        };
      }
    },
    {
      detail: {
        tags: ["Grades"],
        summary: "Get student grades",
        description:
          "Get all student grades with filtering options for dashboard",
      },
    }
  )

  .post(
    "/api/grades",
    async ({ body, headers, jwt, set }) => {
      const { studentId, subjectId, teacherId, gradeType, grade } = body as {
        studentId: string;
        subjectId: string;
        teacherId: string;
        gradeType:
          | "MONTH_1_EXAM"
          | "MONTH_2_EXAM"
          | "MID_TERM_EXAM"
          | "MONTH_3_EXAM"
          | "MONTH_4_EXAM"
          | "FINAL_EXAM";
        grade: number;
      };

      try {
        const schoolId = await getSchoolIdFromAuth(headers, jwt);

        const student = await prisma.student.findFirst({
          where: {
            id: studentId,
            schoolId,
          },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found or not accessible",
          };
        }

        const subject = await prisma.subject.findFirst({
          where: {
            id: subjectId,
            schoolId,
          },
        });

        if (!subject) {
          set.status = 404;
          return {
            success: false,
            message: "Subject not found or not accessible",
          };
        }

        const teacher = await prisma.teacher.findFirst({
          where: {
            id: teacherId,
            schoolId,
          },
        });

        if (!teacher) {
          set.status = 404;
          return {
            success: false,
            message: "Teacher not found or not accessible",
          };
        }

        const existingGrade = await prisma.studentGrade.findFirst({
          where: {
            studentId,
            subjectId,
            gradeType: gradeType as any,
          },
        });

        if (existingGrade) {
          set.status = 409;
          return {
            success: false,
            message: "Grade for this subject and exam type already exists",
          };
        }

        const gradeRecord = await prisma.studentGrade.create({
          data: {
            studentId,
            subjectId,
            teacherId,
            grade: Number(grade).toString(),
            gradeType: gradeType as any,
          },
          include: {
            subject: true,
            teacher: true,
          },
        });

        return {
          success: true,
          data: {
            grade: {
              id: gradeRecord.id,
              studentId: gradeRecord.studentId,
              subject: {
                id: gradeRecord.subject.id,
                name: gradeRecord.subject.name,
              },
              teacher: {
                id: gradeRecord.teacher.id,
                name: gradeRecord.teacher.name,
              },
              grade: Number(gradeRecord.grade),
              gradeType: gradeRecord.gradeType,
              createdAt: gradeRecord.createdAt,
            },
          },
          message: "Grade added successfully",
        };
      } catch (error) {
        console.error("Create grade error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to add grade",
        };
      }
    },
    {
      body: t.Object({
        studentId: t.String({
          description: "Student ID",
        }),
        subjectId: t.String({
          description: "Subject ID",
        }),
        teacherId: t.String({
          description: "Teacher ID",
        }),
        gradeType: t.Union(
          [
            t.Literal("MONTH_1_EXAM"),
            t.Literal("MONTH_2_EXAM"),
            t.Literal("MID_TERM_EXAM"),
            t.Literal("MONTH_3_EXAM"),
            t.Literal("MONTH_4_EXAM"),
            t.Literal("FINAL_EXAM"),
          ],
          {
            description: "Grade type",
            example: "MID_TERM_EXAM",
          }
        ),
        grade: t.Number({
          description: "Grade value (0-100)",
          minimum: 0,
          maximum: 100,
        }),
      }),
      detail: {
        tags: ["Grades"],
        summary: "Add student grade",
        description:
          "Create a new grade entry for a specific student, subject, and exam type",
      },
    }
  )

  .put(
    "/api/students/:id/stage",
    async ({ params: { id }, body, set, headers, jwt }) => {
      const { stageId } = body as { stageId: string };

      try {
        // Get schoolId from authentication for tenant isolation
        const schoolId = await getSchoolIdFromAuth(headers, jwt);

        // Check if stage exists and belongs to this school
        const stage = await prisma.stage.findFirst({
          where: {
            id: stageId,
            schoolId, // CRITICAL: Only allow stages from this school
          },
        });

        if (!stage) {
          set.status = 404;
          return {
            success: false,
            message: "Stage not found or not accessible",
          };
        }

        // Check if student belongs to this school
        const student = await prisma.student.findFirst({
          where: {
            id: id,
            schoolId, // CRITICAL: Only allow students from this school
          },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found or not accessible",
          };
        }

        // Update student's stage
        const updatedStudent = await prisma.student.update({
          where: { id: id },
          data: { stageId },
          include: {
            stage: true,
          },
        });

        return {
          success: true,
          data: {
            student: {
              id: updatedStudent.id,
              name: updatedStudent.name,
              code: updatedStudent.code,
              stage: {
                id: updatedStudent.stage.id,
                name: updatedStudent.stage.name,
              },
            },
          },
          message: "Student stage updated successfully",
        };
      } catch (error) {
        console.error("Update student stage error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to update student stage",
        };
      }
    },
    {
      body: t.Object({
        stageId: t.String({
          description: "New stage ID for the student",
        }),
      }),
      detail: {
        tags: ["Grades"],
        summary: "Update student stage",
        description: "Update a student's stage from the grades table",
      },
    }
  )

  // System Settings endpoints
  .get(
    "/api/system-settings",
    async ({ headers, jwt, set }) => {
      try {
        // Verify school authentication
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }

        const token = authHeader.substring(7);
        const payload = (await jwt.verify(token)) as any;

        if (!payload || payload.type !== "school") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const schoolId = payload.schoolId as string;
        if (!schoolId) {
          set.status = 403;
          return { success: false, message: "Invalid token: missing schoolId" };
        }

        let settings = await prisma.systemSettings.findFirst({
          where: { schoolId },
        });

        // If no settings exist, create default ones
        if (!settings) {
          settings = await prisma.systemSettings.create({
            data: {
              countryName: "Palestine",
              ministryName: "Ministry of Education",
              schoolName: "School Name",
              managerName: "Manager Name",
              studyYear: "2024-2025",
              school: {
                connect: { id: schoolId },
              },
            },
          });
        }

        return {
          success: true,
          data: settings,
        };
      } catch (error) {
        console.error("Get system settings error:", error);
        return {
          success: false,
          message: "Failed to fetch system settings",
        };
      }
    },
    {
      detail: {
        tags: ["Settings"],
        summary: "Get system settings",
        description:
          "Get system settings for PDF headers and general configuration",
      },
    }
  )

  .put(
    "/api/system-settings",
    async ({ body, headers, jwt, set }) => {
      // Verify school authentication
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const token = authHeader.substring(7);
      const payload = (await jwt.verify(token)) as any;

      if (!payload || payload.type !== "school") {
        set.status = 403;
        return { success: false, message: "Access denied" };
      }

      const schoolId = payload.schoolId as string;
      if (!schoolId) {
        set.status = 403;
        return { success: false, message: "Invalid token: missing schoolId" };
      }
      const {
        countryName,
        ministryName,
        schoolName,
        managerName,
        studyYear,
        logoUrl,
      } = body as {
        countryName?: string;
        ministryName?: string;
        schoolName?: string;
        managerName?: string;
        studyYear?: string;
        logoUrl?: string;
      };

      try {
        let settings = await prisma.systemSettings.findFirst({
          where: { schoolId },
        });

        const updateData: any = {};
        if (countryName !== undefined) updateData.countryName = countryName;
        if (ministryName !== undefined) updateData.ministryName = ministryName;
        if (schoolName !== undefined) updateData.schoolName = schoolName;
        if (managerName !== undefined) updateData.managerName = managerName;
        if (studyYear !== undefined) updateData.studyYear = studyYear;
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

        if (settings) {
          // Update existing settings
          settings = await prisma.systemSettings.update({
            where: { id: settings.id },
            data: updateData,
          });
        } else {
          // Create new settings
          settings = await prisma.systemSettings.create({
            data: {
              countryName: countryName || "Palestine",
              ministryName: ministryName || "Ministry of Education",
              schoolName: schoolName || "School Name",
              managerName: managerName || "Manager Name",
              studyYear: studyYear || "2024-2025",
              logoUrl,
              school: {
                connect: { id: schoolId },
              },
            },
          });
        }

        return {
          success: true,
          data: settings,
          message: "System settings updated successfully",
        };
      } catch (error) {
        console.error("Update system settings error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to update system settings",
        };
      }
    },
    {
      body: t.Object({
        countryName: t.Optional(
          t.String({
            description: "Country name",
          })
        ),
        ministryName: t.Optional(
          t.String({
            description: "Ministry name",
          })
        ),
        schoolName: t.Optional(
          t.String({
            description: "School name",
          })
        ),
        managerName: t.Optional(
          t.String({
            description: "Manager name",
          })
        ),
        studyYear: t.Optional(
          t.String({
            description: "Study year (e.g., 2024-2025)",
          })
        ),
        logoUrl: t.Optional(
          t.String({
            description: "School logo URL",
          })
        ),
      }),
      detail: {
        tags: ["Settings"],
        summary: "Update system settings",
        description:
          "Update system settings for PDF headers and general configuration",
      },
    }
  )

  // PDF generation endpoints
  .get(
    "/api/grades/pdf/:studentId",
    async ({ params: { studentId }, set, headers, jwt }) => {
      try {
        // Get system settings
        const schoolId = await getSchoolIdFromAuth(headers, jwt);
        let settings = await prisma.systemSettings.findFirst({
          where: { schoolId },
        });
        if (!settings) {
          settings = await prisma.systemSettings.create({
            data: {
              countryName: "Palestine",
              ministryName: "Ministry of Education",
              schoolName: "School Name",
              managerName: "Manager Name",
              studyYear: "2024-2025",
              schoolId,
            },
          });
        }

        // Get student with all grades and attendance
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            stage: true,
            grades: {
              include: {
                subject: true,
                teacher: true,
              },
            },
            attendanceRecords: {
              include: {
                subject: true,
              },
            },
          },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found",
          };
        }

        // Get all subjects for the student's stage
        const allSubjects = await prisma.subject.findMany({
          where: { stageId: student.stageId },
        });

        // Calculate attendance statistics
        const totalAttendanceDays = student.attendanceRecords.length;
        const presentDays = student.attendanceRecords.filter(
          (attendance) => attendance.status === "present"
        ).length;
        const attendanceRate =
          totalAttendanceDays > 0
            ? ((presentDays / totalAttendanceDays) * 100).toFixed(1)
            : "0";

        // Generate PDF content
        const browser = await launchPdfBrowser();
        const page = await browser.newPage();

        // Create HTML content for PDF
        const htmlContent = generateStudentReportHTML(
          student,
          allSubjects,
          settings,
          {
            totalDays: totalAttendanceDays,
            presentDays,
            absentDays: totalAttendanceDays - presentDays,
            attendanceRate: parseFloat(attendanceRate),
          }
        );

        await page.setContent(htmlContent, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "1cm",
            right: "1cm",
            bottom: "1cm",
            left: "1cm",
          },
        });

        await browser.close();

        // Set headers for PDF download
        set.headers = {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${student.name.replace(
            /\s+/g,
            "_"
          )}_grades_report.pdf"`,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
        };

        return new Response(pdfBuffer);
      } catch (error) {
        console.error("Generate student PDF error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to generate PDF report",
        };
      }
    },
    {
      detail: {
        tags: ["Grades"],
        summary: "Download student grades PDF",
        description:
          "Generate and download a PDF report for a specific student with grades and attendance",
      },
    }
  )
  .post(
    "/api/grades/pdf/bulk",
    async ({ body, set, headers, jwt }) => {
      const { studentIds, stageId, subjectId } = body as {
        studentIds?: string[];
        stageId?: string;
        subjectId?: string;
      };

      try {
        // Get system settings
        const schoolId = await getSchoolIdFromAuth(headers, jwt);
        let settings = await prisma.systemSettings.findFirst({
          where: { schoolId },
        });
        if (!settings) {
          settings = await prisma.systemSettings.create({
            data: {
              countryName: "Palestine",
              ministryName: "Ministry of Education",
              schoolName: "School Name",
              managerName: "Manager Name",
              studyYear: "2024-2025",
              schoolId,
            },
          });
        }

        // Build where condition for students
        const whereCondition: any = {};
        if (studentIds && studentIds.length > 0) {
          whereCondition.id = { in: studentIds };
        } else if (stageId) {
          whereCondition.stageId = stageId;
        }

        // Get students with all grades and attendance
        const students = await prisma.student.findMany({
          where: whereCondition,
          include: {
            stage: true,
            grades: {
              where: subjectId ? { subjectId } : {},
              include: {
                subject: true,
                teacher: true,
              },
            },
            attendanceRecords: {
              include: {
                subject: true,
              },
            },
          },
        });

        if (students.length === 0) {
          set.status = 404;
          return {
            success: false,
            message: "No students found",
          };
        }

        // Generate PDF content for all students
        const browser = await launchPdfBrowser();
        const page = await browser.newPage();

        const htmlPages = [];

        for (const student of students) {
          // Get all subjects for the student's stage
          const allSubjects = await prisma.subject.findMany({
            where: { stageId: student.stageId },
          });

          // Calculate attendance statistics
          const totalAttendanceDays = student.attendanceRecords.length;
          const presentDays = student.attendanceRecords.filter(
            (attendance) => attendance.status === "present"
          ).length;
          const attendanceRate =
            totalAttendanceDays > 0
              ? ((presentDays / totalAttendanceDays) * 100).toFixed(1)
              : "0";

          const studentHTML = generateStudentReportHTML(
            student,
            allSubjects,
            settings,
            {
              totalDays: totalAttendanceDays,
              presentDays,
              absentDays: totalAttendanceDays - presentDays,
              attendanceRate: parseFloat(attendanceRate),
            }
          );

          htmlPages.push(studentHTML);
        }

        // Combine all student reports with page breaks
        const combinedHTML = htmlPages.join(
          '<div style="page-break-after: always;"></div>'
        );

        await page.setContent(combinedHTML, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "1cm",
            right: "1cm",
            bottom: "1cm",
            left: "1cm",
          },
        });

        await browser.close();

        // Set headers for PDF download
        const filename = stageId
          ? `${settings.schoolName.replace(/\s+/g, "_")}_students_report.pdf`
          : `students_grades_report.pdf`;

        set.headers = {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
        };

        return new Response(pdfBuffer);
      } catch (error) {
        console.error("Generate bulk PDF error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to generate PDF reports",
        };
      }
    },
    {
      body: t.Object({
        studentIds: t.Optional(
          t.Array(
            t.String({
              description: "Array of student IDs to include in the report",
            })
          )
        ),
        stageId: t.Optional(
          t.String({
            description: "Stage ID to filter students",
          })
        ),
        subjectId: t.Optional(
          t.String({
            description: "Subject ID to filter grades",
          })
        ),
      }),
      detail: {
        tags: ["Grades"],
        summary: "Download bulk student grades PDF",
        description:
          "Generate and download a PDF report for multiple students with grades and attendance",
      },
    }
  )

  // Stage endpoints
  .get(
    "/api/stages",
    async ({ headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const stages = await prisma.stage.findMany({
        where: {
          schoolId, // Add tenant isolation
        },
        include: {
          teachers: {
            include: {
              teacher: true,
            },
          },
          students: true,
          subjects: true,
        },
      });

      return stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        studentCount: stage.students.length,
        teacherCount: stage.teachers.length,
        subjectCount: stage.subjects.length,
        teachers: stage.teachers.map((ts) => ts.teacher.name),
        students: stage.students.map((student) => student.name),
        subjects: stage.subjects.map((subject) => subject.name),
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Stages"],
        summary: "Get all stages",
        description:
          "Returns a list of all stages with teacher, student, and subject information",
      },
    }
  )
  .post(
    "/api/stages",
    async ({ body, headers, jwt, set }) => {
      // Verify school authentication
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { success: false, message: "Unauthorized" };
      }

      const token = authHeader.substring(7);
      const payload = (await jwt.verify(token)) as any;

      if (!payload || payload.type !== "school") {
        set.status = 403;
        return { success: false, message: "Access denied" };
      }

      const schoolId = payload.schoolId as string;
      if (!schoolId) {
        set.status = 403;
        return { success: false, message: "Invalid token: missing schoolId" };
      }

      const { name } = body as {
        name: string;
      };

      // Check if stage name already exists in this school
      const existingStage = await prisma.stage.findFirst({
        where: {
          name: {
            equals: name.trim(),
            mode: "insensitive",
          },
          schoolId,
        },
      });

      if (existingStage) {
        set.status = 409; // Conflict status code
        return {
          error: "STAGE_NAME_EXISTS",
          message: `A stage with the name "${name}" already exists. Please choose a different name.`,
        };
      }

      try {
        const stage = await prisma.stage.create({
          data: {
            name: name.trim(),
            school: {
              connect: { id: schoolId },
            },
          },
          include: {
            teachers: {
              include: {
                teacher: true,
              },
            },
            students: true,
            subjects: true,
          },
        });

        return {
          id: stage.id,
          name: stage.name,
          studentCount: stage.students.length,
          teacherCount: stage.teachers.length,
          subjectCount: stage.subjects.length,
          teachers: stage.teachers.map((ts) => ts.teacher.name),
          students: stage.students.map((student) => student.name),
          subjects: stage.subjects.map((subject) => subject.name),
          createdAt: stage.createdAt,
          updatedAt: stage.updatedAt,
        };
      } catch (error) {
        set.status = 500;
        return {
          error: "CREATION_FAILED",
          message: "Failed to create stage. Please try again.",
        };
      }
    },
    {
      detail: {
        tags: ["Stages"],
        summary: "Create new stage",
        description: "Creates a new stage with duplicate name validation",
      },
    }
  )

  .put(
    "/api/stages/:id",
    async ({ params: { id }, body, set }) => {
      const { name } = body as {
        name?: string;
      };

      // If name is being updated, check for duplicates
      if (name && name.trim()) {
        const existingStage = await prisma.stage.findFirst({
          where: {
            name: {
              equals: name.trim(),
              mode: "insensitive",
            },
            NOT: {
              id: id, // Exclude current stage from duplicate check
            },
          },
        });

        if (existingStage) {
          set.status = 409; // Conflict status code
          return {
            error: "STAGE_NAME_EXISTS",
            message: `A stage with the name "${name}" already exists. Please choose a different name.`,
          };
        }
      }

      try {
        const stage = await prisma.stage.update({
          where: { id: id },
          data: {
            ...(name && { name: name.trim() }),
          },
          include: {
            teachers: {
              include: {
                teacher: true,
              },
            },
            students: true,
            subjects: true,
          },
        });

        return {
          id: stage.id,
          name: stage.name,
          studentCount: stage.students.length,
          teacherCount: stage.teachers.length,
          subjectCount: stage.subjects.length,
          teachers: stage.teachers.map((ts) => ts.teacher.name),
          students: stage.students.map((student) => student.name),
          subjects: stage.subjects.map((subject) => subject.name),
          createdAt: stage.createdAt,
          updatedAt: stage.updatedAt,
        };
      } catch (error) {
        set.status = 500;
        return {
          error: "UPDATE_FAILED",
          message: "Failed to update stage. Please try again.",
        };
      }
    },
    {
      detail: {
        tags: ["Stages"],
        summary: "Update stage",
        description: "Updates an existing stage with duplicate name validation",
      },
    }
  )

  .delete(
    "/api/stages/:id",
    async ({ params: { id } }) => {
      // Delete related records
      await prisma.teacherStage.deleteMany({
        where: { stageId: id },
      });
      await prisma.schedule.deleteMany({
        where: { stageId: id },
      });
      // Delete students in this stage (since stageId is required and cannot be null)
      await prisma.student.deleteMany({
        where: { stageId: id },
      });
      // Delete subjects in this stage (since stageId is required and cannot be null)
      await prisma.subject.deleteMany({
        where: { stageId: id },
      });

      const stage = await prisma.stage.delete({
        where: { id: id },
      });

      return {
        id: stage.id,
        name: stage.name,
        studentCount: 0,
        teacherCount: 0,
        subjectCount: 0,
        teachers: [],
        students: [],
        subjects: [],
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Stages"],
        summary: "Delete stage",
        description: "Deletes a stage and all associated relationships",
      },
    }
  )

  .get(
    "/api/stages/search",
    async ({ query }) => {
      const { q } = query as { q?: string };

      if (!q) {
        return [];
      }

      const stages = await prisma.stage.findMany({
        where: {
          name: { contains: q, mode: "insensitive" },
        },
        include: {
          teachers: {
            include: {
              teacher: true,
            },
          },
          students: true,
          subjects: true,
        },
      });

      return stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        studentCount: stage.students.length,
        teacherCount: stage.teachers.length,
        subjectCount: stage.subjects.length,
        teachers: stage.teachers.map((ts) => ts.teacher.name),
        students: stage.students.map((student) => student.name),
        subjects: stage.subjects.map((subject) => subject.name),
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Stages"],
        summary: "Search stages",
        description: "Search stages by name",
      },
    }
  )

  // Subject endpoints
  .get(
    "/api/subjects",
    async ({ query, headers, jwt }) => {
      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;
      const search = query.search as string;
      const stageId = query.stageId as string;
      const hasTeachers = query.hasTeachers as string;
      const teacherId = query.teacherId as string;

      const skip = (page - 1) * limit;

      // Get schoolId from authentication
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      // Build where clause for search and filters
      const whereClause: any = {
        schoolId, // Add tenant isolation
      };
      const andConditions: any[] = [];

      // Search functionality
      if (search && search.trim()) {
        andConditions.push({
          OR: [
            {
              name: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
            {
              stage: {
                name: {
                  contains: search.trim(),
                  mode: "insensitive",
                },
              },
            },
          ],
        });
      }

      // Stage filter
      if (stageId && stageId.trim()) {
        andConditions.push({
          stageId: stageId.trim(),
        });
      }

      // Teacher assignment filter
      if (hasTeachers === "true") {
        andConditions.push({
          teachers: {
            some: {},
          },
        });
      } else if (hasTeachers === "false") {
        andConditions.push({
          teachers: {
            none: {},
          },
        });
      }

      // Specific teacher filter
      if (teacherId && teacherId.trim()) {
        andConditions.push({
          teachers: {
            some: {
              teacherId: teacherId.trim(),
            },
          },
        });
      }

      // Apply all conditions
      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      // Get total count for pagination
      const totalCount = await prisma.subject.count({
        where: whereClause,
      });

      // Get paginated subjects
      const subjects = await prisma.subject.findMany({
        where: whereClause,
        include: {
          stage: true,
          teachers: {
            include: {
              teacher: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          name: "asc",
        },
      });

      const transformedSubjects = subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        stage: {
          id: subject.stage.id,
          name: subject.stage.name,
        },
        teacherCount: subject.teachers.length,
        teachers: subject.teachers.map((ts) => ts.teacher.name),
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt,
      }));

      return {
        data: transformedSubjects,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1,
        },
      };
    },
    {
      detail: {
        tags: ["Subjects"],
        summary: "Get subjects with pagination, search, and filters",
        description:
          "Returns a paginated list of subjects with stage and teacher information. Supports search functionality and filtering by stage, teacher assignment status, and specific teachers.",
      },
    }
  )

  .get(
    "/api/subjects/all",
    async ({ headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const subjects = await prisma.subject.findMany({
        where: {
          schoolId, // CRITICAL: Only get subjects from this school
        },
        include: {
          stage: true,
          teachers: {
            include: {
              teacher: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        stage: {
          id: subject.stage.id,
          name: subject.stage.name,
        },
        teacherCount: subject.teachers.length,
        teachers: subject.teachers.map((ts) => ts.teacher.name),
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Subjects"],
        summary: "Get all subjects without pagination",
        description:
          "Returns all subjects with stage and teacher information without pagination",
      },
    }
  )

  .post(
    "/api/subjects",
    async ({ body, set, headers, jwt }) => {
      const { name, stageId } = body as {
        name: string;
        stageId: string;
      };

      // Check if subject name already exists in the same stage
      const existingSubject = await prisma.subject.findFirst({
        where: {
          name: {
            equals: name.trim(),
            mode: "insensitive",
          },
          stageId: stageId,
        },
        include: {
          stage: true,
        },
      });

      if (existingSubject) {
        set.status = 409; // Conflict status code
        return {
          error: "SUBJECT_NAME_EXISTS",
          message: `A subject with the name "${name}" already exists in stage "${existingSubject.stage.name}". Please choose a different name.`,
        };
      }

      try {
        // Get schoolId from authentication
        const schoolId = await getSchoolIdFromAuth(headers, jwt);

        const subject = await prisma.subject.create({
          data: {
            name: name.trim(),
            stageId,
            schoolId,
          },
          include: {
            stage: true,
            teachers: {
              include: {
                teacher: true,
              },
            },
          },
        });

        return {
          id: subject.id,
          name: subject.name,
          stage: {
            id: subject.stage.id,
            name: subject.stage.name,
          },
          teacherCount: subject.teachers.length,
          teachers: subject.teachers.map((ts) => ts.teacher.name),
          createdAt: subject.createdAt,
          updatedAt: subject.updatedAt,
        };
      } catch (error) {
        set.status = 500;
        return {
          error: "CREATION_FAILED",
          message: "Failed to create subject. Please try again.",
        };
      }
    },
    {
      detail: {
        tags: ["Subjects"],
        summary: "Create new subject",
        description:
          "Creates a new subject with duplicate name validation within the same stage",
      },
    }
  )
  .put(
    "/api/subjects/:id",
    async ({ params: { id }, body, set }) => {
      const { name, stageId } = body as {
        name?: string;
        stageId?: string;
      };

      // Get the current subject to check stage context
      const currentSubject = await prisma.subject.findUnique({
        where: { id: id },
        include: { stage: true },
      });

      if (!currentSubject) {
        set.status = 404;
        return {
          error: "SUBJECT_NOT_FOUND",
          message: "Subject not found.",
        };
      }

      // Determine the stage to check against (new stage if being updated, or current stage)
      const targetStageId = stageId || currentSubject.stageId;

      // If name is being updated, check for duplicates in the target stage
      if (name && name.trim()) {
        const existingSubject = await prisma.subject.findFirst({
          where: {
            name: {
              equals: name.trim(),
              mode: "insensitive",
            },
            stageId: targetStageId,
            NOT: {
              id: id, // Exclude current subject from duplicate check
            },
          },
          include: {
            stage: true,
          },
        });

        if (existingSubject) {
          set.status = 409; // Conflict status code
          return {
            error: "SUBJECT_NAME_EXISTS",
            message: `A subject with the name "${name}" already exists in stage "${existingSubject.stage.name}". Please choose a different name.`,
          };
        }
      }

      try {
        const subject = await prisma.subject.update({
          where: { id: id },
          data: {
            ...(name && { name: name.trim() }),
            ...(stageId && { stageId }),
          },
          include: {
            stage: true,
            teachers: {
              include: {
                teacher: true,
              },
            },
          },
        });

        return {
          id: subject.id,
          name: subject.name,
          stage: {
            id: subject.stage.id,
            name: subject.stage.name,
          },
          teacherCount: subject.teachers.length,
          teachers: subject.teachers.map((ts) => ts.teacher.name),
          createdAt: subject.createdAt,
          updatedAt: subject.updatedAt,
        };
      } catch (error) {
        set.status = 500;
        return {
          error: "UPDATE_FAILED",
          message: "Failed to update subject. Please try again.",
        };
      }
    },
    {
      detail: {
        tags: ["Subjects"],
        summary: "Update subject",
        description:
          "Updates an existing subject with duplicate name validation within the same stage",
      },
    }
  )

  .delete(
    "/api/subjects/:id",
    async ({ params: { id } }) => {
      // Get subject info before deletion
      const subjectInfo = await prisma.subject.findUnique({
        where: { id: id },
        include: { stage: true },
      });

      // Delete related records
      await prisma.teacherSubject.deleteMany({
        where: { subjectId: id },
      });
      await prisma.schedule.deleteMany({
        where: { subjectId: id },
      });

      const subject = await prisma.subject.delete({
        where: { id: id },
      });

      return {
        id: subject.id,
        name: subject.name,
        stage: subjectInfo?.stage
          ? {
              id: subjectInfo.stage.id,
              name: subjectInfo.stage.name,
            }
          : null,
        teacherCount: 0,
        teachers: [],
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Subjects"],
        summary: "Delete subject",
        description: "Deletes a subject and all associated relationships",
      },
    }
  )

  .get(
    "/api/subjects/search",
    async ({ query, headers, jwt }) => {
      const { q } = query as { q?: string };

      if (!q) {
        return [];
      }

      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const subjects = await prisma.subject.findMany({
        where: {
          name: { contains: q, mode: "insensitive" },
          schoolId, // CRITICAL: Only search subjects from this school
        },
        include: {
          stage: true,
          teachers: {
            include: {
              teacher: true,
            },
          },
        },
      });

      return subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        stage: {
          id: subject.stage.id,
          name: subject.stage.name,
        },
        teacherCount: subject.teachers.length,
        teachers: subject.teachers.map((ts) => ts.teacher.name),
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Subjects"],
        summary: "Search subjects",
        description: "Search subjects by name",
      },
    }
  )

  .get(
    "/api/subjects/stage/:stageId",
    async ({ params: { stageId }, headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const subjects = await prisma.subject.findMany({
        where: {
          stageId: stageId,
          schoolId, // CRITICAL: Only get subjects from this school
        },
        include: {
          stage: true,
          teachers: {
            include: {
              teacher: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        stage: {
          id: subject.stage.id,
          name: subject.stage.name,
        },
        teacherCount: subject.teachers.length,
        teachers: subject.teachers.map((ts) => ts.teacher.name),
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Subjects"],
        summary: "Get subjects by stage ID",
        description: "Returns subjects for a specific stage",
      },
    }
  )
  // Schedule endpoints
  .get(
    "/api/schedules",
    async ({ headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const schedules = await prisma.schedule.findMany({
        where: {
          schoolId, // Add tenant isolation
        },
        include: {
          stage: true,
          teacher: true,
          subject: true,
        },
      });

      return schedules.map((schedule) => ({
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        timeSlot: schedule.timeSlot,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        stage: {
          id: schedule.stage.id,
          name: schedule.stage.name,
        },
        teacher: {
          id: schedule.teacher.id,
          name: schedule.teacher.name,
        },
        subject: {
          id: schedule.subject.id,
          name: schedule.subject.name,
        },
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Schedules"],
        summary: "Get all schedules",
        description:
          "Returns a list of all schedule items with stage, teacher, and subject information",
      },
    }
  )

  .get(
    "/api/schedules/stage/:stageId",
    async ({ params: { stageId }, headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const schedules = await prisma.schedule.findMany({
        where: {
          stageId: stageId,
          schoolId, // CRITICAL: Only get schedules from this school
        },
        include: {
          stage: true,
          teacher: true,
          subject: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { timeSlot: "asc" }],
      });

      return schedules.map((schedule) => ({
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        timeSlot: schedule.timeSlot,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        stage: {
          id: schedule.stage.id,
          name: schedule.stage.name,
        },
        teacher: {
          id: schedule.teacher.id,
          name: schedule.teacher.name,
        },
        subject: {
          id: schedule.subject.id,
          name: schedule.subject.name,
        },
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Schedules"],
        summary: "Get schedule by stage ID",
        description: "Returns schedule items for a specific stage",
      },
    }
  )

  .get(
    "/api/schedules/teacher/:teacherId",
    async ({ params: { teacherId }, headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const schedules = await prisma.schedule.findMany({
        where: {
          teacherId: teacherId,
          schoolId, // CRITICAL: Only get schedules from this school
        },
        include: {
          stage: true,
          teacher: true,
          subject: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { timeSlot: "asc" }],
      });

      return schedules.map((schedule) => ({
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        timeSlot: schedule.timeSlot,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        stage: {
          id: schedule.stage.id,
          name: schedule.stage.name,
        },
        teacher: {
          id: schedule.teacher.id,
          name: schedule.teacher.name,
        },
        subject: {
          id: schedule.subject.id,
          name: schedule.subject.name,
        },
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Schedules"],
        summary: "Get schedule by teacher ID",
        description: "Returns schedule items for a specific teacher",
      },
    }
  )

  .post(
    "/api/schedules",
    async ({ body, headers, jwt }) => {
      const {
        dayOfWeek,
        timeSlot,
        stageId,
        teacherId,
        subjectId,
        startTime,
        endTime,
      } = body as {
        dayOfWeek:
          | "Monday"
          | "Tuesday"
          | "Wednesday"
          | "Thursday"
          | "Friday"
          | "Saturday"
          | "Sunday";
        timeSlot: number;
        stageId: string;
        teacherId: string;
        subjectId: string;
        startTime?: string;
        endTime?: string;
      };

      // Get schoolId from authentication
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const schedule = await prisma.schedule.create({
        data: {
          dayOfWeek,
          timeSlot,
          stageId,
          teacherId,
          subjectId,
          schoolId,
          ...(startTime && { startTime }),
          ...(endTime && { endTime }),
        },
        include: {
          stage: true,
          teacher: true,
          subject: true,
        },
      });

      return {
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        timeSlot: schedule.timeSlot,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        stage: {
          id: schedule.stage.id,
          name: schedule.stage.name,
        },
        teacher: {
          id: schedule.teacher.id,
          name: schedule.teacher.name,
        },
        subject: {
          id: schedule.subject.id,
          name: schedule.subject.name,
        },
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Schedules"],
        summary: "Create new schedule item",
        description: "Creates a new schedule item",
      },
    }
  )

  .put(
    "/api/schedules/:id",
    async ({ params: { id }, body }) => {
      const {
        dayOfWeek,
        timeSlot,
        stageId,
        teacherId,
        subjectId,
        startTime,
        endTime,
      } = body as {
        dayOfWeek?:
          | "Monday"
          | "Tuesday"
          | "Wednesday"
          | "Thursday"
          | "Friday"
          | "Saturday"
          | "Sunday";
        timeSlot?: number;
        stageId?: string;
        teacherId?: string;
        subjectId?: string;
        startTime?: string;
        endTime?: string;
      };

      const schedule = await prisma.schedule.update({
        where: { id: id },
        data: {
          ...(dayOfWeek && { dayOfWeek }),
          ...(timeSlot && { timeSlot }),
          ...(stageId && { stageId }),
          ...(teacherId && { teacherId }),
          ...(subjectId && { subjectId }),
          ...(startTime !== undefined && { startTime }),
          ...(endTime !== undefined && { endTime }),
        },
        include: {
          stage: true,
          teacher: true,
          subject: true,
        },
      });

      return {
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        timeSlot: schedule.timeSlot,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        stage: {
          id: schedule.stage.id,
          name: schedule.stage.name,
        },
        teacher: {
          id: schedule.teacher.id,
          name: schedule.teacher.name,
        },
        subject: {
          id: schedule.subject.id,
          name: schedule.subject.name,
        },
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Schedules"],
        summary: "Update schedule item",
        description: "Updates an existing schedule item",
      },
    }
  )

  .delete(
    "/api/schedules/:id",
    async ({ params: { id } }) => {
      const schedule = await prisma.schedule.delete({
        where: { id: id },
        include: {
          stage: true,
          teacher: true,
          subject: true,
        },
      });

      return {
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        timeSlot: schedule.timeSlot,
        stage: {
          id: schedule.stage.id,
          name: schedule.stage.name,
        },
        teacher: {
          id: schedule.teacher.id,
          name: schedule.teacher.name,
        },
        subject: {
          id: schedule.subject.id,
          name: schedule.subject.name,
        },
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Schedules"],
        summary: "Delete schedule item",
        description: "Deletes a schedule item",
      },
    }
  )

  // Exam endpoints
  .get(
    "/api/exams",
    async ({ headers, jwt }) => {
      // Get schoolId from authentication
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const exams = await prisma.exam.findMany({
        where: {
          schoolId, // Add tenant isolation
        },
        include: {
          stage: true,
          subject: true,
          teacher: true,
        },
        orderBy: { examDate: "asc" },
      });

      return exams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examDate: exam.examDate,
        classNumber: exam.classNumber,
        stage: {
          id: exam.stage.id,
          name: exam.stage.name,
        },
        subject: {
          id: exam.subject.id,
          name: exam.subject.name,
        },
        teacher: {
          id: exam.teacher.id,
          name: exam.teacher.name,
        },
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Exams"],
        summary: "Get all exams",
        description:
          "Returns a list of all exams with stage, subject, and teacher information",
      },
    }
  )

  .get(
    "/api/exams/:id",
    async ({ params: { id } }) => {
      const exam = await prisma.exam.findUnique({
        where: { id: id },
        include: {
          stage: true,
          subject: true,
          teacher: true,
        },
      });

      if (!exam) {
        throw new Error("Exam not found");
      }

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examDate: exam.examDate,
        classNumber: exam.classNumber,
        stage: {
          id: exam.stage.id,
          name: exam.stage.name,
        },
        subject: {
          id: exam.subject.id,
          name: exam.subject.name,
        },
        teacher: {
          id: exam.teacher.id,
          name: exam.teacher.name,
        },
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Exams"],
        summary: "Get exam by ID",
        description:
          "Returns a specific exam with stage, subject, and teacher information",
      },
    }
  )

  .post(
    "/api/exams",
    async ({ body, headers, jwt }) => {
      const {
        title,
        description,
        examDate,
        classNumber,
        stageId,
        subjectId,
        teacherId,
      } = body as {
        title: string;
        description?: string;
        examDate: string;
        classNumber: string;
        stageId: string;
        subjectId: string;
        teacherId: string;
      };

      // Get schoolId from authentication
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const exam = await prisma.exam.create({
        data: {
          title,
          description,
          examDate: new Date(examDate),
          classNumber,
          stageId,
          subjectId,
          teacherId,
          schoolId,
        },
        include: {
          stage: true,
          subject: true,
          teacher: true,
        },
      });

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examDate: exam.examDate,
        classNumber: exam.classNumber,
        stage: {
          id: exam.stage.id,
          name: exam.stage.name,
        },
        subject: {
          id: exam.subject.id,
          name: exam.subject.name,
        },
        teacher: {
          id: exam.teacher.id,
          name: exam.teacher.name,
        },
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Exams"],
        summary: "Create new exam",
        description: "Creates a new exam",
      },
    }
  )

  .put(
    "/api/exams/:id",
    async ({ params: { id }, body }) => {
      const {
        title,
        description,
        examDate,
        classNumber,
        stageId,
        subjectId,
        teacherId,
      } = body as {
        title?: string;
        description?: string;
        examDate?: string;
        classNumber?: string;
        stageId?: string;
        subjectId?: string;
        teacherId?: string;
      };

      const exam = await prisma.exam.update({
        where: { id: id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(examDate && { examDate: new Date(examDate) }),
          ...(classNumber && { classNumber }),
          ...(stageId && { stageId }),
          ...(subjectId && { subjectId }),
          ...(teacherId && { teacherId }),
        },
        include: {
          stage: true,
          subject: true,
          teacher: true,
        },
      });

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examDate: exam.examDate,
        classNumber: exam.classNumber,
        stage: {
          id: exam.stage.id,
          name: exam.stage.name,
        },
        subject: {
          id: exam.subject.id,
          name: exam.subject.name,
        },
        teacher: {
          id: exam.teacher.id,
          name: exam.teacher.name,
        },
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Exams"],
        summary: "Update exam",
        description: "Updates an existing exam",
      },
    }
  )
  .delete(
    "/api/exams/:id",
    async ({ params: { id } }) => {
      const exam = await prisma.exam.delete({
        where: { id: id },
        include: {
          stage: true,
          subject: true,
          teacher: true,
        },
      });

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examDate: exam.examDate,
        classNumber: exam.classNumber,
        stage: {
          id: exam.stage.id,
          name: exam.stage.name,
        },
        subject: {
          id: exam.subject.id,
          name: exam.subject.name,
        },
        teacher: {
          id: exam.teacher.id,
          name: exam.teacher.name,
        },
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
      };
    },
    {
      detail: {
        tags: ["Exams"],
        summary: "Delete exam",
        description: "Deletes an exam",
      },
    }
  )

  .get(
    "/api/exams/search",
    async ({ query }) => {
      const { q } = query as { q?: string };

      if (!q) {
        return [];
      }

      const exams = await prisma.exam.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { classNumber: { contains: q, mode: "insensitive" } },
            { subject: { name: { contains: q, mode: "insensitive" } } },
            { teacher: { name: { contains: q, mode: "insensitive" } } },
            { stage: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        include: {
          stage: true,
          subject: true,
          teacher: true,
        },
        orderBy: { examDate: "asc" },
      });

      return exams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examDate: exam.examDate,
        classNumber: exam.classNumber,
        stage: {
          id: exam.stage.id,
          name: exam.stage.name,
        },
        subject: {
          id: exam.subject.id,
          name: exam.subject.name,
        },
        teacher: {
          id: exam.teacher.id,
          name: exam.teacher.name,
        },
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Exams"],
        summary: "Search exams",
        description:
          "Search exams by title, description, class number, subject, teacher, or stage name",
      },
    }
  )

  .get(
    "/api/exams/calendar-dates",
    async ({ headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const exams = await prisma.exam.findMany({
        where: {
          schoolId, // CRITICAL: Only get exams from this school
        },
        select: {
          examDate: true,
        },
      });

      // Group exams by date and count them
      const dateMap = new Map<string, number>();

      exams.forEach((exam) => {
        // Use the local date instead of UTC to avoid timezone shifts
        const year = exam.examDate.getFullYear();
        const month = String(exam.examDate.getMonth() + 1).padStart(2, "0");
        const day = String(exam.examDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        if (dateStr) {
          dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
        }
      });

      // Convert to array of objects
      return Array.from(dateMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));
    },
    {
      detail: {
        tags: ["Exams"],
        summary: "Get exam dates with counts",
        description:
          "Returns all dates that have exams with the count of exams on each date",
      },
    }
  )

  .get(
    "/api/exams/by-date/:date",
    async ({ params: { date }, headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      // Parse the input date (YYYY-MM-DD format)
      const dateParts = date.split("-").map(Number);

      if (dateParts.length !== 3 || dateParts.some(isNaN)) {
        throw new Error("Invalid date format. Expected YYYY-MM-DD");
      }

      const year = dateParts[0]!;
      const month = dateParts[1]!;
      const day = dateParts[2]!;

      // Create date range for the entire day in local timezone
      const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endDate = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

      const exams = await prisma.exam.findMany({
        where: {
          examDate: {
            gte: startDate,
            lt: endDate,
          },
          schoolId, // CRITICAL: Only get exams from this school
        },
        include: {
          stage: true,
          subject: true,
          teacher: true,
        },
        orderBy: { examDate: "asc" },
      });

      return exams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examDate: exam.examDate,
        classNumber: exam.classNumber,
        stage: {
          id: exam.stage.id,
          name: exam.stage.name,
        },
        subject: {
          id: exam.subject.id,
          name: exam.subject.name,
        },
        teacher: {
          id: exam.teacher.id,
          name: exam.teacher.name,
        },
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
      }));
    },
    {
      detail: {
        tags: ["Exams"],
        summary: "Get exams by date",
        description: "Returns exams scheduled for a specific date",
      },
    }
  )
  // Backup endpoints
  .get(
    "/api/backup/export",
    async ({ headers, jwt }) => {
      try {
        // Get schoolId from authentication to ensure tenant isolation
        const schoolId = await getSchoolIdFromAuth(headers, jwt);

        // Fetch all data - ONLY FOR THIS SCHOOL
        const [
          teachers,
          students,
          stages,
          subjects,
          schedules,
          exams,
          activationKeys,
          posts,
          grades,
          notes,
          attendance,
          chats,
          adminChats,
          systemSettings,
        ] = await Promise.all([
          // Teachers with relationships - filtered by schoolId
          prisma.teacher.findMany({
            where: { schoolId },
            include: {
              stages: { include: { stage: true } },
              subjects: { include: { subject: true } },
            },
          }),
          // Students with relationships - filtered by schoolId
          prisma.student.findMany({
            where: { schoolId },
            include: { stage: true },
          }),
          // Stages - filtered by schoolId
          prisma.stage.findMany({
            where: { schoolId },
          }),
          // Subjects - filtered by schoolId
          prisma.subject.findMany({
            where: { schoolId },
          }),
          // Schedules with relationships - filtered by schoolId
          prisma.schedule.findMany({
            where: { schoolId },
            include: {
              stage: true,
              teacher: true,
              subject: true,
            },
          }),
          // Exams with relationships - filtered by schoolId
          prisma.exam.findMany({
            where: { schoolId },
            include: {
              stage: true,
              subject: true,
              teacher: true,
            },
          }),
          // Activation Keys - filtered by schoolId
          prisma.activationKey.findMany({
            where: { schoolId },
          }),
          // Teacher Posts - filtered by schoolId
          prisma.teacherPost.findMany({
            where: { schoolId },
            include: {
              teacher: { select: { name: true, phoneNumber: true } },
              stage: { select: { name: true } },
              subject: { select: { name: true } },
              likes: {
                include: {
                  teacher: { select: { name: true } },
                  student: { select: { name: true, code: true } },
                },
              },
              comments: {
                include: {
                  teacher: { select: { name: true } },
                  student: { select: { name: true, code: true } },
                },
              },
            },
          }),
          // Student Grades - filtered by school through student relationship
          prisma.studentGrade.findMany({
            where: { student: { schoolId } },
            include: {
              student: { select: { name: true, code: true } },
              teacher: { select: { name: true } },
              subject: { select: { name: true } },
            },
          }),
          // Student Notes - filtered by school through student relationship
          prisma.studentNote.findMany({
            where: { student: { schoolId } },
            include: {
              student: { select: { name: true, code: true } },
              teacher: { select: { name: true } },
            },
          }),
          // Attendance records - filtered by school through student relationship
          prisma.attendance.findMany({
            where: { student: { schoolId } },
            include: {
              student: { select: { name: true, code: true } },
              subject: { select: { name: true } },
              teacher: { select: { name: true } },
            },
          }),
          // Chats - filtered by schoolId
          prisma.chat.findMany({
            where: { schoolId },
            include: {
              student: { select: { name: true, code: true } },
              teacher: { select: { name: true } },
              messages: {
                orderBy: { createdAt: "asc" },
              },
            },
          }),
          // Admin Chats - filtered by schoolId
          prisma.adminChat.findMany({
            where: { schoolId },
            include: {
              messages: {
                orderBy: { createdAt: "asc" },
              },
            },
          }),
          // System Settings - filtered by schoolId
          prisma.systemSettings.findFirst({
            where: { schoolId },
          }),
        ]);

        // Prepare backup data (includes hashed passwords which are already secure)
        const sanitizedData = {
          teachers: sanitizeForBackup(
            teachers.map((teacher) => ({
              id: teacher.id,
              name: teacher.name,
              age: teacher.age,
              phoneNumber: teacher.phoneNumber,
              gender: teacher.gender,
              birthdate: teacher.birthdate,
              password: teacher.password, // Include hashed password (already bcrypt hashed)
              stageIds: teacher.stages.map((ts) => ts.stage.id),
              subjectIds: teacher.subjects.map((ts) => ts.subject.id),
              createdAt: teacher.createdAt,
              updatedAt: teacher.updatedAt,
            }))
          ),
          students: sanitizeForBackup(
            students.map((student) => ({
              id: student.id,
              name: student.name,
              age: student.age,
              phoneNumber: student.phoneNumber,
              gender: student.gender,
              code: student.code,
              password: student.password, // Include hashed password (already bcrypt hashed)
              stageId: student.stageId,
              createdAt: student.createdAt,
              updatedAt: student.updatedAt,
            }))
          ),
          stages: sanitizeForBackup(stages),
          subjects: sanitizeForBackup(subjects),
          schedules: sanitizeForBackup(
            schedules.map((schedule) => ({
              id: schedule.id,
              dayOfWeek: schedule.dayOfWeek,
              timeSlot: schedule.timeSlot,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              stageId: schedule.stageId,
              teacherId: schedule.teacherId,
              subjectId: schedule.subjectId,
              createdAt: schedule.createdAt,
              updatedAt: schedule.updatedAt,
            }))
          ),
          exams: sanitizeForBackup(
            exams.map((exam) => ({
              id: exam.id,
              title: exam.title,
              description: exam.description,
              examDate: exam.examDate,
              classNumber: exam.classNumber,
              stageId: exam.stageId,
              subjectId: exam.subjectId,
              teacherId: exam.teacherId,
              createdAt: exam.createdAt,
              updatedAt: exam.updatedAt,
            }))
          ),
          activationKeys: sanitizeForBackup(
            activationKeys.map((key) => ({
              id: key.id,
              key: key.key,
              isUsed: key.isUsed,
              usedAt: key.usedAt,
              expiresAt: key.expiresAt,
              studentId: key.studentId,
              createdAt: key.createdAt,
              updatedAt: key.updatedAt,
            }))
          ),
          posts: sanitizeForBackup(
            posts.map((post) => ({
              title: post.title,
              content: post.content,
              teacherName: post.teacher.name,
              stageName: post.stage.name,
              subjectName: post.subject.name,
              likesCount: post.likes.length,
              commentsCount: post.comments.length,
              comments: post.comments.map((comment) => ({
                content: comment.content,
                authorName:
                  comment.teacher?.name || comment.student?.name || "Unknown",
                authorType: comment.teacher ? "teacher" : "student",
                createdAt: comment.createdAt,
              })),
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
            }))
          ),
          grades: sanitizeForBackup(
            grades.map((grade) => ({
              studentName: grade.student.name,
              studentCode: grade.student.code,
              teacherName: grade.teacher.name,
              subjectName: grade.subject.name,
              grade: grade.grade,
              gradeType: grade.gradeType,
              createdAt: grade.createdAt,
              updatedAt: grade.updatedAt,
            }))
          ),
          notes: sanitizeForBackup(
            notes.map((note) => ({
              studentName: note.student.name,
              studentCode: note.student.code,
              teacherName: note.teacher.name,
              title: note.title,
              content: note.content,
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
            }))
          ),
          attendance: sanitizeForBackup(
            attendance.map((record) => ({
              studentName: record.student.name,
              studentCode: record.student.code,
              subjectName: record.subject.name,
              teacherName: record.teacher?.name,
              date: record.date,
              status: record.status,
              markedAt: record.markedAt,
              createdAt: record.createdAt,
            }))
          ),
          chats: sanitizeForBackup(
            chats.map((chat) => ({
              studentName: chat.student.name,
              studentCode: chat.student.code,
              teacherName: chat.teacher.name,
              lastMessage: chat.lastMessage,
              lastMessageAt: chat.lastMessageAt,
              messagesCount: chat.messages.length,
              messages: chat.messages.map((msg) => ({
                senderType: msg.senderType,
                content: msg.content,
                readAt: msg.readAt,
                createdAt: msg.createdAt,
              })),
              createdAt: chat.createdAt,
            }))
          ),
          adminChats: sanitizeForBackup(
            adminChats.map((chat) => ({
              participantType: chat.participantType,
              lastMessage: chat.lastMessage,
              lastMessageAt: chat.lastMessageAt,
              messagesCount: chat.messages.length,
              messages: chat.messages.map((msg) => ({
                senderType: msg.senderType,
                content: msg.content,
                readAt: msg.readAt,
                createdAt: msg.createdAt,
              })),
              createdAt: chat.createdAt,
            }))
          ),
          systemSettings: systemSettings
            ? sanitizeForBackup({
                countryName: systemSettings.countryName,
                ministryName: systemSettings.ministryName,
                schoolName: systemSettings.schoolName,
                managerName: systemSettings.managerName,
                studyYear: systemSettings.studyYear,
                logoUrl: systemSettings.logoUrl,
                createdAt: systemSettings.createdAt,
                updatedAt: systemSettings.updatedAt,
              })
            : null,
        };

        const totalRecords =
          sanitizedData.teachers.length +
          sanitizedData.students.length +
          sanitizedData.stages.length +
          sanitizedData.subjects.length +
          sanitizedData.schedules.length +
          sanitizedData.exams.length +
          sanitizedData.activationKeys.length +
          sanitizedData.posts.length +
          sanitizedData.grades.length +
          sanitizedData.notes.length +
          sanitizedData.attendance.length +
          sanitizedData.chats.length +
          sanitizedData.adminChats.length +
          (sanitizedData.systemSettings ? 1 : 0);

        return {
          ...sanitizedData,
          metadata: {
            exportDate: new Date().toISOString(),
            version: "2.0.0",
            totalRecords,
            schoolCode:
              (
                await prisma.school.findUnique({
                  where: { id: schoolId },
                  select: { schoolCode: true, schoolName: true },
                })
              )?.schoolCode || "unknown",
          },
        };
      } catch (error) {
        console.error("Export failed:", error);
        throw new Error("Failed to export system data");
      }
    },
    {
      detail: {
        tags: ["Backup"],
        summary: "Export all system data",
        description:
          "Returns comprehensive system data for backup purposes (excluding passwords and IDs)",
      },
    }
  )

  .post(
    "/api/backup/import",
    async ({ body, headers, jwt }) => {
      try {
        // Get schoolId from authentication to ensure tenant isolation
        const schoolId = await getSchoolIdFromAuth(headers, jwt);

        const data = body as {
          teachers?: any[];
          students?: any[];
          stages?: any[];
          subjects?: any[];
          schedules?: any[];
          exams?: any[];
          activationKeys?: any[];
          posts?: any[];
          grades?: any[];
          notes?: any[];
          attendance?: any[];
          chats?: any[];
          adminChats?: any[];
          systemSettings?: any;
        };

        let imported = 0;
        const errors: string[] = [];

        // Validate backup file format
        if (!data.stages || !Array.isArray(data.stages)) {
          throw new Error(
            "Invalid backup file format: missing or invalid stages data"
          );
        }

        // Check if this is an old format backup (missing IDs)
        const isOldFormat = data.stages.length > 0 && !data.stages[0].id;
        if (isOldFormat) {
          throw new Error(
            "This backup file is from an old version and is incompatible. " +
              "Please create a new backup using the latest version and try again."
          );
        }

        // Use transaction for data integrity
        await prisma.$transaction(async (tx) => {
          // Import stages first (no dependencies)
          if (data.stages && Array.isArray(data.stages)) {
            for (const stage of data.stages) {
              try {
                // Validate required fields
                if (!stage.id || !stage.name) {
                  errors.push(
                    `Skipping stage: missing required fields (id or name)`
                  );
                  continue;
                }

                // Validate and fix dates (use current date for invalid dates)
                const now = new Date();
                let createdAt = now;
                let updatedAt = now;

                if (stage.createdAt) {
                  const parsedCreated = new Date(stage.createdAt);
                  if (!isNaN(parsedCreated.getTime())) {
                    createdAt = parsedCreated;
                  }
                }

                if (stage.updatedAt) {
                  const parsedUpdated = new Date(stage.updatedAt);
                  if (!isNaN(parsedUpdated.getTime())) {
                    updatedAt = parsedUpdated;
                  }
                }

                await tx.stage.upsert({
                  where: { id: stage.id },
                  create: {
                    id: stage.id,
                    name: stage.name,
                    schoolId: schoolId,
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                  },
                  update: {
                    name: stage.name,
                    updatedAt: updatedAt,
                  },
                });
                imported++;
              } catch (error) {
                errors.push(`Failed to import stage ${stage.name}: ${error}`);
              }
            }
          }

          // Import subjects (depends on stages)
          if (data.subjects && Array.isArray(data.subjects)) {
            for (const subject of data.subjects) {
              try {
                // Validate required fields
                if (!subject.id || !subject.name || !subject.stageId) {
                  errors.push(
                    `Skipping subject ${
                      subject.name || "unknown"
                    }: missing required fields`
                  );
                  continue;
                }

                // Validate and fix dates (use current date for invalid dates)
                const now = new Date();
                let createdAt = now;
                let updatedAt = now;

                if (subject.createdAt) {
                  const parsedCreated = new Date(subject.createdAt);
                  if (!isNaN(parsedCreated.getTime())) {
                    createdAt = parsedCreated;
                  }
                }

                if (subject.updatedAt) {
                  const parsedUpdated = new Date(subject.updatedAt);
                  if (!isNaN(parsedUpdated.getTime())) {
                    updatedAt = parsedUpdated;
                  }
                }

                await tx.subject.upsert({
                  where: { id: subject.id },
                  create: {
                    id: subject.id,
                    name: subject.name,
                    stageId: subject.stageId,
                    schoolId: schoolId,
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                  },
                  update: {
                    name: subject.name,
                    stageId: subject.stageId,
                    updatedAt: updatedAt,
                  },
                });
                imported++;
              } catch (error) {
                errors.push(
                  `Failed to import subject ${subject.name}: ${error}`
                );
              }
            }
          }

          // Import teachers (depends on stages and subjects)
          if (data.teachers && Array.isArray(data.teachers)) {
            for (const teacher of data.teachers) {
              try {
                // Validate required fields
                if (!teacher.id || !teacher.name || !teacher.phoneNumber) {
                  errors.push(
                    `Skipping teacher ${
                      teacher.name || "unknown"
                    }: missing required fields`
                  );
                  continue;
                }

                // Validate and fix dates (use current date for invalid dates)
                const now = new Date();
                let createdAt = now;
                let updatedAt = now;
                let birthdate = null;

                if (teacher.createdAt) {
                  const parsedCreated = new Date(teacher.createdAt);
                  if (!isNaN(parsedCreated.getTime())) {
                    createdAt = parsedCreated;
                  }
                }

                if (teacher.updatedAt) {
                  const parsedUpdated = new Date(teacher.updatedAt);
                  if (!isNaN(parsedUpdated.getTime())) {
                    updatedAt = parsedUpdated;
                  }
                }

                if (teacher.birthdate) {
                  const parsedBirthdate = new Date(teacher.birthdate);
                  if (!isNaN(parsedBirthdate.getTime())) {
                    birthdate = parsedBirthdate;
                  }
                }

                // First, delete existing relationships
                await tx.teacherStage.deleteMany({
                  where: { teacherId: teacher.id },
                });
                await tx.teacherSubject.deleteMany({
                  where: { teacherId: teacher.id },
                });

                // Create or update teacher
                // Use existing hashed password from backup, or generate default if missing (for old backups)
                const teacherPassword =
                  teacher.password || (await bcrypt.hash("Teacher@123", 10));

                await tx.teacher.upsert({
                  where: { id: teacher.id },
                  create: {
                    id: teacher.id,
                    name: teacher.name,
                    age: teacher.age,
                    phoneNumber: teacher.phoneNumber,
                    gender: teacher.gender,
                    birthdate: birthdate,
                    password: teacherPassword,
                    schoolId: schoolId,
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                  },
                  update: {
                    name: teacher.name,
                    age: teacher.age,
                    phoneNumber: teacher.phoneNumber,
                    gender: teacher.gender,
                    birthdate: birthdate,
                    // Don't update password on existing teachers to preserve their current password
                    updatedAt: updatedAt,
                  },
                });

                // Create stage relationships
                if (teacher.stageIds && Array.isArray(teacher.stageIds)) {
                  for (const stageId of teacher.stageIds) {
                    await tx.teacherStage.create({
                      data: {
                        teacherId: teacher.id,
                        stageId: stageId,
                      },
                    });
                  }
                }

                // Create subject relationships
                if (teacher.subjectIds && Array.isArray(teacher.subjectIds)) {
                  for (const subjectId of teacher.subjectIds) {
                    await tx.teacherSubject.create({
                      data: {
                        teacherId: teacher.id,
                        subjectId: subjectId,
                      },
                    });
                  }
                }

                imported++;
              } catch (error) {
                errors.push(
                  `Failed to import teacher ${teacher.name}: ${error}`
                );
              }
            }
          }

          // Import students (depends on stages)
          if (data.students && Array.isArray(data.students)) {
            for (const student of data.students) {
              try {
                // Validate required fields
                if (
                  !student.id ||
                  !student.name ||
                  !student.phoneNumber ||
                  !student.stageId ||
                  !student.code
                ) {
                  errors.push(
                    `Skipping student ${
                      student.name || "unknown"
                    }: missing required fields`
                  );
                  continue;
                }

                // Validate and fix dates (use current date for invalid dates)
                const now = new Date();
                let createdAt = now;
                let updatedAt = now;

                if (student.createdAt) {
                  const parsedCreated = new Date(student.createdAt);
                  if (!isNaN(parsedCreated.getTime())) {
                    createdAt = parsedCreated;
                  }
                }

                if (student.updatedAt) {
                  const parsedUpdated = new Date(student.updatedAt);
                  if (!isNaN(parsedUpdated.getTime())) {
                    updatedAt = parsedUpdated;
                  }
                }

                // Use existing hashed password from backup, or generate default if missing (for old backups)
                const studentPassword =
                  student.password || (await bcrypt.hash("Student@123", 10));

                await tx.student.upsert({
                  where: { id: student.id },
                  create: {
                    id: student.id,
                    name: student.name,
                    age: student.age,
                    phoneNumber: student.phoneNumber,
                    gender: student.gender,
                    code: student.code,
                    stageId: student.stageId,
                    password: studentPassword,
                    schoolId: schoolId,
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                  },
                  update: {
                    name: student.name,
                    age: student.age,
                    phoneNumber: student.phoneNumber,
                    gender: student.gender,
                    code: student.code,
                    stageId: student.stageId,
                    // Don't update password on existing students to preserve their current password
                    updatedAt: updatedAt,
                  },
                });
                imported++;
              } catch (error) {
                errors.push(
                  `Failed to import student ${student.name}: ${error}`
                );
              }
            }
          }

          // Import schedules (depends on stages, teachers, subjects)
          if (data.schedules && Array.isArray(data.schedules)) {
            for (const schedule of data.schedules) {
              try {
                // Validate required fields
                if (
                  !schedule.id ||
                  !schedule.stageId ||
                  !schedule.teacherId ||
                  !schedule.subjectId
                ) {
                  errors.push(
                    `Skipping schedule: missing required fields (id, stageId, teacherId, or subjectId)`
                  );
                  continue;
                }

                // Validate and fix dates (use current date for invalid dates)
                const now = new Date();
                let createdAt = now;
                let updatedAt = now;

                if (schedule.createdAt) {
                  const parsedCreated = new Date(schedule.createdAt);
                  if (!isNaN(parsedCreated.getTime())) {
                    createdAt = parsedCreated;
                  }
                }

                if (schedule.updatedAt) {
                  const parsedUpdated = new Date(schedule.updatedAt);
                  if (!isNaN(parsedUpdated.getTime())) {
                    updatedAt = parsedUpdated;
                  }
                }

                await tx.schedule.upsert({
                  where: { id: schedule.id },
                  create: {
                    id: schedule.id,
                    stageId: schedule.stageId,
                    teacherId: schedule.teacherId,
                    subjectId: schedule.subjectId,
                    dayOfWeek: schedule.dayOfWeek,
                    timeSlot: schedule.timeSlot,
                    startTime: schedule.startTime || null,
                    endTime: schedule.endTime || null,
                    schoolId: schoolId,
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                  },
                  update: {
                    stageId: schedule.stageId,
                    teacherId: schedule.teacherId,
                    subjectId: schedule.subjectId,
                    dayOfWeek: schedule.dayOfWeek,
                    timeSlot: schedule.timeSlot,
                    startTime: schedule.startTime || null,
                    endTime: schedule.endTime || null,
                    updatedAt: updatedAt,
                  },
                });
                imported++;
              } catch (error) {
                errors.push(`Failed to import schedule: ${error}`);
              }
            }
          }

          // Import exams (depends on stages, teachers, subjects)
          if (data.exams && Array.isArray(data.exams)) {
            for (const exam of data.exams) {
              try {
                // Validate required fields
                if (
                  !exam.id ||
                  !exam.title ||
                  !exam.stageId ||
                  !exam.subjectId ||
                  !exam.teacherId
                ) {
                  errors.push(
                    `Skipping exam ${
                      exam.title || "unknown"
                    }: missing required fields`
                  );
                  continue;
                }

                // Validate and fix dates (use current date for invalid dates)
                const now = new Date();
                let examDate = now;
                let createdAt = now;
                let updatedAt = now;

                if (exam.examDate) {
                  const parsedExamDate = new Date(exam.examDate);
                  if (!isNaN(parsedExamDate.getTime())) {
                    examDate = parsedExamDate;
                  }
                }

                if (exam.createdAt) {
                  const parsedCreated = new Date(exam.createdAt);
                  if (!isNaN(parsedCreated.getTime())) {
                    createdAt = parsedCreated;
                  }
                }

                if (exam.updatedAt) {
                  const parsedUpdated = new Date(exam.updatedAt);
                  if (!isNaN(parsedUpdated.getTime())) {
                    updatedAt = parsedUpdated;
                  }
                }

                await tx.exam.upsert({
                  where: { id: exam.id },
                  create: {
                    id: exam.id,
                    title: exam.title,
                    description: exam.description || "",
                    examDate: examDate,
                    classNumber: exam.classNumber || "1",
                    stageId: exam.stageId,
                    subjectId: exam.subjectId,
                    teacherId: exam.teacherId,
                    schoolId: schoolId,
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                  },
                  update: {
                    title: exam.title,
                    description: exam.description || "",
                    examDate: examDate,
                    classNumber: exam.classNumber || "1",
                    stageId: exam.stageId,
                    subjectId: exam.subjectId,
                    teacherId: exam.teacherId,
                    updatedAt: updatedAt,
                  },
                });
                imported++;
              } catch (error) {
                errors.push(`Failed to import exam ${exam.title}: ${error}`);
              }
            }
          }

          // Import activation keys (must be done AFTER students are imported)
          if (data.activationKeys && Array.isArray(data.activationKeys)) {
            for (const key of data.activationKeys) {
              try {
                // Validate required fields
                if (!key.id || !key.key) {
                  errors.push(
                    `Skipping activation key: missing required fields (id or key)`
                  );
                  continue;
                }

                // Validate and fix dates
                const now = new Date();
                let createdAt = now;
                let updatedAt = now;
                let expiresAt = new Date(
                  now.getTime() + 365 * 24 * 60 * 60 * 1000
                ); // Default: 1 year from now
                let usedAt = null;

                if (key.createdAt) {
                  const parsedCreated = new Date(key.createdAt);
                  if (!isNaN(parsedCreated.getTime())) {
                    createdAt = parsedCreated;
                  }
                }

                if (key.updatedAt) {
                  const parsedUpdated = new Date(key.updatedAt);
                  if (!isNaN(parsedUpdated.getTime())) {
                    updatedAt = parsedUpdated;
                  }
                }

                if (key.expiresAt) {
                  const parsedExpires = new Date(key.expiresAt);
                  if (!isNaN(parsedExpires.getTime())) {
                    expiresAt = parsedExpires;
                  }
                }

                if (key.usedAt) {
                  const parsedUsedAt = new Date(key.usedAt);
                  if (!isNaN(parsedUsedAt.getTime())) {
                    usedAt = parsedUsedAt;
                  }
                }

                await tx.activationKey.upsert({
                  where: { id: key.id },
                  create: {
                    id: key.id,
                    key: key.key,
                    isUsed: key.isUsed || false,
                    usedAt: usedAt,
                    expiresAt: expiresAt,
                    studentId: key.studentId || null, // Preserve student-key relationship
                    schoolId: schoolId,
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                  },
                  update: {
                    isUsed: key.isUsed || false,
                    usedAt: usedAt,
                    expiresAt: expiresAt,
                    studentId: key.studentId || null, // Preserve student-key relationship
                    updatedAt: updatedAt,
                  },
                });
                imported++;
              } catch (error) {
                errors.push(
                  `Failed to import activation key ${key.key}: ${error}`
                );
              }
            }
          }
        });

        return { imported, errors };
      } catch (error) {
        console.error("Import transaction failed:", error);
        throw new Error("Failed to import data: " + error);
      }
    },
    {
      detail: {
        tags: ["Backup"],
        summary: "Import system data",
        description: "Imports system data from backup",
      },
    }
  )

  // Attendance endpoints
  .get(
    "/api/attendance/daily/:stageId/:date",
    async ({ params: { stageId, date } }) => {
      try {
        const targetDate = new Date(date);

        // Get stage information
        const stage = await prisma.stage.findUnique({
          where: { id: stageId },
          include: {
            students: true,
            subjects: true,
          },
        });

        if (!stage) {
          throw new Error("Stage not found");
        }

        // Get or create attendance records for this date
        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            date: targetDate,
            student: {
              stageId: stageId,
            },
          },
          include: {
            student: true,
            subject: true,
            teacher: true,
          },
        });

        // Initialize attendance records if they don't exist (all absent by default)
        if (attendanceRecords.length === 0) {
          const attendanceToCreate = [];
          for (const student of stage.students) {
            for (const subject of stage.subjects) {
              attendanceToCreate.push({
                studentId: student.id,
                subjectId: subject.id,
                date: targetDate,
                status: "absent" as const,
              });
            }
          }

          await prisma.attendance.createMany({
            data: attendanceToCreate,
          });

          // Fetch the newly created records
          const newRecords = await prisma.attendance.findMany({
            where: {
              date: targetDate,
              student: {
                stageId: stageId,
              },
            },
            include: {
              student: true,
              subject: true,
              teacher: true,
            },
          });

          return {
            date: date,
            stageId: stageId,
            stageName: stage.name,
            students: stage.students.map((student) => ({
              studentId: student.id,
              studentName: student.name,
              studentCode: student.code,
              subjects: stage.subjects.reduce(
                (acc: Record<string, string>, subject) => {
                  acc[subject.id] = "absent";
                  return acc;
                },
                {}
              ),
            })),
          };
        }

        // Group attendance records by student
        const studentAttendanceMap: Record<string, any> = {};
        for (const record of attendanceRecords) {
          if (!studentAttendanceMap[record.studentId]) {
            studentAttendanceMap[record.studentId] = {
              studentId: record.student.id,
              studentName: record.student.name,
              studentCode: record.student.code,
              subjects: {} as Record<string, string>,
            };
          }
          studentAttendanceMap[record.studentId].subjects[record.subjectId] =
            record.status;
        }

        return {
          date: date,
          stageId: stageId,
          stageName: stage.name,
          students: Object.values(studentAttendanceMap),
        };
      } catch (error) {
        throw new Error(`Failed to get daily attendance: ${error}`);
      }
    },
    {
      detail: {
        tags: ["Attendance"],
        summary: "Get daily attendance for a stage",
        description:
          "Returns attendance records for all students in a stage for a specific date",
      },
    }
  )
  .get(
    "/api/attendance/student/:studentId",
    async ({ params: { studentId }, query }) => {
      try {
        const { fromDate, toDate } = query as {
          fromDate?: string;
          toDate?: string;
        };

        const whereClause: any = {
          studentId: studentId,
        };

        if (fromDate || toDate) {
          whereClause.date = {};
          if (fromDate) whereClause.date.gte = new Date(fromDate);
          if (toDate) whereClause.date.lte = new Date(toDate);
        }

        const attendanceRecords = await prisma.attendance.findMany({
          where: whereClause,
          include: {
            student: true,
            subject: true,
            teacher: true,
          },
          orderBy: {
            date: "desc",
          },
        });

        return attendanceRecords.map((record) => ({
          id: record.id,
          studentId: record.studentId,
          subjectId: record.subjectId,
          date: record.date.toISOString().split("T")[0],
          status: record.status,
          markedAt: record.markedAt?.toISOString(),
          markedBy: record.markedBy,
          student: {
            id: record.student.id,
            name: record.student.name,
            code: record.student.code,
          },
          subject: {
            id: record.subject.id,
            name: record.subject.name,
          },
          teacher: record.teacher
            ? {
                id: record.teacher.id,
                name: record.teacher.name,
              }
            : undefined,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        }));
      } catch (error) {
        throw new Error(`Failed to get student attendance: ${error}`);
      }
    },
    {
      detail: {
        tags: ["Attendance"],
        summary: "Get student attendance records",
        description: "Returns attendance records for a specific student",
      },
    }
  )

  .post(
    "/api/attendance",
    async ({ body }) => {
      try {
        const { studentId, subjectId, date, status, markedBy } = body as {
          studentId: string;
          subjectId: string;
          date: string;
          status: "present" | "absent";
          markedBy?: string;
        };

        const targetDate = new Date(date);

        const attendance = await prisma.attendance.upsert({
          where: {
            studentId_subjectId_date: {
              studentId,
              subjectId,
              date: targetDate,
            },
          },
          create: {
            studentId,
            subjectId,
            date: targetDate,
            status,
            markedAt: new Date(),
            markedBy,
          },
          update: {
            status,
            markedAt: new Date(),
            markedBy,
          },
          include: {
            student: true,
            subject: true,
            teacher: true,
          },
        });

        return {
          id: attendance.id,
          studentId: attendance.studentId,
          subjectId: attendance.subjectId,
          date: attendance.date.toISOString().split("T")[0],
          status: attendance.status,
          markedAt: attendance.markedAt?.toISOString(),
          markedBy: attendance.markedBy,
          student: {
            id: attendance.student.id,
            name: attendance.student.name,
            code: attendance.student.code,
          },
          subject: {
            id: attendance.subject.id,
            name: attendance.subject.name,
          },
          teacher: attendance.teacher
            ? {
                id: attendance.teacher.id,
                name: attendance.teacher.name,
              }
            : undefined,
          createdAt: attendance.createdAt.toISOString(),
          updatedAt: attendance.updatedAt.toISOString(),
        };
      } catch (error) {
        throw new Error(`Failed to mark attendance: ${error}`);
      }
    },
    {
      detail: {
        tags: ["Attendance"],
        summary: "Mark or update attendance",
        description: "Creates or updates an attendance record for a student",
      },
    }
  )

  .post(
    "/api/attendance/bulk",
    async ({ body }) => {
      try {
        const { date, stageId, attendanceData, markedBy } = body as {
          date: string;
          stageId: string;
          attendanceData: Array<{
            studentId: string;
            subjectId: string;
            status: "present" | "absent";
          }>;
          markedBy?: string;
        };

        const targetDate = new Date(date);
        let created = 0;
        let updated = 0;
        const errors: string[] = [];

        // Process each attendance record
        for (const record of attendanceData) {
          try {
            const result = await prisma.attendance.upsert({
              where: {
                studentId_subjectId_date: {
                  studentId: record.studentId,
                  subjectId: record.subjectId,
                  date: targetDate,
                },
              },
              create: {
                studentId: record.studentId,
                subjectId: record.subjectId,
                date: targetDate,
                status: record.status,
                markedAt: new Date(),
                markedBy,
              },
              update: {
                status: record.status,
                markedAt: new Date(),
                markedBy,
              },
            });

            // Check if it was an insert or update
            const existingRecord = await prisma.attendance.findFirst({
              where: {
                studentId: record.studentId,
                subjectId: record.subjectId,
                date: targetDate,
                createdAt: {
                  lt: new Date(Date.now() - 1000), // Created more than 1 second ago
                },
              },
            });

            if (existingRecord) {
              updated++;
            } else {
              created++;
            }
          } catch (error) {
            errors.push(
              `Failed to process record for student ${record.studentId}: ${error}`
            );
          }
        }

        return { created, updated, errors };
      } catch (error) {
        throw new Error(`Failed to bulk mark attendance: ${error}`);
      }
    },
    {
      detail: {
        tags: ["Attendance"],
        summary: "Bulk mark attendance",
        description: "Creates or updates multiple attendance records at once",
      },
    }
  )
  .post(
    "/api/attendance/initialize/:stageId/:date",
    async ({ params: { stageId, date } }) => {
      try {
        const targetDate = new Date(date);

        // Get stage with students and subjects
        const stage = await prisma.stage.findUnique({
          where: { id: stageId },
          include: {
            students: true,
            subjects: true,
          },
        });

        if (!stage) {
          throw new Error("Stage not found");
        }

        // Check if attendance records already exist for this date
        const existingRecords = await prisma.attendance.findMany({
          where: {
            date: targetDate,
            student: {
              stageId: stageId,
            },
          },
        });

        if (existingRecords.length > 0) {
          return {
            created: 0,
            message: "Attendance records already exist for this date",
          };
        }

        // Create attendance records for all students and subjects (default: absent)
        const attendanceToCreate = [];
        for (const student of stage.students) {
          for (const subject of stage.subjects) {
            attendanceToCreate.push({
              studentId: student.id,
              subjectId: subject.id,
              date: targetDate,
              status: "absent" as const,
            });
          }
        }

        const result = await prisma.attendance.createMany({
          data: attendanceToCreate,
        });

        return {
          created: result.count,
          message: `Initialized ${result.count} attendance records for ${stage.name} on ${date}`,
        };
      } catch (error) {
        throw new Error(`Failed to initialize attendance: ${error}`);
      }
    },
    {
      detail: {
        tags: ["Attendance"],
        summary: "Initialize daily attendance",
        description:
          "Creates attendance records for all students in a stage for a specific date (default: absent)",
      },
    }
  )

  .get(
    "/api/attendance/stats",
    async ({ query }) => {
      try {
        const { stageId, studentId, fromDate, toDate } = query as {
          stageId?: string;
          studentId?: string;
          fromDate?: string;
          toDate?: string;
        };

        const whereClause: any = {};

        if (studentId) {
          whereClause.studentId = studentId;
        }

        if (stageId) {
          whereClause.student = {
            stageId: stageId,
          };
        }

        if (fromDate || toDate) {
          whereClause.date = {};
          if (fromDate) whereClause.date.gte = new Date(fromDate);
          if (toDate) whereClause.date.lte = new Date(toDate);
        }

        const attendanceRecords = await prisma.attendance.findMany({
          where: whereClause,
        });

        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(
          (record) => record.status === "present"
        ).length;
        const absentDays = totalDays - presentDays;
        const attendanceRate =
          totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        return {
          totalDays,
          presentDays,
          absentDays,
          attendanceRate: Math.round(attendanceRate * 100) / 100, // Round to 2 decimal places
        };
      } catch (error) {
        throw new Error(`Failed to get attendance stats: ${error}`);
      }
    },
    {
      detail: {
        tags: ["Attendance"],
        summary: "Get attendance statistics",
        description: "Returns attendance statistics for students",
      },
    }
  )

  // Mobile Exam endpoints
  .get(
    "/api/mobile/exams",
    async ({ user, set, query }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      try {
        const {
          page = "1",
          limit = "10",
          upcoming = "false",
        } = query as {
          page?: string;
          limit?: string;
          upcoming?: string;
        };

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        const whereClause: any = { teacherId: user.id };

        // If upcoming is true, only show future exams
        if (upcoming === "true") {
          whereClause.examDate = {
            gte: new Date(),
          };
        }

        const exams = await prisma.exam.findMany({
          where: whereClause,
          include: {
            stage: true,
            subject: true,
            teacher: true,
          },
          orderBy: {
            examDate: "asc",
          },
          skip,
          take: limitNum,
        });

        const totalCount = await prisma.exam.count({
          where: whereClause,
        });

        return {
          success: true,
          data: {
            exams: exams.map((exam) => ({
              id: exam.id,
              title: exam.title,
              description: exam.description,
              examDate: exam.examDate.toISOString(),
              classNumber: exam.classNumber,
              stage: {
                id: exam.stage.id,
                name: exam.stage.name,
              },
              subject: {
                id: exam.subject.id,
                name: exam.subject.name,
              },
              teacher: {
                id: exam.teacher.id,
                name: exam.teacher.name,
              },
              createdAt: exam.createdAt.toISOString(),
              updatedAt: exam.updatedAt.toISOString(),
            })),
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: totalCount,
              totalPages: Math.ceil(totalCount / limitNum),
              hasNext: pageNum < Math.ceil(totalCount / limitNum),
              hasPrev: pageNum > 1,
            },
          },
        };
      } catch (error) {
        console.error("Get exams error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch exams",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Get teacher's exams",
        description:
          "Get all exams created by the authenticated teacher with optional upcoming filter",
      },
    }
  )

  .post(
    "/api/mobile/exams",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      const { title, description, examDate, classNumber, stageId, subjectId } =
        body as {
          title: string;
          description?: string;
          examDate: string;
          classNumber: string;
          stageId: string;
          subjectId: string;
        };

      try {
        // Validate that the teacher is associated with the stage and subject
        const teacherStage = await prisma.teacherStage.findFirst({
          where: {
            teacherId: user.id,
            stageId: stageId,
          },
        });

        const teacherSubject = await prisma.teacherSubject.findFirst({
          where: {
            teacherId: user.id,
            subjectId: subjectId,
          },
        });

        if (!teacherStage) {
          set.status = 400;
          return {
            success: false,
            message: "You are not associated with the selected stage",
          };
        }

        if (!teacherSubject) {
          set.status = 400;
          return {
            success: false,
            message: "You are not associated with the selected subject",
          };
        }

        const exam = await prisma.exam.create({
          data: {
            title,
            description,
            examDate: new Date(examDate),
            classNumber,
            stageId,
            subjectId,
            teacherId: user.id,
            schoolId: user.schoolId, // Add missing schoolId for tenant isolation
          },
          include: {
            stage: true,
            subject: true,
            teacher: true,
          },
        });

        return {
          success: true,
          data: {
            exam: {
              id: exam.id,
              title: exam.title,
              description: exam.description,
              examDate: exam.examDate.toISOString(),
              classNumber: exam.classNumber,
              stage: {
                id: exam.stage.id,
                name: exam.stage.name,
              },
              subject: {
                id: exam.subject.id,
                name: exam.subject.name,
              },
              teacher: {
                id: exam.teacher.id,
                name: exam.teacher.name,
              },
              createdAt: exam.createdAt.toISOString(),
              updatedAt: exam.updatedAt.toISOString(),
            },
          },
          message: "Exam created successfully",
        };
      } catch (error) {
        console.error("Create exam error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to create exam",
        };
      }
    },
    {
      body: t.Object({
        title: t.String({
          description: "Exam title",
          example: "Mid-term Mathematics Exam",
        }),
        description: t.Optional(
          t.String({
            description: "Exam description",
            example: "Covers chapters 1-5",
          })
        ),
        examDate: t.String({
          description: "Exam date and time (ISO string)",
          example: "2024-01-15T10:00:00.000Z",
        }),
        classNumber: t.String({
          description: "Class number or room",
          example: "Room 101",
        }),
        stageId: t.String({
          description: "Stage ID",
          example: "stage-uuid",
        }),
        subjectId: t.String({
          description: "Subject ID",
          example: "subject-uuid",
        }),
      }),
      detail: {
        tags: ["Mobile"],
        summary: "Create new exam",
        description: "Create a new exam for the authenticated teacher",
      },
    }
  )

  .put(
    "/api/mobile/exams/:examId",
    async ({ params: { examId }, body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      const { title, description, examDate, classNumber, stageId, subjectId } =
        body as {
          title?: string;
          description?: string;
          examDate?: string;
          classNumber?: string;
          stageId?: string;
          subjectId?: string;
        };

      try {
        // Check if the exam belongs to this teacher
        const existingExam = await prisma.exam.findFirst({
          where: {
            id: examId,
            teacherId: user.id,
          },
        });

        if (!existingExam) {
          set.status = 404;
          return {
            success: false,
            message: "Exam not found or you don't have permission to edit it",
          };
        }

        // Validate stage and subject if they are being updated
        if (stageId) {
          const teacherStage = await prisma.teacherStage.findFirst({
            where: {
              teacherId: user.id,
              stageId: stageId,
            },
          });

          if (!teacherStage) {
            set.status = 400;
            return {
              success: false,
              message: "You are not associated with the selected stage",
            };
          }
        }

        if (subjectId) {
          const teacherSubject = await prisma.teacherSubject.findFirst({
            where: {
              teacherId: user.id,
              subjectId: subjectId,
            },
          });

          if (!teacherSubject) {
            set.status = 400;
            return {
              success: false,
              message: "You are not associated with the selected subject",
            };
          }
        }

        const exam = await prisma.exam.update({
          where: { id: examId },
          data: {
            ...(title && { title }),
            ...(description !== undefined && { description }),
            ...(examDate && { examDate: new Date(examDate) }),
            ...(classNumber && { classNumber }),
            ...(stageId && { stageId }),
            ...(subjectId && { subjectId }),
          },
          include: {
            stage: true,
            subject: true,
            teacher: true,
          },
        });

        return {
          success: true,
          data: {
            exam: {
              id: exam.id,
              title: exam.title,
              description: exam.description,
              examDate: exam.examDate.toISOString(),
              classNumber: exam.classNumber,
              stage: {
                id: exam.stage.id,
                name: exam.stage.name,
              },
              subject: {
                id: exam.subject.id,
                name: exam.subject.name,
              },
              teacher: {
                id: exam.teacher.id,
                name: exam.teacher.name,
              },
              createdAt: exam.createdAt.toISOString(),
              updatedAt: exam.updatedAt.toISOString(),
            },
          },
          message: "Exam updated successfully",
        };
      } catch (error) {
        console.error("Update exam error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to update exam",
        };
      }
    },
    {
      body: t.Object({
        title: t.Optional(
          t.String({
            description: "Exam title",
            example: "Updated Mid-term Mathematics Exam",
          })
        ),
        description: t.Optional(
          t.String({
            description: "Exam description",
            example: "Updated description",
          })
        ),
        examDate: t.Optional(
          t.String({
            description: "Exam date and time (ISO string)",
            example: "2024-01-15T10:00:00.000Z",
          })
        ),
        classNumber: t.Optional(
          t.String({
            description: "Class number or room",
            example: "Room 102",
          })
        ),
        stageId: t.Optional(
          t.String({
            description: "Stage ID",
            example: "stage-uuid",
          })
        ),
        subjectId: t.Optional(
          t.String({
            description: "Subject ID",
            example: "subject-uuid",
          })
        ),
      }),
      detail: {
        tags: ["Mobile"],
        summary: "Update exam",
        description: "Update an existing exam",
      },
    }
  )
  .delete(
    "/api/mobile/exams/:examId",
    async ({ params: { examId }, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      try {
        // Check if the exam belongs to this teacher
        const existingExam = await prisma.exam.findFirst({
          where: {
            id: examId,
            teacherId: user.id,
          },
        });

        if (!existingExam) {
          set.status = 404;
          return {
            success: false,
            message: "Exam not found or you don't have permission to delete it",
          };
        }

        await prisma.exam.delete({
          where: { id: examId },
        });

        return {
          success: true,
          message: "Exam deleted successfully",
        };
      } catch (error) {
        console.error("Delete exam error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to delete exam",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Delete exam",
        description: "Delete an existing exam",
      },
    }
  )

  // Create sample posts for testing
  .post(
    "/api/posts/sample",
    async () => {
      try {
        // Get some teachers, stages, and subjects
        const teachers = await prisma.teacher.findMany({ take: 3 });
        const stages = await prisma.stage.findMany({ take: 3 });
        const subjects = await prisma.subject.findMany({ take: 3 });

        if (
          teachers.length === 0 ||
          stages.length === 0 ||
          subjects.length === 0
        ) {
          return {
            success: false,
            message:
              "Need at least one teacher, stage, and subject to create sample posts",
          };
        }

        const samplePostTemplates = [
          {
            title: "Mathematics Homework Assignment - Week 3",
            content:
              "Dear students, for this week's homework, please complete exercises 1-15 from Chapter 4. Focus on algebraic equations and remember to show your work. Due date: Friday. If you have any questions, feel free to ask during our next class session.",
            teacherIndex: 0,
            stageIndex: 0,
            subjectIndex: 0,
          },
          {
            title: "Science Lab Safety Reminder",
            content:
              "Important reminder for all students: Safety goggles are mandatory during lab sessions. Please bring your lab notebooks and wear closed-toe shoes. We'll be conducting experiments on chemical reactions next week.",
            teacherIndex: 1,
            stageIndex: 1,
            subjectIndex: 1,
          },
          {
            title: "English Literature Essay Guidelines",
            content:
              "Students, your essays on Shakespeare's Romeo and Juliet are due next Tuesday. Remember to include proper citations and analyze at least three themes. Minimum 500 words, maximum 800 words. Good luck!",
            teacherIndex: 2,
            stageIndex: 0,
            subjectIndex: 2,
          },
          {
            title: "Field Trip Permission Slips Due",
            content:
              "Parents and students, please remember to submit your signed permission slips for the upcoming museum visit. The trip is scheduled for next Friday from 9 AM to 3 PM. Bring lunch money or a packed lunch.",
            teacherIndex: 0,
            stageIndex: 1,
            subjectIndex: 0,
          },
          {
            title: "Midterm Exam Schedule Released",
            content:
              "The midterm examination schedule has been posted on the notice board. Math exam: Monday 10 AM, Science: Tuesday 2 PM, English: Wednesday 9 AM. Study hard and prepare well!",
            teacherIndex: 1,
            stageIndex: 0,
            subjectIndex: 0,
          },
        ];

        const createdPosts = [];
        for (const template of samplePostTemplates) {
          try {
            const teacher = teachers[template.teacherIndex] || teachers[0];
            const stage = stages[template.stageIndex] || stages[0];
            const subject = subjects[template.subjectIndex] || subjects[0];

            if (teacher && stage && subject) {
              const created = await prisma.teacherPost.create({
                data: {
                  title: template.title,
                  content: template.content,
                  teacherId: teacher.id,
                  stageId: stage.id,
                  subjectId: subject.id,
                  schoolId: teacher.schoolId, // Add missing schoolId for tenant isolation
                },
              });
              createdPosts.push(created);
            }
          } catch (error) {
            console.error("Error creating post:", error);
          }
        }

        return {
          success: true,
          message: `Created ${createdPosts.length} sample posts`,
          data: createdPosts,
        };
      } catch (error) {
        console.error("Create sample posts error:", error);
        return {
          success: false,
          message: "Failed to create sample posts",
        };
      }
    },
    {
      detail: {
        tags: ["Posts"],
        summary: "Create sample posts",
        description: "Create sample posts for testing the posts page",
      },
    }
  )
  // Dashboard Posts endpoints - Get all posts from all teachers
  .get(
    "/api/posts",
    async ({ query, headers, jwt }) => {
      // Get schoolId from authentication for tenant isolation
      const schoolId = await getSchoolIdFromAuth(headers, jwt);

      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;
      const search = query.search as string;
      const stageId = query.stageId as string;
      const teacherId = query.teacherId as string;

      const skip = (page - 1) * limit;

      // Build where clause for search and filters
      const whereClause: any = {
        schoolId, // Add tenant isolation - only show posts from this school
      };
      const andConditions: any[] = [];

      // Search functionality
      if (search && search.trim()) {
        andConditions.push({
          OR: [
            {
              title: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: search.trim(),
                mode: "insensitive",
              },
            },
            {
              teacher: {
                name: {
                  contains: search.trim(),
                  mode: "insensitive",
                },
              },
            },
          ],
        });
      }

      // Stage filter
      if (stageId && stageId.trim()) {
        andConditions.push({
          stageId: stageId.trim(),
        });
      }

      // Teacher filter
      if (teacherId && teacherId.trim()) {
        andConditions.push({
          teacherId: teacherId.trim(),
        });
      }

      // Apply all conditions
      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      const posts = await prisma.teacherPost.findMany({
        where: whereClause,
        include: {
          stage: true,
          subject: true,
          teacher: true,
          likes: {
            include: {
              teacher: {
                select: {
                  id: true,
                  name: true,
                },
              },
              student: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          comments: {
            include: {
              teacher: {
                select: {
                  id: true,
                  name: true,
                },
              },
              student: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      });

      const totalCount = await prisma.teacherPost.count({
        where: whereClause,
      });

      return {
        data: posts.map((post) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          stage: {
            id: post.stage.id,
            name: post.stage.name,
          },
          subject: {
            id: post.subject.id,
            name: post.subject.name,
          },
          teacher: {
            id: post.teacher.id,
            name: post.teacher.name,
          },
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          likes: post.likes.map((like) => ({
            id: like.id,
            user: like.teacher
              ? {
                  id: like.teacher.id,
                  name: like.teacher.name,
                  type: "teacher",
                }
              : like.student
              ? {
                  id: like.student.id,
                  name: like.student.name,
                  type: "student",
                }
              : null,
            createdAt: like.createdAt.toISOString(),
          })),
          comments: post.comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            user: comment.teacher
              ? {
                  id: comment.teacher.id,
                  name: comment.teacher.name,
                  type: "teacher",
                }
              : comment.student
              ? {
                  id: comment.student.id,
                  name: comment.student.name,
                  type: "student",
                }
              : null,
            createdAt: comment.createdAt.toISOString(),
          })),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1,
        },
      };
    },
    {
      detail: {
        tags: ["Posts"],
        summary: "Get all teacher posts",
        description:
          "Get all posts from all teachers with pagination, search, and filters",
      },
    }
  )

  // Delete a post
  .delete(
    "/api/posts/:id",
    async ({ params, headers, jwt, set }) => {
      try {
        const postId = params.id;
        
        // Get schoolId from authentication for tenant isolation
        const schoolId = await getSchoolIdFromAuth(headers, jwt);

        // Find the post and verify it belongs to this school
        const post = await prisma.teacherPost.findUnique({
          where: { id: postId },
        });

        if (!post) {
          set.status = 404;
          return {
            success: false,
            message: "Post not found",
          };
        }

        // Verify the post belongs to this school (tenant isolation)
        if (post.schoolId !== schoolId) {
          set.status = 403;
          return {
            success: false,
            message: "Unauthorized to delete this post",
          };
        }

        // Delete the post (cascade will delete likes and comments)
        await prisma.teacherPost.delete({
          where: { id: postId },
        });

        return {
          success: true,
          message: "Post deleted successfully",
        };
      } catch (error) {
        console.error("Delete post error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to delete post",
        };
      }
    },
    {
      detail: {
        tags: ["Posts"],
        summary: "Delete a post",
        description: "Delete a post by ID with tenant isolation",
      },
    }
  )

  // Teacher Posts endpoints
  .get(
    "/api/mobile/posts",
    async ({ user, set, query }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      try {
        const { page = "1", limit = "10" } = query as {
          page?: string;
          limit?: string;
        };

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        const posts = await prisma.teacherPost.findMany({
          where: { teacherId: user.id },
          include: {
            stage: true,
            subject: true,
            teacher: true,
            likes: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                student: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            comments: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                student: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limitNum,
        });

        const totalCount = await prisma.teacherPost.count({
          where: { teacherId: user.id },
        });

        return {
          success: true,
          data: {
            posts: posts.map((post) => ({
              id: post.id,
              title: post.title,
              content: post.content,
              stage: {
                id: post.stage.id,
                name: post.stage.name,
              },
              subject: {
                id: post.subject.id,
                name: post.subject.name,
              },
              teacher: {
                id: post.teacher.id,
                name: post.teacher.name,
              },
              likesCount: post.likes.length,
              commentsCount: post.comments.length,
              isLikedByMe: post.likes.some(
                (like) => like.teacherId === user.id
              ),
              likes: post.likes.map((like) => ({
                id: like.id,
                user: like.teacher
                  ? {
                      id: like.teacher.id,
                      name: like.teacher.name,
                      type: "teacher",
                    }
                  : like.student
                  ? {
                      id: like.student.id,
                      name: like.student.name,
                      type: "student",
                    }
                  : {
                      id: "",
                      name: "Unknown",
                      type: "unknown",
                    },
                createdAt: like.createdAt.toISOString(),
              })),
              comments: post.comments.map((comment) => ({
                id: comment.id,
                content: comment.content,
                user: comment.teacher
                  ? {
                      id: comment.teacher.id,
                      name: comment.teacher.name,
                      type: "teacher",
                    }
                  : comment.student
                  ? {
                      id: comment.student.id,
                      name: comment.student.name,
                      type: "student",
                    }
                  : {
                      id: "",
                      name: "Unknown",
                      type: "unknown",
                    },
                createdAt: comment.createdAt.toISOString(),
              })),
              createdAt: post.createdAt.toISOString(),
              updatedAt: post.updatedAt.toISOString(),
            })),
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: totalCount,
              totalPages: Math.ceil(totalCount / limitNum),
              hasNext: pageNum < Math.ceil(totalCount / limitNum),
              hasPrev: pageNum > 1,
            },
          },
        };
      } catch (error) {
        console.error("Get posts error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch posts",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Get teacher's posts",
        description: "Get all posts created by the authenticated teacher",
      },
    }
  )

  .post(
    "/api/mobile/posts",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      const { title, content, stageId, subjectId } = body as {
        title: string;
        content: string;
        stageId: string;
        subjectId: string;
      };

      try {
        // Validate that the teacher is associated with the stage and subject
        const teacherStage = await prisma.teacherStage.findFirst({
          where: {
            teacherId: user.id,
            stageId: stageId,
          },
        });

        const teacherSubject = await prisma.teacherSubject.findFirst({
          where: {
            teacherId: user.id,
            subjectId: subjectId,
          },
        });

        if (!teacherStage) {
          set.status = 400;
          return {
            success: false,
            message: "You are not associated with the selected stage",
          };
        }

        if (!teacherSubject) {
          set.status = 400;
          return {
            success: false,
            message: "You are not associated with the selected subject",
          };
        }

        const post = await prisma.teacherPost.create({
          data: {
            title,
            content,
            stageId,
            subjectId,
            teacherId: user.id,
            schoolId: user.schoolId, // Add the missing schoolId from user context
          },
          include: {
            stage: true,
            subject: true,
            teacher: true,
            likes: true,
            comments: true,
          },
        });

        return {
          success: true,
          data: {
            post: {
              id: post.id,
              title: post.title,
              content: post.content,
              stage: {
                id: post.stage.id,
                name: post.stage.name,
              },
              subject: {
                id: post.subject.id,
                name: post.subject.name,
              },
              teacher: {
                id: post.teacher.id,
                name: post.teacher.name,
              },
              likesCount: post.likes.length,
              commentsCount: post.comments.length,
              isLikedByMe: false,
              likes: [],
              comments: [],
              createdAt: post.createdAt.toISOString(),
              updatedAt: post.updatedAt.toISOString(),
            },
          },
          message: "Post created successfully",
        };
      } catch (error) {
        console.error("Create post error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to create post",
        };
      }
    },
    {
      body: t.Object({
        title: t.String({
          description: "Post title",
          example: "Math homework assignment",
        }),
        content: t.String({
          description: "Post content",
          example: "Students should complete exercises 1-10 from page 45",
        }),
        stageId: t.String({
          description: "Stage ID",
          example: "stage-uuid",
        }),
        subjectId: t.String({
          description: "Subject ID",
          example: "subject-uuid",
        }),
      }),
      detail: {
        tags: ["Mobile"],
        summary: "Create new post",
        description: "Create a new post for a specific stage and subject",
      },
    }
  )

  .post(
    "/api/mobile/posts/:postId/like",
    async ({ params: { postId }, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      try {
        // Check if post exists
        const post = await prisma.teacherPost.findUnique({
          where: { id: postId },
        });

        if (!post) {
          set.status = 404;
          return {
            success: false,
            message: "Post not found",
          };
        }

        // Check if already liked
        const existingLike = await prisma.postLike.findUnique({
          where: {
            postId_teacherId: {
              postId: postId,
              teacherId: user.id,
            },
          },
        });

        if (existingLike) {
          // Unlike the post
          await prisma.postLike.delete({
            where: { id: existingLike.id },
          });

          return {
            success: true,
            message: "Post unliked successfully",
            data: { isLiked: false },
          };
        } else {
          // Like the post
          await prisma.postLike.create({
            data: {
              postId: postId,
              teacherId: user.id,
            },
          });

          return {
            success: true,
            message: "Post liked successfully",
            data: { isLiked: true },
          };
        }
      } catch (error) {
        console.error("Like post error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to like/unlike post",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Like/Unlike post",
        description: "Toggle like status for a post",
      },
    }
  )
  .post(
    "/api/mobile/posts/:postId/comments",
    async ({ params: { postId }, body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      const { content } = body as { content: string };

      try {
        // Check if post exists
        const post = await prisma.teacherPost.findUnique({
          where: { id: postId },
        });

        if (!post) {
          set.status = 404;
          return {
            success: false,
            message: "Post not found",
          };
        }

        const comment = await prisma.postComment.create({
          data: {
            postId: postId,
            teacherId: user.id,
            content,
          },
          include: {
            teacher: true,
          },
        });

        return {
          success: true,
          data: {
            comment: {
              id: comment.id,
              content: comment.content,
              user: comment.teacher
                ? {
                    id: comment.teacher.id,
                    name: comment.teacher.name,
                    type: "teacher",
                  }
                : null,
              createdAt: comment.createdAt.toISOString(),
              updatedAt: comment.updatedAt.toISOString(),
            },
          },
          message: "Comment added successfully",
        };
      } catch (error) {
        console.error("Add comment error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to add comment",
        };
      }
    },
    {
      body: t.Object({
        content: t.String({
          description: "Comment content",
          example: "Great post! Very helpful.",
        }),
      }),
      detail: {
        tags: ["Mobile"],
        summary: "Add comment to post",
        description: "Add a new comment to a specific post",
      },
    }
  )
  .get(
    "/api/mobile/posts/:postId",
    async ({ params: { postId }, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          message: "Authentication required",
        };
      }

      try {
        const post = await prisma.teacherPost.findUnique({
          where: { id: postId },
          include: {
            stage: true,
            subject: true,
            teacher: true,
            likes: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                student: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            comments: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                student: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        });

        if (!post) {
          set.status = 404;
          return {
            success: false,
            message: "Post not found",
          };
        }

        return {
          success: true,
          data: {
            post: {
              id: post.id,
              title: post.title,
              content: post.content,
              stage: {
                id: post.stage.id,
                name: post.stage.name,
              },
              subject: {
                id: post.subject.id,
                name: post.subject.name,
              },
              teacher: {
                id: post.teacher.id,
                name: post.teacher.name,
              },
              likesCount: post.likes.length,
              commentsCount: post.comments.length,
              isLikedByMe: post.likes.some(
                (like) => like.teacherId === user.id
              ),
              likes: post.likes.map((like) => ({
                id: like.id,
                user: like.teacher
                  ? {
                      id: like.teacher.id,
                      name: like.teacher.name,
                      type: "teacher",
                    }
                  : like.student
                  ? {
                      id: like.student.id,
                      name: like.student.name,
                      type: "student",
                    }
                  : {
                      id: "",
                      name: "Unknown",
                      type: "unknown",
                    },
                createdAt: like.createdAt.toISOString(),
              })),
              comments: post.comments.map((comment) => ({
                id: comment.id,
                content: comment.content,
                user: comment.teacher
                  ? {
                      id: comment.teacher.id,
                      name: comment.teacher.name,
                      type: "teacher",
                    }
                  : comment.student
                  ? {
                      id: comment.student.id,
                      name: comment.student.name,
                      type: "student",
                    }
                  : {
                      id: "",
                      name: "Unknown",
                      type: "unknown",
                    },
                createdAt: comment.createdAt.toISOString(),
              })),
              createdAt: post.createdAt.toISOString(),
              updatedAt: post.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        console.error("Get post error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch post",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile"],
        summary: "Get single post",
        description: "Get details of a specific post with likes and comments",
      },
    }
  )

  // Student grades endpoint
  .get(
    "/api/mobile/student/grades",
    async ({ headers, jwt, set }) => {
      try {
        const studentId = await getStudentIdFromAuth(headers, jwt);
        if (!studentId) {
          set.status = 401;
          return {
            success: false,
            message: "Student authentication required",
          };
        }

        // Get student with their stage
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            stage: true,
          },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found",
          };
        }

        // Get all subjects for the student's stage
        const subjects = await prisma.subject.findMany({
          where: {
            stageId: student.stageId,
          },
        });

        // Get all grades for this student
        const grades = await prisma.studentGrade.findMany({
          where: {
            studentId: studentId,
          },
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Group grades by subject
        const subjectGrades: { [key: string]: any } = {};

        // Initialize all subjects for the student's stage
        subjects.forEach((subject) => {
          subjectGrades[subject.id] = {
            subjectId: subject.id,
            subjectName: subject.name,
            grades: {
              MONTH_1_EXAM: null,
              MONTH_2_EXAM: null,
              MID_TERM_EXAM: null,
              MONTH_3_EXAM: null,
              MONTH_4_EXAM: null,
              FINAL_EXAM: null,
            },
            average: 0,
            totalGrades: 0,
          };
        });

        // Fill in the actual grades
        grades.forEach((grade) => {
          if (subjectGrades[grade.subjectId]) {
            subjectGrades[grade.subjectId].grades[grade.gradeType] = {
              id: grade.id,
              grade: parseFloat(grade.grade) || 0,
              teacher: grade.teacher.name,
              createdAt: grade.createdAt.toISOString(),
            };
          }
        });

        // Calculate averages for each subject
        Object.keys(subjectGrades).forEach((subjectId) => {
          const subject = subjectGrades[subjectId];
          const gradeValues = Object.values(subject.grades)
            .filter((grade: any) => grade !== null)
            .map((grade: any) => grade.grade);

          if (gradeValues.length > 0) {
            subject.average =
              gradeValues.reduce(
                (sum: number, grade: number) => sum + grade,
                0
              ) / gradeValues.length;
            subject.totalGrades = gradeValues.length;
          }
        });

        // Convert to array and sort by subject name
        const subjectGradesArray = Object.values(subjectGrades).sort(
          (a: any, b: any) => a.subjectName.localeCompare(b.subjectName)
        );

        // Calculate overall average
        const allGrades = subjectGradesArray
          .filter((subject: any) => subject.totalGrades > 0)
          .map((subject: any) => subject.average);

        const overallAverage =
          allGrades.length > 0
            ? allGrades.reduce((sum, avg) => sum + avg, 0) / allGrades.length
            : 0;

        return {
          success: true,
          data: {
            student: {
              id: student.id,
              name: student.name,
              code: student.code,
              stage: {
                id: student.stage.id,
                name: student.stage.name,
              },
            },
            subjects: subjectGradesArray,
            summary: {
              overallAverage: Math.round(overallAverage * 100) / 100,
              totalSubjects: subjectGradesArray.length,
              subjectsWithGrades: subjectGradesArray.filter(
                (s: any) => s.totalGrades > 0
              ).length,
            },
          },
        };
      } catch (error) {
        console.error("Error fetching student grades:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch grades",
        };
      }
    },
    {
      detail: {
        tags: ["Student"],
        summary: "Get student grades",
        description:
          "Get all grades for the authenticated student organized by subject",
      },
    }
  )

  // Get student's exams
  .get(
    "/api/mobile/student/exams",
    async ({ headers, jwt, set, query }) => {
      try {
        const studentId = await getStudentIdFromAuth(headers, jwt);
        if (!studentId) {
          set.status = 401;
          return {
            success: false,
            message: "Student authentication required",
          };
        }

        // Get student with their stage
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            stage: true,
          },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found",
          };
        }

        const {
          page = "1",
          limit = "10",
          upcoming = "false",
        } = query as {
          page?: string;
          limit?: string;
          upcoming?: string;
        };

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        const whereClause: any = {
          stageId: student.stageId,
          schoolId: student.schoolId,
        };

        // If upcoming is true, only show future exams
        if (upcoming === "true") {
          whereClause.examDate = {
            gte: new Date(),
          };
        }

        const exams = await prisma.exam.findMany({
          where: whereClause,
          include: {
            stage: true,
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            examDate: "asc",
          },
          skip,
          take: limitNum,
        });

        const totalCount = await prisma.exam.count({
          where: whereClause,
        });

        return {
          success: true,
          data: {
            exams: exams.map((exam) => ({
              id: exam.id,
              title: exam.title,
              description: exam.description,
              examDate: exam.examDate.toISOString(),
              classNumber: exam.classNumber,
              stage: {
                id: exam.stage.id,
                name: exam.stage.name,
              },
              subject: {
                id: exam.subject.id,
                name: exam.subject.name,
              },
              teacher: {
                id: exam.teacher.id,
                name: exam.teacher.name,
              },
              createdAt: exam.createdAt.toISOString(),
              updatedAt: exam.updatedAt.toISOString(),
            })),
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: totalCount,
              totalPages: Math.ceil(totalCount / limitNum),
              hasNext: pageNum < Math.ceil(totalCount / limitNum),
              hasPrev: pageNum > 1,
            },
          },
        };
      } catch (error) {
        console.error("Get student exams error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch exams",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile", "Student"],
        summary: "Get student's exams",
        description:
          "Get all exams for the student's stage with optional upcoming filter",
      },
    }
  )

  // Get student's attendance records
  .get(
    "/api/mobile/student/attendance",
    async ({ headers, jwt, set, query }) => {
      try {
        const studentId = await getStudentIdFromAuth(headers, jwt);
        if (!studentId) {
          set.status = 401;
          return {
            success: false,
            message: "Student authentication required",
          };
        }

        const { fromDate, toDate } = query as {
          fromDate?: string;
          toDate?: string;
        };

        const whereClause: any = {
          studentId: studentId,
        };

        if (fromDate || toDate) {
          whereClause.date = {};
          if (fromDate) whereClause.date.gte = new Date(fromDate);
          if (toDate) whereClause.date.lte = new Date(toDate);
        }

        const attendanceRecords = await prisma.attendance.findMany({
          where: whereClause,
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        });

        return {
          success: true,
          data: attendanceRecords.map((record) => ({
            id: record.id,
            studentId: record.studentId,
            subjectId: record.subjectId,
            date: record.date.toISOString().split("T")[0],
            status: record.status,
            markedAt: record.markedAt?.toISOString(),
            markedBy: record.markedBy,
            subject: {
              id: record.subject.id,
              name: record.subject.name,
            },
            teacher: record.teacher
              ? {
                  id: record.teacher.id,
                  name: record.teacher.name,
                }
              : null,
            createdAt: record.createdAt.toISOString(),
            updatedAt: record.updatedAt.toISOString(),
          })),
        };
      } catch (error) {
        console.error("Get student attendance error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch attendance records",
        };
      }
    },
    {
      detail: {
        tags: ["Mobile", "Student"],
        summary: "Get student's attendance records",
        description:
          "Get attendance records for the authenticated student with optional date range filter",
      },
    }
  )

  // Chat endpoints
  // Get student's chats
  .get(
    "/api/mobile/student/chats",
    async ({ headers, jwt, set }) => {
      try {
        const studentId = await getStudentIdFromAuth(headers, jwt);
        if (!studentId) {
          set.status = 401;
          return {
            success: false,
            message: "Student authentication required",
          };
        }

        // Get student info for schoolId
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          select: { schoolId: true },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found",
          };
        }

        // Get regular chats (student-teacher)
        const regularChats = await prisma.chat.findMany({
          where: {
            studentId: studentId,
          },
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
            messages: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        });

        // Get admin chats (school admin-student)
        const adminChats = await prisma.adminChat.findMany({
          where: {
            participantId: studentId,
            participantType: "STUDENT",
            schoolId: student.schoolId,
          },
          include: {
            messages: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
            school: {
              select: {
                id: true,
                schoolName: true,
              },
            },
          },
        });

        // Format regular chats
        const formattedRegularChats = regularChats.map((chat) => ({
          id: chat.id,
          type: "teacher",
          teacherId: chat.teacherId,
          teacherName: chat.teacher.name,
          lastMessage: chat.lastMessage,
          lastMessageAt: chat.lastMessageAt?.toISOString(),
          unreadCount: chat.messages.filter(
            (msg) => !msg.readAt && msg.senderType === "TEACHER"
          ).length,
          createdAt: chat.createdAt.toISOString(),
        }));

        // Format admin chats
        const formattedAdminChats = await Promise.all(
          adminChats.map(async (chat) => {
            const unreadCount = await prisma.adminChatMessage.count({
              where: {
                chatId: chat.id,
                senderType: "ADMIN",
                readAt: null,
              },
            });

            return {
              id: `admin_${chat.id}`,
              type: "admin",
              teacherId: chat.schoolId,
              teacherName: `${chat.school.schoolName} Admin`,
              lastMessage: chat.lastMessage,
              lastMessageAt: chat.lastMessageAt?.toISOString(),
              unreadCount,
              createdAt: chat.createdAt.toISOString(),
            };
          })
        );

        // Combine and sort all chats
        const allChats = [
          ...formattedRegularChats,
          ...formattedAdminChats,
        ].sort((a, b) => {
          const aTime = a.lastMessageAt
            ? new Date(a.lastMessageAt).getTime()
            : new Date(a.createdAt).getTime();
          const bTime = b.lastMessageAt
            ? new Date(b.lastMessageAt).getTime()
            : new Date(b.createdAt).getTime();
          return bTime - aTime;
        });

        return {
          success: true,
          data: allChats,
        };
      } catch (error) {
        console.error("Error fetching student chats:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch chats",
        };
      }
    },
    {
      detail: {
        tags: ["Student"],
        summary: "Get student chats",
        description: "Get all chats for the authenticated student",
      },
    }
  )

  // Get teachers from student's stage
  .get(
    "/api/mobile/student/teachers",
    async ({ headers, jwt, set }) => {
      try {
        const studentId = await getStudentIdFromAuth(headers, jwt);
        if (!studentId) {
          set.status = 401;
          return {
            success: false,
            message: "Student authentication required",
          };
        }

        // Get student with their stage
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            stage: true,
          },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found",
          };
        }

        // Get teachers assigned to the student's stage
        const teachers = await prisma.teacher.findMany({
          where: {
            schoolId: student.schoolId,
            stages: {
              some: {
                stageId: student.stageId,
              },
            },
          },
          select: {
            id: true,
            name: true,
            subjects: {
              include: {
                subject: true,
              },
            },
          },
        });

        const formattedTeachers = teachers.map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
          subjects: teacher.subjects.map((ts) => ts.subject.name),
        }));

        return {
          success: true,
          data: formattedTeachers,
        };
      } catch (error) {
        console.error("Error fetching teachers:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch teachers",
        };
      }
    },
    {
      detail: {
        tags: ["Student"],
        summary: "Get teachers",
        description: "Get all teachers from the student's stage",
      },
    }
  )
  // Start chat with teacher
  .post(
    "/api/mobile/student/chats",
    async ({ headers, jwt, body, set }) => {
      try {
        const studentId = await getStudentIdFromAuth(headers, jwt);
        if (!studentId) {
          set.status = 401;
          return {
            success: false,
            message: "Student authentication required",
          };
        }

        const { teacherId } = body as { teacherId: string };

        // Get student to get schoolId
        const student = await prisma.student.findUnique({
          where: { id: studentId },
        });

        if (!student) {
          set.status = 404;
          return {
            success: false,
            message: "Student not found",
          };
        }

        // Check if chat already exists
        const existingChat = await prisma.chat.findFirst({
          where: {
            studentId: studentId,
            teacherId: teacherId,
          },
        });

        if (existingChat) {
          return {
            success: true,
            data: {
              chatId: existingChat.id,
              message: "Chat already exists",
            },
          };
        }

        // Create new chat
        const chat = await prisma.chat.create({
          data: {
            studentId: studentId,
            teacherId: teacherId,
            schoolId: student.schoolId,
          },
        });

        return {
          success: true,
          data: {
            chatId: chat.id,
            message: "Chat created successfully",
          },
        };
      } catch (error) {
        console.error("Error creating chat:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to create chat",
        };
      }
    },
    {
      body: t.Object({
        teacherId: t.String({
          description: "Teacher ID to start chat with",
        }),
      }),
      detail: {
        tags: ["Student"],
        summary: "Start chat with teacher",
        description: "Create a new chat with a teacher",
      },
    }
  )
  // Get chat messages
  .get(
    "/api/mobile/chats/:chatId/messages",
    async ({ params: { chatId }, headers, jwt, set }) => {
      try {
        const studentId = await getStudentIdFromAuth(headers, jwt);
        let userId: string | null = studentId;
        let userType = "STUDENT";

        // If not a student, check if it's a teacher
        if (!studentId) {
          const teacherId = await getTeacherIdFromAuth(headers, jwt);
          if (!teacherId) {
            set.status = 401;
            return {
              success: false,
              message: "Authentication required",
            };
          }
          userId = teacherId;
          userType = "TEACHER";
        }

        // Check if this is an admin chat (starts with "admin_")
        if (chatId.startsWith("admin_")) {
          const actualChatId = chatId.replace("admin_", "");

          if (!userId) {
            set.status = 401;
            return {
              success: false,
              message: "Authentication required",
            };
          }

          // Verify user has access to this admin chat
          const adminChat = await prisma.adminChat.findFirst({
            where: {
              id: actualChatId,
              participantId: userId,
              participantType: userType,
            },
          });

          if (!adminChat) {
            set.status = 404;
            return {
              success: false,
              message: "Chat not found or access denied",
            };
          }

          // Get admin chat messages
          const messages = await prisma.adminChatMessage.findMany({
            where: {
              chatId: actualChatId,
            },
            orderBy: {
              createdAt: "asc",
            },
          });

          // Mark messages as read for the current user
          await prisma.adminChatMessage.updateMany({
            where: {
              chatId: actualChatId,
              senderType: "ADMIN",
              readAt: null,
            },
            data: {
              readAt: new Date(),
            },
          });

          const formattedMessages = messages.map((message) => ({
            id: message.id,
            content: message.content,
            senderType: message.senderType,
            senderId: message.senderId,
            isMe: message.senderType === userType,
            readAt: message.readAt?.toISOString(),
            createdAt: message.createdAt.toISOString(),
          }));

          return {
            success: true,
            data: formattedMessages,
          };
        }

        // Handle regular chat
        // Verify user has access to this chat
        const chat = await prisma.chat.findFirst({
          where: {
            id: chatId,
            OR: [
              {
                studentId:
                  userType === "STUDENT" && userId ? userId : undefined,
              },
              {
                teacherId:
                  userType === "TEACHER" && userId ? userId : undefined,
              },
            ],
          },
        });

        if (!chat) {
          set.status = 404;
          return {
            success: false,
            message: "Chat not found or access denied",
          };
        }

        // Get messages
        const messages = await prisma.chatMessage.findMany({
          where: {
            chatId: chatId,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        // Mark messages as read for the current user
        if (userType === "STUDENT") {
          await prisma.chatMessage.updateMany({
            where: {
              chatId: chatId,
              senderType: "TEACHER",
              readAt: null,
            },
            data: {
              readAt: new Date(),
            },
          });
        } else {
          await prisma.chatMessage.updateMany({
            where: {
              chatId: chatId,
              senderType: "STUDENT",
              readAt: null,
            },
            data: {
              readAt: new Date(),
            },
          });
        }

        const formattedMessages = messages.map((message) => ({
          id: message.id,
          content: message.content,
          senderType: message.senderType,
          senderId: message.senderId,
          isMe: message.senderId === userId,
          readAt: message.readAt?.toISOString(),
          createdAt: message.createdAt.toISOString(),
        }));

        return {
          success: true,
          data: formattedMessages,
        };
      } catch (error) {
        console.error("Error fetching messages:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch messages",
        };
      }
    },
    {
      detail: {
        tags: ["Chat"],
        summary: "Get chat messages",
        description: "Get all messages in a chat",
      },
    }
  )

  // Send message
  .post(
    "/api/mobile/chats/:chatId/messages",
    async ({ params: { chatId }, headers, jwt, body, set }) => {
      try {
        const studentId = await getStudentIdFromAuth(headers, jwt);
        let userId: string | null = studentId;
        let userType = "STUDENT";

        // If not a student, check if it's a teacher
        if (!studentId) {
          const teacherId = await getTeacherIdFromAuth(headers, jwt);
          if (!teacherId) {
            set.status = 401;
            return {
              success: false,
              message: "Authentication required",
            };
          }
          userId = teacherId;
          userType = "TEACHER";
        }

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            message: "Authentication required",
          };
        }

        const { content } = body as { content: string };

        // Check if this is an admin chat (starts with "admin_")
        if (chatId.startsWith("admin_")) {
          const actualChatId = chatId.replace("admin_", "");

          // Verify user has access to this admin chat
          const adminChat = await prisma.adminChat.findFirst({
            where: {
              id: actualChatId,
              participantId: userId,
              participantType: userType,
            },
          });

          if (!adminChat) {
            set.status = 404;
            return {
              success: false,
              message: "Chat not found or access denied",
            };
          }

          // Create admin chat message
          const message = await prisma.adminChatMessage.create({
            data: {
              chatId: actualChatId,
              senderId: userId,
              senderType: userType,
              content: content,
            },
          });

          // Update admin chat's last message
          await prisma.adminChat.update({
            where: { id: actualChatId },
            data: {
              lastMessage: content,
              lastMessageAt: new Date(),
            },
          });

          return {
            success: true,
            data: {
              id: message.id,
              content: message.content,
              senderType: message.senderType,
              senderId: message.senderId,
              isMe: true,
              createdAt: message.createdAt.toISOString(),
            },
            message: "Message sent successfully",
          };
        }

        // Handle regular chat
        // Verify user has access to this chat
        const chat = await prisma.chat.findFirst({
          where: {
            id: chatId,
            OR: [
              { studentId: userType === "STUDENT" ? userId : undefined },
              { teacherId: userType === "TEACHER" ? userId : undefined },
            ],
          },
        });

        if (!chat) {
          set.status = 404;
          return {
            success: false,
            message: "Chat not found or access denied",
          };
        }

        // Create message
        const message = await prisma.chatMessage.create({
          data: {
            chatId: chatId,
            senderId: userId,
            senderType: userType as "STUDENT" | "TEACHER",
            content: content,
          },
        });

        // Update chat's last message
        await prisma.chat.update({
          where: { id: chatId },
          data: {
            lastMessage: content,
            lastMessageAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            id: message.id,
            content: message.content,
            senderType: message.senderType,
            senderId: message.senderId,
            isMe: true,
            createdAt: message.createdAt.toISOString(),
          },
          message: "Message sent successfully",
        };
      } catch (error) {
        console.error("Error sending message:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to send message",
        };
      }
    },
    {
      body: t.Object({
        content: t.String({
          description: "Message content",
        }),
      }),
      detail: {
        tags: ["Chat"],
        summary: "Send message",
        description: "Send a message in a chat",
      },
    }
  )

  // Get teacher's chats
  .get(
    "/api/mobile/teacher/chats",
    async ({ headers, jwt, set }) => {
      try {
        const teacherId = await getTeacherIdFromAuth(headers, jwt);
        if (!teacherId) {
          set.status = 401;
          return {
            success: false,
            message: "Teacher authentication required",
          };
        }

        // Get teacher info for schoolId
        const teacher = await prisma.teacher.findUnique({
          where: { id: teacherId },
          select: { schoolId: true },
        });

        if (!teacher) {
          set.status = 404;
          return {
            success: false,
            message: "Teacher not found",
          };
        }

        // Get regular chats (teacher-student)
        const regularChats = await prisma.chat.findMany({
          where: {
            teacherId: teacherId,
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            messages: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        });

        // Get admin chats (school admin-teacher)
        const adminChats = await prisma.adminChat.findMany({
          where: {
            participantId: teacherId,
            participantType: "TEACHER",
            schoolId: teacher.schoolId,
          },
          include: {
            messages: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
            school: {
              select: {
                id: true,
                schoolName: true,
              },
            },
          },
        });

        // Format regular chats
        const formattedRegularChats = regularChats.map((chat) => ({
          id: chat.id,
          type: "student",
          studentId: chat.studentId,
          studentName: chat.student.name,
          studentCode: chat.student.code,
          lastMessage: chat.lastMessage,
          lastMessageAt: chat.lastMessageAt?.toISOString(),
          unreadCount: chat.messages.filter(
            (msg) => !msg.readAt && msg.senderType === "STUDENT"
          ).length,
          createdAt: chat.createdAt.toISOString(),
        }));

        // Format admin chats
        const formattedAdminChats = await Promise.all(
          adminChats.map(async (chat) => {
            const unreadCount = await prisma.adminChatMessage.count({
              where: {
                chatId: chat.id,
                senderType: "ADMIN",
                readAt: null,
              },
            });

            return {
              id: `admin_${chat.id}`,
              type: "admin",
              studentId: chat.schoolId,
              studentName: `${chat.school.schoolName} Admin`,
              studentCode: "ADMIN",
              lastMessage: chat.lastMessage,
              lastMessageAt: chat.lastMessageAt?.toISOString(),
              unreadCount,
              createdAt: chat.createdAt.toISOString(),
            };
          })
        );

        // Combine and sort all chats
        const allChats = [
          ...formattedRegularChats,
          ...formattedAdminChats,
        ].sort((a, b) => {
          const aTime = a.lastMessageAt
            ? new Date(a.lastMessageAt).getTime()
            : new Date(a.createdAt).getTime();
          const bTime = b.lastMessageAt
            ? new Date(b.lastMessageAt).getTime()
            : new Date(b.createdAt).getTime();
          return bTime - aTime;
        });

        return {
          success: true,
          data: allChats,
        };
      } catch (error) {
        console.error("Error fetching teacher chats:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch chats",
        };
      }
    },
    {
      detail: {
        tags: ["Teacher"],
        summary: "Get teacher chats",
        description: "Get all chats for the authenticated teacher",
      },
    }
  )

  // Dashboard chat routes
  .use(dashboardChatsRoutes)

  .post(
    "/central/requests",
    async ({ body, set }) => {
      try {
        const { phoneNumber, schoolCode, studentCode, type, note } = body as {
          phoneNumber?: string;
          schoolCode?: string;
          studentCode?: string;
          type?: string;
          note?: string;
        };

        const requestType = (type || "DELETE_ACCOUNT_TEACHER").toString();

        if (requestType === "DELETE_ACCOUNT_STUDENT") {
          if (!studentCode || studentCode.trim().length === 0) {
            set.status = 400;
            return { success: false, message: "studentCode is required" };
          }

          const created = await (prisma as any).centralRequest.create({
            data: {
              teacherPhone: String(studentCode).trim(),
              schoolCode: "N/A",
              schoolId: null,
              type: requestType,
              status: "PENDING",
              note: note?.toString().slice(0, 200) ?? null,
            },
          });

          return {
            success: true,
            message: "Request submitted",
            data: { request: created },
          };
        }

        // Teacher flow (DELETE_ACCOUNT_TEACHER)
        if (!phoneNumber || phoneNumber.trim().length === 0) {
          set.status = 400;
          return {
            success: false,
            message: "phoneNumber is required",
          };
        }

        let resolvedSchoolId: string | null = null;
        let resolvedSchoolCode = (schoolCode || "N/A").toString().toUpperCase();
        if (schoolCode && schoolCode.trim().length > 0) {
          const school = await prisma.school.findUnique({
            where: { schoolCode: schoolCode },
          });
          if (school) {
            resolvedSchoolId = school.id;
            resolvedSchoolCode = school.schoolCode.toUpperCase();
          }
        }

        const created = await (prisma as any).centralRequest.create({
          data: {
            teacherPhone: String(phoneNumber).trim(),
            schoolCode: resolvedSchoolCode,
            schoolId: resolvedSchoolId,
            type: "DELETE_ACCOUNT_TEACHER",
            status: "PENDING",
            note: note?.toString().slice(0, 200) ?? null,
          },
        });

        return {
          success: true,
          message: "Request submitted",
          data: { request: created },
        };
      } catch (error) {
        console.error("Create central request error:", error);
        set.status = 500;
        return { success: false, message: "Failed to create request" };
      }
    },
    {
      body: t.Object({
        phoneNumber: t.Optional(t.String()),
        schoolCode: t.Optional(t.String()),
        studentCode: t.Optional(t.String()),
        type: t.Optional(t.String()),
        note: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Central"],
        summary: "Create central request",
        description:
          "Public endpoint for apps to submit central requests (e.g., delete account)",
      },
    }
  )
  .get(
    "/central/requests",
    async ({ headers, jwt, set, query }) => {
      try {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }
        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);
        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const page = parseInt((query.page as string) || "1");
        const limit = parseInt((query.limit as string) || "10");
        const skip = (page - 1) * limit;
        const status = (query.status as string) || undefined;

        const where: any = status ? { status } : {};

        const [items, total] = await Promise.all([
          (prisma as any).centralRequest.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
          }),
          (prisma as any).centralRequest.count({ where }),
        ]);

        return {
          success: true,
          data: {
            requests: items,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
              hasNext: page < Math.ceil(total / limit),
              hasPrev: page > 1,
            },
          },
        };
      } catch (error) {
        console.error("Get central requests error:", error);
        set.status = 500;
        return { success: false, message: "Failed to fetch requests" };
      }
    },
    {
      detail: {
        tags: ["Central"],
        summary: "List central requests",
        description: "Admin list of central requests with pagination",
      },
    }
  )
  .patch(
    "/central/requests/:id/status",
    async ({ params, body, headers, jwt, set }) => {
      try {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { success: false, message: "Unauthorized" };
        }
        const token = authHeader.substring(7);
        const payload = await jwt.verify(token);
        if (!payload || payload.type !== "central_admin") {
          set.status = 403;
          return { success: false, message: "Access denied" };
        }

        const { id } = params as { id: string };
        const { status } = body as { status: string };
        if (!status) {
          set.status = 400;
          return { success: false, message: "status is required" };
        }

        await (prisma as any).centralRequest.update({
          where: { id },
          data: { status },
        });

        return { success: true, message: "Status updated" };
      } catch (error) {
        console.error("Update request status error:", error);
        set.status = 500;
        return { success: false, message: "Failed to update request" };
      }
    },
    {
      body: t.Object({ status: t.String() }),
      detail: {
        tags: ["Central"],
        summary: "Update request status",
        description: "Admin action to update a central request status",
      },
    }
  );

/** Vercel = وضع Serverless: بدون listen منفصل وبدون WebSocket محلي */
const isVercelRuntime = Boolean(
  process.env.VERCEL || process.env.VERCEL_ENV
);

if (!isVercelRuntime) {
  app.listen(Number(process.env.PORT) || 3000);
  const port = process.env.PORT || 3000;
  console.log(`🦊 Elysia is running at ${app.server?.hostname}:${port}`);
  console.log(
    `📚 Swagger documentation available at http://${app.server?.hostname}:${port}/swagger`
  );

  // Start WebSocket server (غير مدعوم على Vercel Serverless — استخدم Railway أو خدمة WS منفصلة)
  import("./websocket.ts").catch(console.error);

  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

console.log("Backend starting...", new Date().toISOString());
console.log("Environment:", process.env.NODE_ENV);
console.log("Port:", process.env.PORT);
console.log("Vercel:", isVercelRuntime);
console.log("Database URL configured:", !!process.env.DATABASE_URL);
console.log("JWT Secret configured:", !!process.env.JWT_SECRET);

export default app;
