import React, { useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Popconfirm,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Spin,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  useExams,
  useSearchExams,
  useExamsByDate,
  useDeleteExam,
  useUpdateExam,
  useTeachers,
  useSubjects,
  useStages,
} from "../../hooks/useAPI";
import type { Exam, UpdateExamRequest } from "../../types/api";

interface ExamsTableProps {
  selectedDate: Dayjs | undefined;
  searchText: string;
}

const ExamsTable: React.FC<ExamsTableProps> = ({
  selectedDate,
  searchText,
}) => {
  const { t } = useTranslation();
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Data fetching hooks
  const { data: allExams, isLoading, error } = useExams();
  const { data: searchResults, isLoading: isSearching } =
    useSearchExams(searchText);
  const { data: dateExams, isLoading: isLoadingDateExams } = useExamsByDate(
    selectedDate ? selectedDate.format("YYYY-MM-DD") : ""
  );

  // Form data hooks
  const { data: teachers } = useTeachers();
  const { data: subjects } = useSubjects();
  const { data: stages } = useStages();

  // Mutation hooks
  const deleteExamMutation = useDeleteExam();
  const updateExamMutation = useUpdateExam();

  // Determine which data to display based on filters
  const getDisplayData = () => {
    if (searchText.trim()) {
      return searchResults || [];
    }
    if (selectedDate) {
      return dateExams || [];
    }
    return allExams || [];
  };

  const displayData = getDisplayData();

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    form.setFieldsValue({
      title: exam.title,
      description: exam.description,
      examDate: dayjs(exam.examDate),
      classNumber: exam.classNumber,
      stageId: exam.stage.id,
      subjectId: exam.subject.id,
      teacherId: exam.teacher.id,
    });
    setIsEditModalVisible(true);
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteExamMutation.mutateAsync(id);
      message.success(t("exams.messages.deleteSuccess", { title }));
    } catch (error) {
      message.error(t("exams.messages.deleteFailed"));
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (!editingExam) return;

    try {
      const updateData: UpdateExamRequest = {
        title: values.title,
        description: values.description,
        examDate: values.examDate.toISOString(),
        classNumber: values.classNumber,
        stageId: values.stageId,
        subjectId: values.subjectId,
        teacherId: values.teacherId,
      };

      await updateExamMutation.mutateAsync({
        id: editingExam.id,
        data: updateData,
      });

      message.success(t("exams.messages.updateSuccess"));
      setIsEditModalVisible(false);
      setEditingExam(null);
      form.resetFields();
    } catch (error) {
      message.error(t("exams.messages.updateFailed"));
    }
  };

  const columns: ColumnsType<Exam> = [
    {
      title: t("exams.table.title"),
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: t("exams.table.subject"),
      dataIndex: "subject",
      key: "subject",
      render: (subject: Exam["subject"]) => (
        <Tag color="blue">{subject.name}</Tag>
      ),
    },
    {
      title: t("exams.table.teacher"),
      dataIndex: "teacher",
      key: "teacher",
      render: (teacher: Exam["teacher"]) => teacher.name,
    },
    {
      title: t("exams.table.stage"),
      dataIndex: "stage",
      key: "stage",
      render: (stage: Exam["stage"]) => <Tag color="green">{stage.name}</Tag>,
    },
    {
      title: t("exams.table.class"),
      dataIndex: "classNumber",
      key: "classNumber",
      sorter: (a, b) => a.classNumber.localeCompare(b.classNumber),
    },
    {
      title: t("exams.table.examDate"),
      dataIndex: "examDate",
      key: "examDate",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
      sorter: (a, b) => dayjs(a.examDate).unix() - dayjs(b.examDate).unix(),
    },
    {
      title: t("exams.table.actions"),
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={() => handleEdit(record)}
          >
            {t("exams.table.edit")}
          </Button>
          <Popconfirm
            title={t("exams.delete.title")}
            description={t("exams.delete.confirmMessage", { title: record.title })}
            onConfirm={() => handleDelete(record.id, record.title)}
            okText={t("exams.delete.yes")}
            cancelText={t("exams.delete.no")}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<FontAwesomeIcon icon={faTrash} />}
              loading={deleteExamMutation.isPending}
            >
              {t("exams.table.delete")}
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
        message={t("exams.errors.loading")}
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
        dataSource={displayData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
        loading={isLoading || isSearching || isLoadingDateExams}
      />

      <Modal
        title={t("exams.edit.title")}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingExam(null);
          form.resetFields();
        }}
        footer={null}
        width="min(600px, calc(100vw - 32px))"
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            label={t("exams.edit.examTitleLabel")}
            name="title"
            rules={[{ required: true, message: t("exams.edit.examTitleRequired") }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label={t("exams.edit.descriptionLabel")} name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            label={t("exams.edit.examDateLabel")}
            name="examDate"
            rules={[
              { required: true, message: t("exams.edit.examDateRequired") },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label={t("exams.edit.classLabel")}
            name="classNumber"
            rules={[{ required: true, message: t("exams.edit.classRequired") }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t("exams.edit.stageLabel")}
            name="stageId"
            rules={[{ required: true, message: t("exams.edit.stageRequired") }]}
          >
            <Select placeholder={t("exams.edit.stagePlaceholder")}>
              {stages?.map((stage) => (
                <Select.Option key={stage.id} value={stage.id}>
                  {stage.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t("exams.edit.subjectLabel")}
            name="subjectId"
            rules={[{ required: true, message: t("exams.edit.subjectRequired") }]}
          >
            <Select placeholder={t("exams.edit.subjectPlaceholder")}>
              {subjects?.map((subject) => (
                <Select.Option key={subject.id} value={subject.id}>
                  {subject.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t("exams.edit.teacherLabel")}
            name="teacherId"
            rules={[{ required: true, message: t("exams.edit.teacherRequired") }]}
          >
            <Select placeholder={t("exams.edit.teacherPlaceholder")}>
              {teachers?.map((teacher) => (
                <Select.Option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateExamMutation.isPending}
              >
                {t("exams.edit.updateButton")}
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalVisible(false);
                  setEditingExam(null);
                  form.resetFields();
                }}
              >
                {t("exams.edit.cancelButton")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ExamsTable;
