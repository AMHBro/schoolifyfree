import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Select,
  Input,
  Button,
  Tag,
  Modal,
  message,
  Space,
  Typography,
  Row,
  Col,
  Form,
  InputNumber,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  BookOutlined,
  DownOutlined,
  RightOutlined,
  DownloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { ColumnsType } from "antd/es/table";
import {
  stagesAPI,
  subjectsAPI,
  gradesAPI,
  pdfAPI,
  teachersAPI,
} from "../services/api";
import type { Teacher } from "../types/api";

const { Title } = Typography;
const { Option } = Select;

interface Grade {
  id: string;
  grade: number;
  teacher: string;
  createdAt: string;
}

interface SubjectGrades {
  subjectId: string;
  subjectName: string;
  grades: {
    MONTH_1_EXAM: Grade | null;
    MONTH_2_EXAM: Grade | null;
    MID_TERM_EXAM: Grade | null;
    MONTH_3_EXAM: Grade | null;
    MONTH_4_EXAM: Grade | null;
    FINAL_EXAM: Grade | null;
  };
}

interface StudentGrade {
  id: string;
  name: string;
  code: string;
  stage: {
    id: string;
    name: string;
  };
  subjectGrades: SubjectGrades[];
  summary: {
    total: number;
    average: number;
    isPassed: boolean;
    status: "PASSED" | "FAILED";
    totalGrades: number;
  };
}

