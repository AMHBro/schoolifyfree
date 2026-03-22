import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma-client.ts";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userType?: "STUDENT" | "TEACHER" | "ADMIN";
  schoolId?: string;
}

interface ChatMessage {
  type:
    | "message"
    | "join_chat"
    | "leave_chat"
    | "typing"
    | "stop_typing"
    | "authenticate";
  chatId?: string;
  content?: string;
  senderId?: string;
  senderType?: "STUDENT" | "TEACHER" | "ADMIN";
  messageId?: string;
  createdAt?: string;
  token?: string;
}

class ChatWebSocketServer {
  private wss: WebSocketServer;
  private chatRooms: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketServer();
    console.log(`🔌 WebSocket server running on port ${port}`);
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws: AuthenticatedWebSocket, request) => {
      console.log("New WebSocket connection");

      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString()) as ChatMessage;

          // Handle authentication
          if (message.type === "authenticate" && message.token) {
            await this.authenticateConnection(ws, message.token);
            return;
          }

          // Ensure user is authenticated for all other operations
          if (!ws.userId || !ws.userType) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Authentication required",
              })
            );
            return;
          }

          await this.handleMessage(ws, message);
        } catch (error) {
          console.error("WebSocket message error:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
            })
          );
        }
      });

      ws.on("close", () => {
        this.handleDisconnection(ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });
  }

  private async authenticateConnection(
    ws: AuthenticatedWebSocket,
    token: string
  ) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;

      if (payload.studentId) {
        // Student authentication
        const student = await prisma.student.findUnique({
          where: { id: payload.studentId },
          select: { id: true, schoolId: true },
        });

        if (student) {
          ws.userId = student.id;
          ws.userType = "STUDENT";
          ws.schoolId = student.schoolId;
        }
      } else if (payload.teacherId) {
        // Teacher authentication
        const teacher = await prisma.teacher.findUnique({
          where: { id: payload.teacherId },
          select: { id: true, schoolId: true },
        });

        if (teacher) {
          ws.userId = teacher.id;
          ws.userType = "TEACHER";
          ws.schoolId = teacher.schoolId;
        }
      }

      if (ws.userId) {
        ws.send(
          JSON.stringify({
            type: "authenticated",
            userId: ws.userId,
            userType: ws.userType,
          })
        );
        console.log(`User authenticated: ${ws.userType} ${ws.userId}`);
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Authentication failed",
          })
        );
        ws.close();
      }
    } catch (error) {
      console.error("Authentication error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid token",
        })
      );
      ws.close();
    }
  }

  private async handleMessage(
    ws: AuthenticatedWebSocket,
    message: ChatMessage
  ) {
    switch (message.type) {
      case "join_chat":
        await this.handleJoinChat(ws, message.chatId!);
        break;

      case "leave_chat":
        this.handleLeaveChat(ws, message.chatId!);
        break;

      case "message":
        await this.handleChatMessage(ws, message);
        break;

      case "typing":
        this.handleTyping(ws, message.chatId!, true);
        break;

      case "stop_typing":
        this.handleTyping(ws, message.chatId!, false);
        break;

      default:
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Unknown message type",
          })
        );
    }
  }

  private async handleJoinChat(ws: AuthenticatedWebSocket, chatId: string) {
    try {
      let hasAccess = false;

      // Check if this is an admin chat (starts with "admin_")
      if (chatId.startsWith("admin_")) {
        const actualChatId = chatId.replace("admin_", "");

        // Verify user has access to this admin chat
        const adminChat = await prisma.adminChat.findFirst({
          where: {
            id: actualChatId,
            participantId: ws.userId,
            participantType: ws.userType,
          },
        });

        hasAccess = !!adminChat;
      } else {
        // Regular chat verification
        const chat = await prisma.chat.findFirst({
          where: {
            id: chatId,
            OR: [
              { studentId: ws.userType === "STUDENT" ? ws.userId : undefined },
              { teacherId: ws.userType === "TEACHER" ? ws.userId : undefined },
            ],
          },
        });

        hasAccess = !!chat;
      }

      if (!hasAccess) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Chat not found or access denied",
          })
        );
        return;
      }

      // Add to chat room
      if (!this.chatRooms.has(chatId)) {
        this.chatRooms.set(chatId, new Set());
      }
      this.chatRooms.get(chatId)!.add(ws);

      ws.send(
        JSON.stringify({
          type: "joined_chat",
          chatId: chatId,
        })
      );

      console.log(`User ${ws.userId} joined chat ${chatId}`);
    } catch (error) {
      console.error("Join chat error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to join chat",
        })
      );
    }
  }

  private handleLeaveChat(ws: AuthenticatedWebSocket, chatId: string) {
    const chatRoom = this.chatRooms.get(chatId);
    if (chatRoom) {
      chatRoom.delete(ws);
      if (chatRoom.size === 0) {
        this.chatRooms.delete(chatId);
      }
    }

    ws.send(
      JSON.stringify({
        type: "left_chat",
        chatId: chatId,
      })
    );

    console.log(`User ${ws.userId} left chat ${chatId}`);
  }

  private async handleChatMessage(
    ws: AuthenticatedWebSocket,
    message: ChatMessage
  ) {
    try {
      if (!message.chatId || !message.content) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Missing chatId or content",
          })
        );
        return;
      }

      // Check if this is an admin chat (starts with "admin_")
      if (message.chatId.startsWith("admin_")) {
        const actualChatId = message.chatId.replace("admin_", "");

        // Verify user has access to this admin chat
        const adminChat = await prisma.adminChat.findFirst({
          where: {
            id: actualChatId,
            participantId: ws.userId,
          },
        });

        if (!adminChat) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Chat not found or access denied",
            })
          );
          return;
        }

        // Save message to admin chat database
        const savedMessage = await prisma.adminChatMessage.create({
          data: {
            chatId: actualChatId,
            senderId: ws.userId!,
            senderType: ws.userType!,
            content: message.content,
          },
        });

        // Update admin chat's last message
        await prisma.adminChat.update({
          where: { id: actualChatId },
          data: {
            lastMessage: message.content,
            lastMessageAt: new Date(),
          },
        });

        // Broadcast message to all users in the chat room
        const chatRoom = this.chatRooms.get(message.chatId);
        if (chatRoom) {
          const messageData = {
            type: "message",
            chatId: message.chatId,
            messageId: savedMessage.id,
            content: savedMessage.content,
            senderId: savedMessage.senderId,
            senderType: savedMessage.senderType,
            createdAt: savedMessage.createdAt.toISOString(),
          };

          chatRoom.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  ...messageData,
                  isMe: client.userId === ws.userId,
                })
              );
            }
          });
        }

        console.log(
          `Admin message sent in chat ${message.chatId} by ${ws.userType} ${ws.userId}`
        );
        return;
      }

      // Handle regular chat
      const chat = await prisma.chat.findFirst({
        where: {
          id: message.chatId,
          OR: [
            { studentId: ws.userType === "STUDENT" ? ws.userId : undefined },
            { teacherId: ws.userType === "TEACHER" ? ws.userId : undefined },
          ],
        },
      });

      if (!chat) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Chat not found or access denied",
          })
        );
        return;
      }

      // Save message to database - only for regular chats with STUDENT/TEACHER
      if (ws.userType === "STUDENT" || ws.userType === "TEACHER") {
        const savedMessage = await prisma.chatMessage.create({
          data: {
            chatId: message.chatId,
            senderId: ws.userId!,
            senderType: ws.userType as "STUDENT" | "TEACHER",
            content: message.content,
          },
        });

        // Update chat's last message
        await prisma.chat.update({
          where: { id: message.chatId },
          data: {
            lastMessage: message.content,
            lastMessageAt: new Date(),
          },
        });

        // Broadcast message to all users in the chat room
        const chatRoom = this.chatRooms.get(message.chatId);
        if (chatRoom) {
          const messageData = {
            type: "message",
            chatId: message.chatId,
            messageId: savedMessage.id,
            content: savedMessage.content,
            senderId: savedMessage.senderId,
            senderType: savedMessage.senderType,
            createdAt: savedMessage.createdAt.toISOString(),
          };

          chatRoom.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  ...messageData,
                  isMe: client.userId === ws.userId,
                })
              );
            }
          });
        }

        console.log(
          `Message sent in chat ${message.chatId} by ${ws.userType} ${ws.userId}`
        );
      }
    } catch (error) {
      console.error("Chat message error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to send message",
        })
      );
    }
  }

  private handleTyping(
    ws: AuthenticatedWebSocket,
    chatId: string,
    isTyping: boolean
  ) {
    const chatRoom = this.chatRooms.get(chatId);
    if (chatRoom) {
      const typingData = {
        type: isTyping ? "user_typing" : "user_stop_typing",
        chatId: chatId,
        userId: ws.userId,
        userType: ws.userType,
      };

      // Broadcast typing status to other users in the chat room
      chatRoom.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(typingData));
        }
      });
    }
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    // Remove from all chat rooms
    this.chatRooms.forEach((chatRoom, chatId) => {
      if (chatRoom.has(ws)) {
        chatRoom.delete(ws);
        if (chatRoom.size === 0) {
          this.chatRooms.delete(chatId);
        }
      }
    });

    console.log(`User ${ws.userId} disconnected`);
  }
}

// Start WebSocket server
const wsPort = parseInt(process.env.WS_PORT || "3003");
new ChatWebSocketServer(wsPort);

export default ChatWebSocketServer;
