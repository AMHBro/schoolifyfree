export interface Teacher {
  key: string;
  id: string;
  name: string;
  age: number | null;
  phoneNumber: string;
  gender: "male" | "female" | null;
  birthdate: string | null;
  stages: Array<{
    id: string;
    name: string;
  }>;
  subjects: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ActivationKey {
  id: string;
  key: string;
  isUsed: boolean;
  usedAt?: string;
  expiresAt: string;
  isExpired?: boolean;
  status: "active" | "used" | "expired";
}

export interface Student {
  key: string;
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  phoneNumber: string;
  code: string;
  stage: {
    id: string;
    name: string;
    number: number;
  };
  activationKey?: ActivationKey | null;
  createdAt: string;
  updatedAt: string;
}

export interface Stage {
  id: string;
  name: string;
  studentCount: number;
  teacherCount: number;
  subjectCount: number;
  teachers: string[];
  students: string[];
  subjects: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  stage: {
    id: string;
    name: string;
  };
  teacherCount: number;
  teachers: string[];
  createdAt: string;
  updatedAt: string;
}

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface Schedule {
  id: string;
  dayOfWeek: DayOfWeek;
  timeSlot: number; // 1-6 representing the six periods/slots in a day
  startTime?: string | null; // Time in HH:mm format (e.g., "08:00")
  endTime?: string | null; // Time in HH:mm format (e.g., "09:00")
  stage: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  examDate: string;
  classNumber: string; // Class identifier for the exam
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherRequest {
  name: string;
  age?: number;
  phoneNumber: string;
  gender?: "male" | "female";
  birthdate?: string;
  password: string;
  stageIds: string[];
  subjectIds: string[];
}

export interface CreateStudentRequest {
  name: string;
  age: number;
  gender: "male" | "female";
  phoneNumber: string;
  code: string;
  password: string;
  stageId: string;
  activationKeyId: string;
}

export interface CreateStageRequest {
  name: string;
}

export interface CreateSubjectRequest {
  name: string;
  stageId: string;
}

export interface CreateScheduleRequest {
  dayOfWeek: DayOfWeek;
  timeSlot: number;
  stageId: string;
  teacherId: string;
  subjectId: string;
  startTime?: string;
  endTime?: string;
}

export interface UpdateScheduleRequest {
  dayOfWeek?: DayOfWeek;
  timeSlot?: number;
  stageId?: string;
  teacherId?: string;
  subjectId?: string;
  startTime?: string;
  endTime?: string;
}

export interface CreateExamRequest {
  title: string;
  description?: string;
  examDate: string;
  classNumber: string;
  stageId: string;
  subjectId: string;
  teacherId: string;
}

export interface UpdateExamRequest {
  title?: string;
  description?: string;
  examDate?: string;
  classNumber?: string;
  stageId?: string;
  subjectId?: string;
  teacherId?: string;
}

export type GradeType =
  | "MONTH_1_EXAM"
  | "MONTH_2_EXAM"
  | "MID_TERM_EXAM"
  | "MONTH_3_EXAM"
  | "MONTH_4_EXAM"
  | "FINAL_EXAM";

export interface CreateGradeRequest {
  studentId: string;
  subjectId: string;
  teacherId: string;
  gradeType: GradeType;
  grade: number;
}

// Attendance types
export type AttendanceStatus = "present" | "absent";

export interface Attendance {
  id: string;
  studentId: string;
  subjectId: string;
  date: string;
  status: AttendanceStatus;
  markedAt?: string;
  markedBy?: string;
  student: {
    id: string;
    name: string;
    code: string;
  };
  subject: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  studentCode: string;
  subjects: {
    [subjectId: string]: AttendanceStatus;
  };
}

export interface DailyAttendance {
  date: string;
  stageId: string;
  stageName: string;
  students: AttendanceRecord[];
}

export interface CreateAttendanceRequest {
  studentId: string;
  subjectId: string;
  date: string;
  status: AttendanceStatus;
  markedBy?: string;
}

export interface UpdateAttendanceRequest {
  status: AttendanceStatus;
  markedBy?: string;
}

export interface BulkAttendanceRequest {
  date: string;
  stageId: string;
  attendanceData: Array<{
    studentId: string;
    subjectId: string;
    status: AttendanceStatus;
  }>;
  markedBy?: string;
}

// Pagination types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SubjectFilters {
  stageId?: string;
  hasTeachers?: boolean;
  teacherId?: string;
}

export interface SubjectPaginationParams extends PaginationParams {
  stageId?: string;
  hasTeachers?: boolean;
  teacherId?: string;
}

export interface StudentFilters {
  stageId?: string;
  gender?: "male" | "female";
  minAge?: number;
  maxAge?: number;
  activationKeyStatus?: "active" | "used" | "expired" | "no-key";
}

export interface StudentPaginationParams extends PaginationParams {
  stageId?: string;
  gender?: "male" | "female";
  minAge?: number;
  maxAge?: number;
  activationKeyStatus?: "active" | "used" | "expired" | "no-key";
}
