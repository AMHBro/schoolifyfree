import React, { useState } from "react";
import {
  Table,
  Tag,
  Spin,
  Alert,
  Space,
  Popconfirm,
  Input,
  Modal,
  Form,
  Button,
  message,
  Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  useSubjects,
  useSubjectsPaginated,
  useDeleteSubject,
  useUpdateSubject,
  useSearchSubjects,
  useStages,
} from "../../hooks/useAPI";
import type {
  Subject,
  CreateSubjectRequest,
  SubjectFilters,
} from "../../types/api";
import SubjectsFilters from "./SubjectsFilters";

interface SubjectsTableProps {
  searchQuery: string;
}

const SubjectsTable: React.FC<SubjectsTableProps> = ({ searchQuery }) => {
  const { t } = useTranslation();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<SubjectFilters>({});
  const [form] = Form.useForm();

  // Use paginated data with search and filters
  const {
    data: paginatedData,
    isLoading,
    error,
  } = useSubjectsPaginated({
    page: currentPage,
    limit: pageSize,
    search: searchQuery.trim() || undefined,
    stageId: filters.stageId,
    hasTeachers: filters.hasTeachers,
    teacherId: filters.teacherId,
  });

  const { data: stages, isLoading: stagesLoading } = useStages();
  const deleteSubjectMutation = useDeleteSubject();
  const updateSubjectMutation = useUpdateSubject();

  const displayData = paginatedData?.data || [];

  // Reset to first page when search query or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const handleFiltersChange = (newFilters: SubjectFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    form.setFieldsValue({
      name: subject.name,
      stageId: subject.stage.id,
    });
    setIsEditModalVisible(true);
  };

  const onFieldChange = () => {
    // Clear any field errors when user starts typing or changes selection
    form.setFields([
      {
        name: "name",
        errors: [],
      },
    ]);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteSubjectMutation.mutateAsync(id);
      message.success(t("subjects.messages.deleteSuccess", { name }));
    } catch (error) {
      message.error(t("subjects.messages.deleteFailed"));
    }
  };

  const handleEditSubmit = async (values: CreateSubjectRequest) => {
    if (!editingSubject) return;

    try {
      await updateSubjectMutation.mutateAsync({
        id: editingSubject.id,
        data: values,
      });
      message.success(t("subjects.messages.updateSuccess"));
      setIsEditModalVisible(false);
      setEditingSubject(null);
      form.resetFields();
    } catch (error: any) {
      console.error("Error updating subject:", error);

      // Handle specific error responses from backend
      if (error?.response?.status === 409) {
        const errorData = error.response.data;
        if (errorData?.error === "SUBJECT_NAME_EXISTS") {
          form.setFields([
            {
              name: "name",
              errors: [errorData.message],
            },
          ]);
        } else {
          message.error(t("subjects.messages.subjectNameExists"));
        }
      } else {
        message.error(t("subjects.messages.updateFailed"));
      }
    }
  };

  const columns: ColumnsType<Subject> = [
    {
      title: t("subjects.table.subjectName"),
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t("subjects.table.stage"),
      dataIndex: ["stage", "name"],
      key: "stage",
      sorter: (a, b) => a.stage.name.localeCompare(b.stage.name),
      render: (stageName: string) => <Tag color="blue">{stageName}</Tag>,
    },
    {
      title: t("subjects.table.teacherCount"),
      dataIndex: "teacherCount",
      key: "teacherCount",
      sorter: (a, b) => a.teacherCount - b.teacherCount,
    },
    {
      title: t("subjects.table.teachers"),
      dataIndex: "teachers",
      key: "teachers",
      render: (teachers: string[]) => (
        <>
          {teachers.map((teacher, index) => (
            <Tag key={index} color="green" className="mr-1">
              {teacher}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: t("subjects.table.actions"),
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={() => handleEdit(record)}
          >
            {t("subjects.table.edit")}
          </Button>
          <Popconfirm
            title={t("subjects.delete.title")}
            description={t("subjects.delete.confirmMessage", { name: record.name })}
            onConfirm={() => handleDelete(record.id, record.name)}
            okText={t("subjects.delete.yes")}
            cancelText={t("subjects.delete.no")}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<FontAwesomeIcon icon={faTrash} />}
              loading={deleteSubjectMutation.isPending}
            >
              {t("subjects.table.delete")}
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
        message={t("subjects.errors.loading")}
        description={error.message}
        type="error"
        showIcon
        className="mb-4"
      />
    );
  }

  return (
    <>
      <SubjectsFilters
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
            t("subjects.pagination.showTotal", {
              start: range[0],
              end: range[1],
              total: total,
            }),
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
        title={t("subjects.edit.title")}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingSubject(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            label={t("subjects.edit.subjectNameLabel")}
            name="name"
            rules={[{ required: true, message: t("subjects.edit.subjectNameRequired") }]}
          >
            <Input onChange={onFieldChange} />
          </Form.Item>

          <Form.Item
            label={t("subjects.edit.stageLabel")}
            name="stageId"
            rules={[{ required: true, message: t("subjects.edit.stageRequired") }]}
          >
            <Select
              placeholder={t("subjects.edit.stagePlaceholder")}
              loading={stagesLoading}
              showSearch
              onChange={onFieldChange}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={stages?.map((stage) => ({
                value: stage.id,
                label: stage.name,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateSubjectMutation.isPending}
              >
                {t("subjects.edit.updateButton")}
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  setEditingSubject(null);
                  form.resetFields();
                }}
              >
                {t("subjects.edit.cancelButton")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SubjectsTable;
