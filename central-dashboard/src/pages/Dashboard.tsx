import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Spin,
  Alert,
  List,
  Tag,
  Space,
} from "antd";
import {
  BankOutlined,
  UserOutlined,
  TeamOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { schoolsAPI } from "../services/api";

const { Title, Text } = Typography;

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

const Dashboard: React.FC = () => {
  const { token } = useAuth();

  const { data, isLoading, error } = useQuery<SchoolsResponse>({
    queryKey: ["schools", 1, 5],
    queryFn: () => schoolsAPI.getAll({ page: 1, limit: 5 }),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description="Failed to load dashboard data"
        type="error"
        showIcon
      />
    );
  }

  const schools = data?.data?.schools || [];
  const totalSchools = data?.data?.pagination?.total || 0;
  const activeSchools = schools.filter((school) => school.isActive).length;
  const totalTeachers = schools.reduce(
    (sum, school) => sum + school._count.teachers,
    0
  );
  const totalStudents = schools.reduce(
    (sum, school) => sum + school._count.students,
    0
  );

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <Title level={2}>Dashboard Overview</Title>
        <Text type="secondary">
          Welcome to the Central Dashboard. Here's an overview of your school
          management system.
        </Text>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        <Col xs={24} sm={12} lg={6} xl={6}>
          <Card className="hover-lift">
            <Statistic
              title="Total Schools"
              value={totalSchools}
              prefix={<BankOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={6}>
          <Card className="hover-lift">
            <Statistic
              title="Active Schools"
              value={activeSchools}
              prefix={<BankOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={6}>
          <Card className="hover-lift">
            <Statistic
              title="Total Teachers"
              value={totalTeachers}
              prefix={<UserOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} xl={6}>
          <Card className="hover-lift">
            <Statistic
              title="Total Students"
              value={totalStudents}
              prefix={<TeamOutlined style={{ color: "#fa8c16" }} />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16} xl={16}>
          <Card
            title={
              <Space>
                <BankOutlined />
                Recent Schools
              </Space>
            }
            extra={<Text type="secondary">Last 5 schools</Text>}
            className="hover-lift"
          >
            <List
              dataSource={schools}
              renderItem={(school) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        {school.schoolName}
                        <Tag color={school.isActive ? "green" : "red"}>
                          {school.isActive ? "Active" : "Inactive"}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          Username: {school.username}
                        </Text>
                        <Tag color="blue" style={{ fontSize: "12px" }}>
                          Code: {school.schoolCode}
                        </Tag>
                        {school.contactEmail && (
                          <Text type="secondary">
                            Email: {school.contactEmail}
                          </Text>
                        )}
                        <Space>
                          <Text type="secondary">
                            <UserOutlined /> {school._count.teachers} teachers
                          </Text>
                          <Text type="secondary">
                            <TeamOutlined /> {school._count.students} students
                          </Text>
                          <Text type="secondary">
                            <BookOutlined /> {school._count.stages} stages
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Quick Actions" style={{ height: "100%" }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Card
                size="small"
                style={{ cursor: "pointer", border: "1px dashed #d9d9d9" }}
                styles={{ body: { textAlign: "center", padding: "16px" } }}
              >
                <BankOutlined
                  style={{
                    fontSize: "24px",
                    color: "#1890ff",
                    marginBottom: "8px",
                  }}
                />
                <div>
                  <Text strong>Create New School</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Add a new school to the system
                  </Text>
                </div>
              </Card>

              <Card
                size="small"
                style={{ cursor: "pointer", border: "1px dashed #d9d9d9" }}
                styles={{ body: { textAlign: "center", padding: "16px" } }}
              >
                <UserOutlined
                  style={{
                    fontSize: "24px",
                    color: "#722ed1",
                    marginBottom: "8px",
                  }}
                />
                <div>
                  <Text strong>Manage Schools</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    View and manage all schools
                  </Text>
                </div>
              </Card>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
