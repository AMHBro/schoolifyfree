import React from "react";
import {
  Card,
  Select,
  Space,
  Typography,
  Button,
  Tag,
  InputNumber,
} from "antd";
import { ClearOutlined, FilterOutlined } from "@ant-design/icons";
import { useStages } from "../../hooks/useAPI";
import type { StudentFilters } from "../../types/api";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface StudentsFiltersProps {
  filters: StudentFilters;
  onFiltersChange: (filters: StudentFilters) => void;
  onClearFilters: () => void;
}

const StudentsFilters: React.FC<StudentsFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const { data: stages, isLoading: stagesLoading } = useStages();
  const { t } = useTranslation();

  const handleStageChange = (value: string) => {
    onFiltersChange({
      ...filters,
      stageId: value || undefined,
    });
  };

  const handleGenderChange = (value: "male" | "female" | string) => {
    onFiltersChange({
      ...filters,
      gender:
        value && (value === "male" || value === "female") ? value : undefined,
    });
  };

  const handleMinAgeChange = (value: number | null) => {
    onFiltersChange({
      ...filters,
      minAge: value || undefined,
    });
  };

  const handleMaxAgeChange = (value: number | null) => {
    onFiltersChange({
      ...filters,
      maxAge: value || undefined,
    });
  };

  const handleActivationKeyStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      activationKeyStatus:
        value === "all"
          ? undefined
          : (value as "active" | "used" | "expired" | "no-key"),
    });
  };

  const hasActiveFilters =
    filters.stageId ||
    filters.gender ||
    filters.minAge !== undefined ||
    filters.maxAge !== undefined ||
    filters.activationKeyStatus;

  const activeFilterCount =
    (filters.stageId ? 1 : 0) +
    (filters.gender ? 1 : 0) +
    (filters.minAge !== undefined ? 1 : 0) +
    (filters.maxAge !== undefined ? 1 : 0) +
    (filters.activationKeyStatus ? 1 : 0);

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
          <Text strong>{t("students.filters.title")}:</Text>
          {hasActiveFilters && (
            <Tag color="blue" style={{ margin: 0 }}>
              {t("students.filters.activeFilters", {
                count: activeFilterCount,
              })}
            </Tag>
          )}
        </div>

        <Space wrap>
          <div>
            <Text style={{ fontSize: "12px", color: "#666" }}>
              {t("students.filters.stage")}:
            </Text>
            <Select
              placeholder={t("students.filters.allStages")}
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
                { value: "", label: t("students.filters.allStages") },
                ...(stages?.map((stage) => ({
                  value: stage.id,
                  label: stage.name,
                })) || []),
              ]}
            />
          </div>

          <div>
            <Text style={{ fontSize: "12px", color: "#666" }}>
              {t("students.filters.gender")}:
            </Text>
            <Select
              placeholder={t("students.filters.allGenders")}
              style={{ width: 150, marginLeft: 8 }}
              allowClear
              value={filters.gender}
              onChange={handleGenderChange}
              options={[
                { value: "", label: t("students.filters.allGenders") },
                { value: "male", label: t("students.filters.male") },
                { value: "female", label: t("students.filters.female") },
              ]}
            />
          </div>

          <div>
            <Text style={{ fontSize: "12px", color: "#666" }}>
              {t("students.filters.ageRange")}:
            </Text>
            <Space.Compact style={{ marginLeft: 8 }}>
              <InputNumber
                placeholder={t("students.filters.minAge")}
                min={1}
                max={100}
                value={filters.minAge}
                onChange={handleMinAgeChange}
                style={{ width: 80 }}
              />
              <InputNumber
                placeholder={t("students.filters.maxAge")}
                min={1}
                max={100}
                value={filters.maxAge}
                onChange={handleMaxAgeChange}
                style={{ width: 80 }}
              />
            </Space.Compact>
          </div>

          <div>
            <Text style={{ fontSize: "12px", color: "#666" }}>
              {t("students.filters.keyStatus")}:
            </Text>
            <Select
              placeholder={t("students.filters.allStatuses")}
              style={{ width: 150, marginLeft: 8 }}
              allowClear
              value={filters.activationKeyStatus}
              onChange={handleActivationKeyStatusChange}
              options={[
                { value: "", label: t("students.filters.allStatuses") },
                { value: "active", label: t("students.table.active") },
                { value: "used", label: t("students.table.used") },
                { value: "expired", label: t("students.table.expired") },
                { value: "no-key", label: t("students.table.noKey") },
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
              {t("students.filters.clearFilters")}
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );
};

export default StudentsFilters;
