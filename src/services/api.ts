import type {
  Teacher,
  Student,
  Stage,
  Subject,
  Schedule,
  Exam,
  CreateTeacherRequest,
  CreateStudentRequest,
  CreateStageRequest,
  CreateSubjectRequest,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  CreateExamRequest,
  UpdateExamRequest,
  CreateGradeRequest,
  Attendance,
  DailyAttendance,
  CreateAttendanceRequest,
  UpdateAttendanceRequest,
  BulkAttendanceRequest,
  PaginatedResponse,
  PaginationParams,
  SubjectPaginationParams,
  StudentPaginationParams,
} from "../types/api";

// For Vercel deployment, always use relative URLs to trigger rewrites
// Only use full URL for local development
const API_BASE_URL = import.meta.env.DEV ? "http://localhost:3000" : "";

// Generic fetch wrapper with error handling and auto-authentication
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log("🌐 fetchAPI called:", {
    endpoint,
    url,
    method: options?.method || "GET",
  });

  // Get token from localStorage
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    // Merge headers if options already has headers
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  };

  console.log("📤 Making request with config:", config);

  const response = await fetch(url, config);

  console.log("📥 Response received:", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// File download wrapper with error handling for blob responses and auto-authentication
async function fetchFile(
  endpoint: string,
  options?: RequestInit
): Promise<Blob> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token from localStorage
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(
      `File Download Error: ${response.status} ${response.statusText}`
    );
  }

  return response.blob();
}

