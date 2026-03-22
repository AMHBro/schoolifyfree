import React, { useState } from "react";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Divider, Flex, Input, Calendar, Card, Badge } from "antd";
import type { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import ExamsTable from "../views/exams/ExamsTable";
import { useNavigate } from "react-router-dom";
import { useExamsCalendarDates } from "../hooks/useAPI";

const Exams: React.FC = () => {
  const { t } = useTranslation();
  const route = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Dayjs | undefined>(
    undefined
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch exam dates with counts for calendar dots
  const { data: examDatesData } = useExamsCalendarDates();

  // Create a map for quick lookup of exam counts by date
  const examDatesMap = React.useMemo(() => {
    if (!examDatesData) return new Map();
    const map = new Map<string, number>();
    examDatesData.forEach(({ date, count }) => {
      map.set(date, count);
    });
    return map;
  }, [examDatesData]);

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    const examCount = examDatesMap.get(dateStr);

    if (examCount) {
      return (
        <div className="flex justify-center">
          <Badge
            count={examCount}
            size="small"
            style={{
              backgroundColor: "#ff4d4f",
              fontSize: "10px",
              minWidth: "16px",
              height: "16px",
              lineHeight: "16px",
            }}
          />
        </div>
      );
    }
    return null;
  };

  const onSelect = (date: Dayjs) => {
    // If the same date is clicked, clear the selection
    if (
      selectedDate &&
      selectedDate.format("YYYY-MM-DD") === date.format("YYYY-MM-DD")
    ) {
      setSelectedDate(undefined);
    } else {
      setSelectedDate(date);
      // Clear search when date is selected
      setSearchQuery("");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("exams.title")}</h1>
      <div className="grid gap-6">
        <Card title={t("exams.calendar.title")}>
          <Calendar
            fullscreen={false}
            onSelect={onSelect}
            cellRender={dateCellRender}
            value={selectedDate}
          />
          {selectedDate && (
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <p className="text-blue-700 font-medium">
                {t("exams.calendar.showingExamsFor", {
                  date: selectedDate.format("YYYY-MM-DD"),
                })}
                {examDatesMap.get(selectedDate.format("YYYY-MM-DD")) && (
                  <span className="ml-2 text-sm">
                    ({t("exams.calendar.examCount", {
                      count: examDatesMap.get(selectedDate.format("YYYY-MM-DD")),
                    })})
                  </span>
                )}
              </p>
              <Button
                size="small"
                onClick={() => setSelectedDate(undefined)}
                className="mt-2"
              >
                {t("exams.calendar.clearDateFilter")}
              </Button>
            </div>
          )}
        </Card>

        <Flex justify="space-between" align="center" className="mb-4">
          <Input
            placeholder={t("exams.searchPlaceholder")}
            style={{ width: "400px", marginTop: "16px" }}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Clear date selection when searching
              if (e.target.value.trim()) {
                setSelectedDate(undefined);
              }
            }}
          />
          <Button
            onClick={() => route("/exams/add")}
            type="primary"
            icon={<PlusOutlined />}
          >
            {t("exams.addExam")}
          </Button>
        </Flex>
        <Divider />
        <ExamsTable selectedDate={selectedDate} searchText={searchQuery} />
      </div>
    </div>
  );
};

export default Exams;
