import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  message,
  Modal,
  Progress,
  Upload,
  Row,
  Col,
  Alert,
  Form,
  Input,
  Divider,
  Tag,
} from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  DatabaseOutlined,
  FileZipOutlined,
  CloudDownloadOutlined,
  SettingOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SafetyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { backupAPI, systemSettingsAPI } from "../services/api";

const { Title, Text, Paragraph } = Typography;

interface BackupData {
  teachers: any[];
  students: any[];
  stages: any[];
  subjects: any[];
  schedules: any[];
  exams: any[];
  activationKeys: any[];
  posts: any[];
  grades: any[];
  notes: any[];
  attendance: any[];
  chats: any[];
  adminChats: any[];
  systemSettings: any;
  metadata: {
    exportDate: string;
    version: string;
    totalRecords: number;
    schoolCode: string;
  };
}

interface SystemSettings {
  id: string;
  countryName: string;
  ministryName: string;
  schoolName: string;
  managerName: string;
  studyYear: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface SchoolData {
  accessCode?: string;
  accessCodeActivated: boolean;
}

const Settings: React.FC = () => {
  const { t } = useTranslation();

  // API Base URL from environment variable
  // In production: empty string to use Vercel rewrites (/auth/* -> backend)
  // In development: http://localhost:3000 for local backend
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:3000" : "");

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(
    null
  );
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [form] = Form.useForm();

  // Access Code State
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [isActivationModalVisible, setIsActivationModalVisible] =
    useState(false);
  const [isDeactivationModalVisible, setIsDeactivationModalVisible] =
    useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Last backup timestamp state
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // Define fetchSchoolData before useEffect
  const fetchSchoolData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No authentication token found");
        return;
      }

