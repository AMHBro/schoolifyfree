import React from "react";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Card,
  message,
  Spin,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined,
  PhoneOutlined,
  LockOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { useCreateTeacher, useStages, useSubjects } from "../hooks/useAPI";
import type { CreateTeacherRequest } from "../types/api";
import { useTranslation } from "react-i18next";

const { Option } = Select;

interface AddTeacherFormValues {
  name: string;
  age: number;
  birthdate?: dayjs.Dayjs;
  gender?: "male" | "female";
  phone: string;
  stages: string[];
  subjects: string[];
  password: string;
}

const AddTeacher: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { t } = useTranslation();

  // React Query hooks
  const createTeacherMutation = useCreateTeacher();
  const { data: stages, isLoading: stagesLoading } = useStages();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();

  // Disable future dates for birthdate
  const disabledDate: RangePickerProps["disabledDate"] = (current) => {
    return current && current > dayjs().endOf("day");
  };

  // Generate random password with 8 capital letters and numbers
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Handle password generation
  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    form.setFieldsValue({
      password: newPassword,
    });
    message.success(t("teachers.add.messages.passwordGenerated"));
  };

  const onFinish = async (values: AddTeacherFormValues) => {
    try {
      const teacherData: CreateTeacherRequest = {
        name: values.name,
        age: values.age,
        phoneNumber: values.phone,
        gender: values.gender,
        birthdate: values.birthdate
          ? values.birthdate.toISOString()
          : undefined,
        password: values.password,
        stageIds: values.stages || [],
        subjectIds: values.subjects || [],
      };

      await createTeacherMutation.mutateAsync(teacherData);
      message.success(t("teachers.add.messages.addSuccess"));
      navigate("/teachers");
    } catch (error) {
      console.error("Error creating teacher:", error);
      message.error(t("teachers.add.messages.addFailed"));
    }
  };

  const isLoading =
    stagesLoading || subjectsLoading || createTeacherMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("teachers.add.title")}</h1>
      <Card>
        <Spin spinning={isLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="max-w-2xl"
            disabled={createTeacherMutation.isPending}
          >
            <Form.Item
              name="name"
              label={t("teachers.add.form.nameLabel")}
              rules={[
                {
                  required: true,
                  message: t("teachers.add.form.nameRequired"),
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t("teachers.add.form.namePlaceholder")}
              />
            </Form.Item>

            <Form.Item
              name="age"
              label={t("teachers.add.form.ageLabel")}
              rules={[
                {
                  required: true,
                  message: t("teachers.add.form.ageRequired"),
                },
                {
                  type: "number",
                  min: 18,
                  max: 80,
                  message: t("teachers.add.form.ageValidation"),
                },
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.reject(
                        new Error(t("teachers.add.form.ageRequired"))
                      );
                    }
                    if (value < 18 || value > 80) {
                      return Promise.reject(
                        new Error(t("teachers.add.form.ageValidation"))
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={18}
                max={80}
                placeholder={t("teachers.add.form.agePlaceholder")}
                precision={0}
              />
            </Form.Item>

            <Form.Item
              name="birthdate"
              label={t("teachers.add.form.birthdateLabel")}
            >
              <DatePicker
                disabledDate={disabledDate}
                style={{ width: "100%" }}
                placeholder={t("teachers.add.form.birthdatePlaceholder")}
              />
            </Form.Item>

            <Form.Item name="gender" label={t("teachers.add.form.genderLabel")}>
              <Select
                placeholder={t("teachers.add.form.genderPlaceholder")}
                allowClear
              >
                <Option value="male">{t("teachers.add.gender.male")}</Option>
                <Option value="female">
                  {t("teachers.add.gender.female")}
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="phone"
              label={t("teachers.add.form.phoneLabel")}
              rules={[
                {
                  required: true,
                  message: t("teachers.add.form.phoneRequired"),
                },
                {
                  pattern: /^[+]?[1-9][\d]{0,15}$/,
                  message: t("teachers.add.form.phoneValidation"),
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder={t("teachers.add.form.phonePlaceholder")}
              />
            </Form.Item>

            <Form.Item
              name="stages"
              label={t("teachers.add.form.stagesLabel")}
              rules={[
                {
                  required: true,
                  message: t("teachers.add.form.stagesRequired"),
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder={t("teachers.add.form.stagesPlaceholder")}
                loading={stagesLoading}
              >
                {stages?.map((stage) => (
                  <Option key={stage.id} value={stage.id}>
                    {stage.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="subjects"
              label={t("teachers.add.form.subjectsLabel")}
              rules={[
                {
                  required: true,
                  message: t("teachers.add.form.subjectsRequired"),
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder={t("teachers.add.form.subjectsPlaceholder")}
                loading={subjectsLoading}
              >
                {subjects?.map((subject) => (
                  <Option key={subject.id} value={subject.id}>
                    {subject.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="password"
              label={t("teachers.add.form.passwordLabel")}
              rules={[
                {
                  required: true,
                  message: t("teachers.add.form.passwordRequired"),
                },
                { min: 8, message: t("teachers.add.form.passwordMinLength") },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t("teachers.add.form.passwordPlaceholder")}
                addonAfter={
                  <Button
                    type="link"
                    onClick={handleGeneratePassword}
                    icon={<ReloadOutlined />}
                    style={{ padding: "0 8px", height: "auto" }}
                  >
                    {t("teachers.add.form.generatePassword")}
                  </Button>
                }
              />
            </Form.Item>

            <Form.Item>
              <div className="flex gap-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createTeacherMutation.isPending}
                >
                  {t("teachers.add.buttons.addTeacher")}
                </Button>
                <Button onClick={() => navigate("/teachers")}>
                  {t("teachers.add.buttons.cancel")}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default AddTeacher;
