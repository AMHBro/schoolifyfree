import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Calendar,
  Table,
  Card,
  Typography,
  Space,
  Row,
  Col,
  Descriptions,
  Tag,
  Button,
  message,
  Modal,
  Select,
  Alert,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMars, faVenus } from "@fortawesome/free-solid-svg-icons";
import { studentsAPI, attendanceAPI, subjectsAPI } from "../../services/api";
import { useSchedulesByStage } from "../../hooks/useAPI";
import type {
  Student,
  Attendance,
  Subject,
  AttendanceStatus,
  DayOfWeek,
} from "../../types/api";
import { useTranslation } from "react-i18next";

const { Title } = Typography;
const { Option } = Select;

interface AttendanceTableRecord {
  key: string;
  subject: Subject;
  status: AttendanceStatus;
  markedAt?: string;
  id?: string;
}

const StudentDetails: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [markAttendanceModal, setMarkAttendanceModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedStatus, setSelectedStatus] =
    useState<AttendanceStatus>("present");
  const { t } = useTranslation();

  // Fetch schedule data for the student's stage
  const { data: scheduleData, isLoading: scheduleLoading } =
    useSchedulesByStage(student?.stage?.id || "");

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId && selectedDate) {
      fetchAttendanceData();
    }
  }, [studentId, selectedDate]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const studentData = await studentsAPI.getById(studentId!);
      setStudent(studentData);

      // Fetch subjects for the student's stage
      const allSubjects = await subjectsAPI.getAll();
      const stageSubjects = allSubjects.filter(
        (subject) => subject.stage.id === studentData.stage.id
      );
      setSubjects(stageSubjects);
    } catch (error) {
      message.error(t("students.errors.fetchStudentFailed"));
      console.error("Error fetching student:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    if (!studentId) return;

    try {
      setAttendanceLoading(true);
      const fromDate = selectedDate.format("YYYY-MM-DD");
      const toDate = selectedDate.format("YYYY-MM-DD");
      const attendance = await attendanceAPI.getStudentAttendance(
        studentId,
        fromDate,
        toDate
      );
      setAttendanceData(attendance);
    } catch (error) {
      message.error(t("students.details.attendance.messages.fetchFailed"));
      console.error("Error fetching attendance:", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Get subjects scheduled for the selected day
  const getScheduledSubjectsForDay = () => {
    if (!scheduleData || !selectedDate) return [];

    // Get day of week from selected date
    const selectedDayOfWeek = selectedDate.format("dddd") as DayOfWeek;

    // Get scheduled subjects for this day
    const daySchedules = scheduleData.filter(
      (schedule) => schedule.dayOfWeek === selectedDayOfWeek
    );

    // Extract unique subjects for this day and match with full subject data
    const scheduledSubjectIds = [
      ...new Set(daySchedules.map((s) => s.subject.id)),
    ];
    const scheduledSubjects = subjects.filter((subject) =>
      scheduledSubjectIds.includes(subject.id)
    );

    return scheduledSubjects;
  };

  const handleMarkAttendance = async () => {
    if (!studentId || !selectedSubject) {
      message.error(t("students.details.attendance.messages.selectSubject"));
      return;
    }

    try {
      setIsMarkingAttendance(true);
      await attendanceAPI.markAttendance({
        studentId,
        subjectId: selectedSubject,
        date: selectedDate.format("YYYY-MM-DD"),
        status: selectedStatus,
      });

      message.success(
        t("students.details.attendance.messages.markSuccess", {
          status: selectedStatus,
        })
      );
      setMarkAttendanceModal(false);
      setSelectedSubject("");
      setSelectedStatus("present");

      // Refresh attendance data
      await fetchAttendanceData();
    } catch (error) {
      message.error(t("students.details.attendance.messages.markFailed"));
      console.error("Error marking attendance:", error);
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  const columns = [
    {
      title: t("students.details.attendance.table.subject"),
      dataIndex: "subject",
      key: "subject",
      render: (_: Subject, record: AttendanceTableRecord) =>
        record.subject?.name ||
        t("students.details.attendance.table.unknownSubject"),
    },
    {
      title: t("students.details.attendance.table.status"),
      dataIndex: "status",
      key: "status",
      render: (status: AttendanceStatus) => (
        <Tag color={status === "present" ? "green" : "red"}>
          {t(`students.details.attendance.modal.${status}`).toUpperCase()}
        </Tag>
      ),
    },
    {
      title: t("students.details.attendance.table.markedAt"),
      dataIndex: "markedAt",
      key: "markedAt",
      render: (markedAt: string) =>
        markedAt
          ? dayjs(markedAt).format("HH:mm:ss")
          : t("students.details.attendance.table.notMarked"),
    },
  ];

  // Create table data by combining subjects with attendance records
  const scheduledSubjects = getScheduledSubjectsForDay();
  const selectedDayOfWeek = selectedDate.format("dddd");

  const tableData = scheduledSubjects.map((subject) => {
    const attendanceRecord = attendanceData.find(
      (record) => record.subjectId === subject.id
    );

    return {
      key: subject.id,
      subject: subject,
      status: attendanceRecord?.status || "absent",
      markedAt: attendanceRecord?.markedAt,
      id: attendanceRecord?.id,
    };
  });

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Typography.Text>{t("students.details.loading")}</Typography.Text>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Typography.Text>{t("students.details.notFound")}</Typography.Text>
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Title level={2}>
              {student.name}{" "}
              <FontAwesomeIcon
                icon={student.gender === "male" ? faMars : faVenus}
                style={{
                  color: student.gender === "male" ? "#1890ff" : "#eb2f96",
                }}
              />
            </Title>
          </Col>
          <Col span={24}>
            <Descriptions bordered>
              <Descriptions.Item label={t("students.details.info.age")}>
                {student.age}
              </Descriptions.Item>
              <Descriptions.Item label={t("students.details.info.stage")}>
                <Tag color="blue">{student.stage.name}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t("students.details.info.phoneNumber")}>
                {student.phoneNumber}
              </Descriptions.Item>
              <Descriptions.Item label={t("students.details.info.studentCode")}>
                {student.code}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title={t("students.details.attendance.calendarTitle")}>
            <Calendar
              fullscreen={false}
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={t("students.details.attendance.attendanceFor", {
              date: selectedDate.format("MMMM D, YYYY"),
              day: selectedDayOfWeek,
            })}
            extra={
              <Button
                type="primary"
                onClick={() => setMarkAttendanceModal(true)}
                size="small"
                disabled={scheduledSubjects.length === 0}
              >
                {t("students.details.attendance.markAttendance")}
              </Button>
            }
          >
            {scheduleLoading && (
              <Alert
                message={t("students.details.attendance.loadingSchedule")}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {!scheduleLoading && scheduledSubjects.length === 0 && (
              <Alert
                message={t("students.details.attendance.noSubjects", {
                  day: selectedDayOfWeek,
                })}
                description={t("students.details.attendance.checkSchedule")}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              bordered
              loading={attendanceLoading || scheduleLoading}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={t("students.details.attendance.modal.title")}
        open={markAttendanceModal}
        onOk={handleMarkAttendance}
        onCancel={() => {
          setMarkAttendanceModal(false);
          setSelectedSubject("");
          setSelectedStatus("present");
        }}
        confirmLoading={isMarkingAttendance}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>
              {t("students.details.attendance.modal.date")}:{" "}
            </Typography.Text>
            <Typography.Text>
              {selectedDate.format("MMMM D, YYYY")}
            </Typography.Text>
          </div>
          <div>
            <Typography.Text strong>
              {t("students.details.attendance.modal.student")}:{" "}
            </Typography.Text>
            <Typography.Text>{student.name}</Typography.Text>
          </div>
          <div>
            <Typography.Text strong>
              {t("students.details.attendance.modal.subject")}:{" "}
            </Typography.Text>
            <Select
              style={{ width: "100%" }}
              placeholder={t(
                "students.details.attendance.modal.subjectPlaceholder"
              )}
              value={selectedSubject}
              onChange={setSelectedSubject}
            >
              {scheduledSubjects.map((subject) => (
                <Option key={subject.id} value={subject.id}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <Typography.Text strong>
              {t("students.details.attendance.modal.status")}:{" "}
            </Typography.Text>
            <Select
              style={{ width: "100%" }}
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              <Option value="present">
                {t("students.details.attendance.modal.present")}
              </Option>
              <Option value="absent">
                {t("students.details.attendance.modal.absent")}
              </Option>
            </Select>
          </div>
        </Space>
      </Modal>
    </Space>
  );
};

export default StudentDetails;
