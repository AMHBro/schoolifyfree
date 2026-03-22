import React from "react";
import {
  Form,
  Input,
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
import {
  useCreateStudent,
  useStages,
  useAvailableActivationKeys,
} from "../hooks/useAPI";
import type { CreateStudentRequest } from "../types/api";
import { useTranslation } from "react-i18next";

const { Option } = Select;

interface AddStudentFormValues {
  name1: string;
  name2: string;
  name3: string;
  name4: string;
  birthdate: dayjs.Dayjs;
  gender: "male" | "female";
  phone: string;
  password: string;
  confirmPassword: string;
  stage: string;
  activationKey: string;
}

interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const AddStudent: React.FC = () => {
  console.log("📍 AddStudent component mounted");

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { t } = useTranslation();

  // React Query hooks
  const createStudentMutation = useCreateStudent();
  const { data: stages, isLoading: stagesLoading } = useStages();
  const { data: activationKeysData, isLoading: activationKeysLoading } =
    useAvailableActivationKeys();

  console.log("🔍 Hook states:", {
    isPending: createStudentMutation.isPending,
    stagesLoading,
    activationKeysLoading,
    stagesCount: stages?.length || 0,
    activationKeysCount: activationKeysData?.keys?.length || 0,
  });

  // Disable future dates for birthdate
  const disabledDate: RangePickerProps["disabledDate"] = (current) => {
    return current && current > dayjs().endOf("day");
  };

  // Generate random student code with timestamp to reduce collisions
  const generateStudentCode = () => {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `STU${timestamp}${random}`;
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
      confirmPassword: newPassword,
    });
    message.success(t("students.add.messages.passwordGenerated"));
  };

  const onFinish = async (values: AddStudentFormValues) => {
    console.log("🚀 onFinish called with values:", values);

    try {
      // Validate required fields
      if (
        !values.name1?.trim() ||
        !values.name2?.trim() ||
        !values.name3?.trim() ||
        !values.name4?.trim()
      ) {
        console.log("❌ Name validation failed");
        message.error(t("students.add.messages.nameFieldsRequired"));
        return;
      }

      if (!values.birthdate) {
        console.log("❌ Birthdate validation failed");
        message.error(t("students.add.messages.birthdateRequired"));
        return;
      }

      if (!values.stage) {
        console.log("❌ Stage validation failed");
        message.error(t("students.add.messages.stageRequired"));
        return;
      }

      if (!values.activationKey) {
        console.log("❌ Activation key validation failed");
        message.error(t("students.add.messages.activationKeyRequired"));
        return;
      }

      // Calculate age from birthdate (DatePicker returns dayjs object)
      console.log("🔍 Raw birthdate value:", values.birthdate);
      console.log("🔍 Birthdate type:", typeof values.birthdate);
      console.log("🔍 Is dayjs object:", dayjs.isDayjs(values.birthdate));

      // DatePicker returns a dayjs object directly, no need to parse again
      const birthDate = dayjs.isDayjs(values.birthdate)
        ? values.birthdate
        : dayjs(values.birthdate);

      const today = dayjs();
      const age = today.diff(birthDate, "year");

      console.log("📅 Age calculation details:", {
        rawBirthdate: values.birthdate,
        birthdateType: typeof values.birthdate,
        birthDateParsed: birthDate.format("YYYY-MM-DD"),
        birthDateValid: birthDate.isValid(),
        today: today.format("YYYY-MM-DD"),
        calculatedAge: age,
        diffInDays: today.diff(birthDate, "day"),
        diffInMonths: today.diff(birthDate, "month"),
      });

      // Validate age (temporarily less strict for debugging)
      if (age < 0 || age > 100) {
        console.log("❌ Age validation failed:", age);
        message.error(t("students.add.messages.invalidAge", { age }));
        return;
      }

      // Warning for unusual ages but don't block
      if (age < 5 || age > 25) {
        console.warn("⚠️ Unusual age detected:", age);
        message.warning(t("students.add.messages.unusualAge", { age }));
      }

      const fullName = `${values.name1.trim()} ${values.name2.trim()} ${values.name3.trim()} ${values.name4.trim()}`;
      const studentCode = generateStudentCode();

      const studentData: CreateStudentRequest = {
        name: fullName,
        age: age,
        gender: values.gender,
        phoneNumber: values.phone,
        code: studentCode,
        password: values.password,
        stageId: values.stage,
        activationKeyId: values.activationKey,
      };

      console.log(
        "✅ All validations passed. Creating student with data:",
        studentData
      );

      console.log("🚀 About to call createStudentMutation.mutateAsync...");

      try {
        const mutationResult = await createStudentMutation.mutateAsync(
          studentData
        );
        console.log(
          "✅ createStudentMutation.mutateAsync completed successfully:",
          mutationResult
        );
      } catch (mutationError) {
        console.error("❌ Mutation error:", mutationError);
        throw mutationError; // Re-throw to be caught by outer catch
      }

      // Enhanced success notification
      message.success({
        content: t("students.add.messages.addSuccess", {
          name: fullName,
          code: studentCode,
        }),
        duration: 5,
        style: {
          marginTop: "10px",
        },
      });

      navigate("/students");
    } catch (error: unknown) {
      console.error("Error creating student:", error);

      // More specific error handling
      let errorMessage = t("students.add.messages.addFailed", {
        message: "Failed to add student. Please try again.",
      });

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.data?.message) {
          errorMessage = t("students.add.messages.addFailed", {
            message: axiosError.response.data.message,
          });
        }
      } else if (error && typeof error === "object" && "message" in error) {
        const errorWithMessage = error as { message: string };
        errorMessage = t("students.add.messages.addFailed", {
          message: errorWithMessage.message,
        });
      }

      // Enhanced error notification
      message.error({
        content: errorMessage,
        duration: 6,
        style: {
          marginTop: "10px",
        },
      });
    }
  };

  const isLoading =
    stagesLoading || activationKeysLoading || createStudentMutation.isPending;
  const activationKeys = activationKeysData?.keys || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("students.add.title")}</h1>
      <Card>
        <Spin spinning={isLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={(errorInfo) => {
              console.log("❌ Form validation failed:", errorInfo);
              message.error(t("students.add.messages.formValidationFailed"));
            }}
            className="max-w-2xl"
            initialValues={{ gender: "male" }}
            disabled={createStudentMutation.isPending}
          >
            <Form.Item
              name="name1"
              label={t("students.add.form.firstNameLabel")}
              rules={[
                {
                  required: true,
                  message: t("students.add.form.firstNameRequired"),
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t("students.add.form.firstNamePlaceholder")}
              />
            </Form.Item>

            <Form.Item
              name="name2"
              label={t("students.add.form.secondNameLabel")}
              rules={[
                {
                  required: true,
                  message: t("students.add.form.secondNameRequired"),
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t("students.add.form.secondNamePlaceholder")}
              />
            </Form.Item>

            <Form.Item
              name="name3"
              label={t("students.add.form.thirdNameLabel")}
              rules={[
                {
                  required: true,
                  message: t("students.add.form.thirdNameRequired"),
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t("students.add.form.thirdNamePlaceholder")}
              />
            </Form.Item>

            <Form.Item
              name="name4"
              label={t("students.add.form.fourthNameLabel")}
              rules={[
                {
                  required: true,
                  message: t("students.add.form.fourthNameRequired"),
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t("students.add.form.fourthNamePlaceholder")}
              />
            </Form.Item>

            <Form.Item
              name="birthdate"
              label={t("students.add.form.birthdateLabel")}
              rules={[
                {
                  required: true,
                  message: t("students.add.form.birthdateRequired"),
                },
              ]}
            >
              <DatePicker
                disabledDate={disabledDate}
                style={{ width: "100%" }}
                placeholder={t("students.add.form.birthdatePlaceholder")}
              />
            </Form.Item>

            <Form.Item
              name="gender"
              label={t("students.add.form.genderLabel")}
              rules={[
                {
                  required: true,
                  message: t("students.add.form.genderRequired"),
                },
              ]}
            >
              <Select placeholder={t("students.add.form.genderPlaceholder")}>
                <Option value="male">{t("students.add.gender.male")}</Option>
                <Option value="female">
                  {t("students.add.gender.female")}
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="phone"
              label={t("students.add.form.phoneLabel")}
              rules={[
                {
                  required: true,
                  message: t("students.add.form.phoneRequired"),
                },
                {
                  pattern: /^[+]?[1-9][\d]{0,15}$/,
                  message: t("students.add.form.phoneValidation"),
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder={t("students.add.form.phonePlaceholder")}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={t("students.add.form.passwordLabel")}
              rules={[
                {
                  required: true,
                  message: t("students.add.form.passwordRequired"),
                },
                { min: 8, message: t("students.add.form.passwordMinLength") },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t("students.add.form.passwordPlaceholder")}
                addonAfter={
                  <Button
                    type="link"
                    onClick={handleGeneratePassword}
                    icon={<ReloadOutlined />}
                    style={{ padding: "0 8px", height: "auto" }}
                  >
                    {t("students.add.form.generatePassword")}
                  </Button>
                }
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={t("students.add.form.confirmPasswordLabel")}
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: t("students.add.form.confirmPasswordRequired"),
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(t("students.add.form.passwordMismatch"))
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t("students.add.form.confirmPasswordPlaceholder")}
              />
            </Form.Item>

            <Form.Item
              name="stage"
              label={t("students.add.form.stageLabel")}
              rules={[
                {
                  required: true,
                  message: t("students.add.form.stageRequired"),
                },
              ]}
            >
              <Select
                placeholder={t("students.add.form.stagePlaceholder")}
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
              name="activationKey"
              label={t("students.add.form.activationKeyLabel")}
              rules={[
                {
                  required: true,
                  message: t("students.add.form.activationKeyRequired"),
                },
              ]}
              help={
                activationKeys.length === 0
                  ? t("students.add.form.noActivationKeys")
                  : t("students.add.form.activationKeyHelp")
              }
            >
              <Select
                placeholder={t("students.add.form.activationKeyPlaceholder")}
                loading={activationKeysLoading}
                disabled={activationKeys.length === 0}
                showSearch
                filterOption={(input, option) =>
                  option?.children
                    ?.toString()
                    ?.toLowerCase()
                    .includes(input.toLowerCase()) || false
                }
              >
                {activationKeys.map((key) => (
                  <Option key={key.id} value={key.id}>
                    {key.key} ({t("students.activationKey.expires")}:{" "}
                    {new Date(key.expiresAt).toLocaleDateString()})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <div className="flex gap-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createStudentMutation.isPending}
                  disabled={activationKeys.length === 0}
                  onClick={() => console.log("🔘 Add Student button clicked!")}
                >
                  {t("students.add.buttons.addStudent")}
                </Button>
                <Button onClick={() => navigate("/students")}>
                  {t("students.add.buttons.cancel")}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default AddStudent;
