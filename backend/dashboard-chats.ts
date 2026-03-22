import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// JWT Secret
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

type SchoolAuthResult =
  | { ok: true; schoolId: string }
  | { ok: false; error: string; status: number };

// Helper function to verify school authentication
const verifySchoolAuth = async (
  headers: any,
  jwt: any
): Promise<SchoolAuthResult> => {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const token = authHeader.substring(7);
  const payload = (await jwt.verify(token)) as any;

  if (!payload || payload.type !== "school") {
    return { ok: false, error: "Access denied", status: 403 };
  }

  const schoolId = payload.schoolId as string;
  if (!schoolId) {
    return { ok: false, error: "Invalid token: missing schoolId", status: 403 };
  }

  return { ok: true, schoolId };
};

// Dashboard chat endpoints
export const dashboardChatsRoutes = new Elysia({ prefix: "/api/dashboard" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
      exp: "10y", // Set expiration to 10 years (effectively no expiration for mobile apps)
    })
  )
  // Get all teachers and students for chat selection
  .get(
    "/chat/participants",
    async ({ headers, jwt, set }) => {
      try {
        const authResult = await verifySchoolAuth(headers, jwt);
        if (!authResult.ok) {
          set.status = authResult.status;
          return { success: false, message: authResult.error };
        }

        const { schoolId } = authResult;

        // Get all teachers and students from this school
        const [teachers, students] = await Promise.all([
          prisma.teacher.findMany({
            where: { schoolId },
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              subjects: {
                include: {
                  subject: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          }),
          prisma.student.findMany({
            where: { schoolId },
            select: {
              id: true,
              name: true,
              code: true,
              stage: {
                select: {
                  name: true,
                },
              },
            },
          }),
        ]);

        return {
          success: true,
          data: {
            teachers: teachers.map((teacher) => ({
              id: teacher.id,
              name: teacher.name,
              phoneNumber: teacher.phoneNumber,
              type: "TEACHER",
              subjects: teacher.subjects.map((ts) => ts.subject.name),
            })),
            students: students.map((student) => ({
              id: student.id,
              name: student.name,
              code: student.code,
              type: "STUDENT",
              stage: student.stage?.name,
            })),
          },
        };
      } catch (error) {
        console.error("Get chat participants error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch participants",
        };
      }
    },
    {
      detail: {
        tags: ["Dashboard Chats"],
        summary: "Get all teachers and students for chat",
        description:
          "Get all teachers and students that the school admin can chat with",
      },
    }
  )

  // Get or create a chat with a participant
  .post(
    "/chat/start",
    async ({ headers, jwt, body, set }) => {
      try {
        const authResult = await verifySchoolAuth(headers, jwt);
        if (!authResult.ok) {
          set.status = authResult.status;
          return { success: false, message: authResult.error };
        }

        const { schoolId } = authResult;
        const { participantId, participantType } = body as {
          participantId: string;
          participantType: "TEACHER" | "STUDENT";
        };

        // Check if participant exists and belongs to this school
        if (participantType === "TEACHER") {
          const teacher = await prisma.teacher.findFirst({
            where: { id: participantId, schoolId },
          });
          if (!teacher) {
            set.status = 404;
            return { success: false, message: "Teacher not found" };
          }
        } else {
          const student = await prisma.student.findFirst({
            where: { id: participantId, schoolId },
          });
          if (!student) {
            set.status = 404;
            return { success: false, message: "Student not found" };
          }
        }

        // Check if chat already exists
        const existingChat = await prisma.adminChat.findFirst({
          where: {
            schoolId,
            participantId,
            participantType,
          },
        });

        if (existingChat) {
          return {
            success: true,
            data: { chatId: existingChat.id },
            message: "Chat already exists",
          };
        }

        // Create new chat
        const newChat = await prisma.adminChat.create({
          data: {
            schoolId,
            participantId,
            participantType,
          },
        });

        return {
          success: true,
          data: { chatId: newChat.id },
          message: "Chat created successfully",
        };
      } catch (error) {
        console.error("Start chat error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to start chat",
        };
      }
    },
    {
      body: t.Object({
        participantId: t.String(),
        participantType: t.Union([t.Literal("TEACHER"), t.Literal("STUDENT")]),
      }),
      detail: {
        tags: ["Dashboard Chats"],
        summary: "Start chat with participant",
        description: "Create or get existing chat with a teacher or student",
      },
    }
  )

  // Get all chats for the school admin
  .get(
    "/chats",
    async ({ headers, jwt, set }) => {
      try {
        const authResult = await verifySchoolAuth(headers, jwt);
        if (!authResult.ok) {
          set.status = authResult.status;
          return { success: false, message: authResult.error };
        }

        const { schoolId } = authResult;

        const chats = await prisma.adminChat.findMany({
          where: { schoolId },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { lastMessageAt: "desc" },
        });

        // Get participant details for each chat
        const chatList = await Promise.all(
          chats.map(async (chat) => {
            let participant = null;

            if (chat.participantType === "TEACHER") {
              participant = await prisma.teacher.findUnique({
                where: { id: chat.participantId },
                select: { id: true, name: true, phoneNumber: true },
              });
            } else {
              participant = await prisma.student.findUnique({
                where: { id: chat.participantId },
                select: { id: true, name: true, code: true },
              });
            }

            const unreadCount = await prisma.adminChatMessage.count({
              where: {
                chatId: chat.id,
                senderType: chat.participantType,
                readAt: null,
              },
            });

            return {
              id: chat.id,
              participantId: chat.participantId,
              participantType: chat.participantType,
              participant,
              lastMessage: chat.lastMessage,
              lastMessageAt: chat.lastMessageAt?.toISOString(),
              unreadCount,
              createdAt: chat.createdAt.toISOString(),
            };
          })
        );

        return {
          success: true,
          data: chatList,
        };
      } catch (error) {
        console.error("Get chats error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch chats",
        };
      }
    },
    {
      detail: {
        tags: ["Dashboard Chats"],
        summary: "Get all admin chats",
        description: "Get all chats for the school admin",
      },
    }
  )

  // Get messages for a specific chat
  .get(
    "/chats/:chatId/messages",
    async ({ params: { chatId }, headers, jwt, set }) => {
      try {
        const authResult = await verifySchoolAuth(headers, jwt);
        if (!authResult.ok) {
          set.status = authResult.status;
          return { success: false, message: authResult.error };
        }

        const { schoolId } = authResult;

        // Verify chat belongs to this school
        const chat = await prisma.adminChat.findFirst({
          where: { id: chatId, schoolId },
        });

        if (!chat) {
          set.status = 404;
          return { success: false, message: "Chat not found" };
        }

        // Get messages
        const messages = await prisma.adminChatMessage.findMany({
          where: { chatId },
          orderBy: { createdAt: "asc" },
        });

        // Mark messages as read for admin
        await prisma.adminChatMessage.updateMany({
          where: {
            chatId,
            senderType: { not: "ADMIN" },
            readAt: null,
          },
          data: { readAt: new Date() },
        });

        return {
          success: true,
          data: messages.map((message) => ({
            id: message.id,
            content: message.content,
            senderType: message.senderType,
            senderId: message.senderId,
            isMe: message.senderType === "ADMIN",
            readAt: message.readAt?.toISOString(),
            createdAt: message.createdAt.toISOString(),
          })),
        };
      } catch (error) {
        console.error("Get messages error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to fetch messages",
        };
      }
    },
    {
      detail: {
        tags: ["Dashboard Chats"],
        summary: "Get chat messages",
        description: "Get all messages for a specific chat",
      },
    }
  )

  // Send a message
  .post(
    "/chats/:chatId/messages",
    async ({ params: { chatId }, headers, jwt, body, set }) => {
      try {
        const authResult = await verifySchoolAuth(headers, jwt);
        if (!authResult.ok) {
          set.status = authResult.status;
          return { success: false, message: authResult.error };
        }

        const { schoolId } = authResult;
        const { content } = body as { content: string };

        // Verify chat belongs to this school
        const chat = await prisma.adminChat.findFirst({
          where: { id: chatId, schoolId },
        });

        if (!chat) {
          set.status = 404;
          return { success: false, message: "Chat not found" };
        }

        // Create message
        const message = await prisma.adminChatMessage.create({
          data: {
            chatId,
            senderId: schoolId, // Using schoolId as admin identifier
            senderType: "ADMIN",
            content,
          },
        });

        // Update chat's last message
        await prisma.adminChat.update({
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
        console.error("Send message error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to send message",
        };
      }
    },
    {
      body: t.Object({
        content: t.String(),
      }),
      detail: {
        tags: ["Dashboard Chats"],
        summary: "Send message",
        description: "Send a message in a chat",
      },
    }
  );
