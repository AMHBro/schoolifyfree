import React from "react";
import {
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Card,
  message,
  Space,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useCreateExam,
  useTeachers,
  useSubjects,
  useStages,
} from "../../hooks/useAPI";
import type { CreateExamRequest } from "../../types/api";

const AddExam: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Data fetching hooks
  const { data: teachers } = useTeachers();
  const { data: subjects } = useSubjects();
  const { data: stages } = useStages();

  // Mutation hook
  const createExamMutation = useCreateExam();

  const handleSubmit = async (values: any) => {
    try {
      const examData: CreateExamRequest = {
        title: values.title,
        description: values.description,
        examDate: values.examDate.toISOString(),
        classNumber: values.classNumber,
        stageId: values.stageId,
        subjectId: values.subjectId,
        teacherId: values.teacherId,
      };

      await createExamMutation.mutateAsync(examData);
      message.success(t("exams.add.messages.createSuccess"));
      navigate("/exams");
    } catch (error) {
      message.error(t("exams.add.messages.createFailed"));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("exams.add.title")}</h1>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            label={t("exams.add.form.examTitleLabel")}
            name="title"
            rules={[{ required: true, message: t("exams.add.form.examTitleRequired") }]}
          >
            <Input placeholder={t("exams.add.form.examTitlePlaceholder")} />
          </Form.Item>

          <Form.Item label={t("exams.add.form.descriptionLabel")} name="description">
            <Input.TextArea
              rows={3}
              placeholder={t("exams.add.form.descriptionPlaceholder")}
            />
          </Form.Item>

          <Form.Item
            label={t("exams.add.form.examDateLabel")}
            name="examDate"
            rules={[
              { required: true, message: t("exams.add.form.examDateRequired") },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
              placeholder={t("exams.add.form.examDatePlaceholder")}
            />
          </Form.Item>

          <Form.Item
            label={t("exams.add.form.classLabel")}
            name="classNumber"
            rules={[{ required: true, message: t("exams.add.form.classRequired") }]}
          >
            <Input placeholder={t("exams.add.form.classPlaceholder")} />
          </Form.Item>

          <Form.Item
            label={t("exams.add.form.stageLabel")}
            name="stageId"
            rules={[{ required: true, message: t("exams.add.form.stageRequired") }]}
          >
            <Select placeholder={t("exams.add.form.stagePlaceholder")}>
              {stages?.map((stage) => (
                <Select.Option key={stage.id} value={stage.id}>
                  {stage.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t("exams.add.form.subjectLabel")}
            name="subjectId"
            rules={[{ required: true, message: t("exams.add.form.subjectRequired") }]}
          >
            <Select placeholder={t("exams.add.form.subjectPlaceholder")}>
              {subjects?.map((subject) => (
                <Select.Option key={subject.id} value={subject.id}>
                  {subject.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={t("exams.add.form.teacherLabel")}
            name="teacherId"
            rules={[{ required: true, message: t("exams.add.form.teacherRequired") }]}
          >
            <Select placeholder={t("exams.add.form.teacherPlaceholder")}>
              {teachers?.map((teacher) => (
                <Select.Option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createExamMutation.isPending}
                size="large"
              >
                {t("exams.add.buttons.createExam")}
              </Button>
              <Button size="large" onClick={() => navigate("/exams")}>
                {t("exams.add.buttons.cancel")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddExam;
