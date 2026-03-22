import React, { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Menu,
  Button,
  theme,
  Dropdown,
  Space,
  Typography,
  Drawer,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  UserOutlined,
  AppstoreOutlined,
  BookOutlined,
  FileTextOutlined,
  TrophyOutlined,
  SettingOutlined,
  MessageOutlined,
  LogoutOutlined,
  BankOutlined,
  KeyOutlined,
  CommentOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage } from "./contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import { useIsNarrowScreen } from "./hooks/useIsNarrowScreen";

const { Text } = Typography;

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { school, logout } = useAuth();
  const { language, changeLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const isMobile = useIsNarrowScreen();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    if (!isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

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

  const menuItems = useMemo(
    () => [
      {
        key: "/",
        icon: <UserOutlined />,
        label: t("common.dashboard"),
      },
      {
        key: "/teachers",
        icon: <TeamOutlined />,
        label: t("common.teachers"),
      },
      {
        key: "/students",
        icon: <TeamOutlined />,
        label: t("common.students"),
      },
      {
        key: "/stages",
        icon: <AppstoreOutlined />,
        label: t("common.stages"),
      },
      {
        key: "/subjects",
        icon: <BookOutlined />,
        label: t("common.subjects"),
      },
      {
        key: "/exams",
        icon: <FileTextOutlined />,
        label: t("common.exams"),
      },
      {
        key: "/posts",
        icon: <MessageOutlined />,
        label: t("common.posts"),
      },
      {
        key: "/chats",
        icon: <CommentOutlined />,
        label: t("common.chats"),
      },
      {
        key: "/grades",
        icon: <TrophyOutlined />,
        label: t("common.grades"),
      },
      {
        key: "/activation-keys",
        icon: <KeyOutlined />,
        label: t("common.activationKeys"),
      },
      {
        key: "/settings",
        icon: <SettingOutlined />,
        label: t("common.settings"),
      },
    ],
    [t]
  );

  const handleMenuNavigate = ({ key }: { key: string }) => {
    navigate(key);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const logoBlock = (
    <div
      style={{
        height: "64px",
        margin: isMobile ? "12px" : "16px",
        background: "rgba(255, 255, 255, 0.2)",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: collapsed && !isMobile ? "14px" : "18px",
        fontWeight: "bold",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        padding: "0 8px",
      }}
    >
      Schoolify
    </div>
  );

  const sidebarMenu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuNavigate}
    />
  );

  const drawerMenu = (
    <>
      {logoBlock}
      {sidebarMenu}
    </>
  );

  const headerPadding = isMobile ? "0 8px 0 12px" : "0 24px";
  const contentMargin = isMobile ? "12px 8px" : "24px 16px";
  const contentPadding = isMobile ? 12 : 24;

  const menuToggleButton = (
    <Button
      type="text"
      icon={
        isMobile ? (
          <MenuUnfoldOutlined />
        ) : collapsed ? (
          <MenuUnfoldOutlined />
        ) : (
          <MenuFoldOutlined />
        )
      }
      onClick={() =>
        isMobile ? setMobileDrawerOpen(true) : setCollapsed(!collapsed)
      }
      aria-label={
        isMobile
          ? isRTL
            ? "فتح القائمة"
            : "Open menu"
          : collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
      }
      style={{
        fontSize: "16px",
        width: isMobile ? 48 : 64,
        height: isMobile ? 48 : 64,
        flexShrink: 0,
      }}
    />
  );

  const headerRight = (
    <Space size={isMobile ? "small" : "middle"} style={{ minWidth: 0 }}>
      <Space size="small" style={{ minWidth: 0, display: isMobile ? "none" : "flex" }}>
        <BankOutlined style={{ color: "#667eea", flexShrink: 0 }} />
        <Text strong ellipsis style={{ maxWidth: 200 }}>
          {school?.schoolName}
        </Text>
      </Space>
      {isMobile && (
        <Space size={4} style={{ minWidth: 0 }}>
          <BankOutlined style={{ color: "#667eea", flexShrink: 0 }} />
          <Text strong ellipsis style={{ maxWidth: 120 }}>
            {school?.schoolName}
          </Text>
        </Space>
      )}
      <Dropdown
        menu={{ items: languageMenuItems }}
        placement={isRTL ? "bottomLeft" : "bottomRight"}
        trigger={["click"]}
      >
        <Button
          type="text"
          style={{
            height: "auto",
            padding: isMobile ? "8px 6px" : "8px 12px",
            flexShrink: 0,
          }}
        >
          <Space size={4}>
            <GlobalOutlined />
            {!isMobile && (
              <Text>{language === "ar" ? "العربية" : "English"}</Text>
            )}
          </Space>
        </Button>
      </Dropdown>
      <Dropdown
        menu={{ items: userMenuItems }}
        placement={isRTL ? "bottomLeft" : "bottomRight"}
      >
        <Button
          type="text"
          style={{
            height: "auto",
            padding: isMobile ? "8px 6px" : "8px 12px",
            maxWidth: isMobile ? 120 : "none",
          }}
        >
          <Space size={4}>
            <UserOutlined />
            <Text ellipsis style={{ maxWidth: isMobile ? 72 : 160 }}>
              {school?.username}
            </Text>
          </Space>
        </Button>
      </Dropdown>
    </Space>
  );

  return (
    <Layout
      className={`sms-root-layout${isMobile ? " sms-root-layout--mobile" : ""}`}
      style={{
        minHeight: "100dvh",
        direction: isRTL ? "rtl" : "ltr",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          reverseArrow={isRTL}
          width={200}
          collapsedWidth={80}
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "auto",
          }}
        >
          {logoBlock}
          {sidebarMenu}
        </Sider>
      )}

      <Drawer
        title={null}
        placement={isRTL ? "right" : "left"}
        width={280}
        onClose={() => setMobileDrawerOpen(false)}
        open={isMobile && mobileDrawerOpen}
        styles={{
          body: { padding: 0, background: "#001529" },
          header: { display: "none" },
        }}
        className="sms-mobile-drawer"
      >
        {drawerMenu}
      </Drawer>

      <Layout style={{ minWidth: 0, flex: 1, maxWidth: "100%" }}>
        <Header
          className="sms-app-header"
          style={{
            padding: headerPadding,
            background: colorBgContainer,
            position: "sticky",
            top: 0,
            zIndex: 100,
            width: "100%",
            maxWidth: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "nowrap",
          }}
        >
          {isRTL ? (
            <>
              {headerRight}
              {menuToggleButton}
            </>
          ) : (
            <>
              {menuToggleButton}
              {headerRight}
            </>
          )}
        </Header>
        <Content
          className="sms-main-content"
          style={{
            margin: contentMargin,
            padding: contentPadding,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 240,
            maxWidth: "100%",
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
