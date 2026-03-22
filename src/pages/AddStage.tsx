import React, { useState } from "react";
import { Form, Input, Button, Card, message, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOutlined } from "@ant-design/icons";
import { useCreateStage } from "../hooks/useAPI";
import type { CreateStageRequest } from "../types/api";

const AddStage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string>("");

  // React Query hook
  const createStageMutation = useCreateStage();

  const onFinish = async (values: any) => {
    try {
      setErrorMessage(""); // Clear any previous errors

      const stageData: CreateStageRequest = {
        name: values.name,
      };

      await createStageMutation.mutateAsync(stageData);
      message.success(t("stages.add.messages.addSuccess"));
      navigate("/stages");
    } catch (error: any) {
      console.error("Error creating stage:", error);

      // Handle specific error responses from backend
      if (error?.response?.status === 409) {
        const errorData = error.response.data;
        if (errorData?.error === "STAGE_NAME_EXISTS") {
          setErrorMessage(errorData.message);
          form.setFields([
            {
              name: "name",
              errors: [errorData.message],
            },
          ]);
        } else {
          setErrorMessage(t("stages.messages.stageNameExists"));
        }
      } else {
        setErrorMessage(t("stages.add.messages.addFailed"));
        message.error(t("stages.add.messages.addFailed"));
      }
    }
  };

  const onNameChange = () => {
    // Clear error message when user starts typing
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
      <h1 className="text-3xl font-bold mb-6">{t("stages.add.title")}</h1>
      <Card>
        {errorMessage && (
          <Alert
            message={t("stages.add.errors.validationError")}
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
          disabled={createStageMutation.isPending}
        >
          <Form.Item
            name="name"
            label={t("stages.add.form.stageNameLabel")}
            rules={[
              { required: true, message: t("stages.add.form.stageNameRequired") },
              { min: 2, message: t("stages.add.form.stageNameMinLength") },
              { max: 50, message: t("stages.add.form.stageNameMaxLength") },
              {
                whitespace: true,
                message: t("stages.add.form.stageNameWhitespace"),
              },
            ]}
          >
            <Input
              prefix={<BookOutlined />}
              placeholder={t("stages.add.form.stageNamePlaceholder")}
              onChange={onNameChange}
            />
          </Form.Item>

          <Form.Item>
            <div className="flex gap-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={createStageMutation.isPending}
              >
                {t("stages.add.buttons.addStage")}
              </Button>
              <Button onClick={() => navigate("/stages")}>
                {t("stages.add.buttons.cancel")}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddStage;
