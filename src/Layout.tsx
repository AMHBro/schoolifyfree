import React, { useState } from "react";
import { Layout, Menu, Button, theme, Dropdown, Space, Typography } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  UserOutlined,
  AppstoreOutlined,
  BookOutlined,
  FileTextOutlined,
  SettingOutlined,
  MessageOutlined,
  TrophyOutlined,
  LogoutOutlined,
  BankOutlined,
  KeyOutlined,
  CommentOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage } from "./contexts/LanguageContext";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { school, logout } = useAuth();
  const { language, changeLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const languageMenuItems = [
    {
      key: "en",
      label: t("common.english"),
      onClick: () => changeLanguage("en"),
    },
    {
      key: "ar",
      label: t("common.arabic"),
      onClick: () => changeLanguage("ar"),
    },
  ];

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t("common.logout"),
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", direction: isRTL ? "rtl" : "ltr" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        reverseArrow={isRTL}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            height: "64px",
            margin: "16px",
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: collapsed ? "14px" : "18px",
            fontWeight: "bold",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          Schoolify
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={[
            {
              key: "/",
              icon: <UserOutlined />,
              label: <Link to="/">{t("common.dashboard")}</Link>,
            },
            {
              key: "/teachers",
              icon: <TeamOutlined />,
              label: <Link to="/teachers">{t("common.teachers")}</Link>,
            },
            {
              key: "/students",
              icon: <TeamOutlined />,
              label: <Link to="/students">{t("common.students")}</Link>,
            },
            {
              key: "/stages",
              icon: <AppstoreOutlined />,
              label: <Link to="/stages">{t("common.stages")}</Link>,
            },
            {
              key: "/subjects",
              icon: <BookOutlined />,
              label: <Link to="/subjects">{t("common.subjects")}</Link>,
            },
            {
              key: "/exams",
              icon: <FileTextOutlined />,
              label: <Link to="/exams">{t("common.exams")}</Link>,
            },
            {
              key: "/posts",
              icon: <MessageOutlined />,
              label: <Link to="/posts">{t("common.posts")}</Link>,
            },
            {
              key: "/chats",
              icon: <CommentOutlined />,
              label: <Link to="/chats">{t("common.chats")}</Link>,
            },
            {
              key: "/grades",
              icon: <TrophyOutlined />,
              label: <Link to="/grades">{t("common.grades")}</Link>,
            },
            {
              key: "/activation-keys",
              icon: <KeyOutlined />,
              label: (
                <Link to="/activation-keys">{t("common.activationKeys")}</Link>
              ),
            },
            {
              key: "/settings",
              icon: <SettingOutlined />,
              label: <Link to="/settings">{t("common.settings")}</Link>,
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            position: "sticky",
            top: 0,
            zIndex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Conditionally render elements in different order for RTL */}
          {isRTL ? (
            <>
              {/* In RTL: Collapse button first (appears right), then user menu (appears left) */}
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "16px",
                  width: 64,
                  height: 64,
                }}
              />
              <Space>
                <Space>
                  <BankOutlined style={{ color: "#667eea" }} />
                  <Text strong>{school?.schoolName}</Text>
                </Space>
                <Dropdown
                  menu={{ items: languageMenuItems }}
                  placement="bottomLeft"
                  trigger={["click"]}
                >
                  <Button
                    type="text"
                    style={{ height: "auto", padding: "8px 12px" }}
                  >
                    <Space>
                      <GlobalOutlined />
                      <Text>{language === "ar" ? "العربية" : "English"}</Text>
                    </Space>
                  </Button>
                </Dropdown>
                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="bottomLeft"
                >
                  <Button
                    type="text"
                    style={{ height: "auto", padding: "8px 12px" }}
                  >
                    <Space>
                      <UserOutlined />
                      <Text>{school?.username}</Text>
                    </Space>
                  </Button>
                </Dropdown>
              </Space>
            </>
          ) : (
            <>
              {/* In LTR: Collapse button first (appears left), then user menu (appears right) */}
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "16px",
                  width: 64,
                  height: 64,
                }}
              />
              <Space>
                <Space>
                  <BankOutlined style={{ color: "#667eea" }} />
                  <Text strong>{school?.schoolName}</Text>
                </Space>
                <Dropdown
                  menu={{ items: languageMenuItems }}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <Button
                    type="text"
                    style={{ height: "auto", padding: "8px 12px" }}
                  >
                    <Space>
                      <GlobalOutlined />
                      <Text>{language === "ar" ? "العربية" : "English"}</Text>
                    </Space>
                  </Button>
                </Dropdown>
                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="bottomRight"
                >
                  <Button
                    type="text"
                    style={{ height: "auto", padding: "8px 12px" }}
                  >
                    <Space>
                      <UserOutlined />
                      <Text>{school?.username}</Text>
                    </Space>
                  </Button>
                </Dropdown>
              </Space>
            </>
          )}
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
