import React from "react";
import { Card, Select, Space, Typography, Button, Tag } from "antd";
import { ClearOutlined, FilterOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useStages, useTeachers } from "../../hooks/useAPI";
import type { SubjectFilters } from "../../types/api";

const { Text } = Typography;

interface SubjectsFiltersProps {
  filters: SubjectFilters;
  onFiltersChange: (filters: SubjectFilters) => void;
  onClearFilters: () => void;
}

const SubjectsFilters: React.FC<SubjectsFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const { t } = useTranslation();
  const { data: stages, isLoading: stagesLoading } = useStages();
  const { data: teachers, isLoading: teachersLoading } = useTeachers();

  const handleStageChange = (value: string) => {
    onFiltersChange({
      ...filters,
      stageId: value || undefined,
    });
  };

  const handleTeacherStatusChange = (value: string) => {
    let hasTeachers: boolean | undefined = undefined;
    if (value === "true") hasTeachers = true;
    else if (value === "false") hasTeachers = false;

    onFiltersChange({
      ...filters,
      hasTeachers,
    });
  };

  const handleTeacherChange = (value: string) => {
    onFiltersChange({
      ...filters,
      teacherId: value || undefined,
    });
  };

  const hasActiveFilters =
    filters.stageId || filters.hasTeachers !== undefined || filters.teacherId;
  const activeFilterCount =
    (filters.stageId ? 1 : 0) +
    (filters.hasTeachers !== undefined ? 1 : 0) +
    (filters.teacherId ? 1 : 0);

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FilterOutlined />
          <Text strong>{t("subjects.filters.title")}:</Text>
          {hasActiveFilters && (
            <Tag color="blue" style={{ margin: 0 }}>
              {t("subjects.filters.activeFilters", { count: activeFilterCount })}
            </Tag>
          )}
        </div>

        <Space>
          <div>
            <Text style={{ fontSize: "12px", color: "#666" }}>
              {t("subjects.filters.stage")}:
            </Text>
            <Select
              placeholder={t("subjects.filters.allStages")}
              style={{ width: 150, marginLeft: 8 }}
              allowClear
              loading={stagesLoading}
              value={filters.stageId}
              onChange={handleStageChange}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={[
                { value: "", label: t("subjects.filters.allStages") },
                ...(stages?.map((stage) => ({
                  value: stage.id,
                  label: stage.name,
                })) || []),
              ]}
            />
          </div>

          <div>
            <Text style={{ fontSize: "12px", color: "#666" }}>
              {t("subjects.filters.teacherAssignment")}:
            </Text>
            <Select
              placeholder={t("subjects.filters.allSubjects")}
              style={{ width: 180, marginLeft: 8 }}
              allowClear
              value={
                filters.hasTeachers === true
                  ? "true"
                  : filters.hasTeachers === false
                  ? "false"
                  : undefined
              }
              onChange={handleTeacherStatusChange}
              options={[
                { value: "", label: t("subjects.filters.allSubjects") },
                { value: "true", label: t("subjects.filters.withTeachers") },
                { value: "false", label: t("subjects.filters.withoutTeachers") },
              ]}
            />
          </div>

          <div>
            <Text style={{ fontSize: "12px", color: "#666" }}>
              {t("subjects.filters.teacher")}:
            </Text>
            <Select
              placeholder={t("subjects.filters.allTeachers")}
              style={{ width: 200, marginLeft: 8 }}
              allowClear
              loading={teachersLoading}
              value={filters.teacherId}
              onChange={handleTeacherChange}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={[
                { value: "", label: t("subjects.filters.allTeachers") },
                ...(teachers?.map((teacher) => ({
                  value: teacher.id,
                  label: teacher.name,
                })) || []),
              ]}
            />
          </div>

          {hasActiveFilters && (
            <Button
              type="link"
              icon={<ClearOutlined />}
              onClick={onClearFilters}
              style={{ padding: "4px 8px" }}
            >
              {t("subjects.filters.clearFilters")}
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );
};

export default SubjectsFilters;
