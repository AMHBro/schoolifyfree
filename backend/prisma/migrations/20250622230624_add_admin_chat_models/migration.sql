-- CreateTable
CREATE TABLE "admin_chats" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "participantId" UUID NOT NULL,
    "participantType" TEXT NOT NULL,
    "lastMessage" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_chat_messages" (
    "id" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_chats_schoolId_participantId_participantType_key" ON "admin_chats"("schoolId", "participantId", "participantType");

-- AddForeignKey
ALTER TABLE "admin_chats" ADD CONSTRAINT "admin_chats_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_chat_messages" ADD CONSTRAINT "admin_chat_messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "admin_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
