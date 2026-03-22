import React, { useState } from "react";
import {
  Table,
  Typography,
  Space,
  Modal,
  Select,
  Form,
  Spin,
  Alert,
  message,
  TimePicker,
  Button,
  Popconfirm,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  useSchedulesByStage,
  useTeachers,
  useSubjects,
  useUpdateSchedule,
  useCreateSchedule,
  useDeleteSchedule,
} from "../../hooks/useAPI";
import type {
  Schedule,
  DayOfWeek,
  UpdateScheduleRequest,
  CreateScheduleRequest,
} from "../../types/api";

const { Title, Text } = Typography;
const { Option } = Select;

interface TableData {
  key: string;
  day: DayOfWeek;
  subjects: Schedule[];
}

interface StageScheduleProps {
  stageId?: string; // Optional prop to override URL param
}

const StageSchedule: React.FC<StageScheduleProps> = ({
  stageId: propStageId,
}) => {
  const { t } = useTranslation();
  const { stageId: urlStageId } = useParams<{ stageId: string }>();
  const stageId = propStageId || urlStageId; // Use prop if provided, otherwise URL param

  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    day: DayOfWeek;
    timeSlot: number;
    existingSchedule?: Schedule;
  } | null>(null);

  // API hooks
  const {
    data: scheduleData,
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useSchedulesByStage(stageId || "");
  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const updateScheduleMutation = useUpdateSchedule();
  const createScheduleMutation = useCreateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();

  const days: DayOfWeek[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const handleCellClick = (day: DayOfWeek, timeSlot: number) => {
    const existingSchedule = scheduleData?.find(
      (s) => s.dayOfWeek === day && s.timeSlot === timeSlot
    );

    setEditingCell({ day, timeSlot, existingSchedule });

    if (existingSchedule) {
      form.setFieldsValue({
        subject: existingSchedule.subject.id,
        teacher: existingSchedule.teacher.id,
        startTime: existingSchedule.startTime ? dayjs(existingSchedule.startTime, "HH:mm") : null,
        endTime: existingSchedule.endTime ? dayjs(existingSchedule.endTime, "HH:mm") : null,
      });
    } else {
      form.resetFields();
    }

    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (!editingCell || !stageId) return;

      if (editingCell.existingSchedule) {
        // Update existing schedule
        const updateData: UpdateScheduleRequest = {
          subjectId: values.subject,
          teacherId: values.teacher,
          startTime: values.startTime ? values.startTime.format("HH:mm") : undefined,
          endTime: values.endTime ? values.endTime.format("HH:mm") : undefined,
        };

        await updateScheduleMutation.mutateAsync({
          id: editingCell.existingSchedule.id,
          data: updateData,
        });

        message.success(t("stages.schedule.messages.updateSuccess"));
      } else {
        // Create new schedule
        const createData: CreateScheduleRequest = {
          dayOfWeek: editingCell.day,
          timeSlot: editingCell.timeSlot,
          stageId: stageId,
          subjectId: values.subject,
          teacherId: values.teacher,
          startTime: values.startTime ? values.startTime.format("HH:mm") : undefined,
          endTime: values.endTime ? values.endTime.format("HH:mm") : undefined,
        };

        await createScheduleMutation.mutateAsync(createData);
        message.success(t("stages.schedule.messages.createSuccess"));
      }

      setIsModalVisible(false);
      setEditingCell(null);
    } catch (error) {
      console.error("Error saving schedule:", error);
      message.error(t("stages.schedule.messages.saveFailed"));
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingCell(null);
  };

  const handleDelete = async () => {
    if (!editingCell?.existingSchedule) return;

    try {
      await deleteScheduleMutation.mutateAsync(editingCell.existingSchedule.id);
      message.success(t("stages.schedule.messages.deleteSuccess"));
      setIsModalVisible(false);
      setEditingCell(null);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      message.error(t("stages.schedule.messages.deleteFailed"));
    }
  };

  // Transform data for table display
  const tableData = days.map((day) => {
    const daySchedules = (scheduleData || [])
      .filter((schedule) => schedule.dayOfWeek === day)
      .sort((a, b) => a.timeSlot - b.timeSlot);

    return {
      key: day,
      day: day,
      subjects: daySchedules,
    };
  });

  const renderScheduleCell = (
    subjects: Schedule[],
    timeSlot: number,
    day: DayOfWeek
  ) => {
    const schedule = subjects.find((s) => s.timeSlot === timeSlot);

    return (
      <div
        onClick={() => handleCellClick(day, timeSlot)}
        style={{
          cursor: "pointer",
          minHeight: "60px",
          padding: "8px",
          backgroundColor: schedule ? "#f6ffed" : "#fafafa",
          border: schedule ? "1px solid #b7eb8f" : "1px dashed #d9d9d9",
          borderRadius: "4px",
        }}
      >
        {schedule ? (
          <Space direction="vertical" size="small">
            <Text strong>{schedule.subject.name}</Text>
            <Text type="secondary">{schedule.teacher.name}</Text>
            {schedule.startTime && schedule.endTime && (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {schedule.startTime} - {schedule.endTime}
              </Text>
            )}
          </Space>
        ) : (
          <Text type="secondary" style={{ fontStyle: "italic" }}>
            {t("stages.schedule.cell.clickToAdd")}
          </Text>
        )}
      </div>
    );
  };

  const columns: ColumnsType<TableData> = [
    {
      title: t("stages.schedule.day"),
      dataIndex: "day",
      key: "day",
      width: 120,
      fixed: "left" as const,
      render: (day: DayOfWeek) => t(`stages.schedule.days.${day}`),
    },
    {
      title: t("stages.schedule.periods.period1"),
      dataIndex: "subjects",
      key: "period1",
      render: (subjects: Schedule[], record) =>
        renderScheduleCell(subjects, 1, record.day),
    },
    {
      title: t("stages.schedule.periods.period2"),
      dataIndex: "subjects",
      key: "period2",
      render: (subjects: Schedule[], record) =>
        renderScheduleCell(subjects, 2, record.day),
    },
    {
      title: t("stages.schedule.periods.period3"),
      dataIndex: "subjects",
      key: "period3",
      render: (subjects: Schedule[], record) =>
        renderScheduleCell(subjects, 3, record.day),
    },
    {
      title: t("stages.schedule.periods.period4"),
      dataIndex: "subjects",
      key: "period4",
      render: (subjects: Schedule[], record) =>
        renderScheduleCell(subjects, 4, record.day),
    },
    {
      title: t("stages.schedule.periods.period5"),
      dataIndex: "subjects",
      key: "period5",
      render: (subjects: Schedule[], record) =>
        renderScheduleCell(subjects, 5, record.day),
    },
    {
      title: t("stages.schedule.periods.period6"),
      dataIndex: "subjects",
      key: "period6",
      render: (subjects: Schedule[], record) =>
        renderScheduleCell(subjects, 6, record.day),
    },
  ];

  // Show loading or error states
  if (scheduleLoading || teachersLoading || subjectsLoading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spin size="large" />
        <div>{t("stages.schedule.loading.schedule")}</div>
      </div>
    );
  }

  if (scheduleError) {
    return (
      <Alert
        message={t("stages.schedule.loading.error")}
        description={t("stages.schedule.loading.errorDescription")}
        type="error"
        showIcon
      />
    );
  }

  if (!stageId) {
    return (
      <Alert
        message={t("stages.schedule.alerts.noStage")}
        description={t("stages.schedule.alerts.noStageDescription")}
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Title level={2}>{t("stages.schedule.title")}</Title>
      <div className="mb-4">
        <Text type="secondary">
          {t("stages.schedule.clickToEdit")}
        </Text>
      </div>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        bordered
        className="mt-4"
        scroll={{ x: "max-content" }}
      />

      <Modal
        title={editingCell?.existingSchedule ? t("stages.schedule.modal.editTitle") : t("stages.schedule.modal.addTitle")}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={
          updateScheduleMutation.isPending || createScheduleMutation.isPending
        }
        footer={[
          editingCell?.existingSchedule && (
            <Popconfirm
              key="delete"
              title={t("stages.schedule.modal.deleteConfirmTitle")}
              description={t("stages.schedule.modal.deleteConfirmMessage")}
              onConfirm={handleDelete}
              okText={t("common.yes", "Yes")}
              cancelText={t("common.no", "No")}
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger 
                icon={<DeleteOutlined />}
                loading={deleteScheduleMutation.isPending}
                style={{ float: "left" }}
              >
                {t("stages.schedule.modal.deleteButton")}
              </Button>
            </Popconfirm>
          ),
          <Button key="cancel" onClick={handleModalCancel}>
            {t("common.cancel", "Cancel")}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={updateScheduleMutation.isPending || createScheduleMutation.isPending}
            onClick={handleModalOk}
          >
            {t("common.save", "Save")}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="subject"
            label={t("stages.schedule.modal.subjectLabel")}
            rules={[{ required: true, message: t("stages.schedule.modal.subjectRequired") }]}
          >
            <Select placeholder={t("stages.schedule.modal.subjectPlaceholder")} loading={subjectsLoading}>
              {subjects?.map((subject) => (
                <Option key={subject.id} value={subject.id}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="teacher"
            label={t("stages.schedule.modal.teacherLabel")}
            rules={[{ required: true, message: t("stages.schedule.modal.teacherRequired") }]}
          >
            <Select placeholder={t("stages.schedule.modal.teacherPlaceholder")} loading={teachersLoading}>
              {teachers?.map((teacher) => (
                <Option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startTime"
            label={t("stages.schedule.modal.startTimeLabel", "Start Time")}
          >
            <TimePicker
              format="HH:mm"
              placeholder={t("stages.schedule.modal.startTimePlaceholder", "Select start time")}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            name="endTime"
            label={t("stages.schedule.modal.endTimeLabel", "End Time")}
          >
            <TimePicker
              format="HH:mm"
              placeholder={t("stages.schedule.modal.endTimePlaceholder", "Select end time")}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StageSchedule;