      console.log(
        "🔍 Fetching school profile from:",
        `${apiBaseUrl}/school/profile`
      );
      const response = await fetch(`${apiBaseUrl}/school/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Prevent caching to ensure fresh data
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        // Force bypass cache
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "School profile fetch failed:",
          response.status,
          errorData
        );

        if (response.status === 401 || response.status === 403) {
          // Token is invalid - user might need to re-login
          console.warn("Authentication failed - token may be invalid");
        }
        return;
      }

      const data = await response.json();
      console.log("✅ School profile response:", data);

      if (data.success && data.data) {
        console.log("📋 Setting school data:", {
          accessCode: data.data.accessCode,
          accessCodeActivated: data.data.accessCodeActivated,
        });
        setSchoolData({
          accessCode: data.data.accessCode,
          accessCodeActivated: data.data.accessCodeActivated,
        });
      } else {
        console.error("Invalid response format:", data);
      }
    } catch (error) {
      console.error("Failed to fetch school data:", error);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchSystemSettings();
    fetchSchoolData();
    // Load last backup time from localStorage
    const savedBackupTime = localStorage.getItem("lastBackupTime");
    if (savedBackupTime) {
      setLastBackupTime(savedBackupTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSchoolData]);

  // Manual refresh function
  const handleRefreshStatus = async () => {
    console.log("🔄 Refresh Status button clicked");
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Please log in again - session expired");
        setIsRefreshing(false);
        return;
      }

      console.log("📡 Calling fetchSchoolData...");
      await fetchSchoolData();

      // Check if data was actually updated
      if (schoolData) {
        console.log("✅ Refresh completed, current schoolData:", schoolData);
        message.success(t("settings.companyAccess.refreshSuccess"));
      } else {
        console.warn("⚠️ Refresh completed but schoolData is null");
        message.warning("Could not fetch latest status. Please try again.");
      }
    } catch (error) {
      console.error("Refresh error:", error);
      message.error(t("settings.companyAccess.refreshFailed"));
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchSystemSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await systemSettingsAPI.get();
      if (response.success) {
        setSystemSettings(response.data);
        form.setFieldsValue({
          countryName: response.data.countryName,
          ministryName: response.data.ministryName,
          schoolName: response.data.schoolName,
          managerName: response.data.managerName,
          studyYear: response.data.studyYear,
        });
      }
    } catch (error) {
      console.error("Failed to fetch system settings:", error);
      message.error(t("settings.systemConfiguration.loadFailed"));
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSaveSettings = async (values: any) => {
    setIsSavingSettings(true);
    try {
      const response = await systemSettingsAPI.update(values);
      if (response.success) {
        setSystemSettings(response.data);
        message.success(t("settings.systemConfiguration.updateSuccess"));
      }
    } catch (error) {
      console.error("Failed to update system settings:", error);
      message.error(t("settings.systemConfiguration.updateFailed"));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleActivateAccessCode = async () => {
    setIsSendingCode(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${apiBaseUrl}/auth/school/access-code/activate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setMaskedPhone(data.data?.phoneNumber || null);
        setIsActivationModalVisible(true);
        message.success(t("settings.activationModal.codeSentSuccess"));
      } else {
        // If access code is already activated, refresh the school data to update UI
        if (data.message?.includes("already activated")) {
          await fetchSchoolData();
          message.info(t("settings.companyAccess.alreadyActivated"));
        } else {
          message.error(
            data.message || t("settings.activationModal.sendCodeFailed")
          );
        }
      }
    } catch (error) {
      console.error("Failed to send activation code:", error);
      message.error(t("settings.activationModal.sendCodeFailed"));
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyActivation = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      message.error(t("settings.activationModal.invalidCode"));
      return;
    }

    setIsVerifying(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${apiBaseUrl}/auth/school/access-code/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ verificationCode }),
        }
      );

      const data = await response.json();

      if (data.success) {
        message.success(t("settings.activationModal.activateSuccess"));
        // Refresh school data from backend to ensure UI is in sync
        await fetchSchoolData();
        setIsActivationModalVisible(false);
        setVerificationCode("");
        setMaskedPhone(null);
      } else {
        message.error(
          data.message || t("settings.activationModal.verifyFailed")
        );
      }
    } catch (error) {
      console.error("Failed to verify activation code:", error);
      message.error(t("settings.activationModal.verifyFailed"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeactivateAccessCode = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${apiBaseUrl}/auth/school/access-code/deactivate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        message.success(t("settings.deactivationModal.deactivateSuccess"));
        // Refresh school data from backend to ensure UI is in sync
        await fetchSchoolData();
        setIsDeactivationModalVisible(false);
      } else {
        message.error(
          data.message || t("settings.deactivationModal.deactivateFailed")
        );
      }
    } catch (error) {
      console.error("Failed to deactivate access code:", error);
      message.error(t("settings.deactivationModal.deactivateFailed"));
    }
  };

  // Fetch all data from APIs
  const fetchAllData = async (): Promise<BackupData> => {
    try {
      console.log("Calling backup API...");
      const result = await backupAPI.exportAll();
      console.log("Backup API response received successfully");
      return result;
    } catch (error) {
      console.error("Error fetching backup data:", error);

      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(t("settings.backup.backendNotAccessible"));
      } else if (error instanceof Error && error.message.includes("404")) {
        throw new Error(
          "Backup API endpoint not found. Please check the backend configuration."
        );
      } else if (error instanceof Error && error.message.includes("500")) {
        throw new Error(
          "Server error occurred while fetching data. Please try again."
        );
      } else {
        throw new Error(
          `${t("settings.backup.backupFailed")} ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  };

  // Create and download backup file
  const handleBackup = async () => {
    console.log("🔥 handleBackup function called!");

    setIsBackingUp(true);
    setBackupProgress(0);

    try {
      message.loading(t("settings.backup.fetchingData"), 0);
      console.log("Starting backup process...");

      // Check if backend is accessible first
      try {
        const healthCheck = await fetch(`${apiBaseUrl}/hello`);
        if (!healthCheck.ok) {
          throw new Error("Backend server is not accessible");
        }
        console.log("Backend server is accessible");
      } catch (error) {
        console.error("Backend connection failed:", error);
        throw new Error(t("settings.backup.backendNotAccessible"));
      }

      setBackupProgress(25);

      // Fetch all data
      console.log("Fetching backup data...");
      const backupData = await fetchAllData();
      console.log("Backup data received:", {
        teachers: backupData.teachers?.length || 0,
        students: backupData.students?.length || 0,
        stages: backupData.stages?.length || 0,
        subjects: backupData.subjects?.length || 0,
        schedules: backupData.schedules?.length || 0,
        exams: backupData.exams?.length || 0,
        activationKeys: backupData.activationKeys?.length || 0,
        posts: backupData.posts?.length || 0,
        grades: backupData.grades?.length || 0,
        notes: backupData.notes?.length || 0,
        attendance: backupData.attendance?.length || 0,
        chats: backupData.chats?.length || 0,
        adminChats: backupData.adminChats?.length || 0,
        systemSettings: backupData.systemSettings ? 1 : 0,
        totalRecords: backupData.metadata?.totalRecords || 0,
        schoolCode: backupData.metadata?.schoolCode || "unknown",
      });

      setBackupProgress(75);

      // Create JSON file
      const jsonData = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonData], {
        type: "application/json;charset=utf-8",
      });

