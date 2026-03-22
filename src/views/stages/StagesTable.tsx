import {
  Table,
  Button,
  Spin,
  Alert,
  Space,
  Popconfirm,
  Input,
  Modal,
  Form,
  message,
} from "antd";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  useStages,
  useDeleteStage,
  useUpdateStage,
  useSearchStages,
} from "../../hooks/useAPI";
import type { Stage, CreateStageRequest } from "../../types/api";

interface StagesTableProps {
  searchQuery: string;
}

const StagesTable: React.FC<StagesTableProps> = ({ searchQuery }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { data: stages, isLoading, error } = useStages();
  const { data: searchResults, isLoading: isSearching } =
    useSearchStages(searchQuery);
  const deleteStageMutation = useDeleteStage();
  const updateStageMutation = useUpdateStage();

  const displayData = searchQuery.trim() ? searchResults : stages;

  const handleShowSchedule = (stageId: string) => {
    navigate(`/stages/${stageId}/schedule`);
  };

  const handleShowDetails = (stageId: string) => {
    navigate(`/stages/${stageId}`);
  };

  const handleEdit = (stage: Stage) => {
    setEditingStage(stage);
    form.setFieldsValue({
      name: stage.name,
    });
    setIsEditModalVisible(true);
  };

  const onFieldChange = () => {
    // Clear any field errors when user starts typing
    form.setFields([
      {
        name: "name",
        errors: [],
      },
    ]);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteStageMutation.mutateAsync(id);
      message.success(t("stages.messages.deleteSuccess", { name }));
    } catch (error) {
      message.error(t("stages.messages.deleteFailed"));
    }
  };

  const handleEditSubmit = async (values: CreateStageRequest) => {
    if (!editingStage) return;

    try {
      await updateStageMutation.mutateAsync({
        id: editingStage.id,
        data: values,
      });
      message.success(t("stages.messages.updateSuccess"));
      setIsEditModalVisible(false);
      setEditingStage(null);
      form.resetFields();
    } catch (error: any) {
      console.error("Error updating stage:", error);

      // Handle specific error responses from backend
      if (error?.response?.status === 409) {
        const errorData = error.response.data;
        if (errorData?.error === "STAGE_NAME_EXISTS") {
          form.setFields([
            {
              name: "name",
              errors: [errorData.message],
            },
          ]);
        } else {
          message.error(t("stages.messages.stageNameExists"));
        }
      } else {
        message.error(t("stages.messages.updateFailed"));
      }
    }
  };

  const columns = [
    {
      title: t("stages.table.stageName"),
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Stage) => (
        <a onClick={() => handleShowDetails(record.id)}>{text}</a>
      ),
    },
    {
      title: t("stages.table.numberOfStudents"),
      dataIndex: "studentCount",
      key: "studentCount",
      sorter: (a: Stage, b: Stage) => a.studentCount - b.studentCount,
    },
    {
      title: t("stages.table.numberOfTeachers"),
      dataIndex: "teacherCount",
      key: "teacherCount",
      sorter: (a: Stage, b: Stage) => a.teacherCount - b.teacherCount,
    },
    {
      title: t("stages.table.numberOfSubjects"),
      dataIndex: "subjectCount",
      key: "subjectCount",
      sorter: (a: Stage, b: Stage) => a.subjectCount - b.subjectCount,
    },
    {
      title: t("stages.table.actions"),
      key: "actions",
      render: (_: unknown, record: Stage) => (
        <Space>
          <Button type="default" onClick={() => handleShowSchedule(record.id)}>
            {t("stages.table.viewSchedule")}
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={() => handleEdit(record)}
          >
            {t("stages.table.edit")}
          </Button>
          <Popconfirm
            title={t("stages.delete.title")}
            description={t("stages.delete.confirmMessage", { name: record.name })}
            onConfirm={() => handleDelete(record.id, record.name)}
            okText={t("stages.delete.yes")}
            cancelText={t("stages.delete.no")}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<FontAwesomeIcon icon={faTrash} />}
              loading={deleteStageMutation.isPending}
            >
              {t("stages.table.delete")}
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
        message={t("stages.errors.loading")}
        description={error.message}
        type="error"
        showIcon
        className="mb-4"
      />
    );
  }

  return (
    <>
      <Table
        scroll={{ x: "max-content" }}
        columns={columns}
        dataSource={displayData || []}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
        loading={isLoading || isSearching}
      />

      <Modal
        title={t("stages.edit.title")}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingStage(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            label={t("stages.edit.stageNameLabel")}
            name="name"
            rules={[{ required: true, message: t("stages.edit.stageNameRequired") }]}
          >
            <Input onChange={onFieldChange} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateStageMutation.isPending}
              >
                {t("stages.edit.updateButton")}
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  setEditingStage(null);
                  form.resetFields();
                }}
              >
                {t("stages.edit.cancelButton")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default StagesTable;
