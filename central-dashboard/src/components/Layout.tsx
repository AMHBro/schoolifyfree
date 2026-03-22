import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Layout as AntLayout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Typography,
  Space,
  Drawer,
} from "antd";
import {
  DashboardOutlined,
  BankOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { useIsNarrowScreen } from "../hooks/useIsNarrowScreen";
import type { MenuProps } from "antd";

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsNarrowScreen();

  useEffect(() => {
    if (!isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile]);

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/schools",
      icon: <BankOutlined />,
      label: "Schools",
    },
    {
      key: "/requests",
      icon: <ExclamationCircleOutlined />,
      label: "Requests",
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  const sidebarLogo = (
    <div
      style={{
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: "1px solid #f0f0f0",
        margin: "0 16px",
      }}
    >
      {!collapsed ? (
        <Text strong style={{ fontSize: "18px", color: "#1890ff" }}>
          Central Dashboard
        </Text>
      ) : (
        <div
          style={{
            width: "32px",
            height: "32px",
            background: "#1890ff",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "16px",
          }}
        >
          C
        </div>
      )}
    </div>
  );

  const sidebarMenu = (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{
        border: "none",
        marginTop: "16px",
      }}
    />
  );

  return (
    <AntLayout className="central-app-layout" style={{ minHeight: "100vh", width: "100%" }}>
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          collapsedWidth={80}
          breakpoint="lg"
          onBreakpoint={(broken) => {
            if (broken) {
              setCollapsed(true);
            }
          }}
          style={{
            background: "#fff",
            boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
            position: "relative",
            overflow: "auto",
          }}
        >
          {sidebarLogo}
          {sidebarMenu}
        </Sider>
      )}

      <Drawer
        title={null}
        placement="left"
        width={280}
        onClose={() => setMobileDrawerOpen(false)}
        open={isMobile && mobileDrawerOpen}
        styles={{
          body: { padding: 0 },
          header: { display: "none" },
        }}
        className="central-mobile-drawer"
      >
        <div style={{ paddingTop: 8 }}>
          <div
            style={{
              height: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: "1px solid #f0f0f0",
              margin: "0 16px 8px",
            }}
          >
            <Text strong style={{ fontSize: "16px", color: "#1890ff" }}>
              Central Dashboard
            </Text>
          </div>
          {sidebarMenu}
        </div>
      </Drawer>

      <AntLayout style={{ minWidth: 0 }}>
        <Header
          className="central-app-header"
          style={{
            padding: isMobile ? "0 12px" : "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            zIndex: 1,
            position: "sticky",
            top: 0,
            flexWrap: "nowrap",
            gap: 8,
          }}
        >
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
            aria-label={isMobile ? "Open menu" : collapsed ? "Expand menu" : "Collapse menu"}
            style={{
              fontSize: "18px",
              width: isMobile ? 48 : 64,
              height: isMobile ? 48 : 64,
              flexShrink: 0,
            }}
          />

          <Space size={isMobile ? "small" : "middle"} style={{ minWidth: 0 }}>
            {!isMobile && <Text type="secondary">Welcome back,</Text>}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
              trigger={["click"]}
            >
              <Button
                type="text"
                style={{
                  height: "auto",
                  padding: isMobile ? "8px 4px" : "8px 12px",
                  maxWidth: isMobile ? 140 : "none",
                }}
              >
                <Space size="small">
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#1890ff", flexShrink: 0 }}
                  />
                  <Text strong ellipsis style={{ maxWidth: isMobile ? 72 : 200 }}>
                    {admin?.name}
                  </Text>
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content
          className="central-app-content"
          style={{
            margin: isMobile ? "12px" : "24px",
            padding: isMobile ? "12px" : "24px",
            background: "#fff",
            borderRadius: "8px",
            minHeight: "calc(100vh - 112px)",
            maxWidth: "100%",
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
