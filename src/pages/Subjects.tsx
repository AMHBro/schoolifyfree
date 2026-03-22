import {
  PlusOutlined,
  SearchOutlined,
  BookOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { Button, Divider, Flex, Input, Card, Row, Col, Statistic } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import SubjectsTable from "../views/subjects/SubjectsTable";
import { useNavigate } from "react-router-dom";
import { useSubjects } from "../hooks/useAPI";

const Subjects: React.FC = () => {
  const { t } = useTranslation();
  const route = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: subjects, isLoading } = useSubjects();

  const subjectCount = subjects?.length || 0;

  // Calculate unique stages that have subjects
  const uniqueStages = React.useMemo(() => {
    if (!subjects) return new Set();
    return new Set(subjects.map((subject) => subject.stage.id));
  }, [subjects]);

  const stagesWithSubjects = uniqueStages.size;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("subjects.title")}</h1>
      <div className="grid gap-6">
        <Row gutter={16} className="mb-8">
          <Col span={12}>
            <Card>
              <Statistic
                title={t("subjects.statistics.totalSubjects")}
                value={subjectCount}
                prefix={<BookOutlined />}
                valueStyle={{ color: "#1890ff" }}
                loading={isLoading}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title={t("subjects.statistics.stagesWithSubjects")}
                value={stagesWithSubjects}
                prefix={<BankOutlined />}
                valueStyle={{ color: "#52c41a" }}
                loading={isLoading}
              />
            </Card>
          </Col>
        </Row>
        <Flex
          justify="space-between"
          align="center"
          className="mb-4"
          style={{ marginTop: "16px" }}
        >
          <Input
            placeholder={t("subjects.searchPlaceholder")}
            style={{ width: "200px" }}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            onClick={() => route("/subjects/add")}
            type="primary"
            icon={<PlusOutlined />}
          >
            {t("subjects.addSubject")}
          </Button>
        </Flex>
        <Divider />
        <SubjectsTable searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default Subjects;
