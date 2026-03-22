import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Divider, Flex, Input, Card, Row, Col } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import StagesTable from "../views/stages/StagesTable";
import { useNavigate } from "react-router-dom";
import { Column } from "@ant-design/plots";
import { useStages } from "../hooks/useAPI";

const Stages: React.FC = () => {
  const { t } = useTranslation();
  const route = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: stages, isLoading } = useStages();

  // Transform real data for the chart - showing both students and subjects
  const chartData = React.useMemo(() => {
    if (!stages) return [];

    const studentData = stages.map((stage) => ({
      stage: stage.name,
      count: stage.studentCount,
      type: t("common.students"),
    }));

    const subjectData = stages.map((stage) => ({
      stage: stage.name,
      count: stage.subjectCount,
      type: t("common.subjects"),
    }));

    return [...studentData, ...subjectData];
  }, [stages, t]);

  const config = {
    data: chartData,
    xField: "stage",
    yField: "count",
    seriesField: "type",
    isGroup: true,
    columnStyle: {
      radius: [2, 2, 0, 0],
    },
    label: {
      position: "middle",
      style: {
        fill: "#FFFFFF",
        opacity: 0.8,
      },
    },
    meta: {
      stage: {
        alias: t("common.stages"),
      },
      count: {
        alias: "Count",
      },
      type: {
        alias: "Type",
      },
    },
    height: 300,
    autoFit: true,
    marginRatio: 0.1,
    loading: isLoading,
    color: ["#1890ff", "#52c41a"],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("stages.title")}</h1>
      <div className="grid gap-6">
        <Row gutter={16} className="mb-8">
          <Col span={24}>
            <Card title={t("stages.charts.studentsAndSubjects")}>
              <Column {...config} />
            </Card>
          </Col>
        </Row>
        <Flex justify="space-between" align="center" className="mb-4">
          <Input
            placeholder={t("stages.searchPlaceholder")}
            style={{ width: "200px", marginTop: "16px" }}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            onClick={() => route("/stages/add")}
            type="primary"
            icon={<PlusOutlined />}
          >
            {t("stages.addStage")}
          </Button>
        </Flex>
        <Divider />
        <StagesTable searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default Stages;
