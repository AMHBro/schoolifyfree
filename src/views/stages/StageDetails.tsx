import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Calendar,
  Table,
  Card,
  Typography,
  Space,
  Input,
  Button,
  message,
  Modal,
  Select,
  Tooltip,
  Badge,
  Alert,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  SearchOutlined,
  UsergroupAddOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  stagesAPI,
  attendanceAPI,
  subjectsAPI,
  studentsAPI,
} from "../../services/api";
import { useSchedulesByStage } from "../../hooks/useAPI";
import type {
  Stage,
  Student,
  Subject,
  DailyAttendance,
  AttendanceStatus,
  DayOfWeek,
} from "../../types/api";
import AttendanceToggle from "../../components/AttendanceToggle";
import AttendanceStatusBadge from "../../components/AttendanceStatusBadge";

const { Title } = Typography;
const { Option } = Select;

interface StudentAttendanceRow {
  id: string;
  name: string;
  code: string;
  subjects: {
    [subjectId: string]: AttendanceStatus;
  };
}

const StageDetails: React.FC = () => {
  const { t } = useTranslation();
  const { stageId } = useParams<{ stageId: string }>();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [searchText, setSearchText] = useState("");
  const [stage, setStage] = useState<Stage | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dailyAttendance, setDailyAttendance] =
    useState<DailyAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [bulkMarkModal, setBulkMarkModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedStatus, setSelectedStatus] =
    useState<AttendanceStatus>("present");
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [updatingAttendance, setUpdatingAttendance] = useState<Set<string>>(
    new Set()
  );
  const [isInitializing, setIsInitializing] = useState(false);
  const [attendanceInitialized, setAttendanceInitialized] = useState(false);

  // Fetch schedule data
  const { data: scheduleData, isLoading: scheduleLoading } =
    useSchedulesByStage(stageId || "");

  useEffect(() => {
    if (stageId) {
      fetchStageData();
    }
  }, [stageId]);

  useEffect(() => {
    if (stageId && selectedDate) {
      fetchAttendanceData();
    }
  }, [stageId, selectedDate]);

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

  const fetchStageData = async () => {
    try {
      setLoading(true);
      const [allStages, allStudents, allSubjects] = await Promise.all([
        stagesAPI.getAll(),
        studentsAPI.getAll(),
        subjectsAPI.getAll(),
      ]);

      const currentStage = allStages.find((s) => s.id === stageId);
      if (!currentStage) {
        message.error(t("stages.details.notFound"));
        return;
      }

      setStage(currentStage);

      // Filter students and subjects for this stage
      const stageStudents = allStudents.filter(
        (student) => student.stage.id === stageId
      );
      const stageSubjects = allSubjects.filter(
        (subject) => subject.stage.id === stageId
      );

      setStudents(stageStudents);
      setSubjects(stageSubjects);
    } catch (error) {
      message.error("Failed to fetch stage data");
      console.error("Error fetching stage:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    if (!stageId) return;

    try {
      setAttendanceLoading(true);
      const dateStr = selectedDate.format("YYYY-MM-DD");
      const attendance = await attendanceAPI.getDailyAttendance(
        dateStr,
        stageId
      );
      setDailyAttendance(attendance);
    } catch (error) {
      message.error("Failed to fetch attendance data");
      console.error("Error fetching attendance:", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleInitializeAttendance = async () => {
    console.log("🔄 Initialize Attendance button clicked");

    if (!stageId) {
      console.error("❌ No stageId available");
      message.error("Unable to initialize: Stage not found!");
      return;
    }

    const selectedDateStr = selectedDate.format("MMMM D, YYYY");
    console.log("📅 Selected date:", selectedDateStr);
    console.log("🏫 Stage ID:", stageId);

    try {
      setIsInitializing(true);
      console.log("⏳ Setting loading state to true");

      const dateStr = selectedDate.format("YYYY-MM-DD");
      console.log("🚀 Making API call to initialize attendance...");

      // Show loading message
      message.loading(
        t("stages.details.attendance.messages.initializeLoading", {
          stageName: stage?.name,
          date: selectedDateStr,
        }),
        2
      );

      const result = await attendanceAPI.initializeDailyAttendance(
        dateStr,
        stageId
      );

      console.log("✅ API response received:", result);

      if (result.created > 0) {
        console.log("🎉 Records created:", result.created);
        setAttendanceInitialized(true);
        message.success(
          t("stages.details.attendance.messages.initializeSuccess", {
            count: result.created,
            stageName: stage?.name,
            date: selectedDateStr,
          }),
          6
        );
      } else {
        console.log("ℹ️ No new records created");
        setAttendanceInitialized(true);
        message.info(
          t("stages.details.attendance.messages.initializeAlreadyExists", {
            stageName: stage?.name,
            date: selectedDateStr,
          }),
          5
        );
      }

      // Refresh attendance data
      console.log("🔄 Refreshing attendance data...");
      await fetchAttendanceData();
      console.log("✅ Attendance data refreshed");
    } catch (error: any) {
      console.error("❌ Error initializing attendance:", error);
      message.error(
        t("stages.details.attendance.messages.initializeFailed", {
          date: selectedDateStr,
          error: error.message || "Unknown error occurred",
        }),
        4
      );
    } finally {
      setIsInitializing(false);
      console.log("✅ Loading state set to false");
    }
  };

  const handleBulkMarkAttendance = async () => {
    if (!stageId || selectedStudents.length === 0 || !selectedSubject) {
      message.error(t("stages.details.attendance.messages.selectStudentsAndSubject"));
      return;
    }

    try {
      setIsMarkingAttendance(true);
      const attendanceData = selectedStudents.map((studentId) => ({
        studentId,
        subjectId: selectedSubject,
        status: selectedStatus,
      }));

      await attendanceAPI.bulkMarkAttendance({
        date: selectedDate.format("YYYY-MM-DD"),
        stageId,
        attendanceData,
      });

      message.success(
        t("stages.details.attendance.messages.bulkMarkSuccess", {
          status: selectedStatus,
          count: selectedStudents.length,
        })
      );
      setBulkMarkModal(false);
      setSelectedStudents([]);
      setSelectedSubject("");
      setSelectedStatus("present");

      // Refresh attendance data
      await fetchAttendanceData();
    } catch (error) {
      message.error(t("stages.details.attendance.messages.bulkMarkFailed"));
      console.error("Error marking attendance:", error);
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  const handleIndividualAttendanceChange = async (
    studentId: string,
    subjectId: string,
    status: AttendanceStatus
  ) => {
    const updateKey = `${studentId}-${subjectId}`;

    try {
      setUpdatingAttendance((prev) => new Set(prev).add(updateKey));

      await attendanceAPI.markAttendance({
        studentId,
        subjectId,
        date: selectedDate.format("YYYY-MM-DD"),
        status,
      });

      message.success(t("stages.details.attendance.messages.individualUpdateSuccess", { status }));
      // Refresh attendance data
      await fetchAttendanceData();
    } catch (error) {
      message.error(t("stages.details.attendance.messages.individualUpdateFailed"));
      console.error("Error updating attendance:", error);
    } finally {
      setUpdatingAttendance((prev) => {
        const newSet = new Set(prev);
        newSet.delete(updateKey);
        return newSet;
      });
    }
  };

  const getAttendanceStats = (students: StudentAttendanceRow[]) => {
    const scheduledSubjects = getScheduledSubjectsForDay();
    const totalRecords = students.length * scheduledSubjects.length;
    if (totalRecords === 0) return { present: 0, absent: 0, total: 0, rate: 0 };

    let presentCount = 0;
    let absentCount = 0;

    students.forEach((student) => {
      scheduledSubjects.forEach((subject) => {
        const status = student.subjects[subject.id];
        if (status === "present") presentCount++;
        else absentCount++;
      });
    });

    return {
      present: presentCount,
      absent: absentCount,
      total: totalRecords,
      rate: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0,
    };
  };

  const columns = [
    {
      title: t("stages.details.attendance.table.studentName"),
      dataIndex: "name",
      key: "name",
      fixed: "left" as const,
      width: 200,
      render: (name: string, record: StudentAttendanceRow) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#666",
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: "500" }}>{name}</div>
            <div style={{ fontSize: "11px", color: "#888" }}>{record.code}</div>
          </div>
        </div>
      ),
    },
    ...getScheduledSubjectsForDay().map((subject) => ({
      title: (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "600" }}>{subject.name}</div>
        </div>
      ),
      dataIndex: ["subjects", subject.id],
      key: subject.id,
      width: 120,
      align: "center" as const,
      render: (status: AttendanceStatus, record: StudentAttendanceRow) => {
        const updateKey = `${record.id}-${subject.id}`;
        const isUpdating = updatingAttendance.has(updateKey);

        return (
          <AttendanceToggle
            value={status || "absent"}
            onChange={(value: AttendanceStatus) =>
              handleIndividualAttendanceChange(record.id, subject.id, value)
            }
            size="small"
            loading={isUpdating}
          />
        );
      },
    })),
  ];

  // Convert daily attendance to table format
  const tableData: StudentAttendanceRow[] = students
    .filter((student) =>
      student.name.toLowerCase().includes(searchText.toLowerCase())
    )
    .map((student) => {
      const studentAttendance = dailyAttendance?.students.find(
        (attendance) => attendance.studentId === student.id
      );

      return {
        id: student.id,
        name: student.name,
        code: student.code,
        subjects: studentAttendance?.subjects || {},
      };
    });

  const attendanceStats = getAttendanceStats(tableData);
  const scheduledSubjects = getScheduledSubjectsForDay();
  const selectedDayOfWeek = selectedDate.format("dddd");

  const rowSelection = {
    selectedRowKeys: selectedStudents,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedStudents(selectedRowKeys as string[]);
    },
  };

  // Reset initialized state when date changes
  useEffect(() => {
    setAttendanceInitialized(false);
  }, [selectedDate]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Typography.Text>{t("stages.details.loading")}</Typography.Text>
      </div>
    );
  }

  if (!stage) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Typography.Text>{t("stages.details.notFound")}</Typography.Text>
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            {t("stages.details.title", { stageName: stage.name })}
          </Title>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Badge count={students.length} showZero color="#1890ff">
              <UsergroupAddOutlined
                style={{ fontSize: "24px", color: "#1890ff" }}
              />
            </Badge>
            <Tooltip title={t("stages.details.students")}>
              <span style={{ fontSize: "14px", color: "#666" }}>
                {t("stages.details.students")}
              </span>
            </Tooltip>
          </div>
        </div>
        <Calendar
          fullscreen={false}
          value={selectedDate}
          onChange={(date) => setSelectedDate(date)}
        />
      </Card>

      <Card>
        <Space
          direction="vertical"
          size="middle"
          style={{ width: "100%", overflow: "visible" }}
        >
          {scheduleLoading && (
            <Alert
              message={t("stages.details.attendance.alerts.loadingSchedule")}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {!scheduleLoading && scheduledSubjects.length === 0 && (
            <Alert
              message={t("stages.details.attendance.alerts.noSubjectsScheduled", { day: selectedDayOfWeek })}
              description={t("stages.details.attendance.alerts.checkSchedule")}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <Title level={3} style={{ margin: 0 }}>
                {t("stages.details.attendance.title", {
                  date: selectedDate.format("MMMM D, YYYY"),
                  day: selectedDayOfWeek,
                })}
              </Title>
              {scheduledSubjects.length > 0 && (
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <AttendanceStatusBadge
                    status="present"
                    showLabel={false}
                    size="small"
                  />
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {attendanceStats.present} {t("stages.details.attendance.stats.present")}
                  </span>
                  <AttendanceStatusBadge
                    status="absent"
                    showLabel={false}
                    size="small"
                  />
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {attendanceStats.absent} {t("stages.details.attendance.stats.absent")}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginLeft: "8px",
                    }}
                  >
                    ({t("stages.details.attendance.stats.presentRate", { rate: attendanceStats.rate.toFixed(1) })})
                  </span>
                </div>
              )}
            </div>
            <Space>
              <Input
                placeholder={t("stages.details.attendance.searchStudents")}
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
              <Button
                onClick={handleInitializeAttendance}
                type={attendanceInitialized ? "default" : "primary"}
                loading={isInitializing}
                disabled={scheduledSubjects.length === 0}
                style={{
                  backgroundColor: attendanceInitialized
                    ? "#52c41a"
                    : undefined,
                  borderColor: attendanceInitialized ? "#52c41a" : undefined,
                  color: attendanceInitialized ? "white" : undefined,
                }}
                icon={attendanceInitialized ? "✅" : undefined}
              >
                {attendanceInitialized
                  ? t("stages.details.attendance.initializeButtonInitialized")
                  : t("stages.details.attendance.initializeButton")}
              </Button>
              <Button
                type="primary"
                onClick={() => setBulkMarkModal(true)}
                disabled={
                  selectedStudents.length === 0 ||
                  scheduledSubjects.length === 0
                }
                icon={<CheckOutlined />}
              >
                {t("stages.details.attendance.bulkMark")} ({selectedStudents.length})
              </Button>
            </Space>
          </div>
          <Table
            scroll={{ x: "max-content" }}
            columns={columns}
            dataSource={tableData}
            rowKey="id"
            pagination={false}
            bordered
            loading={attendanceLoading || scheduleLoading}
            rowSelection={
              scheduledSubjects.length > 0 ? rowSelection : undefined
            }
            scroll={{ x: 800 }}
            size="small"
          />
        </Space>
      </Card>

      <Modal
        title={t("stages.details.attendance.modal.title")}
        open={bulkMarkModal}
        onOk={handleBulkMarkAttendance}
        onCancel={() => {
          setBulkMarkModal(false);
          setSelectedStudents([]);
          setSelectedSubject("");
          setSelectedStatus("present");
        }}
        confirmLoading={isMarkingAttendance}
        width="min(500px, calc(100vw - 32px))"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>{t("stages.details.attendance.modal.date")}: </Typography.Text>
            <Typography.Text>
              {selectedDate.format("MMMM D, YYYY")}
            </Typography.Text>
          </div>
          <div>
            <Typography.Text strong>{t("stages.details.attendance.modal.selectedStudents")}: </Typography.Text>
            <Typography.Text>
              {t("stages.details.attendance.modal.studentsCount", { count: selectedStudents.length })}
            </Typography.Text>
          </div>
          <div>
            <Typography.Text strong>{t("stages.details.attendance.modal.subject")}: </Typography.Text>
            <Select
              style={{ width: "100%" }}
              placeholder={t("stages.details.attendance.modal.subjectPlaceholder")}
              value={selectedSubject}
              onChange={setSelectedSubject}
            >
              {getScheduledSubjectsForDay().map((subject) => (
                <Option key={subject.id} value={subject.id}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <Typography.Text strong>{t("stages.details.attendance.modal.status")}: </Typography.Text>
            <div style={{ marginTop: "8px" }}>
              <AttendanceToggle
                value={selectedStatus}
                onChange={setSelectedStatus}
                size="default"
              />
            </div>
          </div>
        </Space>
      </Modal>
    </Space>
  );
};

export default StageDetails;
