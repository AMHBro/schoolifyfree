import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  List,
  Input,
  Button,
  Avatar,
  Typography,
  Space,
  Badge,
  Spin,
  Modal,
  Select,
  Empty,
  Tag,
  message,
} from "antd";
import {
  MessageOutlined,
  UserOutlined,
  TeamOutlined,
  SendOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Sider, Content } = Layout;
const { Option } = Select;

// Match API base URL behavior used in src/services/api.ts
const API_BASE_URL = import.meta.env.DEV ? "http://localhost:3000" : "";

interface Participant {
  id: string;
  name: string;
  type: "TEACHER" | "STUDENT";
  phoneNumber?: string;
  code?: string;
  subjects?: string[];
  stage?: string;
}

interface Chat {
  id: string;
  participantId: string;
  participantType: "TEACHER" | "STUDENT";
  participant: {
    id: string;
    name: string;
    phoneNumber?: string;
    code?: string;
  };
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

interface Message {
  id: string;
  content: string;
  senderType: string;
  senderId: string;
  isMe: boolean;
  readAt: string | null;
  createdAt: string;
}

const Chats: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { isRTL } = useLanguage();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chats
  const fetchChats = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out chats with deleted participants (where participant is null)
        const validChats = (data.data || []).filter((chat: Chat) => chat.participant !== null);
        setChats(validChats);
      } else {
        message.error(t("chats.messages.fetchChatsError"));
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      message.error(t("chats.messages.fetchChatsError"));
    } finally {
      setLoading(false);
    }
  };

  // Fetch participants
  const fetchParticipants = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/chat/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const allParticipants = [
          ...data.data.teachers.map((t: any) => ({ ...t, type: "TEACHER" })),
          ...data.data.students.map((s: any) => ({ ...s, type: "STUDENT" })),
        ];
        setParticipants(allParticipants);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  // Fetch messages for a chat
  const fetchMessages = async (chatId: string) => {
    if (!token) return;

    setMessagesLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/chats/${chatId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      } else {
        message.error(t("chats.messages.fetchMessagesError"));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      message.error(t("chats.messages.fetchMessagesError"));
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim() || !token) return;

    setSendingMessage(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/chats/${selectedChat.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: newMessage.trim(),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");
        // Update chat's last message
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  lastMessage: newMessage.trim(),
                  lastMessageAt: data.data.createdAt,
                }
              : chat
          )
        );
      } else {
        message.error(t("chats.messages.sendMessageError"));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      message.error(t("chats.messages.sendMessageError"));
    } finally {
      setSendingMessage(false);
    }
  };

  // Start a new chat
  const startNewChat = async () => {
    if (!selectedParticipant || !token) return;

    const participant = participants.find((p) => p.id === selectedParticipant);
    if (!participant) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/chat/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          participantId: participant.id,
          participantType: participant.type,
        }),
      });

      if (response.ok) {
        await response.json();
        setShowNewChatModal(false);
        setSelectedParticipant(null);
        message.success(t("chats.messages.chatStartedSuccess"));
        fetchChats(); // Refresh chats
      } else {
        message.error(t("chats.messages.startChatError"));
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      message.error(t("chats.messages.startChatError"));
    }
  };

  useEffect(() => {
    fetchChats();
    fetchParticipants();
  }, [token]);

  // Clear selected chat if its participant no longer exists
  useEffect(() => {
    if (selectedChat && !selectedChat.participant) {
      setSelectedChat(null);
      message.warning("The chat participant no longer exists");
    }
  }, [selectedChat]);

  const handleChatSelect = (chat: Chat) => {
    // Safety check: don't select chats with deleted participants
    if (!chat.participant) {
      message.warning("This chat participant no longer exists");
      return;
    }
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    return dayjs(dateString).format(t("chats.time.timeFormat"));
  };

  const formatChatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const now = dayjs();
    const date = dayjs(dateString);
    const diffInMinutes = now.diff(date, "minute");
    const diffInHours = now.diff(date, "hour");
    const diffInDays = now.diff(date, "day");

    if (diffInMinutes < 1) {
      return t("chats.time.now");
    } else if (diffInMinutes < 60) {
      return t("chats.time.minutesAgo", { minutes: diffInMinutes });
    } else if (diffInHours < 24) {
      return t("chats.time.hoursAgo", { hours: diffInHours });
    } else if (diffInDays < 7) {
      return t("chats.time.daysAgo", { days: diffInDays });
    } else {
      return date.format("MMM D");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <MessageOutlined
            style={{
              marginRight: isRTL ? 0 : 8,
              marginLeft: isRTL ? 8 : 0,
              color: "#1890ff",
            }}
          />
          {t("chats.title")}
        </Title>
        <Text type="secondary">{t("chats.subtitle")}</Text>
      </div>

      <Layout
        style={{
          minHeight: "600px",
          background: "#fff",
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        {/* Chats Sidebar */}
        <Sider
          width={350}
          reverseArrow={isRTL}
          style={{
            background: "#fafafa",
            borderRight: isRTL ? "none" : "1px solid #f0f0f0",
            borderLeft: isRTL ? "1px solid #f0f0f0" : "none",
          }}
        >
          <div style={{ padding: "16px" }}>
            <Space style={{ width: "100%", marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowNewChatModal(true)}
                style={{ flex: 1 }}
              >
                {t("chats.sidebar.newChat")}
              </Button>
            </Space>

            <Spin spinning={loading}>
              {chats.length === 0 ? (
                <Empty
                  description={t("chats.sidebar.noChats")}
                  style={{ marginTop: 40 }}
                />
              ) : (
                <List
                  dataSource={chats}
                  renderItem={(chat) => {
                    // Skip rendering if participant is null (defensive programming)
                    if (!chat.participant) return null;
                    
                    return (
                      <List.Item
                        key={chat.id}
                        onClick={() => handleChatSelect(chat)}
                        style={{
                          cursor: "pointer",
                          borderRadius: "8px",
                          marginBottom: "8px",
                          padding: "12px",
                          backgroundColor:
                            selectedChat?.id === chat.id ? "#e6f7ff" : "#fff",
                          border:
                            selectedChat?.id === chat.id
                              ? "1px solid #1890ff"
                              : "1px solid #f0f0f0",
                        }}
                      >
                        <List.Item.Meta
                          avatar={
                            <Badge count={chat.unreadCount} size="small">
                              <Avatar
                                icon={
                                  chat.participantType === "TEACHER" ? (
                                    <UserOutlined />
                                  ) : (
                                    <TeamOutlined />
                                  )
                                }
                                style={{
                                  backgroundColor:
                                    chat.participantType === "TEACHER"
                                      ? "#52c41a"
                                      : "#1890ff",
                                }}
                              />
                            </Badge>
                          }
                          title={
                            <Space>
                              <Text strong>{chat.participant.name}</Text>
                              <Tag
                                color={
                                  chat.participantType === "TEACHER"
                                    ? "green"
                                    : "blue"
                                }
                              >
                                {chat.participantType === "TEACHER"
                                  ? t("chats.participants.teacher")
                                  : t("chats.participants.student")}
                              </Tag>
                            </Space>
                          }
                          description={
                            <div>
                              <Text
                                type="secondary"
                                ellipsis
                                style={{ fontSize: "12px" }}
                              >
                                {chat.lastMessage ||
                                  t("chats.sidebar.noMessages")}
                              </Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: "11px" }}>
                                {formatChatTime(chat.lastMessageAt)}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Spin>
          </div>
        </Sider>

        {/* Messages Area */}
        <Content style={{ display: "flex", flexDirection: "column" }}>
          {selectedChat && selectedChat.participant ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid #f0f0f0",
                  backgroundColor: "#fafafa",
                }}
              >
                <Space>
                  <Avatar
                    icon={
                      selectedChat.participantType === "TEACHER" ? (
                        <UserOutlined />
                      ) : (
                        <TeamOutlined />
                      )
                    }
                    style={{
                      backgroundColor:
                        selectedChat.participantType === "TEACHER"
                          ? "#52c41a"
                          : "#1890ff",
                    }}
                  />
                  <div>
                    <Title level={5} style={{ margin: 0 }}>
                      {selectedChat.participant.name}
                    </Title>
                    <Text type="secondary">
                      {selectedChat.participantType === "TEACHER"
                        ? t("chats.participants.teacherInfo", {
                            phone: selectedChat.participant.phoneNumber || "",
                          })
                        : t("chats.participants.studentInfo", {
                            code: selectedChat.participant.code || "",
                          })}
                    </Text>
                  </div>
                </Space>
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  padding: "16px 24px",
                  overflowY: "auto",
                  maxHeight: "400px",
                }}
              >
                <Spin spinning={messagesLoading}>
                  {messages.length === 0 ? (
                    <Empty description={t("chats.messages.noMessagesYet")} />
                  ) : (
                    <div>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          style={{
                            display: "flex",
                            justifyContent: message.isMe
                              ? isRTL
                                ? "flex-start"
                                : "flex-end"
                              : isRTL
                              ? "flex-end"
                              : "flex-start",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "70%",
                              padding: "8px 12px",
                              borderRadius: "12px",
                              backgroundColor: message.isMe
                                ? "#1890ff"
                                : "#f0f0f0",
                              color: message.isMe ? "#fff" : "#000",
                              textAlign: isRTL ? "right" : "left",
                              direction: isRTL ? "rtl" : "ltr",
                            }}
                          >
                            <div>{message.content}</div>
                            <div
                              style={{
                                fontSize: "11px",
                                opacity: 0.7,
                                marginTop: "4px",
                                textAlign: isRTL ? "left" : "right",
                              }}
                            >
                              {formatMessageTime(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </Spin>
              </div>

              {/* Message Input */}
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid #f0f0f0",
                  backgroundColor: "#fafafa",
                }}
              >
                <Space.Compact style={{ width: "100%" }}>
                  <TextArea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t("chats.messages.typeMessage")}
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={sendingMessage}
                    disabled={!newMessage.trim()}
                  >
                    {t("chats.messages.send")}
                  </Button>
                </Space.Compact>
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Empty
                description={t("chats.messages.selectChat")}
                image={
                  <MessageOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
                }
              />
            </div>
          )}
        </Content>
      </Layout>

      {/* New Chat Modal */}
      <Modal
        title={t("chats.newChatModal.title")}
        open={showNewChatModal}
        onCancel={() => {
          setShowNewChatModal(false);
          setSelectedParticipant(null);
        }}
        onOk={startNewChat}
        okText={t("chats.newChatModal.startChat")}
        okButtonProps={{ disabled: !selectedParticipant }}
        width={600}
      >
        <Select
          style={{ width: "100%", marginBottom: 16 }}
          placeholder={t("chats.newChatModal.placeholder")}
          value={selectedParticipant}
          onChange={setSelectedParticipant}
          showSearch
          filterOption={true}
        >
          {participants.map((participant) => (
            <Option key={participant.id} value={participant.id}>
              <Space>
                <Avatar
                  size="small"
                  icon={
                    participant.type === "TEACHER" ? (
                      <UserOutlined />
                    ) : (
                      <TeamOutlined />
                    )
                  }
                  style={{
                    backgroundColor:
                      participant.type === "TEACHER" ? "#52c41a" : "#1890ff",
                  }}
                />
                <div>
                  <div>
                    <Text strong>{participant.name}</Text>
                    <Tag
                      color={participant.type === "TEACHER" ? "green" : "blue"}
                      style={{ marginLeft: 8 }}
                    >
                      {participant.type === "TEACHER"
                        ? t("chats.participants.teacher")
                        : t("chats.participants.student")}
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {participant.type === "TEACHER"
                      ? t("chats.newChatModal.teacherDetails", {
                          phone:
                            participant.phoneNumber ||
                            t("chats.newChatModal.noPhone"),
                          subjects:
                            participant.subjects?.join(", ") ||
                            t("chats.newChatModal.noSubjects"),
                        })
                      : t("chats.newChatModal.studentDetails", {
                          code:
                            participant.code || t("chats.newChatModal.noCode"),
                          stage:
                            participant.stage ||
                            t("chats.newChatModal.noStage"),
                        })}
                  </Text>
                </div>
              </Space>
            </Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
};

export default Chats;
