import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Spin,
  Empty,
  Avatar,
  Tag,
  Space,
  Pagination,
  Button,
  Badge,
  Modal,
  List,
  Divider,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  HeartOutlined,
  MessageOutlined,
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  HeartFilled,
  EyeOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { postsAPI, stagesAPI, teachersAPI } from "../services/api";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Post {
  id: string;
  title: string;
  content: string;
  stage: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
  };
  likesCount: number;
  commentsCount: number;
  likes: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      type: string;
    } | null;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
      type: string;
    } | null;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface PostsResponse {
  data: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const Posts: React.FC = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [teacherFilter, setTeacherFilter] = useState<string>("");
  const [stages, setStages] = useState<Array<{ id: string; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>(
    []
  );

  // Modal state for comments
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Modal state for delete confirmation
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = async (page = 1) => {
    setLoading(true);
    try {
      console.log("🔄 Fetching posts...", {
        page,
        limit: pagination.limit,
        search,
        stageFilter,
        teacherFilter,
      });

      const response = await postsAPI.getAll({
        page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(stageFilter && { stageId: stageFilter }),
        ...(teacherFilter && { teacherId: teacherFilter }),
      });

      console.log("✅ Posts fetched successfully:", response);

      setPosts(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      });
    } catch (error) {
      console.error(t("posts.errors.fetchPostsFailed"), error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const response = await stagesAPI.getAll();
      setStages(response);
    } catch (error) {
      console.error(t("posts.errors.fetchStagesFailed"), error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await teachersAPI.getAll();
      setTeachers(
        response.map((teacher: any) => ({ id: teacher.id, name: teacher.name }))
      );
    } catch (error) {
      console.error(t("posts.errors.fetchTeachersFailed"), error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchStages();
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [search, stageFilter, teacherFilter]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleStageFilter = (value: string) => {
    setStageFilter(value);
  };

  const handleTeacherFilter = (value: string) => {
    setTeacherFilter(value);
  };

  const clearFilters = () => {
    setSearch("");
    setStageFilter("");
    setTeacherFilter("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return t("posts.post.timeAgo.minutesAgo", { minutes: diffInMinutes });
    } else if (diffInHours < 24) {
      return t("posts.post.timeAgo.hoursAgo", { hours: Math.floor(diffInHours) });
    } else if (diffInDays < 7) {
      return t("posts.post.timeAgo.daysAgo", { days: Math.floor(diffInDays) });
    } else {
      return formatDate(dateString);
    }
  };

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const showCommentsModal = (post: Post) => {
    setSelectedPost(post);
    setIsCommentsModalVisible(true);
  };

  const hideCommentsModal = () => {
    setIsCommentsModalVisible(false);
    setSelectedPost(null);
  };

  const showDeleteConfirmation = (post: Post) => {
    setPostToDelete(post);
    setIsDeleteModalVisible(true);
  };

  const hideDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setPostToDelete(null);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      const response = await postsAPI.delete(postToDelete.id);
      
      if (response.success) {
        // Show success message
        Modal.success({
          title: t("posts.delete.success"),
          content: t("posts.delete.successMessage"),
        });
        
        // Refresh the posts list
        await fetchPosts(pagination.page);
        
        // Close the delete modal
        hideDeleteModal();
      } else {
        // Show error message
        Modal.error({
          title: t("posts.delete.error"),
          content: response.message || t("posts.delete.errorMessage"),
        });
      }
    } catch (error) {
      console.error("Delete post error:", error);
      Modal.error({
        title: t("posts.delete.error"),
        content: t("posts.delete.errorMessage"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
          📝 {t("posts.title")}
        </Title>
        <Text type="secondary">
          {t("posts.subtitle")}
        </Text>
      </div>

      {/* Search and Filters */}
      <Card style={{ marginBottom: "24px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder={t("posts.search.placeholder")}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder={t("posts.filters.stage")}
              style={{ width: "100%" }}
              value={stageFilter || undefined}
              onChange={handleStageFilter}
              allowClear
            >
              {stages.map((stage) => (
                <Option key={stage.id} value={stage.id}>
                  {stage.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              placeholder={t("posts.filters.teacher")}
              style={{ width: "100%" }}
              value={teacherFilter || undefined}
              onChange={handleTeacherFilter}
              allowClear
            >
              {teachers.map((teacher) => (
                <Option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Button onClick={clearFilters}>{t("posts.filters.clearFilters")}</Button>
              <Badge count={pagination.total} showZero color="#1890ff">
                <Text strong>{t("posts.filters.totalPosts")}</Text>
              </Badge>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Posts Grid */}
      <Spin spinning={loading}>
        {posts.length === 0 ? (
          <Empty
            description={t("posts.empty.noPosts")}
            style={{ margin: "60px 0" }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {posts.map((post) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={post.id}>
                  <Card
                    hoverable
                    style={{
                      height: "100%",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      transition: "all 0.3s ease",
                      position: "relative",
                    }}
                    bodyStyle={{
                      padding: "16px",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 24px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.1)";
                    }}
                  >
                    {/* Delete Button */}
                    <Tooltip title={t("posts.post.delete")}>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteConfirmation(post);
                        }}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          zIndex: 1,
                        }}
                      />
                    </Tooltip>
                    
                    {/* Post Header */}
                    <div style={{ marginBottom: "12px" }}>
                      <Space align="start" style={{ width: "100%" }}>
                        <Avatar
                          size="small"
                          icon={<UserOutlined />}
                          style={{ backgroundColor: "#1890ff", flexShrink: 0 }}
                        >
                          {post.teacher.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            strong
                            style={{ fontSize: "14px", display: "block" }}
                          >
                            {post.teacher.name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            <CalendarOutlined style={{ marginRight: "4px" }} />
                            {formatRelativeTime(post.createdAt)}
                          </Text>
                        </div>
                      </Space>
                    </div>

                    {/* Post Title */}
                    <Title
                      level={4}
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#262626",
                        lineHeight: "1.4",
                      }}
                      ellipsis={{ rows: 2, tooltip: post.title }}
                    >
                      {post.title}
                    </Title>

                    {/* Stage and Subject Tags */}
                    <div style={{ marginBottom: "12px" }}>
                      <Space size="small">
                        <Tag
                          color="blue"
                          style={{ margin: 0, fontSize: "11px" }}
                        >
                          <BookOutlined style={{ marginRight: "2px" }} />
                          {post.stage.name}
                        </Tag>
                        <Tag
                          color="green"
                          style={{ margin: 0, fontSize: "11px" }}
                        >
                          {post.subject.name}
                        </Tag>
                      </Space>
                    </div>

                    {/* Post Content */}
                    <div style={{ flex: 1, marginBottom: "12px" }}>
                      <Paragraph
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#595959",
                          lineHeight: "1.5",
                        }}
                        ellipsis={{ rows: 3, tooltip: post.content }}
                      >
                        {truncateContent(post.content)}
                      </Paragraph>
                    </div>

                    {/* Post Actions */}
                    <div
                      style={{
                        borderTop: "1px solid #f0f0f0",
                        paddingTop: "12px",
                      }}
                    >
                      <Space
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <Space size="large">
                          <Space size="small">
                            <HeartOutlined style={{ color: "#ff4d4f" }} />
                            <Text style={{ fontSize: "12px" }}>
                              {post.likesCount}
                            </Text>
                          </Space>
                          <Tooltip title={t("posts.post.interactions.viewComments")}>
                            <Space
                              size="small"
                              style={{ cursor: "pointer" }}
                              onClick={() => showCommentsModal(post)}
                            >
                              <MessageOutlined style={{ color: "#1890ff" }} />
                              <Text style={{ fontSize: "12px" }}>
                                {post.commentsCount}
                              </Text>
                            </Space>
                          </Tooltip>
                        </Space>
                        {post.likes.length > 0 && (
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            {post.likes.length === 1
                              ? t("posts.post.interactions.likedBy", { name: post.likes[0].user?.name })
                              : t("posts.post.interactions.likedByOthers", {
                                  name: post.likes[0].user?.name,
                                  count: post.likes.length - 1,
                                })
                            }
                          </Text>
                        )}
                      </Space>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ textAlign: "center", marginTop: "32px" }}>
                <Pagination
                  current={pagination.page}
                  total={pagination.total}
                  pageSize={pagination.limit}
                  onChange={(page) => fetchPosts(page)}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) =>
                    t("posts.pagination.showTotal", {
                      start: range[0],
                      end: range[1],
                      total: total,
                    })
                  }
                />
              </div>
            )}
          </>
        )}
      </Spin>

      {/* Comments Modal */}
      <Modal
        title={
          <div
            style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "16px" }}
          >
            <Space align="start">
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: "#1890ff" }}
              >
                {selectedPost?.teacher.name.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Title level={4} style={{ margin: 0, fontSize: "18px" }}>
                  {selectedPost?.title}
                </Title>
                <Text type="secondary">
                  {t("posts.modal.postBy", { name: selectedPost?.teacher.name })} •{" "}
                  {selectedPost && formatRelativeTime(selectedPost.createdAt)}
                </Text>
              </div>
            </Space>
          </div>
        }
        open={isCommentsModalVisible}
        onCancel={hideCommentsModal}
        footer={null}
        width={600}
        style={{ top: 20 }}
      >
        {selectedPost && (
          <div>
            {/* Post Content */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ marginBottom: "12px" }}>
                <Space size="small">
                  <Tag color="blue" style={{ fontSize: "11px" }}>
                    <BookOutlined style={{ marginRight: "2px" }} />
                    {selectedPost.stage.name}
                  </Tag>
                  <Tag color="green" style={{ fontSize: "11px" }}>
                    {selectedPost.subject.name}
                  </Tag>
                </Space>
              </div>
              <Paragraph style={{ fontSize: "14px", lineHeight: "1.6" }}>
                {selectedPost.content}
              </Paragraph>
            </div>

            {/* Post Stats */}
            <div
              style={{
                marginBottom: "24px",
                padding: "12px",
                backgroundColor: "#fafafa",
                borderRadius: "8px",
              }}
            >
              <Space size="large">
                <Space size="small">
                  <HeartOutlined style={{ color: "#ff4d4f" }} />
                  <Text style={{ fontSize: "14px" }}>
                    {selectedPost.likesCount}{" "}
                    {selectedPost.likesCount === 1 
                      ? t("posts.post.interactions.like") 
                      : t("posts.post.interactions.likes")
                    }
                  </Text>
                </Space>
                <Space size="small">
                  <MessageOutlined style={{ color: "#1890ff" }} />
                  <Text style={{ fontSize: "14px" }}>
                    {selectedPost.commentsCount}{" "}
                    {selectedPost.commentsCount === 1 
                      ? t("posts.post.interactions.comment") 
                      : t("posts.post.interactions.comments")
                    }
                  </Text>
                </Space>
              </Space>
            </div>

            <Divider style={{ margin: "16px 0" }}>
              <Text strong style={{ color: "#1890ff" }}>
                {t("posts.modal.commentsTitle", { count: selectedPost.commentsCount })}
              </Text>
            </Divider>

            {/* Comments List */}
            {selectedPost.comments.length > 0 ? (
              <List
                dataSource={selectedPost.comments}
                renderItem={(comment) => (
                  <List.Item style={{ padding: "12px 0", border: "none" }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size="small"
                          style={{ backgroundColor: "#52c41a" }}
                        >
                          {comment.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong style={{ fontSize: "14px" }}>
                            {comment.user?.name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            <ClockCircleOutlined
                              style={{ marginRight: "4px" }}
                            />
                            {formatRelativeTime(comment.createdAt)}
                          </Text>
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: "4px" }}>
                          <Text style={{ fontSize: "13px", lineHeight: "1.5" }}>
                            {comment.content}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description={t("posts.modal.noComments")}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: "20px 0" }}
              >
                <Text type="secondary">{t("posts.modal.noCommentsDescription")}</Text>
              </Empty>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#ff4d4f", fontSize: "22px" }} />
            <Text strong style={{ fontSize: "16px" }}>
              {t("posts.delete.confirmTitle")}
            </Text>
          </Space>
        }
        open={isDeleteModalVisible}
        onCancel={hideDeleteModal}
        onOk={handleDeletePost}
        okText={t("posts.delete.confirmButton")}
        cancelText={t("posts.delete.cancelButton")}
        okButtonProps={{ danger: true, loading: isDeleting }}
        cancelButtonProps={{ disabled: isDeleting }}
        width={500}
      >
        <div style={{ marginTop: "16px" }}>
          <Text>
            {t("posts.delete.confirmMessage")}
          </Text>
          {postToDelete && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                backgroundColor: "#fafafa",
                borderRadius: "8px",
                borderLeft: "3px solid #ff4d4f",
              }}
            >
              <Title level={5} style={{ margin: "0 0 8px 0" }}>
                {postToDelete.title}
              </Title>
              <Text type="secondary" style={{ fontSize: "13px" }}>
                {t("posts.modal.postBy", { name: postToDelete.teacher.name })} •{" "}
                {formatRelativeTime(postToDelete.createdAt)}
              </Text>
            </div>
          )}
          <div style={{ marginTop: "16px" }}>
            <Text type="warning" strong>
              {t("posts.delete.warning")}
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Posts;
