import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Spin, App as AntApp } from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { admin, login } = useAuth();
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();

  // Redirect if already logged in
  if (admin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success("Login successful!");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding:
          "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
        boxSizing: "border-box",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          borderRadius: "12px",
        }}
        styles={{ body: { padding: "40px" } }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, #1890ff, #722ed1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "24px",
              color: "white",
            }}
          >
            <LoginOutlined />
          </div>
          <Title
            level={2}
            style={{
              margin: 0,
              color: "#262626",
              fontSize: "clamp(1.25rem, 5vw, 1.75rem)",
            }}
          >
            Central Dashboard
          </Title>
          <Text type="secondary">Sign in to manage school accounts</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please enter your username!" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter username"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: "48px",
                fontSize: "16px",
                fontWeight: 500,
                background: "linear-gradient(135deg, #1890ff, #722ed1)",
                border: "none",
              }}
            >
              {loading ? <Spin size="small" /> : "Sign In"}
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            background: "#f8f9fa",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#666",
          }}
        >
          <Text type="secondary">
            <strong>Demo Credentials:</strong>
            <br />
            Username: admin
            <br />
            Password: admin123
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
