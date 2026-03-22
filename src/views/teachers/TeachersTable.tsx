import React, { useState } from "react";
import {
  Table,
  Tag,
  Button,
  Spin,
  Alert,
  Space,
  Popconfirm,
  Input,
  InputNumber,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { CalendarOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import {
  useTeachers,
  useDeleteTeacher,
  useUpdateTeacher,
  useSearchTeachers,
  useStages,
  useSubjects,
} from "../../hooks/useAPI";
import type { Teacher, CreateTeacherRequest } from "../../types/api";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

interface TeachersTableProps {
  searchQuery: string;
}

interface TeacherFormValues {
  name: string;
  age?: number;
  phoneNumber: string;
  gender?: "male" | "female";
  birthdate?: dayjs.Dayjs;
  stageIds: string[];
  subjectIds: string[];
}

const TeachersTable: React.FC<TeachersTableProps> = ({ searchQuery }) => {
  const navigate = useNavigate();
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const { data: teachers, isLoading, error } = useTeachers();
  const { data: searchResults, isLoading: isSearching } =
    useSearchTeachers(searchQuery);
  const { data: stages } = useStages();
  const { data: subjects } = useSubjects();
  const deleteTeacherMutation = useDeleteTeacher();
  const updateTeacherMutation = useUpdateTeacher();

  const displayData = searchQuery.trim() ? searchResults : teachers;

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    form.setFieldsValue({
      name: teacher.name,
      age: teacher.age,
      phoneNumber: teacher.phoneNumber,
      gender: teacher.gender,
      birthdate: teacher.birthdate ? dayjs(teacher.birthdate) : null,
      stageIds: teacher.stages.map((stage) => stage.id),
      subjectIds: teacher.subjects.map((subject) => subject.id),
    });
    setIsEditModalVisible(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteTeacherMutation.mutateAsync(id);
      message.success(t("teachers.messages.deleteSuccess", { name }));
    } catch {
      message.error(t("teachers.messages.deleteFailed"));
    }
  };

  const handleEditSubmit = async (values: TeacherFormValues) => {
    if (!editingTeacher) return;

    try {
      const updateData: Partial<CreateTeacherRequest> = {
        ...values,
        birthdate:
          values.birthdate && dayjs.isDayjs(values.birthdate)
            ? values.birthdate.toISOString()
            : undefined,
      };

      await updateTeacherMutation.mutateAsync({
        id: editingTeacher.id,
        data: updateData,
      });
      message.success(t("teachers.messages.updateSuccess"));
      setIsEditModalVisible(false);
      setEditingTeacher(null);
      form.resetFields();
    } catch {
      message.error(t("teachers.messages.updateFailed"));
    }
  };

  const columns: ColumnsType<Teacher> = [
    {
      title: t("teachers.table.name"),
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t("teachers.table.age"),
      dataIndex: "age",
      key: "age",
      sorter: (a, b) => (a.age || 0) - (b.age || 0),
      render: (age: number | null) => age || t("teachers.table.notAvailable"),
    },
    {
      title: t("teachers.table.phoneNumber"),
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: t("teachers.table.gender"),
      dataIndex: "gender",
      key: "gender",
      render: (gender: "male" | "female" | null) => {
        if (!gender) return t("teachers.table.notAvailable");
        return (
          <Tag color={gender === "male" ? "blue" : "pink"}>
            {t(`teachers.table.${gender}`)}
          </Tag>
        );
      },
      filters: [
        { text: t("teachers.table.male"), value: "male" },
        { text: t("teachers.table.female"), value: "female" },
      ],
      onFilter: (value, record) => record.gender === value,
    },
    {
      title: t("teachers.table.stages"),
      dataIndex: "stages",
      key: "stages",
      render: (stages: Teacher["stages"]) => (
        <>
          {stages.map((stage) => (
            <Tag key={stage.id} color="blue" className="mr-1">
              {stage.name}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: t("teachers.table.subjects"),
      dataIndex: "subjects",
      key: "subjects",
      render: (subjects: Teacher["subjects"]) => (
        <>
          {subjects.map((subject) => (
            <Tag key={subject.id} color="green" className="mr-1">
              {subject.name}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: t("teachers.table.actions"),
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            icon={<CalendarOutlined />}
            onClick={() => navigate(`/teachers/${record.id}/schedule`)}
          >
            {t("teachers.table.schedule")}
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={() => handleEdit(record)}
          >
            {t("teachers.table.edit")}
          </Button>
          <Popconfirm
            title={t("teachers.delete.title")}
            description={t("teachers.delete.confirmMessage", {
              name: record.name,
            })}
            onConfirm={() => handleDelete(record.id, record.name)}
            okText={t("teachers.delete.yes")}
            cancelText={t("teachers.delete.no")}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<FontAwesomeIcon icon={faTrash} />}
              loading={deleteTeacherMutation.isPending}
            >
              {t("teachers.table.delete")}
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
        message={t("teachers.errors.loading")}
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
        pagination={{ pageSize: 10 }}
        bordered
        rowKey="id"
        loading={isLoading || isSearching}
      />

      <Modal
        title={t("teachers.edit.title")}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingTeacher(null);
          form.resetFields();
        }}
        footer={null}
        width="min(600px, calc(100vw - 32px))"
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            label={t("teachers.edit.nameLabel")}
            name="name"
            rules={[
              { required: true, message: t("teachers.edit.nameRequired") },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t("teachers.edit.ageLabel")}
            name="age"
            rules={[
              {
                type: "number",
                min: 18,
                max: 100,
                message: t("teachers.edit.ageValidation"),
              },
              {
                validator: (_, value) => {
                  if (value && (value < 18 || value > 100)) {
                    return Promise.reject(
                      new Error(t("teachers.edit.ageValidation"))
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={18}
              max={100}
              precision={0}
              placeholder={t("teachers.edit.ageLabel")}
            />
          </Form.Item>

          <Form.Item
            label={t("teachers.edit.phoneLabel")}
            name="phoneNumber"
            rules={[
              { required: true, message: t("teachers.edit.phoneRequired") },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label={t("teachers.edit.genderLabel")} name="gender">
            <Select placeholder={t("teachers.edit.genderPlaceholder")}>
              <Select.Option value="male">
                {t("teachers.table.male")}
              </Select.Option>
              <Select.Option value="female">
                {t("teachers.table.female")}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label={t("teachers.edit.birthdateLabel")} name="birthdate">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label={t("teachers.edit.stagesLabel")}
            name="stageIds"
            rules={[
              { required: true, message: t("teachers.edit.stagesRequired") },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={t("teachers.edit.stagesPlaceholder")}
            >
              {stages?.map((stage) => (
                <Select.Option key={stage.id} value={stage.id}>
                  {stage.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t("teachers.edit.subjectsLabel")}
            name="subjectIds"
            rules={[
              { required: true, message: t("teachers.edit.subjectsRequired") },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={t("teachers.edit.subjectsPlaceholder")}
            >
              {subjects?.map((subject) => (
                <Select.Option key={subject.id} value={subject.id}>
                  {subject.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateTeacherMutation.isPending}
              >
                {t("teachers.edit.updateButton")}
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  setEditingTeacher(null);
                  form.resetFields();
                }}
              >
                {t("teachers.edit.cancelButton")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TeachersTable;
