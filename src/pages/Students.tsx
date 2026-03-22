import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Divider, Flex, Input, Card, Row, Col, Statistic } from "antd";
import React, { useState } from "react";
import StudentsTable from "../views/students/StudentsTable";
import { useNavigate } from "react-router-dom";
import { Line } from "@ant-design/plots";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useStudents } from "../hooks/useAPI";
import { useTranslation } from "react-i18next";

const Students: React.FC = () => {
  const route = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: students, isLoading } = useStudents();
  const { t } = useTranslation();

  // Calculate statistics from real data
  const totalStudents = students?.length || 0;

  // Age distribution from real data
  const ageDistribution = React.useMemo(() => {
    if (!students) return [];

    const ageGroups: Record<number, number> = {};
    students.forEach((student) => {
      ageGroups[student.age] = (ageGroups[student.age] || 0) + 1;
    });

    return Object.entries(ageGroups).map(([age, count]) => ({
      name: `${age} ${t("home.years")}`,
      value: count,
    }));
  }, [students, t]);

  // Mock data for the line chart (student growth over time) - could be enhanced with real historical data
  const lineData = [
    { month: "Jan", students: Math.max(0, totalStudents - 50) },
    { month: "Feb", students: Math.max(0, totalStudents - 40) },
    { month: "Mar", students: Math.max(0, totalStudents - 30) },
    { month: "Apr", students: Math.max(0, totalStudents - 20) },
    { month: "May", students: Math.max(0, totalStudents - 10) },
    { month: "Jun", students: totalStudents },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("students.title")}</h1>
      <div className="grid gap-6">
        <Row gutter={16} className="mb-8">
          <Col span={12}>
            <Card style={{ height: "100%" }}>
              <Statistic
                title={t("students.totalStudents")}
                value={totalStudents}
                className="mb-4"
                loading={isLoading}
              />
              <div style={{ height: 250 }}>
                <Line {...lineConfig} />
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={t("students.charts.ageDistribution")}
              style={{ height: "100%" }}
            >
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
            </Card>
          </Col>
        </Row>
        <Flex
          justify="space-between"
          align="center"
          className="mb-4 mt-4"
          style={{ marginTop: "16px" }}
        >
          <Input
            placeholder={t("students.searchPlaceholder")}
            style={{ width: "200px" }}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            onClick={() => route("/students/add")}
            type="primary"
            icon={<PlusOutlined />}
          >
            {t("students.addStudent")}
          </Button>
        </Flex>
        <Divider />
        <StudentsTable searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default Students;
