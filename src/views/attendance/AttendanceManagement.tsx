import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Space,
  Row,
  Col,
  Select,
  DatePicker,
  Table,
  Tag,
  Button,
  Statistic,
  message,
  Modal,
  Progress,
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  BookOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  stagesAPI,
  studentsAPI,
  subjectsAPI,
  attendanceAPI,
} from "../../services/api";
import type { Stage, Student, Subject } from "../../types/api";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
}

interface StudentAttendanceData {
  student: Student;
  stats: AttendanceStats;
}

const AttendanceManagement: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, "days"),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] =
    useState<AttendanceStats | null>(null);
  const [studentAttendanceData, setStudentAttendanceData] = useState<
    StudentAttendanceData[]
  >([]);
  const [reportModal, setReportModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedStage) {
      fetchStageData();
    }
  }, [selectedStage]);

  useEffect(() => {
    if (selectedStage && dateRange) {
      fetchAttendanceStats();
    }
  }, [selectedStage, selectedStudent, selectedSubject, dateRange]);

  const fetchInitialData = async () => {
    try {
      const [stagesData, studentsData, subjectsData] = await Promise.all([
        stagesAPI.getAll(),
        studentsAPI.getAll(),
        subjectsAPI.getAll(),
      ]);
      setStages(stagesData);
      setStudents(studentsData);
      setSubjects(subjectsData);
    } catch (error) {
      message.error("Failed to fetch initial data");
      console.error("Error fetching data:", error);
    }
  };

  const fetchStageData = async () => {
    try {
      const allStudents = await studentsAPI.getAll();
      const allSubjects = await subjectsAPI.getAll();

      const stageStudents = allStudents.filter(
        (student) => student.stage.id === selectedStage
      );
      const stageSubjects = allSubjects.filter(
        (subject) => subject.stage.id === selectedStage
      );

      setStudents(stageStudents);
      setSubjects(stageSubjects);
    } catch (error) {
      message.error("Failed to fetch stage data");
      console.error("Error fetching stage data:", error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      const fromDate = dateRange[0].format("YYYY-MM-DD");
      const toDate = dateRange[1].format("YYYY-MM-DD");

      const statsParams: any = {
        fromDate,
        toDate,
      };

      if (selectedStage && !selectedStudent) {
        statsParams.stageId = selectedStage;
      }
      if (selectedStudent) {
        statsParams.studentId = selectedStudent;
      }

      const stats = await attendanceAPI.getAttendanceStats(
        statsParams.stageId,
        statsParams.studentId,
        statsParams.fromDate,
        statsParams.toDate
      );

      setAttendanceStats(stats);

      // If viewing stage-level data, fetch individual student stats
      if (selectedStage && !selectedStudent) {
        await fetchStudentAttendanceData();
      }
    } catch (error) {
      message.error("Failed to fetch attendance statistics");
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendanceData = async () => {
    try {
      const fromDate = dateRange[0].format("YYYY-MM-DD");
      const toDate = dateRange[1].format("YYYY-MM-DD");

      const studentStats = await Promise.all(
        students.map(async (student) => {
          const stats = await attendanceAPI.getAttendanceStats(
            undefined,
            student.id,
            fromDate,
            toDate
          );
          return { student, stats };
        })
      );

      setStudentAttendanceData(studentStats);
    } catch (error) {
      message.error("Failed to fetch student attendance data");
      console.error("Error fetching student data:", error);
    }
  };

  const handleGenerateReport = () => {
    setReportModal(true);
  };

  const handleExportReport = () => {
    // Implementation for exporting report
    message.success("Report exported successfully");
    setReportModal(false);
  };

  const studentColumns = [
    {
      title: "Student Name",
      dataIndex: ["student", "name"],
      key: "name",
    },
    {
      title: "Student Code",
      dataIndex: ["student", "code"],
      key: "code",
    },
    {
      title: "Total Days",
      dataIndex: ["stats", "totalDays"],
      key: "totalDays",
    },
    {
      title: "Present Days",
      dataIndex: ["stats", "presentDays"],
      key: "presentDays",
      render: (value: number) => <Tag color="green">{value}</Tag>,
    },
    {
      title: "Absent Days",
      dataIndex: ["stats", "absentDays"],
      key: "absentDays",
      render: (value: number) => <Tag color="red">{value}</Tag>,
    },
    {
      title: "Attendance Rate",
      dataIndex: ["stats", "attendanceRate"],
      key: "attendanceRate",
      render: (value: number) => (
        <Progress
          percent={value}
          size="small"
          status={
            value >= 80 ? "success" : value >= 60 ? "normal" : "exception"
          }
          format={(percent) => `${percent?.toFixed(1)}%`}
        />
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Title level={2}>
          <CalendarOutlined /> Attendance Management
        </Title>
      </Card>

      <Card title="Filters">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Typography.Text strong>Stage:</Typography.Text>
              <Select
                style={{ width: "100%" }}
                placeholder="Select a stage"
                value={selectedStage}
                onChange={(value) => {
                  setSelectedStage(value);
                  setSelectedStudent("");
                }}
                allowClear
              >
                {stages.map((stage) => (
                  <Option key={stage.id} value={stage.id}>
                    {stage.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Typography.Text strong>Student:</Typography.Text>
              <Select
                style={{ width: "100%" }}
                placeholder="Select a student"
                value={selectedStudent}
                onChange={setSelectedStudent}
                disabled={!selectedStage}
                allowClear
              >
                {students.map((student) => (
                  <Option key={student.id} value={student.id}>
                    {student.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Typography.Text strong>Subject:</Typography.Text>
              <Select
                style={{ width: "100%" }}
                placeholder="Select a subject"
                value={selectedSubject}
                onChange={setSelectedSubject}
                disabled={!selectedStage}
                allowClear
              >
                {subjects.map((subject) => (
                  <Option key={subject.id} value={subject.id}>
                    {subject.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Typography.Text strong>Date Range:</Typography.Text>
              <RangePicker
                style={{ width: "100%" }}
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                  }
                }}
                format="YYYY-MM-DD"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {attendanceStats && (
        <Card title="Attendance Statistics" loading={loading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Statistic
                title="Total Days"
                value={attendanceStats.totalDays}
                prefix={<CalendarOutlined />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Present Days"
                value={attendanceStats.presentDays}
                valueStyle={{ color: "#3f8600" }}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Absent Days"
                value={attendanceStats.absentDays}
                valueStyle={{ color: "#cf1322" }}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Attendance Rate"
                value={attendanceStats.attendanceRate}
                precision={2}
                suffix="%"
                valueStyle={{
                  color:
                    attendanceStats.attendanceRate >= 80
                      ? "#3f8600"
                      : "#cf1322",
                }}
                prefix={<BookOutlined />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {selectedStage &&
        !selectedStudent &&
        studentAttendanceData.length > 0 && (
          <Card
            title="Student Attendance Summary"
            extra={
              <Button type="primary" onClick={handleGenerateReport}>
                Generate Report
              </Button>
            }
          >
            <Table
              scroll={{ x: "max-content" }}
              columns={studentColumns}
              dataSource={studentAttendanceData}
              rowKey={(record) => record.student.id}
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </Card>
        )}

      <Modal
        title="Attendance Report"
        open={reportModal}
        onOk={handleExportReport}
        onCancel={() => setReportModal(false)}
        width="min(800px, calc(100vw - 32px))"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Text strong>Report Configuration:</Typography.Text>
          <Typography.Text>
            Stage:{" "}
            {stages.find((s) => s.id === selectedStage)?.name || "All Stages"}
          </Typography.Text>
          <Typography.Text>
            Date Range: {dateRange[0].format("YYYY-MM-DD")} to{" "}
            {dateRange[1].format("YYYY-MM-DD")}
          </Typography.Text>
          <Typography.Text>
            Students: {studentAttendanceData.length}
          </Typography.Text>
          {attendanceStats && (
            <>
              <Typography.Text>
                Overall Attendance Rate:{" "}
                {attendanceStats.attendanceRate.toFixed(2)}%
              </Typography.Text>
              <Progress
                percent={attendanceStats.attendanceRate}
                status={
                  attendanceStats.attendanceRate >= 80 ? "success" : "exception"
                }
              />
            </>
          )}
        </Space>
      </Modal>
    </Space>
  );
};

export default AttendanceManagement;