// Teachers API
export const teachersAPI = {
  getAll: (): Promise<Teacher[]> => fetchAPI("/api/teachers"),
  getById: (id: string): Promise<Teacher> => fetchAPI(`/api/teachers/${id}`),
  create: (data: CreateTeacherRequest): Promise<Teacher> =>
    fetchAPI("/api/teachers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<CreateTeacherRequest>): Promise<Teacher> =>
    fetchAPI(`/api/teachers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string): Promise<Teacher> =>
    fetchAPI(`/api/teachers/${id}`, {
      method: "DELETE",
    }),
  search: (query: string): Promise<Teacher[]> =>
    fetchAPI(`/api/teachers/search?q=${encodeURIComponent(query)}`),
};

// Students API
export const studentsAPI = {
  getAll: (): Promise<Student[]> => fetchAPI("/api/students/all"),
  getPaginated: (
    params: StudentPaginationParams
  ): Promise<PaginatedResponse<Student>> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.stageId) queryParams.append("stageId", params.stageId);
    if (params.gender) queryParams.append("gender", params.gender);
    if (params.minAge !== undefined)
      queryParams.append("minAge", params.minAge.toString());
    if (params.maxAge !== undefined)
      queryParams.append("maxAge", params.maxAge.toString());
    if (params.activationKeyStatus)
      queryParams.append("activationKeyStatus", params.activationKeyStatus);

    const queryString = queryParams.toString();
    return fetchAPI(`/api/students${queryString ? `?${queryString}` : ""}`);
  },
  getById: (id: string): Promise<Student> => fetchAPI(`/api/students/${id}`),
  create: (data: CreateStudentRequest): Promise<Student> => {
    console.log("📡 studentsAPI.create called with data:", data);
    return fetchAPI("/api/students", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: (id: string, data: Partial<CreateStudentRequest>): Promise<Student> =>
    fetchAPI(`/api/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateActivationKey: (
    studentId: string,
    activationKeyId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> =>
    fetchAPI(`/api/students/${studentId}/activation-key`, {
      method: "PATCH",
      body: JSON.stringify({ activationKeyId }),
    }),
  delete: (id: string): Promise<Student> =>
    fetchAPI(`/api/students/${id}`, {
      method: "DELETE",
    }),
  search: (query: string): Promise<Student[]> =>
    fetchAPI(`/api/students/search?q=${encodeURIComponent(query)}`),
};

// Stages API
export const stagesAPI = {
  getAll: (): Promise<Stage[]> => fetchAPI("/api/stages"),
  create: (data: CreateStageRequest): Promise<Stage> =>
    fetchAPI("/api/stages", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<CreateStageRequest>): Promise<Stage> =>
    fetchAPI(`/api/stages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string): Promise<Stage> =>
    fetchAPI(`/api/stages/${id}`, {
      method: "DELETE",
    }),
  search: (query: string): Promise<Stage[]> =>
    fetchAPI(`/api/stages/search?q=${encodeURIComponent(query)}`),
};

// Subjects API
export const subjectsAPI = {
  getAll: (): Promise<Subject[]> => fetchAPI("/api/subjects/all"),
  getByStageId: (stageId: string): Promise<Subject[]> =>
    fetchAPI(`/api/subjects/stage/${stageId}`),
  getPaginated: (
    params: SubjectPaginationParams
  ): Promise<PaginatedResponse<Subject>> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.stageId) queryParams.append("stageId", params.stageId);
    if (params.hasTeachers !== undefined)
      queryParams.append("hasTeachers", params.hasTeachers.toString());
    if (params.teacherId) queryParams.append("teacherId", params.teacherId);

    const queryString = queryParams.toString();
    return fetchAPI(`/api/subjects${queryString ? `?${queryString}` : ""}`);
  },
  create: (data: CreateSubjectRequest): Promise<Subject> =>
    fetchAPI("/api/subjects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<CreateSubjectRequest>): Promise<Subject> =>
    fetchAPI(`/api/subjects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string): Promise<Subject> =>
    fetchAPI(`/api/subjects/${id}`, {
      method: "DELETE",
    }),
  search: (query: string): Promise<Subject[]> =>
    fetchAPI(`/api/subjects/search?q=${encodeURIComponent(query)}`),
};

// Activation Keys API
export const activationKeysAPI = {
  getAll: (): Promise<{
    success: boolean;
    data: {
      keys: Array<{
        id: string;
        key: string;
        isUsed: boolean;
        usedAt?: string;
        expiresAt: string;
        createdAt: string;
        student?: {
          id: string;
          name: string;
          code: string;
        };
      }>;
      stats: {
        total: number;
        active: number;
        used: number;
        expired: number;
      };
    };
  }> => fetchAPI("/api/activation-keys"),

  getAvailable: (): Promise<{
    keys: { id: string; key: string; expiresAt: string; createdAt: string }[];
  }> =>
    fetchAPI("/api/activation-keys/available").then(
      (response: any) => response.data
    ),
};

// Grades API
export const gradesAPI = {
  getAll: (params: {
    stageId?: string;
    subjectId?: string;
    page?: number;
    limit?: number;
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.stageId) queryParams.append("stageId", params.stageId);
    if (params.subjectId) queryParams.append("subjectId", params.subjectId);

    const queryString = queryParams.toString();
    return fetchAPI(`/api/grades${queryString ? `?${queryString}` : ""}`);
  },
  createGrade: (data: CreateGradeRequest): Promise<{
    success: boolean;
    message?: string;
  }> =>
    fetchAPI("/api/grades", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStudentStage: (studentId: string, stageId: string): Promise<any> =>
    fetchAPI(`/api/students/${studentId}/stage`, {
      method: "PUT",
      body: JSON.stringify({ stageId }),
    }),
};

// Schedules API
export const schedulesAPI = {
  getAll: (): Promise<Schedule[]> => fetchAPI("/api/schedules"),
  getByStageId: (stageId: string): Promise<Schedule[]> =>
    fetchAPI(`/api/schedules/stage/${stageId}`),
  getByTeacherId: (teacherId: string): Promise<Schedule[]> =>
    fetchAPI(`/api/schedules/teacher/${teacherId}`),
  create: (data: CreateScheduleRequest): Promise<Schedule> =>
    fetchAPI("/api/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateScheduleRequest): Promise<Schedule> =>
    fetchAPI(`/api/schedules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string): Promise<Schedule> =>
    fetchAPI(`/api/schedules/${id}`, {
      method: "DELETE",
    }),
};

// Exams API
export const examsAPI = {
  getAll: (): Promise<Exam[]> => fetchAPI("/api/exams"),
  getById: (id: string): Promise<Exam> => fetchAPI(`/api/exams/${id}`),
  getByDate: (date: string): Promise<Exam[]> =>
    fetchAPI(`/api/exams/by-date/${date}`),
  getCalendarDates: (): Promise<Array<{ date: string; count: number }>> =>
    fetchAPI("/api/exams/calendar-dates"),
  create: (data: CreateExamRequest): Promise<Exam> =>
    fetchAPI("/api/exams", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateExamRequest): Promise<Exam> =>
    fetchAPI(`/api/exams/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string): Promise<Exam> =>
    fetchAPI(`/api/exams/${id}`, {
      method: "DELETE",
    }),
  search: (query: string): Promise<Exam[]> =>
    fetchAPI(`/api/exams/search?q=${encodeURIComponent(query)}`),
};

// Backup API
export const backupAPI = {
  exportAll: async (): Promise<{
    teachers: any[];
    students: any[];
    stages: Stage[];
    subjects: Subject[];
    schedules: any[];
    exams: any[];
    activationKeys: any[];
    posts: any[];
    grades: any[];
    notes: any[];
    attendance: any[];
    chats: any[];
    adminChats: any[];
    systemSettings: any;
    metadata: {
      exportDate: string;
      version: string;
      totalRecords: number;
      schoolCode: string;
    };
  }> => {
    return fetchAPI("/api/backup/export");
  },

  importBulk: async (data: {
    teachers?: any[];
    students?: any[];
    stages?: any[];
    subjects?: any[];
    schedules?: any[];
    exams?: any[];
    activationKeys?: any[];
    posts?: any[];
    grades?: any[];
    notes?: any[];
    attendance?: any[];
    chats?: any[];
    adminChats?: any[];
    systemSettings?: any;
  }): Promise<{ imported: number; errors: string[] }> => {
    return fetchAPI("/api/backup/import", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Attendance API
export const attendanceAPI = {
  // Get attendance records for a specific date and stage
  getDailyAttendance: (
    date: string,
    stageId: string
  ): Promise<DailyAttendance> =>
    fetchAPI(`/api/attendance/daily/${stageId}/${date}`),

  // Get attendance records for a specific student
  getStudentAttendance: (
    studentId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<Attendance[]> => {
    const params = new URLSearchParams();
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return fetchAPI(`/api/attendance/student/${studentId}${queryString}`);
  },

  // Get attendance records for a specific stage
  getStageAttendance: (
    stageId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<Attendance[]> => {
    const params = new URLSearchParams();
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return fetchAPI(`/api/attendance/stage/${stageId}${queryString}`);
  },

  // Create or update a single attendance record
  markAttendance: (data: CreateAttendanceRequest): Promise<Attendance> =>
    fetchAPI("/api/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Update a single attendance record
  updateAttendance: (
    id: string,
    data: UpdateAttendanceRequest
  ): Promise<Attendance> =>
    fetchAPI(`/api/attendance/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Bulk mark attendance for multiple students/subjects
  bulkMarkAttendance: (
    data: BulkAttendanceRequest
  ): Promise<{ created: number; updated: number; errors: string[] }> =>
    fetchAPI("/api/attendance/bulk", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Initialize attendance records for a specific date and stage (all students marked as absent by default)
  initializeDailyAttendance: (
    date: string,
    stageId: string
  ): Promise<{ created: number; message: string }> =>
    fetchAPI(`/api/attendance/initialize/${stageId}/${date}`, {
      method: "POST",
    }),

  // Get attendance statistics
  getAttendanceStats: (
    stageId?: string,
    studentId?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<{
    totalDays: number;
    presentDays: number;
    absentDays: number;
    attendanceRate: number;
  }> => {
    const params = new URLSearchParams();
    if (stageId) params.append("stageId", stageId);
    if (studentId) params.append("studentId", studentId);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return fetchAPI(`/api/attendance/stats${queryString}`);
  },
};

// Posts API
export const postsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    stageId?: string;
    teacherId?: string;
  }): Promise<{
    data: Array<{
      id: string;
      title: string;
      content: string;
      stage: { id: string; name: string };
      subject: { id: string; name: string };
      teacher: { id: string; name: string };
      likesCount: number;
      commentsCount: number;
      likes: Array<{
        id: string;
        teacher: { id: string; name: string };
        createdAt: string;
      }>;
      comments: Array<{
        id: string;
        content: string;
        teacher: { id: string; name: string };
        createdAt: string;
      }>;
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.stageId) queryParams.append("stageId", params.stageId);
    if (params?.teacherId) queryParams.append("teacherId", params.teacherId);

    const queryString = queryParams.toString();
    return fetchAPI(`/api/posts${queryString ? `?${queryString}` : ""}`);
  },
  delete: (postId: string): Promise<{ success: boolean; message: string }> => {
    return fetchAPI(`/api/posts/${postId}`, {
      method: "DELETE",
    });
  },
};

// System Settings API
export const systemSettingsAPI = {
  get: (): Promise<{
    success: boolean;
    data: {
      id: string;
      countryName: string;
      ministryName: string;
      schoolName: string;
      managerName: string;
      studyYear: string;
      logoUrl?: string;
      createdAt: string;
      updatedAt: string;
    };
    message?: string;
  }> => fetchAPI("/api/system-settings"),

  update: (data: {
    countryName?: string;
    ministryName?: string;
    schoolName?: string;
    managerName?: string;
    studyYear?: string;
    logoUrl?: string;
  }): Promise<{
    success: boolean;
    data: {
      id: string;
      countryName: string;
      ministryName: string;
      schoolName: string;
      managerName: string;
      studyYear: string;
      logoUrl?: string;
      createdAt: string;
      updatedAt: string;
    };
    message?: string;
  }> =>
    fetchAPI("/api/system-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// PDF Download API
export const pdfAPI = {
  downloadStudentReport: (studentId: string): Promise<Blob> => {
    return fetchFile(`/api/grades/pdf/${studentId}`);
  },

  downloadBulkReports: (data: {
    studentIds?: string[];
    stageId?: string;
    subjectId?: string;
  }): Promise<Blob> => {
    return fetchFile("/api/grades/pdf/bulk", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
