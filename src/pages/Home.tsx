import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  List,
  Tag,
  Spin,
  message,
  notification,
} from "antd";
import toast from "react-hot-toast";
import {
  TeamOutlined,
  BookOutlined,
  CalendarOutlined,
  UserOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { Line } from "@ant-design/plots";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Column } from "@ant-design/plots";
import { useNavigate } from "react-router-dom";
import StageSchedule from "../views/stages/StageSchedule";
import {
  useStudents,
  useTeachers,
  useSubjects,
  useStages,
  useExams,
} from "../hooks/useAPI";
import { useAuth } from "../contexts/AuthContext";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const { school } = useAuth();
  const { t } = useTranslation();

  // Debug: Log school object to see what's available
  React.useEffect(() => {
    console.log("School object:", school);
    if (school) {
      console.log("School code:", school.schoolCode);
    }
  }, [school]);

  // Fetch real data
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: stages, isLoading: stagesLoading } = useStages();
  const { data: exams, isLoading: examsLoading } = useExams();

  // Calculate real statistics
  const totalStudents = students?.length || 0;
  const totalTeachers = teachers?.length || 0;
  const totalSubjects = subjects?.length || 0;
  const totalStages = stages?.length || 0;

  // Process student age distribution from real data
  const ageDistribution = useMemo(() => {
    if (!students) return [];

    const ageGroups: Record<number, number> = {};
    students.forEach((student) => {
      ageGroups[student.age] = (ageGroups[student.age] || 0) + 1;
    });

    return Object.entries(ageGroups)
      .map(([age, count]) => ({
        name: `${age} ${t("home.years")}`,
        value: count,
      }))
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [students, t]);

  // Mock historical data for line chart (in a real app, this would come from historical records)
  const lineData = useMemo(() => {
    if (totalStudents === 0) return [];

    const currentMonth = new Date().getMonth();
    const months = [
      t("home.months.jan"),
      t("home.months.feb"),
      t("home.months.mar"),
      t("home.months.apr"),
      t("home.months.may"),
      t("home.months.jun"),
      t("home.months.jul"),
      t("home.months.aug"),
      t("home.months.sep"),
      t("home.months.oct"),
      t("home.months.nov"),
      t("home.months.dec"),
    ];

    // Create a more realistic growth pattern
    const monthsToShow = 6;
    const startMonth = Math.max(0, currentMonth - monthsToShow + 1);
    const endMonth = currentMonth + 1;

    return months.slice(startMonth, endMonth).map((month, index) => {
      // Simulate growth with some randomness but overall upward trend
      const baseGrowth = Math.floor(totalStudents * 0.15); // 15% growth range
      const monthlyGrowth = Math.floor(
        (baseGrowth / monthsToShow) * (index + 1)
      );
      const randomVariation = Math.floor(Math.random() * 10) - 5; // ±5 variation

      return {
        month,
        students: Math.max(
          0,
          totalStudents - baseGrowth + monthlyGrowth + randomVariation
        ),
      };
    });
  }, [totalStudents, t]);

  // Get gender distribution for additional insights
  const genderDistribution = useMemo(() => {
    if (!students) return [];

    const genderGroups: Record<string, number> = {};
    students.forEach((student) => {
      const gender =
        student.gender === "male"
          ? t("home.gender.male")
          : t("home.gender.female");
      genderGroups[gender] = (genderGroups[gender] || 0) + 1;
    });

    return Object.entries(genderGroups).map(([gender, count]) => ({
      name: gender,
      value: count,
    }));
  }, [students, t]);

  // Enhanced stage statistics
  const stageStatistics = useMemo(() => {
    if (!stages || !students) return [];

    return stages
      .map((stage) => {
        const stageStudents = students.filter((s) => s.stage.id === stage.id);
        const maleCount = stageStudents.filter(
          (s) => s.gender === "male"
        ).length;
        const femaleCount = stageStudents.filter(
          (s) => s.gender === "female"
        ).length;

        return {
          stage: stage.name,
          students: stage.studentCount,
          stageId: stage.id,
          maleCount,
          femaleCount,
          teacherCount: stage.teacherCount,
        };
      })
      .sort(
        (a, b) =>
          parseInt(a.stage.replace(/\D/g, "")) -
          parseInt(b.stage.replace(/\D/g, ""))
      );
  }, [stages, students]);

  // Get upcoming exams (next 7 days)
  const upcomingExams = useMemo(() => {
    if (!exams) return [];

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return exams
      .filter((exam) => {
        const examDate = new Date(exam.examDate);
        return examDate >= today && examDate <= nextWeek;
      })
      .sort(
        (a, b) =>
          new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
      )
      .slice(0, 5); // Show only first 5 upcoming exams
  }, [exams]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  const lineConfig = {
    data: lineData,
    xField: "month",
    yField: "students",
    smooth: true,
    lineStyle: {
      stroke: "#1890ff",
    },
    point: {
      size: 5,
      shape: "circle",
      style: {
        fill: "#1890ff",
      },
    },
    height: 250,
  };

  const stageConfig = {
    data: stageStatistics,
    xField: "stage",
    yField: "students",
    label: {
      position: "middle",
      style: {
        fill: "#FFFFFF",
        opacity: 0.6,
      },
    },
    meta: {
      stage: {
        alias: "Stage",
      },
      students: {
        alias: "Number of Students",
      },
    },
    height: 300,
    autoFit: true,
    barSize: 30,
    marginRatio: 0.2,
    tooltip: {
      formatter: (datum: any) => ({
        name: "Students",
        value: `${datum.students} (${datum.maleCount}M, ${datum.femaleCount}F)`,
      }),
    },
  };

  const isLoading =
    studentsLoading ||
    teachersLoading ||
    subjectsLoading ||
    stagesLoading ||
    examsLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-6">{t("home.title")}</h1>
          <p className="mb-12">{t("home.subtitle")}</p>
        </div>
        <Button
          type="primary"
          icon={<CopyOutlined />}
          onClick={() => {
            if (school?.schoolCode) {
              navigator.clipboard.writeText(school.schoolCode);
              toast.success(
                t("home.schoolCodeCopied", { code: school.schoolCode }),
                {
                  icon: "📋",
                  duration: 3000,
                }
              );
            } else {
              toast.error(t("home.schoolCodeError"), {
                icon: "⚠️",
                duration: 5000,
              });
            }
          }}
          size="large"
        >
          {school?.schoolCode || t("home.loginRequired")}
        </Button>
      </div>

      {/* First Row - Overview Statistics */}
      <Row gutter={16} className="mb-12" style={{ marginBottom: "16px" }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={t("home.statistics.totalStudents")}
              value={totalStudents}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t("home.statistics.totalTeachers")}
              value={totalTeachers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#52c41a" }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t("home.statistics.totalSubjects")}
              value={totalSubjects}
              prefix={<BookOutlined />}
              valueStyle={{ color: "#fa8c16" }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t("home.statistics.totalStages")}
              value={totalStages}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#722ed1" }}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Second Row - Student Growth and Distributions */}
      <Row gutter={16} className="mb-12" style={{ marginBottom: "16px" }}>
        <Col span={8}>
          <Card
            title={t("home.charts.studentGrowthTrend")}
            style={{ height: "100%" }}
          >
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 250,
                }}
              >
                <Spin size="large" />
              </div>
            ) : (
              <div style={{ height: 250 }}>
                <Line {...lineConfig} />
              </div>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={t("home.charts.studentAgeDistribution")}
            style={{ height: "100%" }}
          >
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 250,
                }}
              >
                <Spin size="large" />
              </div>
            ) : (
              <div style={{ height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={ageDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ageDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={t("home.charts.genderDistribution")}
            style={{ height: "100%" }}
          >
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 250,
                }}
              >
                <Spin size="large" />
              </div>
            ) : (
              <div style={{ height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={genderDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Third Row - Upcoming Exams */}
      <Row gutter={16} className="mb-12">
        <Col span={24}>
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <span>{t("home.upcomingExams.title")}</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate("/exams")}>
                {t("home.upcomingExams.viewAll")}
              </Button>
            }
          >
            {examsLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "20px",
                }}
              >
                <Spin size="large" />
              </div>
            ) : upcomingExams.length > 0 ? (
              <List
                dataSource={upcomingExams}
                renderItem={(exam) => (
                  <List.Item
                    key={exam.id}
                    actions={[
                      <Tag color="blue">{exam.stage.name}</Tag>,
                      <Tag color="green">{exam.classNumber}</Tag>,
                    ]}
                  >
                    <List.Item.Meta
                      title={exam.title}
                      description={
                        <Space direction="vertical" size="small">
                          <span>
                            {t("home.upcomingExams.subject")}:{" "}
                            {exam.subject.name}
                          </span>
                          <span>
                            {t("home.upcomingExams.teacher")}:{" "}
                            {exam.teacher.name}
                          </span>
                          <span>
                            {t("home.upcomingExams.date")}:{" "}
                            {new Date(exam.examDate).toLocaleDateString()}
                          </span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div
                style={{ textAlign: "center", padding: "20px", color: "#666" }}
              >
                {t("home.upcomingExams.noExams")}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Fourth Row - Stages Distribution */}
      <Row gutter={16} className="mb-12" style={{ marginTop: "16px" }}>
        <Col span={24}>
          <Card title={t("home.charts.studentsPerStage")}>
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 300,
                }}
              >
                <Spin size="large" />
              </div>
            ) : (
              <Column {...stageConfig} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Fifth Row - Stage Schedule Buttons */}
      {!isLoading && stageStatistics.length > 0 && (
        <Row gutter={16} className="mb-12" style={{ marginTop: "16px" }}>
          <Col span={24}>
            <Card title={t("home.stageSchedules.title")}>
              <Space size="middle" wrap>
                {stageStatistics.map((stage) => (
                  <Button
                    key={stage.stageId}
                    type={
                      selectedStage === stage.stageId ? "primary" : "default"
                    }
                    onClick={() =>
                      setSelectedStage(
                        selectedStage === stage.stageId ? null : stage.stageId
                      )
                    }
                  >
                    {stage.stage} {t("home.stageSchedules.schedule")} (
                    {stage.students} {t("home.stageSchedules.students")})
                  </Button>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* Sixth Row - Selected Stage Schedule */}
      {selectedStage && (
        <Row gutter={16} style={{ marginTop: "16px" }}>
          <Col span={24}>
            <Card
              title={`${
                stageStatistics.find((s) => s.stageId === selectedStage)?.stage
              } Schedule`}
            >
              <div style={{ padding: "20px" }}>
                <StageSchedule stageId={selectedStage} />
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Home;
