import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Space,
  Modal,
  message,
  Tabs,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  BankOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface LoginForm {
  identifier: string;
  password: string;
}

interface AccessCodeLoginForm {
  accessCode: string;
}

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessCodeLoading, setAccessCodeLoading] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotPhone, setForgotPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [mfaOpen, setMfaOpen] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaMaskedPhone, setMfaMaskedPhone] = useState<string | null>(null);
  const [loginIdentifier, setLoginIdentifier] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || "/";

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      // For Vercel deployment, always use relative URLs to trigger rewrites
      // Only use full URL for local development
      const apiBaseUrl = import.meta.env.DEV ? "http://localhost:3000" : "";

      console.log("🔗 Environment:", import.meta.env.MODE);
      console.log("🔗 Is DEV:", import.meta.env.DEV);
      console.log("🔗 API Base URL:", apiBaseUrl);
      console.log(
        "🔗 Making login request to:",
        `${apiBaseUrl}/auth/school/login`
      );

      const response = await fetch(`${apiBaseUrl}/auth/school/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: values.identifier,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data?.data?.mfaRequired) {
          setLoginIdentifier(values.identifier);
          setMfaMaskedPhone(data?.data?.phoneNumber ?? null);
          setMfaOpen(true);
          message.success(t("login.messages.codeSentSuccess"));
        } else if (data?.data?.token) {
          // Use auth context to login (this will now trigger dashboard refresh)
          login(data.data.token, data.data.school);

          // Show success message
          console.log(
            "Login successful - dashboard will refresh with new data"
          );

          // Redirect to the intended page or dashboard
          navigate(from, { replace: true });
        } else {
          setError(t("login.messages.unexpectedResponse"));
        }
      } else {
        setError(data.message || t("login.messages.unexpectedResponse"));
      }
    } catch (err) {
      setError(t("login.messages.networkError"));
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onAccessCodeFinish = async (values: AccessCodeLoginForm) => {
    setAccessCodeLoading(true);
    setAccessCodeError(null);

    try {
      const apiBaseUrl = import.meta.env.DEV ? "http://localhost:3000" : "";

      const response = await fetch(
        `${apiBaseUrl}/auth/school/login/access-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessCode: values.accessCode,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        if (data?.data?.token) {
          // Use auth context to login
          login(data.data.token, data.data.school);

          // Show success message
          console.log(
            "Login successful - dashboard will refresh with new data"
          );

          // Redirect to the intended page or dashboard
          navigate(from, { replace: true });
        } else {
          setAccessCodeError(t("login.messages.unexpectedResponse"));
        }
      } else {
        setAccessCodeError(
          data.message || t("login.messages.unexpectedResponse")
        );
      }
    } catch (err) {
      setAccessCodeError(t("login.messages.networkError"));
      console.error("Access code login error:", err);
    } finally {
      setAccessCodeLoading(false);
    }
  };

  const apiBaseUrl = import.meta.env.DEV ? "http://localhost:3000" : "";

  const handleRequestCode = async () => {
    setForgotError(null);
    if (!forgotPhone || forgotPhone.trim().length < 6) {
      setForgotError(t("login.messages.invalidPhoneNumber"));
      return;
    }
    try {
      setForgotLoading(true);
      const res = await fetch(`${apiBaseUrl}/auth/school/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: forgotPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || t("login.messages.sendCodeFailed"));
      }
      setMaskedPhone(data?.data?.phoneNumber ?? null);
      setForgotStep(2);
      message.success(t("login.messages.codeSentSuccess"));
    } catch (e) {
      const err = e as Error;
      setForgotError(err?.message || t("login.messages.sendCodeFailed"));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (values: {
    verificationCode: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    setForgotError(null);
    if (values.newPassword !== values.confirmPassword) {
      setForgotError(t("login.messages.passwordMismatch"));
      return;
    }
    if (!/^\d{6}$/.test(values.verificationCode)) {
      setForgotError(t("login.messages.codeInvalid"));
      return;
    }
    try {
      setForgotLoading(true);
      const res = await fetch(`${apiBaseUrl}/auth/school/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: forgotPhone.trim(),
          verificationCode: values.verificationCode.trim(),
          newPassword: values.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message || t("login.messages.resetPasswordFailed")
        );
      }
      message.success(t("login.messages.passwordResetSuccess"));
      setForgotOpen(false);
      setForgotStep(1);
      setForgotPhone("");
      setMaskedPhone(null);
    } catch (e) {
      const err =
        (e as Error) ?? new Error(t("login.messages.resetPasswordFailed"));
      setForgotError(err.message || t("login.messages.resetPasswordFailed"));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyLoginCode = async (values: {
    verificationCode: string;
  }) => {
    setMfaError(null);
    if (!/^\d{6}$/.test(values.verificationCode)) {
      setMfaError(t("login.messages.codeInvalid"));
      return;
    }

    try {
      setMfaLoading(true);
      const res = await fetch(`${apiBaseUrl}/auth/school/login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier,
          verificationCode: values.verificationCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || t("login.messages.verifyCodeFailed"));
      }

      // Successful verification — proceed to login
      login(data.data.token, data.data.school);
      setMfaOpen(false);
      setMfaMaskedPhone(null);
      setLoginIdentifier("");
      message.success(t("login.messages.loginSuccess"));
      navigate(from, { replace: true });
    } catch (e) {
      const err =
        (e as Error) ?? new Error(t("login.messages.verifyCodeFailed"));
      setMfaError(err.message || t("login.messages.verifyCodeFailed"));
    } finally {
      setMfaLoading(false);
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
          "max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px))",
        boxSizing: "border-box",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          borderRadius: "12px",
          border: "none",
        }}
        styles={{
          body: { padding: "clamp(24px, 6vw, 40px)" },
        }}
      >
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", textAlign: "center" }}
        >
          <div>
            <BankOutlined
              style={{
                fontSize: "48px",
                color: "#667eea",
                marginBottom: "16px",
              }}
            />
            <Title
              level={2}
              style={{ margin: 0, color: "#333", textAlign: "center" }}
            >
              {t("login.title")}
            </Title>
            <Text type="secondary">{t("login.subtitle")}</Text>
          </div>

          <Tabs
            defaultActiveKey="normal"
            centered
            items={[
              {
                key: "normal",
                label: (
                  <span>
                    <UserOutlined /> {t("login.tabs.normalLogin")}
                  </span>
                ),
                children: (
                  <>
                    {error && (
                      <Alert
                        message={error}
                        type="error"
                        showIcon
                        style={{ textAlign: "left", marginBottom: "16px" }}
                      />
                    )}

                    <Form
                      name="login"
                      onFinish={onFinish}
                      autoComplete="off"
                      layout="vertical"
                      size="large"
                    >
                      <Form.Item
                        name="identifier"
                        rules={[
                          {
                            required: true,
                            message: t("login.normalLogin.identifierRequired"),
                          },
                          {
                            min: 3,
                            message: t("login.normalLogin.identifierMinLength"),
                          },
                        ]}
                      >
                        <Input
                          prefix={<UserOutlined />}
                          placeholder={t("login.normalLogin.identifier")}
                          autoComplete="username"
                        />
                      </Form.Item>

                      <Form.Item
                        name="password"
                        rules={[
                          {
                            required: true,
                            message: t("login.normalLogin.passwordRequired"),
                          },
                          {
                            min: 6,
                            message: t("login.normalLogin.passwordMinLength"),
                          },
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder={t("login.normalLogin.password")}
                          autoComplete="current-password"
                        />
                      </Form.Item>

                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                          style={{
                            width: "100%",
                            height: "48px",
                            borderRadius: "8px",
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            fontSize: "16px",
                            fontWeight: 500,
                          }}
                        >
                          {loading
                            ? t("login.normalLogin.signingIn")
                            : t("login.normalLogin.signIn")}
                        </Button>
                      </Form.Item>
                    </Form>

                    <div style={{ textAlign: "center", marginTop: "8px" }}>
                      <Button
                        type="link"
                        onClick={() => setForgotOpen(true)}
                        style={{ padding: 0 }}
                      >
                        {t("login.normalLogin.forgotPassword")}
                      </Button>
                    </div>
                  </>
                ),
              },
              {
                key: "accessCode",
                label: (
                  <span>
                    <KeyOutlined /> {t("login.tabs.accessCode")}
                  </span>
                ),
                children: (
                  <>
                    {accessCodeError && (
                      <Alert
                        message={accessCodeError}
                        type="error"
                        showIcon
                        style={{ textAlign: "left", marginBottom: "16px" }}
                      />
                    )}

                    <Alert
                      message={t("login.accessCodeLogin.infoTitle")}
                      description={t("login.accessCodeLogin.infoDescription")}
                      type="info"
                      showIcon
                      style={{ marginBottom: "16px" }}
                    />

                    <Form
                      name="accessCodeLogin"
                      onFinish={onAccessCodeFinish}
                      autoComplete="off"
                      layout="vertical"
                      size="large"
                    >
                      <Form.Item
                        name="accessCode"
                        rules={[
                          {
                            required: true,
                            message: t(
                              "login.accessCodeLogin.accessCodeRequired"
                            ),
                          },
                          {
                            min: 10,
                            message: t(
                              "login.accessCodeLogin.accessCodeMinLength"
                            ),
                          },
                        ]}
                      >
                        <Input
                          prefix={<KeyOutlined />}
                          placeholder={t("login.accessCodeLogin.accessCode")}
                          autoComplete="off"
                        />
                      </Form.Item>

                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={accessCodeLoading}
                          style={{
                            width: "100%",
                            height: "48px",
                            borderRadius: "8px",
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            fontSize: "16px",
                            fontWeight: 500,
                          }}
                        >
                          {accessCodeLoading
                            ? t("login.accessCodeLogin.signingIn")
                            : t("login.accessCodeLogin.signIn")}
                        </Button>
                      </Form.Item>
                    </Form>
                  </>
                ),
              },
            ]}
          />

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {t("login.help.needHelp")}
            </Text>
          </div>
        </Space>
      </Card>

      <Modal
        open={forgotOpen}
        onCancel={() => {
          setForgotOpen(false);
          setForgotStep(1);
          setForgotPhone("");
          setForgotError(null);
          setMaskedPhone(null);
        }}
        title={t("login.forgotPassword.title")}
        footer={null}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {forgotError && <Alert message={forgotError} type="error" showIcon />}

          {forgotStep === 1 && (
            <Form
              layout="vertical"
              onFinish={handleRequestCode}
              autoComplete="off"
            >
              <Form.Item
                label={t("login.forgotPassword.step1.phoneLabel")}
                name="phoneNumber"
                rules={[
                  {
                    required: true,
                    message: t("login.forgotPassword.step1.phoneRequired"),
                  },
                ]}
              >
                <Input
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  placeholder={t("login.forgotPassword.step1.phonePlaceholder")}
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={forgotLoading}
                block
              >
                {t("login.forgotPassword.step1.sendCode")}
              </Button>
            </Form>
          )}

          {forgotStep === 2 && (
            <Form
              layout="vertical"
              onFinish={handleResetPassword}
              initialValues={{
                verificationCode: "",
                newPassword: "",
                confirmPassword: "",
              }}
              autoComplete="off"
            >
              {maskedPhone && (
                <Text type="secondary">
                  {t("login.forgotPassword.step2.codeSent")} {maskedPhone}
                </Text>
              )}
              <Form.Item
                label={t("login.forgotPassword.step2.codeLabel")}
                name="verificationCode"
                rules={[
                  {
                    required: true,
                    message: t("login.forgotPassword.step2.codeRequired"),
                  },
                ]}
              >
                <Input
                  maxLength={6}
                  placeholder={t("login.forgotPassword.step2.codePlaceholder")}
                />
              </Form.Item>
              <Form.Item
                label={t("login.forgotPassword.step2.newPasswordLabel")}
                name="newPassword"
                rules={[
                  {
                    required: true,
                    message: t(
                      "login.forgotPassword.step2.newPasswordRequired"
                    ),
                  },
                  {
                    min: 6,
                    message: t(
                      "login.forgotPassword.step2.newPasswordMinLength"
                    ),
                  },
                ]}
              >
                <Input.Password
                  placeholder={t(
                    "login.forgotPassword.step2.newPasswordPlaceholder"
                  )}
                />
              </Form.Item>
              <Form.Item
                label={t("login.forgotPassword.step2.confirmPasswordLabel")}
                name="confirmPassword"
                dependencies={["newPassword"]}
                rules={[
                  {
                    required: true,
                    message: t(
                      "login.forgotPassword.step2.confirmPasswordRequired"
                    ),
                  },
                ]}
              >
                <Input.Password
                  placeholder={t(
                    "login.forgotPassword.step2.confirmPasswordPlaceholder"
                  )}
                />
              </Form.Item>
              <Space style={{ width: "100%" }} direction="vertical">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={forgotLoading}
                  block
                >
                  {t("login.forgotPassword.step2.resetButton")}
                </Button>
                <Button onClick={() => setForgotStep(1)} block>
                  {t("login.forgotPassword.step2.backButton")}
                </Button>
              </Space>
            </Form>
          )}
        </Space>
      </Modal>

      <Modal
        open={mfaOpen}
        onCancel={() => {
          setMfaOpen(false);
          setMfaError(null);
          setMfaMaskedPhone(null);
        }}
        title={t("login.mfaVerification.title")}
        footer={null}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {mfaError && <Alert message={mfaError} type="error" showIcon />}
          {mfaMaskedPhone && (
            <Text type="secondary">
              {t("login.mfaVerification.codeSent")} {mfaMaskedPhone}
            </Text>
          )}

          <Form
            layout="vertical"
            onFinish={handleVerifyLoginCode}
            autoComplete="off"
          >
            <Form.Item
              label={t("login.mfaVerification.codeLabel")}
              name="verificationCode"
              rules={[
                {
                  required: true,
                  message: t("login.mfaVerification.codeRequired"),
                },
              ]}
            >
              <Input
                maxLength={6}
                placeholder={t("login.mfaVerification.codePlaceholder")}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={mfaLoading} block>
              {t("login.mfaVerification.verifyButton")}
            </Button>
          </Form>
        </Space>
      </Modal>
    </div>
  );
};

export default Login;
