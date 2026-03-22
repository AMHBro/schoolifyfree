import { PlusOutlined, SearchOutlined, TeamOutlined } from "@ant-design/icons";
import { Button, Divider, Flex, Input, Card, Row, Col, Statistic } from "antd";
import React, { useState } from "react";
import TeachersTable from "../views/teachers/TeachersTable";
import { useNavigate } from "react-router-dom";
import { useTeachers } from "../hooks/useAPI";
import { useTranslation } from "react-i18next";

const Teachers: React.FC = () => {
  const route = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: teachers, isLoading } = useTeachers();
  const { t } = useTranslation();

  const teacherCount = teachers?.length || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("teachers.title")}</h1>
      <div className="grid gap-6">
        <Row gutter={16} className="mb-8">
          <Col span={12}>
            <Card>
              <Statistic
                title={t("teachers.totalTeachers")}
                value={teacherCount}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#1890ff" }}
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
            placeholder={t("teachers.searchPlaceholder")}
            style={{ width: "200px" }}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            onClick={() => route("/teachers/add")}
            type="primary"
            icon={<PlusOutlined />}
          >
            {t("teachers.addTeacher")}
          </Button>
        </Flex>
        <Divider />
        <TeachersTable searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default Teachers;
