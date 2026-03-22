import React, { useState } from "react";
import { Form, Input, Button, Card, message, Select, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOutlined } from "@ant-design/icons";
import { useCreateSubject, useStages } from "../hooks/useAPI";
import type { CreateSubjectRequest } from "../types/api";

const AddSubject: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string>("");

  // React Query hooks
  const createSubjectMutation = useCreateSubject();
  const { data: stages, isLoading: stagesLoading } = useStages();

  const onFinish = async (values: any) => {
    try {
      setErrorMessage(""); // Clear any previous errors

      const subjectData: CreateSubjectRequest = {
        name: values.name,
        stageId: values.stageId,
      };

      await createSubjectMutation.mutateAsync(subjectData);
      message.success(t("subjects.add.messages.addSuccess"));
      navigate("/subjects");
    } catch (error: any) {
      console.error("Error creating subject:", error);

      // Handle specific error responses from backend
      if (error?.response?.status === 409) {
        const errorData = error.response.data;
        if (errorData?.error === "SUBJECT_NAME_EXISTS") {
          setErrorMessage(errorData.message);
          form.setFields([
            {
              name: "name",
              errors: [errorData.message],
            },
          ]);
        } else {
          setErrorMessage(t("subjects.messages.subjectNameExists"));
        }
      } else {
        setErrorMessage(t("subjects.add.messages.addFailed"));
        message.error(t("subjects.add.messages.addFailed"));
      }
    }
  };

  const onFieldChange = () => {
    // Clear error message when user starts typing or changes stage
    if (errorMessage) {
      setErrorMessage("");
      form.setFields([
        {
          name: "name",
          errors: [],
        },
      ]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("subjects.add.title")}</h1>
      <Card>
        {errorMessage && (
          <Alert
            message={t("subjects.add.errors.validationError")}
            description={errorMessage}
            type="error"
            showIcon
            className="mb-4"
          />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="max-w-2xl"
          disabled={createSubjectMutation.isPending}
        >
          <Form.Item
            name="name"
            label={t("subjects.add.form.subjectNameLabel")}
            rules={[
              { required: true, message: t("subjects.add.form.subjectNameRequired") },
              { min: 2, message: t("subjects.add.form.subjectNameMinLength") },
              {
                max: 50,
                message: t("subjects.add.form.subjectNameMaxLength"),
              },
              {
                whitespace: true,
                message: t("subjects.add.form.subjectNameWhitespace"),
              },
            ]}
          >
            <Input
              prefix={<BookOutlined />}
              placeholder={t("subjects.add.form.subjectNamePlaceholder")}
              onChange={onFieldChange}
            />
          </Form.Item>

          <Form.Item
            name="stageId"
            label={t("subjects.add.form.stageLabel")}
            rules={[{ required: true, message: t("subjects.add.form.stageRequired") }]}
          >
            <Select
              placeholder={t("subjects.add.form.stagePlaceholder")}
              loading={stagesLoading}
              showSearch
              onChange={onFieldChange}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={stages?.map((stage) => ({
                value: stage.id,
                label: stage.name,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <div className="flex gap-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={createSubjectMutation.isPending}
              >
                {t("subjects.add.buttons.addSubject")}
              </Button>
              <Button onClick={() => navigate("/subjects")}>
                {t("subjects.add.buttons.cancel")}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddSubject;
