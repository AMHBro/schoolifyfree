import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Tag, Space, Button, Select, message, Typography } from "antd";
import { requestsAPI } from "../services/api";

const { Title } = Typography;

const statusColors: Record<string, string> = {
  PENDING: "orange",
  IN_PROGRESS: "blue",
  RESOLVED: "green",
  REJECTED: "red",
};

const Requests: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["central-requests", { page: 1, limit: 20 }],
    queryFn: () => requestsAPI.getAll({ page: 1, limit: 20 }) as any,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      requestsAPI.updateStatus(id, status) as any,
    onSuccess: () => {
      message.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["central-requests"] });
    },
    onError: () => message.error("Failed to update status"),
  });

  const columns = [
    {
      title: "Teacher Phone",
      dataIndex: ["teacherPhone"],
      key: "teacherPhone",
    },
    {
      title: "School Code",
      dataIndex: ["schoolCode"],
      key: "schoolCode",
    },
    {
      title: "Type",
      dataIndex: ["type"],
      key: "type",
    },
    {
      title: "Status",
      dataIndex: ["status"],
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: ["createdAt"],
      key: "createdAt",
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Select
            size="small"
            style={{ width: 140 }}
            defaultValue={record.status}
            onChange={(val) =>
              updateStatus.mutate({ id: record.id, status: val })
            }
            options={[
              { value: "PENDING", label: "PENDING" },
              { value: "IN_PROGRESS", label: "IN_PROGRESS" },
              { value: "RESOLVED", label: "RESOLVED" },
              { value: "REJECTED", label: "REJECTED" },
            ]}
          />
        </Space>
      ),
    },
  ];

  const requests = (data as any)?.data?.requests || [];

  return (
    <div>
      <Title level={3}>Requests</Title>
      <Table
        scroll={{ x: "max-content" }}
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={requests}
        pagination={false}
      />
    </div>
  );
};

export default Requests;
