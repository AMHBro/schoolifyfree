import React from "react";
import { Table, Typography, Space, Spin, Alert } from "antd";
import { useParams } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useSchedulesByTeacher } from "../../hooks/useAPI";
import type { Schedule, DayOfWeek } from "../../types/api";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface TableData {
  key: string;
  day: DayOfWeek;
  subjects: Schedule[];
}

const TeacherSchedule: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const { t } = useTranslation();
  const {
    data: scheduleData,
    isLoading,
    error,
  } = useSchedulesByTeacher(teacherId || "");

  const days: DayOfWeek[] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

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

  const renderPeriod = (subjects: Schedule[], period: number) => {
    const schedule = subjects.find((s) => s.timeSlot === period);
    return schedule ? (
      <div>
        <Space direction="vertical" size="small">
          <Text strong>{schedule.subject.name}</Text>
          <Text type="secondary">{schedule.stage.name}</Text>
        </Space>
      </div>
    ) : null;
  };

  const columns: ColumnsType<TableData> = [
    {
      title: t("teachers.schedule.day"),
      dataIndex: "day",
      key: "day",
      width: 120,
      fixed: "left" as const,
      render: (day: DayOfWeek) => t(`teachers.schedule.days.${day}`),
    },
    {
      title: t("teachers.schedule.period1"),
      dataIndex: "subjects",
      key: "period1",
      render: (subjects: Schedule[]) => renderPeriod(subjects, 1),
    },
    {
      title: t("teachers.schedule.period2"),
      dataIndex: "subjects",
      key: "period2",
      render: (subjects: Schedule[]) => renderPeriod(subjects, 2),
    },
    {
      title: t("teachers.schedule.period3"),
      dataIndex: "subjects",
      key: "period3",
      render: (subjects: Schedule[]) => renderPeriod(subjects, 3),
    },
    {
      title: t("teachers.schedule.period4"),
      dataIndex: "subjects",
      key: "period4",
      render: (subjects: Schedule[]) => renderPeriod(subjects, 4),
    },
    {
      title: t("teachers.schedule.period5"),
      dataIndex: "subjects",
      key: "period5",
      render: (subjects: Schedule[]) => renderPeriod(subjects, 5),
    },
    {
      title: t("teachers.schedule.period6"),
      dataIndex: "subjects",
      key: "period6",
      render: (subjects: Schedule[]) => renderPeriod(subjects, 6),
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-8">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert
          message={t("teachers.schedule.errorLoading")}
          description={error.message}
          type="error"
          showIcon
          className="mb-4"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Title level={2}>{t("teachers.schedule.title")}</Title>
      <Table
        scroll={{ x: "max-content" }}
        columns={columns}
        dataSource={tableData}
        pagination={false}
        bordered
        className="mt-4"
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default TeacherSchedule;