      console.log("Created blob with size:", blob.size, "bytes");

      // Generate filename with timestamp and school code
      const now = new Date();
      const timestamp =
        now.toISOString().replace(/[:.]/g, "-").split("T")[0] +
        "_" +
        now.toTimeString().split(" ")[0].replace(/:/g, "-");
      const schoolCode = backupData.metadata?.schoolCode || "unknown";
      const filename = `sms-backup-${schoolCode}-${timestamp}.json`;

      console.log("Downloading file:", filename);

      // Create download link - improved method
      if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
        // For IE
        (window.navigator as any).msSaveOrOpenBlob(blob, filename);
      } else {
        // For modern browsers
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";

        // Ensure the link is in the DOM
        document.body.appendChild(link);

        // Trigger download
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      }

      setBackupProgress(100);

      // Save backup timestamp to localStorage
      const backupTimestamp = new Date().toISOString();
      localStorage.setItem("lastBackupTime", backupTimestamp);
      setLastBackupTime(backupTimestamp);

      message.destroy();
      message.success(
        t("settings.backup.backupSuccess", {
          count: backupData.metadata.totalRecords,
          filename,
        })
      );

      console.log("Backup completed successfully");
    } catch (error) {
      console.error("Backup failed:", error);
      message.destroy();

      let errorMessage = t("settings.backup.backupFailed");
      if (error instanceof Error) {
        errorMessage += " " + error.message;
      } else {
        errorMessage += " Please try again.";
      }

      message.error(errorMessage, 5); // Show error for 5 seconds

      // Show detailed error in console for debugging
      console.error("Detailed error:", {
        error,
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  // Handle file upload and import
  const handleFileUpload = async (file: File) => {
    setIsImporting(true);
    setImportProgress(0);

    try {
      message.loading(t("settings.backup.readingFile"), 0);
      console.log("🔥 Starting import process for file:", file.name);

      // Read file content
      const text = await file.text();
      setImportProgress(20);
      console.log("✅ File content read successfully");

      let backupData: BackupData;
      try {
        backupData = JSON.parse(text);
      } catch (error) {
        throw new Error(t("settings.backup.invalidFileFormat"));
      }

      // Validate backup data structure
      if (!backupData.metadata) {
        throw new Error(t("settings.backup.invalidFileStructure"));
      }

      console.log("✅ Backup data validated:", {
        teachers: backupData.teachers?.length || 0,
        students: backupData.students?.length || 0,
        stages: backupData.stages?.length || 0,
        subjects: backupData.subjects?.length || 0,
        schedules: backupData.schedules?.length || 0,
        exams: backupData.exams?.length || 0,
        activationKeys: backupData.activationKeys?.length || 0,
        posts: backupData.posts?.length || 0,
        grades: backupData.grades?.length || 0,
        notes: backupData.notes?.length || 0,
        attendance: backupData.attendance?.length || 0,
        chats: backupData.chats?.length || 0,
        adminChats: backupData.adminChats?.length || 0,
        systemSettings: backupData.systemSettings ? 1 : 0,
        exportDate: backupData.metadata.exportDate,
        version: backupData.metadata.version,
        schoolCode: backupData.metadata.schoolCode,
      });

      setImportProgress(40);

      // Import directly without confirmation modal
      console.log("🔥 Starting import to database...");
      await performImport(backupData);
    } catch (error) {
      console.error("Import failed:", error);
      message.destroy();
      message.error(
        error instanceof Error ? error.message : "Failed to import backup file"
      );
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Format last backup time for display
  const formatBackupTime = (timestamp: string | null): string => {
    if (!timestamp) return t("settings.backup.neverBackedUp");

    const backupDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - backupDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return t("settings.backup.justNow");
    } else if (diffMins < 60) {
      return t("settings.backup.minutesAgo", { minutes: diffMins });
    } else if (diffHours < 24) {
      return t("settings.backup.hoursAgo", { hours: diffHours });
    } else if (diffDays < 7) {
      return t("settings.backup.daysAgo", { days: diffDays });
    } else {
      return backupDate.toLocaleString();
    }
  };

  // Perform the actual import
  const performImport = async (backupData: BackupData) => {
    try {
      message.loading(t("settings.backup.importingData"), 0);
      console.log("🔥 performImport started");

      setImportProgress(50);

      console.log("📡 Calling backend import API...");
      const result = await backupAPI.importBulk({
        teachers: backupData.teachers,
        students: backupData.students,
        stages: backupData.stages,
        subjects: backupData.subjects,
        schedules: backupData.schedules,
        exams: backupData.exams,
        activationKeys: backupData.activationKeys,
        posts: backupData.posts,
        grades: backupData.grades,
        notes: backupData.notes,
        attendance: backupData.attendance,
        chats: backupData.chats,
        adminChats: backupData.adminChats,
        systemSettings: backupData.systemSettings,
      });

      console.log("✅ Backend import completed:", result);
      setImportProgress(100);

      message.destroy();

      if (result.errors.length > 0) {
        console.log("⚠️ Import completed with warnings:", result.errors);
        Modal.warning({
          title: t("settings.backup.importWithWarnings"),
          content: (
            <div>
              <p>Successfully imported {result.imported} records.</p>
              <p>Errors encountered:</p>
              <ul style={{ maxHeight: 200, overflow: "auto" }}>
                {result.errors.slice(0, 10).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {result.errors.length > 10 && (
                  <li>... and {result.errors.length - 10} more errors</li>
                )}
              </ul>
            </div>
          ),
        });
      } else {
        console.log("✅ Import completed successfully!");
        message.success(
          t("settings.backup.importSuccess", { count: result.imported })
        );
      }
    } catch (error) {
      console.error("❌ Import process failed:", error);
      message.destroy();
      message.error(t("settings.backup.importFailed"));
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>
        <SettingOutlined /> {t("settings.title")}
      </Title>

      {/* System Settings Section */}
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>{t("settings.systemConfiguration.title")}</span>
          </Space>
        }
        style={{ marginBottom: "24px" }}
      >
        <Paragraph>{t("settings.systemConfiguration.description")}</Paragraph>

        <Form form={form} layout="vertical" onFinish={handleSaveSettings}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t("settings.systemConfiguration.countryName")}
                name="countryName"
                rules={[
                  {
                    required: true,
                    message: t(
                      "settings.systemConfiguration.countryNameRequired"
                    ),
                  },
                ]}
              >
                <Input
                  placeholder={t(
                    "settings.systemConfiguration.countryNamePlaceholder"
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t("settings.systemConfiguration.ministryName")}
                name="ministryName"
                rules={[
                  {
                    required: true,
                    message: t(
                      "settings.systemConfiguration.ministryNameRequired"
                    ),
                  },
                ]}
              >
                <Input
                  placeholder={t(
                    "settings.systemConfiguration.ministryNamePlaceholder"
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t("settings.systemConfiguration.schoolName")}
                name="schoolName"
                rules={[
                  {
                    required: true,
                    message: t(
                      "settings.systemConfiguration.schoolNameRequired"
                    ),
                  },
                ]}
              >
                <Input
                  placeholder={t(
                    "settings.systemConfiguration.schoolNamePlaceholder"
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t("settings.systemConfiguration.managerName")}
                name="managerName"
                rules={[
                  {
                    required: true,
                    message: t(
                      "settings.systemConfiguration.managerNameRequired"
                    ),
                  },
                ]}
              >
                <Input
                  placeholder={t(
                    "settings.systemConfiguration.managerNamePlaceholder"
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t("settings.systemConfiguration.studyYear")}
                name="studyYear"
                rules={[
                  {
                    required: true,
                    message: t(
                      "settings.systemConfiguration.studyYearRequired"
                    ),
                  },
                ]}
              >
                <Input
                  placeholder={t(
                    "settings.systemConfiguration.studyYearPlaceholder"
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSavingSettings}
              icon={<SettingOutlined />}
            >
              {t("settings.systemConfiguration.saveSettings")}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      {/* Access Code Section */}
      <Card
        title={
          <Space>
            <SafetyOutlined />
            <span>{t("settings.companyAccess.title")}</span>
            {schoolData?.accessCodeActivated ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                {t("settings.companyAccess.activated")}
              </Tag>
            ) : (
              <Tag color="default" icon={<StopOutlined />}>
                {t("settings.companyAccess.notActivated")}
              </Tag>
            )}
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Alert
            message={t("settings.companyAccess.whatIs")}
            description={
              <Space direction="vertical" size={8}>
                <Text>{t("settings.companyAccess.description")}</Text>
                {!schoolData?.accessCodeActivated ? (
                  <Text strong style={{ color: "#fa8c16" }}>
                    {t("settings.companyAccess.disabledWarning")}
                  </Text>
                ) : (
                  <Text strong style={{ color: "#52c41a" }}>
                    {t("settings.companyAccess.enabledSuccess")}
                  </Text>
                )}
              </Space>
            }
            type={schoolData?.accessCodeActivated ? "success" : "warning"}
            showIcon
          />

          <Row gutter={[24, 16]}>
            <Col span={12}>
              <div
                style={{
                  padding: "16px",
                  background: "#fafafa",
                  borderRadius: "6px",
                  border: "1px solid #f0f0f0",
                }}
              >
                <Space direction="vertical" size={4}>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {t("settings.companyAccess.accessCode")}
                  </Text>
                  {schoolData?.accessCode ? (
                    <Text code style={{ fontSize: "14px" }}>
                      {schoolData.accessCode}
                    </Text>
                  ) : (
                    <Text type="secondary" style={{ fontStyle: "italic" }}>
                      {t("settings.companyAccess.noAccessCode")}
                    </Text>
                  )}
                </Space>
              </div>
            </Col>
            <Col span={12}>
              <div
                style={{
                  padding: "16px",
                  background: "#fafafa",
                  borderRadius: "6px",
                  border: "1px solid #f0f0f0",
                }}
              >
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {t("settings.companyAccess.status")}
                    </Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={handleRefreshStatus}
                      loading={isRefreshing}
                      title={t("settings.companyAccess.refreshButton")}
                    />
                  </div>
                  <Text
                    strong
                    style={{
                      color: schoolData?.accessCodeActivated
                        ? "#52c41a"
                        : "#8c8c8c",
                    }}
                  >
                    {schoolData?.accessCodeActivated
                      ? t("settings.companyAccess.activatedEnabled")
                      : t("settings.companyAccess.deactivated")}
                  </Text>
                </Space>
              </div>
            </Col>
          </Row>

          <Space>
            {schoolData?.accessCodeActivated ? (
              <Button
                type="default"
                danger
                icon={<StopOutlined />}
                onClick={() => setIsDeactivationModalVisible(true)}
                size="large"
              >
                {t("settings.companyAccess.deactivateButton")}
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<KeyOutlined />}
                onClick={handleActivateAccessCode}
                loading={isSendingCode}
                size="large"
              >
                {t("settings.companyAccess.activateButton")}
              </Button>
            )}

            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={handleRefreshStatus}
              loading={isRefreshing}
              size="large"
            >
              {t("settings.companyAccess.refreshButton")}
            </Button>
          </Space>
        </Space>
      </Card>

      <Divider />

      {/* Backup & Restore Section */}
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>{t("settings.backup.title")}</span>
          </Space>
        }
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <CloudDownloadOutlined />
                  {t("settings.backup.backupTitle")}
                </Space>
              }
              actions={[
                <Button
                  key="backup"
                  type="primary"
                  icon={<DownloadOutlined />}
                  loading={isBackingUp}
                  onClick={handleBackup}
                  size="large"
                >
                  {t("settings.backup.createBackup")}
                </Button>,
              ]}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text>{t("settings.backup.backupDescription")}</Text>

                {/* Last Backup Time Display */}
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#f0f5ff",
                    borderRadius: "6px",
                    border: "1px solid #adc6ff",
                  }}
                >
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {t("settings.backup.lastBackup")}
                    </Text>
                    <Text
                      strong
                      style={{ color: lastBackupTime ? "#1890ff" : "#8c8c8c" }}
                    >
                      {formatBackupTime(lastBackupTime)}
                    </Text>
                  </Space>
                </div>

                <Alert
                  message={t("settings.backup.backupInfo")}
                  description={
                    <div>
                      <Text>{t("settings.backup.backupInfoDescription")}</Text>
                      <div style={{ marginTop: "12px" }}>
                        <Text strong>{t("settings.backup.includes")}</Text>
                        <ul style={{ marginTop: "8px", marginBottom: 0 }}>
                          <li>
                            {t("settings.backup.includesTeachersStudents")}
                          </li>
                          <li>{t("settings.backup.includesSchedulesExams")}</li>
                          <li>{t("settings.backup.includesGradesNotes")}</li>
                          <li>{t("settings.backup.includesAttendance")}</li>
                          <li>{t("settings.backup.includesPosts")}</li>
                          <li>{t("settings.backup.includesChats")}</li>
                          <li>{t("settings.backup.includesActivationKeys")}</li>
                          <li>{t("settings.backup.includesSystemSettings")}</li>
                        </ul>
                        <Text
                          type="success"
                          strong
                          style={{ display: "block", marginTop: "8px" }}
                        >
                          {t("settings.backup.passwordsSecure")}
                        </Text>
                        <Text
                          type="secondary"
                          style={{
                            display: "block",
                            marginTop: "4px",
                            fontSize: "12px",
                          }}
                        >
                          {t("settings.backup.passwordsNote")}
                        </Text>
                      </div>
                    </div>
                  }
                  type="info"
                  showIcon
                />
                {isBackingUp && (
                  <Progress
                    percent={backupProgress}
                    status="active"
                    strokeColor={{
                      from: "#108ee9",
                      to: "#87d068",
                    }}
                  />
                )}
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <FileZipOutlined />
                  {t("settings.backup.importTitle")}
                </Space>
              }
              actions={[
                <Upload
                  key="import"
                  beforeUpload={(file) => {
                    handleFileUpload(file);
                    return false; // Prevent default upload behavior
                  }}
                  accept=".json"
                  showUploadList={false}
                  disabled={isImporting}
                >
                  <Button
                    type="default"
                    icon={<UploadOutlined />}
                    loading={isImporting}
                    size="large"
                  >
                    {t("settings.backup.selectFile")}
                  </Button>
                </Upload>,
              ]}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Text>{t("settings.backup.importDescription")}</Text>
                <Alert
                  message={t("settings.backup.importWarning")}
                  description={t("settings.backup.importWarningDescription")}
                  type="warning"
                  showIcon
                />
                {isImporting && (
                  <Progress
                    percent={importProgress}
                    status="active"
                    strokeColor={{
                      from: "#ff7875",
                      to: "#ff9c6e",
                    }}
                  />
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Activation Modal */}
      <Modal
        title={t("settings.activationModal.title")}
        open={isActivationModalVisible}
        onCancel={() => {
          setIsActivationModalVisible(false);
          setVerificationCode("");
          setMaskedPhone(null);
        }}
        footer={null}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Alert
            message={t("settings.activationModal.verificationRequired")}
            description={`${t("settings.activationModal.codeSent")}${
              maskedPhone ? `: ${maskedPhone}` : ""
            }.`}
            type="info"
            showIcon
          />

          <div>
            <Text strong style={{ marginBottom: "8px", display: "block" }}>
              {t("settings.activationModal.enterCode")}
            </Text>
            <Input
              placeholder={t("settings.activationModal.codePlaceholder")}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              size="large"
              style={{ width: "100%" }}
            />
          </div>

          <Alert
            message={t("settings.activationModal.important")}
            description={t("settings.activationModal.importantMessage")}
            type="warning"
            showIcon
          />

          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                setIsActivationModalVisible(false);
                setVerificationCode("");
                setMaskedPhone(null);
              }}
            >
              {t("settings.activationModal.cancel")}
            </Button>
            <Button
              type="primary"
              onClick={handleVerifyActivation}
              loading={isVerifying}
              disabled={verificationCode.length !== 6}
            >
              {t("settings.activationModal.activate")}
            </Button>
          </Space>
        </Space>
      </Modal>

      {/* Deactivation Confirmation Modal */}
      <Modal
        title={t("settings.deactivationModal.title")}
        open={isDeactivationModalVisible}
        onCancel={() => setIsDeactivationModalVisible(false)}
        onOk={handleDeactivateAccessCode}
        okText={t("settings.deactivationModal.deactivate")}
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" size="middle">
          <Alert
            message={t("settings.deactivationModal.confirmTitle")}
            description={t("settings.deactivationModal.confirmMessage")}
            type="warning"
            showIcon
          />
          <Text>{t("settings.deactivationModal.reactivateNote")}</Text>
        </Space>
      </Modal>
    </div>
  );
};

export default Settings;
