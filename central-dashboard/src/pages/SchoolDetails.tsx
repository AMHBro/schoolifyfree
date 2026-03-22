import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Statistic,
  Divider,
  Descriptions,
  Avatar,
  Badge,
  Tooltip,
  message,
  Popconfirm,
  Spin,
  Alert,
  Input,
  Modal,
  Table,
  Select,
  DatePicker,
  Form,
} from "antd";
import {
  ArrowLeftOutlined,
  BankOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  KeyOutlined,
  EditOutlined,
  CheckCircleOutlined,
  StopOutlined,
  CopyOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  TrophyOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { schoolsAPI } from "../services/api";
import type { ColumnsType } from "antd/es/table";

const { Title, Text, Paragraph } = Typography;

// Main API Base URL - should match the one in services/api.ts
const API_BASE_URL = "https://sms-backend-production-eedb.up.railway.app";

// Development API Base URL - should match the one in services/api.ts
// const API_BASE_URL = "https://backend-production-563f.up.railway.app";

// const API_BASE_URL = "http://localhost:3000";

interface SchoolDetailsData {
  id: string;
  username: string;
  password: string;
  schoolName: string;
  schoolCode: string;
  accessCode?: string;
  accessCodeActivated: boolean;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    teachers: number;
    students: number;
    stages: number;
    activationKeys: number;
  };
}

interface SchoolDetailsResponse {
  success: boolean;
  data: {
    school: SchoolDetailsData;
  };
}

interface ActivationKey {
  id: string;
  key: string;
  isUsed: boolean;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
  student?: {
    id: string;
    name: string;
    code: string;
  };
}

interface ActivationKeysResponse {
  success: boolean;
  data: {
    keys: ActivationKey[];
    stats: {
      total: number;
      active: number;
      used: number;
      expired: number;
    };
  };
}

const SchoolDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [isGenerateKeysModalVisible, setIsGenerateKeysModalVisible] =
    useState(false);
  const [keysCount, setKeysCount] = useState(1);
  const [isManageKeysModalVisible, setIsManageKeysModalVisible] =
    useState(false);
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([]);
  const [deleteType, setDeleteType] = useState<
    "expired" | "unused" | "selected"
  >("expired");
  const [expirationDate, setExpirationDate] = useState<any>(null);
  const [generateForm] = Form.useForm();
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editExpirationDate, setEditExpirationDate] = useState<any>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");

  // Fetch school details
  const { data, isLoading, error } = useQuery<SchoolDetailsResponse>({
    queryKey: ["school-details", id],
    queryFn: () => schoolsAPI.getById(id!),
    enabled: !!token && !!id,
  });

  // Fetch activation keys
  const { data: keysData } = useQuery<ActivationKeysResponse>({
    queryKey: ["activation-keys", id],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/central/schools/${id}/activation-keys`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activation keys");
      }

      return response.json();
    },
    enabled: !!token && !!id,
  });

  // Generate activation keys mutation
  const generateKeysMutation = useMutation({
    mutationFn: async (data: { count: number; expirationDate: string }) => {
      const response = await fetch(
        `${API_BASE_URL}/central/schools/${id}/activation-keys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to generate activation keys"
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["activation-keys", id] });
      queryClient.invalidateQueries({ queryKey: ["school-details", id] });
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setIsGenerateKeysModalVisible(false);
      setKeysCount(1);
      setExpirationDate(null);
      generateForm.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Delete activation keys mutation
  const deleteKeysMutation = useMutation({
    mutationFn: async (deleteData: {
      type: "expired" | "unused" | "selected";
      keyIds?: string[];
    }) => {
      const response = await fetch(
        `${API_BASE_URL}/central/schools/${id}/activation-keys/bulk`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            deleteType: deleteData.type,
            keyIds: deleteData.keyIds,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to delete activation keys"
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["activation-keys", id] });
      queryClient.invalidateQueries({ queryKey: ["school-details", id] });
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setSelectedKeyIds([]);
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Delete single activation key mutation
  const deleteSingleKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const response = await fetch(
        `${API_BASE_URL}/central/schools/${id}/activation-keys/${keyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete activation key");
      }

      return response.json();
    },
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["activation-keys", id] });
      queryClient.invalidateQueries({ queryKey: ["school-details", id] });
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Update expiration date mutation
  const updateExpirationMutation = useMutation({
    mutationFn: async (data: { keyId: string; expirationDate: string }) => {
      const response = await fetch(
        `${API_BASE_URL}/central/schools/${id}/activation-keys/${data.keyId}/expiration`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ expirationDate: data.expirationDate }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update expiration date"
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      message.success("Expiration date updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["activation-keys", id] });
      setEditingKeyId(null);
      setEditExpirationDate(null);
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Toggle school status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/central/schools/${id}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to toggle school status");
      }

      return response.json();
    },
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["school-details", id] });
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Update phone number mutation
  const updatePhoneMutation = useMutation({
    mutationFn: async (contactPhone: string) => {
      const response = await fetch(
        `${API_BASE_URL}/central/schools/${id}/phone`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ contactPhone }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update phone number");
      }

      return response.json();
    },
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["school-details", id] });
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setIsEditingPhone(false);
      setNewPhoneNumber("");
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const handleToggleStatus = () => {
    toggleStatusMutation.mutate();
  };

  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${type} copied to clipboard`);
  };

  const handleGenerateKeys = (values: any) => {
    generateKeysMutation.mutate({
      count: parseInt(values.count, 10),
      expirationDate: values.expirationDate.toISOString(),
    });
  };

  const handleBulkDelete = () => {
    deleteKeysMutation.mutate({
      type: deleteType,
      keyIds: deleteType === "selected" ? selectedKeyIds : undefined,
    });
  };

  const handleDeleteSingleKey = (keyId: string) => {
    deleteSingleKeyMutation.mutate(keyId);
  };

  const handleEditExpiration = (keyId: string, currentExpiration: string) => {
    setEditingKeyId(keyId);
    setEditExpirationDate(new Date(currentExpiration));
  };

  const handleUpdateExpiration = () => {
    if (editingKeyId && editExpirationDate) {
      updateExpirationMutation.mutate({
        keyId: editingKeyId,
        expirationDate: editExpirationDate.toISOString(),
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingKeyId(null);
    setEditExpirationDate(null);
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description="Failed to load school details"
        type="error"
        showIcon
        action={
          <Button onClick={() => navigate("/schools")}>Back to Schools</Button>
        }
      />
    );
  }

  if (!data?.data?.school) {
    return (
      <Alert
        message="School Not Found"
        description="The requested school could not be found"
        type="warning"
        showIcon
        action={
          <Button onClick={() => navigate("/schools")}>Back to Schools</Button>
        }
      />
    );
  }

  const school = data.data.school;

  const handleStartEditPhone = () => {
    setNewPhoneNumber(school.contactPhone || "");
    setIsEditingPhone(true);
  };

  const handleCancelEditPhone = () => {
    setIsEditingPhone(false);
    setNewPhoneNumber("");
  };

  const handleSavePhone = () => {
    if (!newPhoneNumber.trim()) {
      message.error("Phone number cannot be empty");
      return;
    }
    updatePhoneMutation.mutate(newPhoneNumber.trim());
  };

  return (
    <div
      style={{
        background: "#f8f9fa",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      {/* Simplified Header */}
      <div
        style={{
          marginBottom: "32px",
          background: "#ffffff",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          border: "1px solid #f0f0f0",
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/schools")}
                size="large"
                style={{
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              >
                Back to Schools
              </Button>
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <Avatar
                  size={48}
                  style={{
                    backgroundColor: school.isActive ? "#1890ff" : "#8c8c8c",
                    fontSize: "20px",
                  }}
                  icon={<BankOutlined />}
                />
                <div>
                  <Title level={2} style={{ margin: 0, color: "#262626" }}>
                    {school.schoolName}
                  </Title>
                  <Space>
                    <Text type="secondary" style={{ fontSize: "14px" }}>
                      School Management Dashboard
                    </Text>
                    <Badge
                      status={school.isActive ? "success" : "default"}
                      text={
                        <Text style={{ fontSize: "14px" }}>
                          {school.isActive ? "Active" : "Inactive"}
                        </Text>
                      }
                    />
                  </Space>
                </div>
              </div>
            </Space>
          </Col>
          <Col>
            <Space size="middle">
              <Popconfirm
                title={`Are you sure you want to ${
                  school.isActive ? "deactivate" : "activate"
                } this school?`}
                onConfirm={handleToggleStatus}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type={school.isActive ? "default" : "primary"}
                  icon={
                    school.isActive ? <StopOutlined /> : <CheckCircleOutlined />
                  }
                  danger={school.isActive}
                  loading={toggleStatusMutation.isPending}
                  size="large"
                  style={{
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {school.isActive ? "Deactivate" : "Activate"}
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Simplified Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "32px" }}>
        <Col xs={12} sm={8} lg={4}>
          <Card className="hover-lift">
            <Statistic
              title="Teachers"
              value={school._count.teachers}
              prefix={<UserOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#262626", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="hover-lift">
            <Statistic
              title="Students"
              value={school._count.students}
              prefix={<TeamOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#262626", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="hover-lift">
            <Statistic
              title="Stages"
              value={school._count.stages}
              prefix={<BookOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#262626", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="hover-lift">
            <Statistic
              title="Active Keys"
              value={keysData?.data?.stats?.active || 0}
              prefix={<KeyOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#262626", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="hover-lift">
            <Statistic
              title="Total Keys"
              value={keysData?.data?.stats?.total || 0}
              prefix={<KeyOutlined style={{ color: "#8c8c8c" }} />}
              valueStyle={{ color: "#262626", fontSize: "24px" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className="hover-lift">
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: "8px" }}>
                <TrophyOutlined
                  style={{ fontSize: "20px", color: "#1890ff" }}
                />
              </div>
              <Text
                strong
                style={{ color: "#262626", fontSize: "20px", display: "block" }}
              >
                {school._count.teachers + school._count.students}
              </Text>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                Total Users
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content - Now Full Width */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Basic Information Card */}
            <Card
              title={
                <Space>
                  <BankOutlined style={{ color: "#1890ff" }} />
                  <Text strong>Basic Information</Text>
                </Space>
              }
              className="hover-lift"
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={12}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={0}
                      style={{ width: "100%" }}
                    >
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        School Name
                      </Text>
                      <Text strong style={{ fontSize: "16px" }}>
                        {school.schoolName}
                      </Text>
                    </Space>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={0}
                      style={{ width: "100%" }}
                    >
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        School Code
                      </Text>
                      <Space>
                        <Tag color="blue">{school.schoolCode}</Tag>
                        <Tooltip title="Copy School Code">
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() =>
                              handleCopyToClipboard(
                                school.schoolCode,
                                "School Code"
                              )
                            }
                          />
                        </Tooltip>
                      </Space>
                    </Space>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Credentials Card */}
            <Card
              title={
                <Space>
                  <KeyOutlined style={{ color: "#1890ff" }} />
                  <Text strong>Login Credentials</Text>
                </Space>
              }
              className="hover-lift"
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={12}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={0}
                      style={{ width: "100%" }}
                    >
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Username
                      </Text>
                      <Space>
                        <Text code>{school.username}</Text>
                        <Tooltip title="Copy Username">
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() =>
                              handleCopyToClipboard(school.username, "Username")
                            }
                          />
                        </Tooltip>
                      </Space>
                    </Space>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Access Code Card */}
            <Card
              title={
                <Space>
                  <KeyOutlined style={{ color: "#1890ff" }} />
                  <Text strong>Company Access Code</Text>
                  {school.accessCodeActivated ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      Activated
                    </Tag>
                  ) : (
                    <Tag color="default" icon={<StopOutlined />}>
                      Not Activated
                    </Tag>
                  )}
                </Space>
              }
              className="hover-lift"
            >
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <div
                    style={{
                      padding: "16px",
                      background: school.accessCodeActivated
                        ? "#f6ffed"
                        : "#fafafa",
                      borderRadius: "6px",
                      border: school.accessCodeActivated
                        ? "1px solid #b7eb8f"
                        : "1px solid #f0f0f0",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      <Space
                        style={{
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Access Code
                        </Text>
                        {school.accessCode && (
                          <Tooltip title="Copy Access Code">
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() =>
                                handleCopyToClipboard(
                                  school.accessCode!,
                                  "Access Code"
                                )
                              }
                            />
                          </Tooltip>
                        )}
                      </Space>
                      {school.accessCode ? (
                        <Text
                          code
                          style={{
                            fontSize: "16px",
                            color: school.accessCodeActivated
                              ? "#52c41a"
                              : "#8c8c8c",
                          }}
                        >
                          {school.accessCode}
                        </Text>
                      ) : (
                        <Text type="secondary" style={{ fontStyle: "italic" }}>
                          No access code generated
                        </Text>
                      )}

                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px",
                          background: school.accessCodeActivated
                            ? "#e6f7ff"
                            : "#fff7e6",
                          borderRadius: "6px",
                          border: school.accessCodeActivated
                            ? "1px solid #91d5ff"
                            : "1px solid #ffd591",
                        }}
                      >
                        <Space direction="vertical" size={4}>
                          <Text
                            strong
                            style={{
                              fontSize: "12px",
                              color: school.accessCodeActivated
                                ? "#1890ff"
                                : "#fa8c16",
                            }}
                          >
                            {school.accessCodeActivated
                              ? "🔓 Company Access Enabled"
                              : "🔒 Company Access Disabled"}
                          </Text>
                          <Text style={{ fontSize: "11px" }}>
                            {school.accessCodeActivated
                              ? "Company personnel can access this school dashboard using the access code without WhatsApp verification."
                              : "The school needs to activate this feature from their settings page to allow company access."}
                          </Text>
                        </Space>
                      </div>
                    </Space>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Contact Information Card */}
            <Card
              title={
                <Space>
                  <MailOutlined style={{ color: "#1890ff" }} />
                  <Text strong>Contact Information</Text>
                </Space>
              }
              className="hover-lift"
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={12}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={0}
                      style={{ width: "100%" }}
                    >
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Email Address
                      </Text>
                      {school.contactEmail ? (
                        <Space>
                          <Text>{school.contactEmail}</Text>
                          <Tooltip title="Copy Email">
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() =>
                                handleCopyToClipboard(
                                  school.contactEmail!,
                                  "Email"
                                )
                              }
                            />
                          </Tooltip>
                        </Space>
                      ) : (
                        <Text type="secondary" style={{ fontStyle: "italic" }}>
                          Not provided
                        </Text>
                      )}
                    </Space>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={0}
                      style={{ width: "100%" }}
                    >
                      <Space
                        style={{
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Phone Number
                        </Text>
                        {!isEditingPhone && (
                          <Tooltip title="Edit Phone Number">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={handleStartEditPhone}
                            />
                          </Tooltip>
                        )}
                      </Space>
                      {isEditingPhone ? (
                        <Space style={{ width: "100%", marginTop: "8px" }}>
                          <Input
                            value={newPhoneNumber}
                            onChange={(e) => setNewPhoneNumber(e.target.value)}
                            placeholder="Enter phone number"
                            style={{ width: "200px" }}
                            onPressEnter={handleSavePhone}
                          />
                          <Button
                            type="primary"
                            size="small"
                            icon={<SaveOutlined />}
                            onClick={handleSavePhone}
                            loading={updatePhoneMutation.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={handleCancelEditPhone}
                            disabled={updatePhoneMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </Space>
                      ) : school.contactPhone ? (
                        <Space>
                          <Text>{school.contactPhone}</Text>
                          <Tooltip title="Copy Phone">
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() =>
                                handleCopyToClipboard(
                                  school.contactPhone!,
                                  "Phone"
                                )
                              }
                            />
                          </Tooltip>
                        </Space>
                      ) : (
                        <Text type="secondary" style={{ fontStyle: "italic" }}>
                          Not provided
                        </Text>
                      )}
                    </Space>
                  </div>
                </Col>
                <Col span={24}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={0}
                      style={{ width: "100%" }}
                    >
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Address
                      </Text>
                      {school.address ? (
                        <Paragraph
                          style={{ margin: 0 }}
                          copyable={{
                            text: school.address,
                            onCopy: () => message.success("Address copied!"),
                          }}
                        >
                          {school.address}
                        </Paragraph>
                      ) : (
                        <Text type="secondary" style={{ fontStyle: "italic" }}>
                          Not provided
                        </Text>
                      )}
                    </Space>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* System Information Card */}
            <Card
              title={
                <Space>
                  <CalendarOutlined style={{ color: "#1890ff" }} />
                  <Text strong>System Information</Text>
                </Space>
              }
              className="hover-lift"
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={12}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={0}
                      style={{ width: "100%" }}
                    >
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Created Date
                      </Text>
                      <Text strong>
                        {new Date(school.createdAt).toLocaleString()}
                      </Text>
                    </Space>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={0}
                      style={{ width: "100%" }}
                    >
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Last Updated
                      </Text>
                      <Text strong>
                        {new Date(school.updatedAt).toLocaleString()}
                      </Text>
                    </Space>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Activation Keys Management Card */}
            <Card
              title={
                <Space>
                  <KeyOutlined style={{ color: "#1890ff" }} />
                  <Text strong>Activation Keys Management</Text>
                  <Tag color="blue">Student Registration</Tag>
                </Space>
              }
              className="hover-lift"
              extra={
                <Space>
                  <Button
                    type="default"
                    icon={<EditOutlined />}
                    onClick={() => setIsManageKeysModalVisible(true)}
                  >
                    Manage Keys
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsGenerateKeysModalVisible(true)}
                  >
                    Generate Keys
                  </Button>
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                      textAlign: "center",
                    }}
                  >
                    <KeyOutlined
                      style={{
                        fontSize: "20px",
                        color: "#1890ff",
                        marginBottom: "8px",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#262626",
                      }}
                    >
                      {keysData?.data?.stats?.total || 0}
                    </div>
                    <Text type="secondary">Total</Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                      textAlign: "center",
                    }}
                  >
                    <CheckCircleOutlined
                      style={{
                        fontSize: "20px",
                        color: "#52c41a",
                        marginBottom: "8px",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#262626",
                      }}
                    >
                      {keysData?.data?.stats?.active || 0}
                    </div>
                    <Text type="secondary">Active</Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                      textAlign: "center",
                    }}
                  >
                    <UserOutlined
                      style={{
                        fontSize: "20px",
                        color: "#8c8c8c",
                        marginBottom: "8px",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#262626",
                      }}
                    >
                      {keysData?.data?.stats?.used || 0}
                    </div>
                    <Text type="secondary">Used</Text>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div
                    style={{
                      padding: "16px",
                      background: "#fafafa",
                      borderRadius: "6px",
                      border: "1px solid #f0f0f0",
                      textAlign: "center",
                    }}
                  >
                    <StopOutlined
                      style={{
                        fontSize: "20px",
                        color: "#ff4d4f",
                        marginBottom: "8px",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#262626",
                      }}
                    >
                      {keysData?.data?.stats?.expired || 0}
                    </div>
                    <Text type="secondary">Expired</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Manage Activation Keys Modal */}
      <Modal
        title="Manage Activation Keys"
        open={isManageKeysModalVisible}
        onCancel={() => {
          setIsManageKeysModalVisible(false);
          setSelectedKeyIds([]);
          setDeleteType("expired");
        }}
        footer={null}
        width={900}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {/* Statistics Summary */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Total"
                  value={keysData?.data?.stats?.total || 0}
                  prefix={<KeyOutlined style={{ color: "#1890ff" }} />}
                  valueStyle={{ color: "#1890ff", fontSize: "16px" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Active"
                  value={keysData?.data?.stats?.active || 0}
                  prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ color: "#52c41a", fontSize: "16px" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Used"
                  value={keysData?.data?.stats?.used || 0}
                  prefix={<UserOutlined style={{ color: "#fa8c16" }} />}
                  valueStyle={{ color: "#fa8c16", fontSize: "16px" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small">
                <Statistic
                  title="Expired"
                  value={keysData?.data?.stats?.expired || 0}
                  prefix={<StopOutlined style={{ color: "#ff4d4f" }} />}
                  valueStyle={{ color: "#ff4d4f", fontSize: "16px" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Bulk Actions */}
          <Card size="small" title="Bulk Actions">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12}>
                  <Space>
                    <Text>Delete Type:</Text>
                    <Select
                      value={deleteType}
                      onChange={setDeleteType}
                      style={{ width: 150 }}
                    >
                      <Select.Option value="expired">
                        Expired Keys
                      </Select.Option>
                      <Select.Option value="unused">
                        All Unused Keys
                      </Select.Option>
                      <Select.Option value="selected">
                        Selected Keys
                      </Select.Option>
                    </Select>
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Popconfirm
                    title={`Are you sure you want to delete ${
                      deleteType === "expired"
                        ? "all expired"
                        : deleteType === "unused"
                        ? "all unused"
                        : "selected"
                    } activation keys?`}
                    onConfirm={handleBulkDelete}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                    icon={
                      <ExclamationCircleOutlined style={{ color: "red" }} />
                    }
                  >
                    <Button
                      danger
                      type="primary"
                      icon={<DeleteOutlined />}
                      loading={deleteKeysMutation.isPending}
                      disabled={
                        deleteType === "selected" && selectedKeyIds.length === 0
                      }
                    >
                      Delete{" "}
                      {deleteType === "selected"
                        ? `Selected (${selectedKeyIds.length})`
                        : deleteType}{" "}
                      Keys
                    </Button>
                  </Popconfirm>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* Keys Table */}
          <Table
            scroll={{ x: "max-content" }}
            rowSelection={
              deleteType === "selected"
                ? {
                    selectedRowKeys: selectedKeyIds,
                    onChange: (selectedRowKeys) =>
                      setSelectedKeyIds(selectedRowKeys as string[]),
                    getCheckboxProps: (record) => ({
                      disabled: record.isUsed, // Cannot select used keys
                    }),
                  }
                : undefined
            }
            columns={[
              {
                title: "Key",
                dataIndex: "key",
                key: "key",
                render: (key: string) => (
                  <Space>
                    <Text code style={{ fontSize: "12px" }}>
                      {key}
                    </Text>
                    <Tooltip title="Copy Key">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() =>
                          handleCopyToClipboard(key, "Activation Key")
                        }
                      />
                    </Tooltip>
                  </Space>
                ),
              },
              {
                title: "Status",
                key: "status",
                render: (_, record) => {
                  const isExpired = new Date(record.expiresAt) < new Date();
                  const tags = [];

                  if (record.isUsed) {
                    tags.push(
                      <Tag key="used" color="orange" icon={<UserOutlined />}>
                        Used
                      </Tag>
                    );
                  }

                  if (isExpired) {
                    tags.push(
                      <Tag key="expired" color="red" icon={<StopOutlined />}>
                        Expired
                      </Tag>
                    );
                  }

                  if (!record.isUsed && !isExpired) {
                    tags.push(
                      <Tag
                        key="active"
                        color="green"
                        icon={<CheckCircleOutlined />}
                      >
                        Active
                      </Tag>
                    );
                  }

                  return <Space>{tags}</Space>;
                },
              },
              {
                title: "Created",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (date: string) => new Date(date).toLocaleDateString(),
              },
              {
                title: "Expires",
                dataIndex: "expiresAt",
                key: "expiresAt",
                render: (date: string, record) => {
                  if (editingKeyId === record.id) {
                    return (
                      <Space>
                        <DatePicker
                          value={
                            editExpirationDate
                              ? dayjs(editExpirationDate)
                              : null
                          }
                          onChange={(date) =>
                            setEditExpirationDate(date?.toDate())
                          }
                          format="YYYY-MM-DD"
                          size="small"
                          disabledDate={(current) =>
                            current && current < dayjs().startOf("day")
                          }
                        />
                        <Button
                          type="link"
                          size="small"
                          onClick={handleUpdateExpiration}
                          loading={updateExpirationMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          type="link"
                          size="small"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </Space>
                    );
                  }
                  return (
                    <Space>
                      <Text>{new Date(date).toLocaleDateString()}</Text>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => handleEditExpiration(record.id, date)}
                      >
                        Edit
                      </Button>
                    </Space>
                  );
                },
              },
              {
                title: "Used At",
                dataIndex: "usedAt",
                key: "usedAt",
                render: (date?: string) =>
                  date ? new Date(date).toLocaleDateString() : "-",
              },
              {
                title: "Used By",
                key: "usedBy",
                render: (_, record) => {
                  if (record.student) {
                    return (
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: "12px" }}>
                          {record.student.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: "11px" }}>
                          Code: {record.student.code}
                        </Text>
                      </Space>
                    );
                  }
                  return <Text type="secondary">-</Text>;
                },
              },
              {
                title: "Actions",
                key: "actions",
                render: (_, record) => (
                  <Space>
                    {!record.isUsed && (
                      <Popconfirm
                        title="Are you sure you want to delete this activation key?"
                        onConfirm={() => handleDeleteSingleKey(record.id)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                      >
                        <Button
                          danger
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          loading={deleteSingleKeyMutation.isPending}
                        />
                      </Popconfirm>
                    )}
                  </Space>
                ),
              },
            ]}
            dataSource={keysData?.data?.keys || []}
            rowKey="id"
            size="small"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} keys`,
            }}
          />
        </Space>
      </Modal>

      {/* Generate Activation Keys Modal */}
      <Modal
        title="Generate Activation Keys"
        open={isGenerateKeysModalVisible}
        onCancel={() => {
          setIsGenerateKeysModalVisible(false);
          setKeysCount(1);
          setExpirationDate(null);
          generateForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={generateForm}
          layout="vertical"
          onFinish={handleGenerateKeys}
          initialValues={{
            count: 1,
            expirationDate: null,
          }}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Text>
              Generate activation keys for{" "}
              <Text strong>{school.schoolName}</Text>
            </Text>

            <Form.Item
              name="count"
              label="Number of keys to generate"
              rules={[
                { required: true, message: "Please enter number of keys!" },
                {
                  validator: async (_, value) => {
                    const num = parseInt(value, 10);
                    if (isNaN(num) || num < 1 || num > 100) {
                      throw new Error("Number must be between 1 and 100!");
                    }
                  },
                },
              ]}
            >
              <Input
                type="number"
                min={1}
                max={100}
                placeholder="Enter number of keys (1-100)"
              />
            </Form.Item>

            <Form.Item
              name="expirationDate"
              label="Expiration Date"
              rules={[
                { required: true, message: "Please select expiration date!" },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (value.isBefore(dayjs(), "day")) {
                      return Promise.reject(
                        new Error("Expiration date cannot be in the past!")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Select expiration date"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
                showTime={false}
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <div
              style={{
                padding: "12px",
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: "6px",
              }}
            >
              <Space direction="vertical" size={4}>
                <Text strong style={{ color: "#52c41a" }}>
                  Key Information:
                </Text>
                <Text style={{ fontSize: "12px" }}>
                  • Each key is 16 characters long
                </Text>
                <Text style={{ fontSize: "12px" }}>
                  • Keys expire on the selected date if not used
                </Text>
                <Text style={{ fontSize: "12px" }}>
                  • Keys can only be used once for student registration
                </Text>
                <Text style={{ fontSize: "12px" }}>
                  • When used, the key will be linked to the registered student
                </Text>
              </Space>
            </div>

            <div style={{ textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setIsGenerateKeysModalVisible(false);
                    setKeysCount(1);
                    setExpirationDate(null);
                    generateForm.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={generateKeysMutation.isPending}
                >
                  Generate Keys
                </Button>
              </Space>
            </div>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolDetails;