interface GradesResponse {
  success: boolean;
  data: {
    grades: StudentGrade[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message?: string;
}

interface Stage {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  stage?: {
    id: string;
    name: string;
  };
}

// Student row structure for expandable table
interface StudentRow {
  key: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  stage: { id: string; name: string };
  subjectGrades: SubjectGrades[];
  totalSubjects: number;
  overallAverage: number;
  status: "PASSED" | "FAILED";
  totalGrades: number;
}

// Subject detail row for expanded content
interface SubjectDetailRow {
  key: string;
  subjectName: string;
  monthly1: Grade | null;
  monthly2: Grade | null;
  midExam: Grade | null;
  monthly3: Grade | null;
  monthly4: Grade | null;
  finalExam: Grade | null;
  subjectAverage: number;
}

const Grades: React.FC = () => {
  const { t } = useTranslation();
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [editingStudent, setEditingStudent] = useState<StudentGrade | null>(
    null
  );
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newStageId, setNewStageId] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [addGradeModalVisible, setAddGradeModalVisible] = useState(false);
  const [addGradeModalLoading, setAddGradeModalLoading] = useState(false);
  const [selectedStudentForGrade, setSelectedStudentForGrade] =
    useState<StudentRow | null>(null);
  const [addGradeForm] = Form.useForm();
  const watchedSubjectId = Form.useWatch("subjectId", addGradeForm);

  // Fetch grades data
  const fetchGrades = async (page = 1) => {
    setLoading(true);
    try {
      const response = await gradesAPI.getAll({
        page,
        limit: pagination.pageSize,
        stageId: selectedStage || undefined,
        subjectId: selectedSubject || undefined,
      });

      if (response.success) {
        setGrades(response.data.grades);
        setPagination((prev) => ({
          ...prev,
          current: response.data.pagination.page,
          total: response.data.pagination.total,
        }));
      } else {
        message.error(
          response.message || t("grades.messages.fetchGradesError")
        );
      }
    } catch (error) {
      console.error("Fetch grades error:", error);
      message.error(t("grades.messages.fetchGradesError"));
    } finally {
      setLoading(false);
    }
  };

  // Fetch stages for filter
  const fetchStages = async () => {
    try {
      const response = await stagesAPI.getAll();
      setStages(response);
    } catch (error) {
      console.error("Fetch stages error:", error);
    }
  };

  // Fetch subjects for filter
  const fetchSubjects = async () => {
    try {
      const response = await subjectsAPI.getAll();
      setSubjects(response);
    } catch (error) {
      console.error("Fetch subjects error:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await teachersAPI.getAll();
      setTeachers(response);
    } catch (error) {
      console.error("Fetch teachers error:", error);
    }
  };

  useEffect(() => {
    fetchGrades();
    fetchStages();
    fetchSubjects();
  }, [selectedStage, selectedSubject]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Handle stage change for student
  const handleStageChange = async () => {
    if (!editingStudent || !newStageId) {
      message.error(t("grades.messages.selectStageError"));
      return;
    }

    try {
      const response = await gradesAPI.updateStudentStage(
        editingStudent.id,
        newStageId
      );

      if (response.success) {
        message.success(t("grades.messages.updateStageSuccess"));
        setEditModalVisible(false);
        setEditingStudent(null);
        setNewStageId("");
        fetchGrades(pagination.current);
      } else {
        message.error(
          response.message || t("grades.messages.updateStageError")
        );
      }
    } catch (error) {
      console.error("Update stage error:", error);
      message.error(t("grades.messages.updateStageError"));
    }
  };

  const openAddGradeModal = (student: StudentRow) => {
    setSelectedStudentForGrade(student);
    addGradeForm.resetFields();
    setAddGradeModalVisible(true);
  };

  const closeAddGradeModal = () => {
    setAddGradeModalVisible(false);
    setSelectedStudentForGrade(null);
    addGradeForm.resetFields();
  };

  const handleAddGrade = async () => {
    if (!selectedStudentForGrade) {
      return;
    }

    try {
      const values = await addGradeForm.validateFields();
      setAddGradeModalLoading(true);

      await gradesAPI.createGrade({
        studentId: selectedStudentForGrade.studentId,
        subjectId: values.subjectId,
        teacherId: values.teacherId,
        gradeType: values.gradeType,
        grade: values.grade,
      });

      message.success(t("grades.messages.addGradeSuccess"));
      closeAddGradeModal();
      fetchGrades(pagination.current);
    } catch (error) {
      console.error("Add grade error:", error);
      message.error(t("grades.messages.addGradeError"));
    } finally {
      setAddGradeModalLoading(false);
    }
  };

  const gradeTypeOptions = [
    { value: "MONTH_1_EXAM", label: t("grades.table.gradeTypes.month1") },
    { value: "MONTH_2_EXAM", label: t("grades.table.gradeTypes.month2") },
    { value: "MID_TERM_EXAM", label: t("grades.table.gradeTypes.midExam") },
    { value: "MONTH_3_EXAM", label: t("grades.table.gradeTypes.month3") },
    { value: "MONTH_4_EXAM", label: t("grades.table.gradeTypes.month4") },
    { value: "FINAL_EXAM", label: t("grades.table.gradeTypes.finalExam") },
  ];

  const subjectOptionsForStudent = selectedStudentForGrade
    ? subjects.filter(
        (subject) =>
          subject.stage && subject.stage.id === selectedStudentForGrade.stage.id
      )
    : subjects;

  const teacherOptionsForSelection =
    watchedSubjectId && teachers.length > 0
      ? teachers.filter((teacher) =>
          teacher.subjects?.some((subject) => subject.id === watchedSubjectId)
        )
      : teachers;

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to download PDF file
  const downloadPDF = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle download for individual student
  const handleDownloadStudent = async (studentId: string) => {
    const student = grades.find((g) => g.id === studentId);
    if (!student) {
      message.error(t("grades.messages.studentNotFound"));
      return;
    }

    try {
      message.loading(t("grades.messages.generatingPDF"), 0);
      const blob = await pdfAPI.downloadStudentReport(studentId);
      const filename = `${student.name.replace(/\s+/g, "_")}_grades_report.pdf`;

      downloadPDF(blob, filename);
      message.destroy();
      message.success(
        t("grades.messages.downloadSuccess", { studentName: student.name })
      );
    } catch (error) {
      console.error("PDF download error:", error);
      message.destroy();
      message.error(t("grades.messages.downloadError"));
    }
  };

  // Handle download for all current students
  const handleDownloadAll = async () => {
    if (studentRows.length === 0) {
      message.error(t("grades.messages.noDataToDownload"));
      return;
    }

    try {
      message.loading(t("grades.messages.generatingBulkPDF"), 0);

      const studentIds = studentRows.map((row) => row.studentId);
      const downloadData: any = { studentIds };

      if (selectedStage) {
        downloadData.stageId = selectedStage;
      }
      if (selectedSubject) {
        downloadData.subjectId = selectedSubject;
      }

      const blob = await pdfAPI.downloadBulkReports(downloadData);

      const filterInfo = [];
      if (selectedStage) {
        const stageName = stages.find((s) => s.id === selectedStage)?.name;
        filterInfo.push(`stage_${stageName}`);
      }
      if (selectedSubject) {
        const subjectName = subjects.find(
          (s) => s.id === selectedSubject
        )?.name;
        filterInfo.push(`subject_${subjectName}`);
      }
      if (searchText) {
        filterInfo.push(`search_${searchText}`);
      }

      const filterSuffix =
        filterInfo.length > 0
          ? `_${filterInfo.join("_").replace(/\s+/g, "_")}`
          : "";
      const filename = `all_student_grades${filterSuffix}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      downloadPDF(blob, filename);
      message.destroy();
      message.success(
        t("grades.messages.bulkDownloadSuccess", { count: studentRows.length })
      );
    } catch (error) {
      console.error("Bulk PDF download error:", error);
      message.destroy();
      message.error(t("grades.messages.bulkDownloadError"));
    }
  };

  // Transform data for student-based expandable table
  const studentRows = grades
    .filter((student) => {
      // Apply search filter
      const searchMatch =
        student.name.toLowerCase().includes(searchText.toLowerCase()) ||
        student.code.toLowerCase().includes(searchText.toLowerCase()) ||
        student.stage.name.toLowerCase().includes(searchText.toLowerCase()) ||
        student.subjectGrades.some((sg) =>
          sg.subjectName.toLowerCase().includes(searchText.toLowerCase())
        );

      // Apply subject filter - show students who have grades in the selected subject
      const subjectMatch =
        !selectedSubject ||
        student.subjectGrades.some((sg) => sg.subjectId === selectedSubject);

      return searchMatch && subjectMatch;
    })
    .map((student): StudentRow => {
      return {
        key: student.id,
        studentId: student.id,
        studentName: student.name,
        studentCode: student.code,
        stage: student.stage,
        subjectGrades: student.subjectGrades,
        totalSubjects: student.subjectGrades.length,
        overallAverage: student.summary.average,
        status: student.summary.status,
        totalGrades: student.summary.totalGrades,
      };
    });

  // Render grade tag with color coding
  const renderGradeTag = (grade: Grade | null) => {
    if (!grade) {
      return <Tag color="default">-</Tag>;
    }
    return <Tag color={grade.grade >= 50 ? "green" : "red"}>{grade.grade}</Tag>;
  };

  // Get all subjects for a specific stage
  const getSubjectsForStage = (stageId: string): Subject[] => {
    return subjects.filter(
      (subject) => subject.stage && subject.stage.id === stageId
    );
  };

  // Expanded row content showing all subjects for a student
  const expandedRowRender = (record: StudentRow) => {
    const subjectColumns: ColumnsType<SubjectDetailRow> = [
      {
        title: t("grades.table.headers.subject"),
        dataIndex: "subjectName",
        width: 150,
        render: (subjectName: string, record) => (
          <Tag
            icon={<BookOutlined />}
            color={
              selectedSubject && record.key.includes(selectedSubject)
                ? "orange"
                : "blue"
            }
          >
            {subjectName}
          </Tag>
        ),
      },
      {
        title: t("grades.table.gradeTypes.month1"),
        dataIndex: "monthly1",
        width: 100,
        render: renderGradeTag,
      },
      {
        title: t("grades.table.gradeTypes.month2"),
        dataIndex: "monthly2",
        width: 100,
        render: renderGradeTag,
      },
      {
        title: t("grades.table.gradeTypes.midExam"),
        dataIndex: "midExam",
        width: 100,
        render: renderGradeTag,
      },
      {
        title: t("grades.table.gradeTypes.month3"),
        dataIndex: "monthly3",
        width: 100,
        render: renderGradeTag,
      },
      {
        title: t("grades.table.gradeTypes.month4"),
        dataIndex: "monthly4",
        width: 100,
        render: renderGradeTag,
      },
      {
        title: t("grades.table.gradeTypes.finalExam"),
        dataIndex: "finalExam",
        width: 100,
        render: renderGradeTag,
      },
      {
        title: t("grades.table.headers.subjectAverage"),
        dataIndex: "subjectAverage",
        width: 100,
        render: (average: number) => (
          <Tag color={average >= 50 ? "green" : "red"}>
            {average > 0 ? average.toFixed(1) : "-"}
          </Tag>
        ),
      },
    ];

    // Get all subjects for this student's stage
    const stageSubjects = getSubjectsForStage(record.stage.id);

    // Create a map of existing subject grades
    const existingGradesMap = new Map<string, SubjectGrades>();
    record.subjectGrades.forEach((sg) => {
      existingGradesMap.set(sg.subjectId, sg);
    });

    // Create subject data including all subjects (with and without grades)
    let subjectData: SubjectDetailRow[] = stageSubjects.map((subject) => {
      const existingGrades = existingGradesMap.get(subject.id);

      // If grades exist, calculate average; otherwise, show 0
      let subjectAverage = 0;
      if (existingGrades) {
        const subjectGradeValues = Object.values(existingGrades.grades)
          .filter((grade): grade is Grade => grade !== null)
          .map((grade) => grade.grade);
        subjectAverage =
          subjectGradeValues.length > 0
            ? subjectGradeValues.reduce((sum, grade) => sum + grade, 0) /
              subjectGradeValues.length
            : 0;
      }

      return {
        key: `${record.studentId}-${subject.id}`,
        subjectName: subject.name,
        monthly1: existingGrades?.grades.MONTH_1_EXAM || null,
        monthly2: existingGrades?.grades.MONTH_2_EXAM || null,
        midExam: existingGrades?.grades.MID_TERM_EXAM || null,
        monthly3: existingGrades?.grades.MONTH_3_EXAM || null,
        monthly4: existingGrades?.grades.MONTH_4_EXAM || null,
        finalExam: existingGrades?.grades.FINAL_EXAM || null,
        subjectAverage: Math.round(subjectAverage * 100) / 100,
      };
    });

    // If a subject is selected, highlight and prioritize it
    if (selectedSubject) {
      subjectData = subjectData.sort((a, b) => {
        const aIsSelected = a.key.includes(selectedSubject);
        const bIsSelected = b.key.includes(selectedSubject);
        if (aIsSelected && !bIsSelected) return -1;
        if (!aIsSelected && bIsSelected) return 1;
        return 0;
      });
    }

    return (
      <div style={{ margin: "16px 0" }}>
        <Typography.Text strong>
          {t("grades.table.expandedView.title", {
            studentName: record.studentName,
            stageName: record.stage.name,
          })}
          {selectedSubject && (
            <Tag color="orange" style={{ marginLeft: 8 }}>
              {t("grades.table.expandedView.filteredBy", {
                subjectName: subjects.find((s) => s.id === selectedSubject)
                  ?.name,
              })}
            </Tag>
          )}
        </Typography.Text>
        <Table
          scroll={{ x: "max-content" }}
          columns={subjectColumns}
          dataSource={subjectData}
          pagination={false}
          size="small"
          style={{ marginTop: 8 }}
        />
      </div>
    );
  };

  // Handle row expansion
  const handleRowExpand = (expanded: boolean, record: StudentRow) => {
    if (expanded) {
      setExpandedRows([...expandedRows, record.key]);
    } else {
      setExpandedRows(expandedRows.filter((key) => key !== record.key));
    }
  };

  // Main table columns for student rows
  const columns: ColumnsType<StudentRow> = [
    {
      title: t("grades.table.headers.student"),
      key: "student",
      width: 250,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
            {record.studentName}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {t("grades.table.studentInfo.code", { code: record.studentCode })}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {t("grades.table.studentInfo.stage", { stage: record.stage.name })}
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                const student = grades.find((g) => g.id === record.studentId);
                if (student) {
                  setEditingStudent(student);
                  setNewStageId(student.stage.id);
                  setEditModalVisible(true);
                }
              }}
            />
          </div>
        </div>
      ),
    },
    {
      title: t("grades.table.headers.subjectsWithGrades"),
      dataIndex: "totalSubjects",
      width: 140,
      render: (total: number, record) => {
        const totalStageSubjects = getSubjectsForStage(record.stage.id).length;
        return (
          <Tag color="blue">
            {total} / {totalStageSubjects}
          </Tag>
        );
      },
    },
    {
      title: t("grades.table.headers.totalGrades"),
      dataIndex: "totalGrades",
      width: 120,
      render: (total: number) => <Tag color="cyan">{total}</Tag>,
    },
    {
      title: t("grades.table.headers.overallAverage"),
      dataIndex: "overallAverage",
      width: 130,
      render: (average: number) => (
        <Tag color={average >= 50 ? "green" : "red"}>
          {average > 0 ? average.toFixed(1) : "-"}
        </Tag>
      ),
    },
    {
      title: t("grades.table.headers.status"),
      dataIndex: "status",
      width: 100,
      render: (status: "PASSED" | "FAILED") => (
        <Tag color={status === "PASSED" ? "success" : "error"}>
          {status === "PASSED"
            ? t("grades.status.passed")
            : t("grades.status.failed")}
        </Tag>
      ),
    },
    {
      title: t("grades.table.headers.actions"),
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              openAddGradeModal(record);
            }}
          >
            {t("grades.actions.addGrade")}
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadStudent(record.studentId);
            }}
          >
            {t("grades.actions.download")}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>{t("grades.title")}</Title>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder={t("grades.filters.searchPlaceholder")}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder={t("grades.filters.selectStage")}
              style={{ width: "100%" }}
              value={selectedStage || undefined}
              onChange={(value) => {
                setSelectedStage(value || "");
                setSelectedSubject(""); // Clear subject filter when stage changes
              }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase()) ?? false
              }
            >
              {stages.map((stage) => (
                <Option key={stage.id} value={stage.id}>
                  {stage.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder={t("grades.filters.selectSubject")}
              style={{ width: "100%" }}
              value={selectedSubject || undefined}
              onChange={(value) => setSelectedSubject(value || "")}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase()) ?? false
              }
            >
              {subjects
                .filter(
                  (subject) =>
                    !selectedStage || subject.stage?.id === selectedStage
                )
                .map((subject) => (
                  <Option key={subject.id} value={subject.id}>
                    {subject.name}
                  </Option>
                ))}
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              {(selectedStage || selectedSubject || searchText) && (
                <Button
                  onClick={() => {
                    setSelectedStage("");
                    setSelectedSubject("");
                    setSearchText("");
                  }}
                >
                  {t("grades.filters.clearAll")}
                </Button>
              )}
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadAll}
                disabled={studentRows.length === 0}
              >
                {t("grades.filters.downloadAll", { count: studentRows.length })}
              </Button>
            </Space>
          </Col>
        </Row>
        {(selectedStage || selectedSubject) && (
          <Row style={{ marginTop: 12 }}>
            <Col span={24}>
              <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                {selectedStage &&
                  t("grades.filters.filterInfo", {
                    stage:
                      stages.find((s) => s.id === selectedStage)?.name ||
                      "selected stage",
                  })}
                {selectedStage && selectedSubject && " • "}
                {selectedSubject &&
                  t("grades.filters.subjectFilterInfo", {
                    subject:
                      subjects.find((s) => s.id === selectedSubject)?.name ||
                      "selected subject",
                  })}
              </Typography.Text>
            </Col>
          </Row>
        )}
      </Card>

      {/* Student Grades Table with Expandable Rows */}
      <Card title={t("grades.title")}>
        <Table
          scroll={{ x: "max-content" }}
          columns={columns}
          dataSource={studentRows}
          rowKey="key"
          loading={loading}
          expandable={{
            expandedRowRender,
            expandIcon: ({ expanded, onExpand, record }) =>
              expanded ? (
                <DownOutlined
                  onClick={(e) => onExpand(record, e)}
                  style={{ color: "#1890ff" }}
                />
              ) : (
                <RightOutlined
                  onClick={(e) => onExpand(record, e)}
                  style={{ color: "#1890ff" }}
                />
              ),
            rowExpandable: () => true, // All rows are expandable
            onExpand: handleRowExpand,
            expandedRowKeys: expandedRows,
          }}
          onRow={(record) => {
            return {
              onClick: () => {
                const isExpanded = expandedRows.includes(record.key);
                handleRowExpand(!isExpanded, record);
              },
              style: { cursor: "pointer" },
            };
          }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              t("grades.pagination.showTotal", {
                start: range[0],
                end: range[1],
                total: total,
              }),
            onChange: (page, pageSize) => {
              setPagination((prev) => ({
                ...prev,
                current: page,
                pageSize: pageSize || 10,
              }));
              fetchGrades(page);
            },
          }}
          size="small"
        />
      </Card>

      {/* Add Grade Modal */}
      <Modal
        title={
          selectedStudentForGrade
            ? t("grades.modal.addGrade.title", {
                student: selectedStudentForGrade.studentName,
              })
            : t("grades.modal.addGrade.titleFallback")
        }
        open={addGradeModalVisible}
        onOk={handleAddGrade}
        onCancel={closeAddGradeModal}
        okText={t("grades.modal.addGrade.submitButton")}
        cancelText={t("grades.modal.addGrade.cancelButton")}
        confirmLoading={addGradeModalLoading}
        destroyOnClose
      >
        <Form form={addGradeForm} layout="vertical">
          <Form.Item
            name="subjectId"
            label={t("grades.modal.addGrade.subjectLabel")}
            rules={[
              {
                required: true,
                message: t("grades.modal.addGrade.subjectRequired"),
              },
            ]}
          >
            <Select
              placeholder={t("grades.modal.addGrade.subjectPlaceholder")}
              showSearch
              optionFilterProp="label"
              disabled={!selectedStudentForGrade}
              options={subjectOptionsForStudent.map((subject) => ({
                label: subject.name,
                value: subject.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="gradeType"
            label={t("grades.modal.addGrade.gradeTypeLabel")}
            rules={[
              {
                required: true,
                message: t("grades.modal.addGrade.gradeTypeRequired"),
              },
            ]}
          >
            <Select
              placeholder={t("grades.modal.addGrade.gradeTypePlaceholder")}
              options={gradeTypeOptions}
            />
          </Form.Item>

          <Form.Item
            name="grade"
            label={t("grades.modal.addGrade.gradeValueLabel")}
            rules={[
              {
                required: true,
                message: t("grades.modal.addGrade.gradeValueRequired"),
              },
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: "100%" }}
              placeholder={t("grades.modal.addGrade.gradeValuePlaceholder")}
            />
          </Form.Item>

          <Form.Item
            name="teacherId"
            label={t("grades.modal.addGrade.teacherLabel")}
            rules={[
              {
                required: true,
                message: t("grades.modal.addGrade.teacherRequired"),
              },
            ]}
          >
            <Select
              placeholder={t("grades.modal.addGrade.teacherPlaceholder")}
              showSearch
              optionFilterProp="label"
              options={teacherOptionsForSelection.map((teacher) => ({
                label: teacher.name,
                value: teacher.id,
              }))}
              notFoundContent={t("grades.modal.addGrade.noTeacherAvailable")}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Stage Modal */}
      <Modal
        title={t("grades.modal.editStage.title")}
        open={editModalVisible}
        onOk={handleStageChange}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingStudent(null);
          setNewStageId("");
        }}
        okText={t("grades.modal.editStage.updateButton")}
        cancelText={t("grades.modal.editStage.cancelButton")}
      >
        {editingStudent && (
          <div>
            <p>
              <strong>{t("grades.modal.editStage.studentLabel")}</strong>{" "}
              {editingStudent.name}
            </p>
            <p>
              <strong>{t("grades.modal.editStage.currentStageLabel")}</strong>{" "}
              {editingStudent.stage.name}
            </p>
            <div style={{ marginTop: 16 }}>
              <label>{t("grades.modal.editStage.newStageLabel")}</label>
              <Select
                style={{ width: "100%", marginTop: 8 }}
                value={newStageId || undefined}
                onChange={(value) => setNewStageId(value || "")}
                placeholder={t("grades.modal.editStage.selectNewStage")}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase()) ?? false
                }
              >
                {stages.map((stage) => (
                  <Option key={stage.id} value={stage.id}>
                    {stage.name}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Grades;
