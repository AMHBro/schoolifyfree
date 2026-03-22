import React, { useState } from "react";
import {
  Table,
  Tag,
  Button,
  message,
  Spin,
  Alert,
  Space,
  Popconfirm,
  Input,
  Modal,
  Form,
  Select,
  DatePicker,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMars,
  faVenus,
  faCopy,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { UserOutlined, PhoneOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  useStudentsPaginated,
  useDeleteStudent,
  useUpdateStudent,
  useStages,
  useAvailableActivationKeys,
  useUpdateStudentActivationKey,
} from "../../hooks/useAPI";
import type {
  Student,
  CreateStudentRequest,
  StudentFilters,
} from "../../types/api";
import StudentsFilters from "./StudentsFilters";
import { useTranslation } from "react-i18next";

interface StudentsTableProps {
  searchQuery: string;
}

interface StudentEditFormValues {
  name1: string;
  name2: string;
  name3: string;
  name4: string;
  birthdate: dayjs.Dayjs;
  gender: "male" | "female";
  phoneNumber: string;
  stageId: string;
}

interface ActivationKeyFormValues {
  activationKeyId: string;
}

const StudentsTable: React.FC<StudentsTableProps> = ({ searchQuery }) => {
  const navigate = useNavigate();
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<StudentFilters>({});
  const [form] = Form.useForm();
  const { t } = useTranslation();

  // Activation key update modal state
  const [isActivationKeyModalVisible, setIsActivationKeyModalVisible] =
    useState(false);
  const [selectedStudentForKeyUpdate, setSelectedStudentForKeyUpdate] =
    useState<Student | null>(null);
  const [activationKeyForm] = Form.useForm();

  // Use paginated data with search and filters
  const {
    data: paginatedData,
    isLoading,
    error,
  } = useStudentsPaginated({
    page: currentPage,
    limit: pageSize,
    search: searchQuery.trim() || undefined,
    stageId: filters.stageId,
    gender: filters.gender,
    minAge: filters.minAge,
    maxAge: filters.maxAge,
    activationKeyStatus: filters.activationKeyStatus,
  });

  const { data: stages, isLoading: stagesLoading } = useStages();
  const { data: activationKeysData } = useAvailableActivationKeys();
  const deleteStudentMutation = useDeleteStudent();
  const updateStudentMutation = useUpdateStudent();
  const updateActivationKeyMutation = useUpdateStudentActivationKey();

  const displayData = paginatedData?.data || [];

  // Reset to first page when search query or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const handleFiltersChange = (newFilters: StudentFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);

    // Split the full name into four parts (fallback to empty strings if not enough parts)
    const nameParts = student.name.split(" ");
    const name1 = nameParts[0] || "";
    const name2 = nameParts[1] || "";
    const name3 = nameParts[2] || "";
    const name4 = nameParts.slice(3).join(" ") || ""; // Join remaining parts for fourth name

    form.setFieldsValue({
      name1,
      name2,
      name3,
      name4,
      gender: student.gender,
      phoneNumber: student.phoneNumber,
      stageId: student.stage.id,
      // Note: birthdate might not be available in existing student data
      // So we don't set it here to avoid errors
    });
    setIsEditModalVisible(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteStudentMutation.mutateAsync(id);

      // Enhanced success notification for deletion
      message.success({
        content: t("students.messages.deleteSuccess", { name }),
        duration: 4,
        style: {
          marginTop: "10px",
        },
      });
    } catch (error) {
      // Enhanced error notification for deletion
      message.error({
        content: t("students.messages.deleteFailed", { name }),
        duration: 5,
        style: {
          marginTop: "10px",
        },
      });
      console.error("Error deleting student:", error);
    }
  };

  const handleEditSubmit = async (values: StudentEditFormValues) => {
    if (!editingStudent) return;

    try {
      // Combine the four name parts into a single name
      const fullName =
        `${values.name1} ${values.name2} ${values.name3} ${values.name4}`.trim();

      // Calculate age from birthdate (DatePicker returns dayjs object)
      const birthDate = dayjs.isDayjs(values.birthdate)
        ? values.birthdate
        : dayjs(values.birthdate);

      const today = dayjs();
      const age = today.diff(birthDate, "year");

      const studentData: Partial<CreateStudentRequest> = {
        name: fullName,
        age: age,
        gender: values.gender,
        phoneNumber: values.phoneNumber,
        stageId: values.stageId,
      };

      await updateStudentMutation.mutateAsync({
        id: editingStudent.id,
        data: studentData,
      });

      // Enhanced success notification
      message.success({
        content: t("students.messages.updateSuccess", { name: fullName }),
        duration: 4,
        style: {
          marginTop: "10px",
        },
      });

      setIsEditModalVisible(false);
      setEditingStudent(null);
      form.resetFields();
    } catch (error) {
      // Enhanced error notification
      message.error({
        content: t("students.messages.updateFailed", {
          name: editingStudent.name,
        }),
        duration: 5,
        style: {
          marginTop: "10px",
        },
      });
      console.error("Error updating student:", error);
    }
  };

  const handleActivationKeyClick = (student: Student) => {
    if (
      student.activationKey?.status === "expired" ||
      student.activationKey?.status === "used"
    ) {
      setSelectedStudentForKeyUpdate(student);
      setIsActivationKeyModalVisible(true);
    }
  };

  const handleActivationKeyUpdate = async (values: ActivationKeyFormValues) => {
    if (!selectedStudentForKeyUpdate) return;

    try {
      await updateActivationKeyMutation.mutateAsync({
        studentId: selectedStudentForKeyUpdate.id,
        activationKeyId: values.activationKeyId,
      });
      message.success(t("students.messages.activationKeyUpdateSuccess"));
      setIsActivationKeyModalVisible(false);
      setSelectedStudentForKeyUpdate(null);
      activationKeyForm.resetFields();
    } catch {
      message.error(t("students.messages.activationKeyUpdateFailed"));
    }
  };

  const columns: ColumnsType<Student> = [
    {
      title: t("students.table.name"),
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text: string, record: Student) => (
        <span
          style={{ cursor: "pointer", color: "#1890ff" }}
          onClick={() => navigate(`/students/${record.id}`)}
        >
          {text}{" "}
          <FontAwesomeIcon
            icon={record.gender === "male" ? faMars : faVenus}
            style={{
              marginLeft: 8,
              color: record.gender === "male" ? "#1890ff" : "#eb2f96",
            }}
          />
        </span>
      ),
    },
    {
      title: t("students.table.phoneNumber"),
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      sorter: (a, b) => a.phoneNumber.localeCompare(b.phoneNumber),
    },
    {
      title: t("students.table.age"),
      dataIndex: "age",
      key: "age",
      sorter: (a, b) => a.age - b.age,
    },
    {
      title: t("students.table.stage"),
      dataIndex: "stage",
      key: "stage",
      sorter: (a, b) => a.stage.number - b.stage.number,
      render: (stage: Student["stage"]) => <Tag color="blue">{stage.name}</Tag>,
    },
    {
      title: t("students.table.code"),
      dataIndex: "code",
      key: "code",
      render: (code: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{code}</span>
          <Button
            type="text"
            icon={<FontAwesomeIcon icon={faCopy} />}
            onClick={() => {
              navigator.clipboard.writeText(code);
              message.success(t("students.table.codeCopied"));
            }}
          />
        </div>
      ),
    },
    {
      title: t("students.table.activationKey"),
      dataIndex: "activationKey",
      key: "activationKey",
      render: (activationKey: Student["activationKey"], record: Student) => {
        if (!activationKey) {
          return <Tag color="red">{t("students.table.noKey")}</Tag>;
        }

        const getStatusColor = (status: string) => {
          switch (status) {
            case "active":
              return "green";
            case "used":
              return "blue";
            case "expired":
              return "red";
            default:
              return "default";
          }
        };

        const isExpired =
          activationKey.isExpired || activationKey.status === "expired";
        const isUsed = activationKey.isUsed || activationKey.status === "used";
        const isActive = activationKey.status === "active";

        // Only expired keys are clickable
        const canUpdateKey = isExpired;

        const tags = [];

        if (isUsed) {
          tags.push(
            <Tag key="used" color={getStatusColor("used")}>
              {t("students.table.used")}
            </Tag>
          );
        }

        if (isExpired) {
          tags.push(
            <Tag
              key="expired"
              color={getStatusColor("expired")}
              style={{
                cursor: canUpdateKey ? "pointer" : "default",
                ...(canUpdateKey && { textDecoration: "underline" }),
              }}
              onClick={() => canUpdateKey && handleActivationKeyClick(record)}
              title={
                canUpdateKey
                  ? t("students.activationKey.updateKeyTooltip")
                  : undefined
              }
            >
              {t("students.table.expired")}
            </Tag>
          );
        }

        if (isActive) {
          tags.push(
            <Tag key="active" color={getStatusColor("active")}>
              {t("students.table.active")}
            </Tag>
          );
        }

        return (
          <div>
            <Space size={4}>{tags}</Space>
            <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
              <Input.Password
                value={activationKey.key}
                readOnly
                size="small"
                style={{
                  fontSize: "11px",
                  width: "140px",
                  border: "none",
                  backgroundColor: "transparent",
                  padding: 0,
                  boxShadow: "none",
                }}
                visibilityToggle
              />
            </div>
          </div>
        );
      },
    },
    {
      title: t("students.table.actions"),
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={() => handleEdit(record)}
          >
            {t("students.table.edit")}
          </Button>
          <Popconfirm
            title={t("students.delete.title")}
            description={t("students.delete.confirmMessage", {
              name: record.name,
            })}
            onConfirm={() => handleDelete(record.id, record.name)}
            okText={t("students.delete.yes")}
            cancelText={t("students.delete.no")}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<FontAwesomeIcon icon={faTrash} />}
              loading={deleteStudentMutation.isPending}
            >
              {t("students.table.delete")}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message={t("students.errors.loading")}
        description={error.message}
        type="error"
        showIcon
        className="mb-4"
      />
    );
  }

  return (
    <>
      <StudentsFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />
      <Table
        columns={columns}
        dataSource={displayData || []}
        rowKey="id"
        bordered
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: paginatedData?.pagination.total || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
          onChange: (page, size) => {
            setCurrentPage(page);
            if (size !== pageSize) {
              setPageSize(size);
              setCurrentPage(1); // Reset to first page when page size changes
            }
          },
        }}
        loading={isLoading}
      />

      <Modal
        title={t("students.edit.title")}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingStudent(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          className="max-w-2xl"
          disabled={updateStudentMutation.isPending}
        >
          <Form.Item
            name="name1"
            label={t("students.edit.firstNameLabel")}
            rules={[
              { required: true, message: t("students.edit.firstNameRequired") },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t("students.edit.firstNamePlaceholder")}
            />
          </Form.Item>

          <Form.Item
            name="name2"
            label={t("students.edit.secondNameLabel")}
            rules={[
              {
                required: true,
                message: t("students.edit.secondNameRequired"),
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t("students.edit.secondNamePlaceholder")}
            />
          </Form.Item>

          <Form.Item
            name="name3"
            label={t("students.edit.thirdNameLabel")}
            rules={[
              { required: true, message: t("students.edit.thirdNameRequired") },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t("students.edit.thirdNamePlaceholder")}
            />
          </Form.Item>

          <Form.Item
            name="name4"
            label={t("students.edit.fourthNameLabel")}
            rules={[
              {
                required: true,
                message: t("students.edit.fourthNameRequired"),
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t("students.edit.fourthNamePlaceholder")}
            />
          </Form.Item>

          <Form.Item
            name="birthdate"
            label={t("students.edit.birthdateLabel")}
            rules={[
              { required: true, message: t("students.edit.birthdateRequired") },
            ]}
          >
            <DatePicker
              disabledDate={(current) => {
                return current && current > dayjs().endOf("day");
              }}
              style={{ width: "100%" }}
              placeholder={t("students.edit.birthdatePlaceholder")}
            />
          </Form.Item>

          <Form.Item
            name="gender"
            label={t("students.edit.genderLabel")}
            rules={[
              { required: true, message: t("students.edit.genderRequired") },
            ]}
          >
            <Select placeholder={t("students.edit.genderPlaceholder")}>
              <Select.Option value="male">
                {t("students.filters.male")}
              </Select.Option>
              <Select.Option value="female">
                {t("students.filters.female")}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label={t("students.edit.phoneLabel")}
            rules={[
              { required: true, message: t("students.edit.phoneRequired") },
              {
                pattern: /^[+]?[1-9][\d]{0,15}$/,
                message: t("students.edit.phoneValidation"),
              },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder={t("students.edit.phonePlaceholder")}
            />
          </Form.Item>

          <Form.Item
            name="stageId"
            label={t("students.edit.stageLabel")}
            rules={[
              { required: true, message: t("students.edit.stageRequired") },
            ]}
          >
            <Select
              placeholder={t("students.edit.stagePlaceholder")}
              loading={stagesLoading}
            >
              {stages?.map((stage) => (
                <Select.Option key={stage.id} value={stage.id}>
                  {stage.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <div className="flex gap-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={updateStudentMutation.isPending}
              >
                {t("students.edit.updateButton")}
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  setEditingStudent(null);
                  form.resetFields();
                }}
              >
                {t("students.edit.cancelButton")}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Activation Key Modal */}
      <Modal
        title={t("students.activationKey.updateTitle")}
        open={isActivationKeyModalVisible}
        onCancel={() => {
          setIsActivationKeyModalVisible(false);
          setSelectedStudentForKeyUpdate(null);
          activationKeyForm.resetFields();
        }}
        footer={null}
      >
        <div style={{ marginBottom: "16px" }}>
          <p>
            <strong>{t("students.details.attendance.modal.student")}:</strong>{" "}
            {selectedStudentForKeyUpdate?.name}
          </p>
          <p>
            <strong>{t("students.activationKey.currentKeyStatus")}:</strong>{" "}
            <Tag
              color={
                selectedStudentForKeyUpdate?.activationKey?.status === "expired"
                  ? "red"
                  : "blue"
              }
            >
              {selectedStudentForKeyUpdate?.activationKey?.status === "expired"
                ? t("students.table.expired")
                : t("students.table.used")}
            </Tag>
          </p>
          <p style={{ color: "#666", fontSize: "14px" }}>
            {t("students.activationKey.selectDescription")}
          </p>
        </div>

        <Form
          form={activationKeyForm}
          layout="vertical"
          onFinish={handleActivationKeyUpdate}
        >
          <Form.Item
            name="activationKeyId"
            label={t("students.activationKey.newKeyLabel")}
            rules={[
              {
                required: true,
                message: t("students.activationKey.newKeyRequired"),
              },
            ]}
            help={
              activationKeysData?.keys?.length === 0
                ? t("students.activationKey.noKeysAvailable")
                : t("students.activationKey.selectKeyHelp")
            }
          >
            <Select
              placeholder={t("students.activationKey.newKeyPlaceholder")}
              disabled={activationKeysData?.keys?.length === 0}
              showSearch
              filterOption={(input, option) =>
                option?.children
                  ?.toString()
                  ?.toLowerCase()
                  .includes(input.toLowerCase()) || false
              }
            >
              {activationKeysData?.keys?.map((key) => (
                <Select.Option key={key.id} value={key.id}>
                  {key.key} ({t("students.activationKey.expires")}:{" "}
                  {new Date(key.expiresAt).toLocaleDateString()})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateActivationKeyMutation.isPending}
                disabled={activationKeysData?.keys?.length === 0}
              >
                {t("students.activationKey.updateButton")}
              </Button>
              <Button
                onClick={() => {
                  setIsActivationKeyModalVisible(false);
                  setSelectedStudentForKeyUpdate(null);
                  activationKeyForm.resetFields();
                }}
              >
                {t("students.edit.cancelButton")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default StudentsTable;
