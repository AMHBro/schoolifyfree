import React, { useState } from "react";
import {
  Card,
  Table,
  Typography,
  Space,
  Tag,
  Button,
  Statistic,
  Row,
  Col,
  message,
  Tooltip,
  Input,
  Select,
  DatePicker,
} from "antd";
import {
  KeyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { activationKeysAPI } from "../services/api";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

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

const ActivationKeys: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);

  // Fetch activation keys
  const {
    data: keysData,
    isLoading,
    error,
    refetch,
  } = useQuery<ActivationKeysResponse>({
    queryKey: ["activation-keys"],
    queryFn: () => activationKeysAPI.getAll(),
    enabled: !!token,
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      message.success(t("activationKeys.messages.keyCopied"));
    });
  };

  const getStatusTags = (key: ActivationKey) => {
    const isExpired = new Date(key.expiresAt) <= new Date();
    const tags = [];

    if (key.isUsed) {
      tags.push(
        <Tag key="used" color="success" icon={<CheckCircleOutlined />}>
          {t("activationKeys.table.status.used")}
        </Tag>
      );
    }

    if (isExpired) {
      tags.push(
        <Tag key="expired" color="error" icon={<ExclamationCircleOutlined />}>
          {t("activationKeys.table.status.expired")}
        </Tag>
      );
    }

    if (!key.isUsed && !isExpired) {
      tags.push(
        <Tag key="active" color="processing" icon={<ClockCircleOutlined />}>
          {t("activationKeys.table.status.active")}
        </Tag>
      );
    }

    return <Space size={4}>{tags}</Space>;
  };

  const filteredKeys =
    keysData?.data.keys.filter((key) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesKey = key.key.toLowerCase().includes(searchLower);
        const matchesStudent =
          key.student?.name.toLowerCase().includes(searchLower) ||
          key.student?.code.toLowerCase().includes(searchLower);
        if (!matchesKey && !matchesStudent) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const isExpired = new Date(key.expiresAt) <= new Date();

        if (statusFilter === "used" && !key.isUsed) return false;
        if (statusFilter === "expired" && !isExpired) return false;
        if (statusFilter === "active" && (key.isUsed || isExpired))
          return false;
      }

      // Date range filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const keyDate = dayjs(key.createdAt);
        if (
          keyDate.isBefore(dateRange[0], "day") ||
          keyDate.isAfter(dateRange[1], "day")
        )
          return false;
      }

      return true;
    }) || [];

  const columns = [
    {
      title: t("activationKeys.table.headers.activationKey"),
      dataIndex: "key",
      key: "key",
      width: 200,
      render: (key: string) => (
        <Space>
          <Input.Password
            value={key}
            readOnly
            size="small"
            style={{
              fontSize: "12px",
              width: "140px",
              border: "none",
              backgroundColor: "transparent",
              padding: 0,
              boxShadow: "none",
            }}
            visibilityToggle
          />
          <Tooltip title={t("activationKeys.actions.copyToClipboard")}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyKey(key)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: t("activationKeys.table.headers.status"),
      key: "status",
      width: 100,
      render: (_: any, record: ActivationKey) => getStatusTags(record),
    },
    {
      title: t("activationKeys.table.headers.usedBy"),
      key: "usedBy",
      width: 150,
      render: (_: any, record: ActivationKey) => {
        if (record.student) {
          return (
            <Space direction="vertical" size={0}>
              <Text strong>{record.student.name}</Text>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {t("activationKeys.table.usedBy.code", { code: record.student.code })}
              </Text>
            </Space>
          );
        }
        return <Text type="secondary">{t("activationKeys.table.usedBy.notUsed")}</Text>;
      },
    },
    {
      title: t("activationKeys.table.headers.usedAt"),
      dataIndex: "usedAt",
      key: "usedAt",
      width: 120,
      render: (usedAt: string) => {
        if (usedAt) {
          return (
            <Space direction="vertical" size={0}>
              <Text>{dayjs(usedAt).format("MMM DD, YYYY")}</Text>
              <Text type="secondary" style={{ fontSize: "11px" }}>
                {dayjs(usedAt).format("HH:mm")}
              </Text>
            </Space>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: t("activationKeys.table.headers.expiresAt"),
      dataIndex: "expiresAt",
      key: "expiresAt",
      width: 120,
      render: (expiresAt: string) => {
        const isExpired = new Date(expiresAt) <= new Date();
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ color: isExpired ? "#ff4d4f" : undefined }}>
              {dayjs(expiresAt).format("MMM DD, YYYY")}
            </Text>
            <Text
              type="secondary"
              style={{
                fontSize: "11px",
                color: isExpired ? "#ff4d4f" : undefined,
              }}
            >
              {dayjs(expiresAt).format("HH:mm")}
            </Text>
          </Space>
        );
      },
    },
    {
      title: t("activationKeys.table.headers.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (createdAt: string) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(createdAt).format("MMM DD, YYYY")}</Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            {dayjs(createdAt).format("HH:mm")}
          </Text>
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <Card>
        <Space direction="vertical" align="center" style={{ width: "100%" }}>
          <ExclamationCircleOutlined
            style={{ fontSize: 48, color: "#ff4d4f" }}
          />
          <Title level={4}>{t("activationKeys.messages.loadError")}</Title>
          <Text type="secondary">
            {error instanceof Error
              ? error.message
              : t("activationKeys.messages.unexpectedError")}
          </Text>
          <Button type="primary" onClick={() => refetch()}>
            {t("activationKeys.actions.tryAgain")}
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <KeyOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          {t("activationKeys.title")}
        </Title>
        <Text type="secondary">
          {t("activationKeys.subtitle")}
        </Text>
      </div>

      {/* Statistics Cards */}
      {keysData?.data.stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t("activationKeys.statistics.totalKeys")}
                value={keysData.data.stats.total}
                prefix={<KeyOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t("activationKeys.statistics.activeKeys")}
                value={keysData.data.stats.active}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t("activationKeys.statistics.usedKeys")}
                value={keysData.data.stats.used}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={t("activationKeys.statistics.expiredKeys")}
                value={keysData.data.stats.expired}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex={1}>
            <Search
              placeholder={t("activationKeys.filters.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%" }}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              placeholder={t("activationKeys.filters.statusFilter.placeholder")}
              prefix={<FilterOutlined />}
            >
              <Option value="all">{t("activationKeys.filters.statusFilter.all")}</Option>
              <Option value="active">{t("activationKeys.filters.statusFilter.active")}</Option>
              <Option value="used">{t("activationKeys.filters.statusFilter.used")}</Option>
              <Option value="expired">{t("activationKeys.filters.statusFilter.expired")}</Option>
            </Select>
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              placeholder={[
                t("activationKeys.filters.dateRange.startDate"),
                t("activationKeys.filters.dateRange.endDate")
              ]}
              style={{ width: 240 }}
            />
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            >
              {t("activationKeys.filters.refresh")}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Activation Keys Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredKeys}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: filteredKeys.length,
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              t("activationKeys.pagination.showTotal", {
                start: range[0],
                end: range[1],
                total: total
              }),
          }}
          scroll={{ x: 1000 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default ActivationKeys;
