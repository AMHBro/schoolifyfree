import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Card,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  List,
  Pagination,
} from "antd";
import {
  PlusOutlined,
  BankOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  CheckCircleOutlined,
  StopOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { useIsNarrowScreen } from "../hooks/useIsNarrowScreen";
import { schoolsAPI } from "../services/api";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface School {
  id: string;
  username: string;
  schoolName: string;
  schoolCode: string;
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
    activeActivationKeys?: number;
  };
}

interface SchoolsResponse {
  success: boolean;
  data: {
    schools: School[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface CreateSchoolForm {
  username: string;
  password: string;
  schoolName: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

const Schools: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const isMobile = useIsNarrowScreen();

  const { token } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch schools
  const { data, isLoading, error } = useQuery<SchoolsResponse>({
    queryKey: ["schools", currentPage, pageSize],
    queryFn: () => schoolsAPI.getAll({ page: currentPage, limit: pageSize }),
    enabled: !!token,
  });

  // Create school mutation
  const createSchoolMutation = useMutation({
    mutationFn: (schoolData: CreateSchoolForm) => schoolsAPI.create(schoolData),
    onSuccess: () => {
      message.success("School created successfully!");
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      setIsCreateModalVisible(false);
      createForm.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  // Toggle school status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (schoolId: string) => schoolsAPI.toggleStatus(schoolId),
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const handleCreateSchool = async (values: CreateSchoolForm) => {
    createSchoolMutation.mutate(values);
  };

  const handleToggleStatus = (school: School) => {
    toggleStatusMutation.mutate(school.id);
  };

  const handleRowClick = (school: School) => {
    navigate(`/schools/${school.id}`);
  };

  const columns: ColumnsType<School> = [
    {
      title: "School Info",
      key: "schoolInfo",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.schoolName}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            @{record.username}
          </Text>
          <Tag color="blue" style={{ fontSize: "10px" }}>
            Code: {record.schoolCode}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Contact Info",
      key: "contact",
      responsive: ["md"],
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.contactEmail && (
            <Text style={{ fontSize: "12px" }}>{record.contactEmail}</Text>
          )}
          {record.contactPhone && (
            <Text style={{ fontSize: "12px" }}>{record.contactPhone}</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Statistics",
      key: "stats",
      responsive: ["md"],
      render: (_, record) => (
        <Space>
          <Tooltip title="Teachers">
            <Tag icon={<UserOutlined />} color="purple">
              {record._count.teachers}
            </Tag>
          </Tooltip>
          <Tooltip title="Students">
            <Tag icon={<TeamOutlined />} color="orange">
              {record._count.students}
            </Tag>
          </Tooltip>
          <Tooltip title="Stages">
            <Tag icon={<BookOutlined />} color="blue">
              {record._count.stages}
            </Tag>
          </Tooltip>
          <Tooltip title="Active Keys">
            <Tag icon={<KeyOutlined />} color="green">
              {record._count?.activationKeys || 0}
            </Tag>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag
          color={isActive ? "green" : "red"}
          icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
        >
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      responsive: ["lg"],
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Manage Activation Keys">
            <Button
              type="text"
              icon={<KeyOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/schools/${record.id}`);
              }}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? "Deactivate" : "Activate"}>
            <Popconfirm
              title={`Are you sure you want to ${
                record.isActive ? "deactivate" : "activate"
              } this school?`}
              onConfirm={(e) => {
                e?.stopPropagation();
                handleToggleStatus(record);
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                icon={
                  record.isActive ? <StopOutlined /> : <CheckCircleOutlined />
                }
                danger={record.isActive}
                loading={toggleStatusMutation.isPending}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const schools = data?.data?.schools || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="schools-page">
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Row gutter={[0, 16]} justify="space-between" align="middle">
          <Col xs={24} md={16} lg={18}>
            <Title
              level={2}
              style={{
                marginBottom: 4,
                fontSize: isMobile ? "1.35rem" : undefined,
                lineHeight: 1.3,
              }}
            >
              Schools Management
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 13 : undefined }}>
              Manage all school accounts in the system
            </Text>
          </Col>
          <Col xs={24} md={8} lg={6}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalVisible(true)}
              size={isMobile ? "middle" : "large"}
              block={isMobile}
            >
              Create School
            </Button>
          </Col>
        </Row>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Schools"
              value={pagination?.total || 0}
              prefix={<BankOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Schools"
              value={schools.filter((s) => s.isActive).length}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Inactive Schools"
              value={schools.filter((s) => !s.isActive).length}
              prefix={<StopOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Schools: cards on phone, table on desktop */}
      {isMobile ? (
        <Card styles={{ body: { padding: 12 } }}>
          <List
            loading={isLoading}
            dataSource={schools}
            locale={{ emptyText: "No schools found" }}
            renderItem={(school) => (
              <List.Item style={{ padding: "8px 0", border: "none" }}>
                <Card
                  size="small"
                  className="schools-mobile-card"
                  styles={{ body: { padding: 12 } }}
                  style={{ width: "100%", cursor: "pointer" }}
                  onClick={() => handleRowClick(school)}
                >
                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Text strong ellipsis style={{ display: "block" }}>
                          {school.schoolName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          @{school.username}
                        </Text>
                      </div>
                      <Tag
                        color={school.isActive ? "green" : "red"}
                        style={{ margin: 0, flexShrink: 0 }}
                      >
                        {school.isActive ? "Active" : "Inactive"}
                      </Tag>
                    </div>
                    <Tag color="blue" style={{ margin: 0, alignSelf: "flex-start" }}>
                      {school.schoolCode}
                    </Tag>
                    {(school.contactEmail || school.contactPhone) && (
                      <Space direction="vertical" size={0}>
                        {school.contactEmail && (
                          <Text style={{ fontSize: 12 }} ellipsis>
                            {school.contactEmail}
                          </Text>
                        )}
                        {school.contactPhone && (
                          <Text style={{ fontSize: 12 }}>{school.contactPhone}</Text>
                        )}
                      </Space>
                    )}
                    <Space size={[4, 4]} wrap>
                      <Tag icon={<UserOutlined />}>{school._count.teachers}</Tag>
                      <Tag icon={<TeamOutlined />}>{school._count.students}</Tag>
                      <Tag icon={<BookOutlined />}>{school._count.stages}</Tag>
                      <Tag icon={<KeyOutlined />}>
                        {school._count?.activationKeys ?? 0}
                      </Tag>
                    </Space>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                    >
                      <Button
                        type="default"
                        size="small"
                        icon={<KeyOutlined />}
                        onClick={() => navigate(`/schools/${school.id}`)}
                      >
                        Keys
                      </Button>
                      <Popconfirm
                        title={`Are you sure you want to ${
                          school.isActive ? "deactivate" : "activate"
                        } this school?`}
                        onConfirm={() => handleToggleStatus(school)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          type={school.isActive ? "default" : "primary"}
                          size="small"
                          danger={school.isActive}
                          icon={
                            school.isActive ? (
                              <StopOutlined />
                            ) : (
                              <CheckCircleOutlined />
                            )
                          }
                          loading={toggleStatusMutation.isPending}
                        >
                          {school.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </Popconfirm>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Created {new Date(school.createdAt).toLocaleDateString()}
                    </Text>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={pagination?.total || 0}
              showSizeChanger={schools.length > 5}
              pageSizeOptions={[5, 10, 20, 50]}
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} / ${total}`
              }
              size="small"
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              }}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <Table
            columns={columns}
            dataSource={schools}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: "max-content" }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: "pointer" },
            })}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: pagination?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} schools`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              },
            }}
          />
        </Card>
      )}

      {/* Create School Modal */}
      <Modal
        title="Create New School"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={isMobile ? "calc(100vw - 24px)" : 600}
        style={isMobile ? { top: 12, maxWidth: "100%" } : undefined}
        styles={isMobile ? { body: { maxHeight: "calc(100dvh - 120px)", overflowY: "auto" } } : undefined}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateSchool}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: "Please enter username!" },
                  {
                    min: 3,
                    message: "Username must be at least 3 characters!",
                  },
                ]}
              >
                <Input placeholder="Enter unique username" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please enter password!" },
                  {
                    min: 6,
                    message: "Password must be at least 6 characters!",
                  },
                ]}
              >
                <Input.Password placeholder="Enter secure password" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="schoolName"
            label="School Name"
            rules={[{ required: true, message: "Please enter school name!" }]}
          >
            <Input placeholder="Enter school name" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="contactEmail"
                label="Contact Email"
                rules={[
                  { type: "email", message: "Please enter valid email!" },
                ]}
              >
                <Input placeholder="Enter contact email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="contactPhone"
                label="Contact Phone"
                rules={[
                  { required: true, message: "Please enter phone number!" },
                ]}
              >
                <Input placeholder="Enter contact phone" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address">
            <TextArea rows={3} placeholder="Enter school address" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setIsCreateModalVisible(false);
                  createForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createSchoolMutation.isPending}
              >
                Create School
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Schools;
