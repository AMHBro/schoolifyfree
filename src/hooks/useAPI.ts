import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  teachersAPI,
  studentsAPI,
  stagesAPI,
  subjectsAPI,
  schedulesAPI,
  examsAPI,
  activationKeysAPI,
} from "../services/api";
import type {
  CreateTeacherRequest,
  CreateStudentRequest,
  CreateStageRequest,
  CreateSubjectRequest,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  CreateExamRequest,
  UpdateExamRequest,
  PaginationParams,
  SubjectPaginationParams,
  StudentPaginationParams,
} from "../types/api";

// Query Keys
export const queryKeys = {
  teachers: ["teachers"] as const,
  teacher: (id: string) => ["teachers", id] as const,
  teachersSearch: (query: string) => ["teachers", "search", query] as const,
  students: ["students"] as const,
  studentsPaginated: (params: StudentPaginationParams) =>
    ["students", "paginated", params] as const,
  student: (id: string) => ["students", id] as const,
  studentsSearch: (query: string) => ["students", "search", query] as const,
  stages: ["stages"] as const,
  stagesSearch: (query: string) => ["stages", "search", query] as const,
  subjects: ["subjects"] as const,
  subjectsPaginated: (params: SubjectPaginationParams) =>
    ["subjects", "paginated", params] as const,
  subjectsSearch: (query: string) => ["subjects", "search", query] as const,
  schedules: ["schedules"] as const,
  schedulesByStage: (stageId: string) =>
    ["schedules", "stage", stageId] as const,
  schedulesByTeacher: (teacherId: string) =>
    ["schedules", "teacher", teacherId] as const,
  exams: ["exams"] as const,
  exam: (id: string) => ["exams", id] as const,
  examsByDate: (date: string) => ["exams", "date", date] as const,
  examsSearch: (query: string) => ["exams", "search", query] as const,
  examsCalendarDates: ["exams", "calendar-dates"] as const,
};

// Teachers Hooks
export const useTeachers = () => {
  return useQuery({
    queryKey: queryKeys.teachers,
    queryFn: teachersAPI.getAll,
  });
};

export const useTeacher = (id: string) => {
  return useQuery({
    queryKey: queryKeys.teacher(id),
    queryFn: () => teachersAPI.getById(id),
    enabled: !!id,
  });
};

export const useSearchTeachers = (query: string) => {
  return useQuery({
    queryKey: queryKeys.teachersSearch(query),
    queryFn: () => teachersAPI.search(query),
    enabled: !!query.trim(),
  });
};

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeacherRequest) => teachersAPI.create(data),
    onSuccess: () => {
      // Invalidate and refetch teachers list
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers });
      // Also invalidate stages and subjects as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
    },
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateTeacherRequest>;
    }) => teachersAPI.update(id, data),
    onSuccess: (updatedTeacher) => {
      // Invalidate and refetch teachers list
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers });
      // Invalidate specific teacher
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacher(updatedTeacher.id),
      });
      // Also invalidate stages and subjects as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
    },
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teachersAPI.delete(id),
    onSuccess: () => {
      // Invalidate and refetch teachers list
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers });
      // Also invalidate stages and subjects as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
    },
  });
};

// Students Hooks
export const useStudents = () => {
  return useQuery({
    queryKey: queryKeys.students,
    queryFn: studentsAPI.getAll,
  });
};

export const useStudentsPaginated = (params: StudentPaginationParams) => {
  return useQuery({
    queryKey: queryKeys.studentsPaginated(params),
    queryFn: () => studentsAPI.getPaginated(params),
  });
};

export const useStudent = (id: string) => {
  return useQuery({
    queryKey: queryKeys.student(id),
    queryFn: () => studentsAPI.getById(id),
    enabled: !!id,
  });
};

export const useSearchStudents = (query: string) => {
  return useQuery({
    queryKey: queryKeys.studentsSearch(query),
    queryFn: () => studentsAPI.search(query),
    enabled: !!query.trim(),
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStudentRequest) => {
      console.log("🔥 useCreateStudent mutationFn called with:", data);
      return studentsAPI.create(data);
    },
    onSuccess: (result) => {
      console.log("🎉 useCreateStudent onSuccess called with result:", result);
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      // Invalidate paginated students
      queryClient.invalidateQueries({ queryKey: ["students", "paginated"] });
      // Also invalidate stages as student count might change
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
      // Invalidate activation keys as one will be used
      queryClient.invalidateQueries({ queryKey: ["activation-keys"] });
    },
    onError: (error) => {
      console.error("💥 useCreateStudent onError called with error:", error);
    },
  });
};

// Activation Keys hooks
export const useAvailableActivationKeys = () => {
  return useQuery({
    queryKey: ["activation-keys", "available"],
    queryFn: () => activationKeysAPI.getAvailable(),
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateStudentRequest>;
    }) => studentsAPI.update(id, data),
    onSuccess: (updatedStudent) => {
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      // Invalidate paginated students
      queryClient.invalidateQueries({ queryKey: ["students", "paginated"] });
      // Invalidate specific student
      queryClient.invalidateQueries({
        queryKey: queryKeys.student(updatedStudent.id),
      });
      // Also invalidate stages as student count might change
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
    },
  });
};

export const useUpdateStudentActivationKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      activationKeyId,
    }: {
      studentId: string;
      activationKeyId: string;
    }) => studentsAPI.updateActivationKey(studentId, activationKeyId),
    onSuccess: () => {
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      // Invalidate paginated students
      queryClient.invalidateQueries({ queryKey: ["students", "paginated"] });
      // Invalidate activation keys as one will be used and another freed
      queryClient.invalidateQueries({ queryKey: ["activation-keys"] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => studentsAPI.delete(id),
    onSuccess: () => {
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      // Invalidate paginated students
      queryClient.invalidateQueries({ queryKey: ["students", "paginated"] });
      // Also invalidate stages as student count might change
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
    },
  });
};

// Stages Hooks
export const useStages = () => {
  return useQuery({
    queryKey: queryKeys.stages,
    queryFn: stagesAPI.getAll,
  });
};

export const useSearchStages = (query: string) => {
  return useQuery({
    queryKey: queryKeys.stagesSearch(query),
    queryFn: () => stagesAPI.search(query),
    enabled: !!query.trim(),
  });
};

export const useCreateStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStageRequest) => stagesAPI.create(data),
    onSuccess: () => {
      // Invalidate and refetch stages list
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
    },
  });
};

export const useUpdateStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateStageRequest>;
    }) => stagesAPI.update(id, data),
    onSuccess: () => {
      // Invalidate and refetch stages list
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
    },
  });
};

export const useDeleteStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => stagesAPI.delete(id),
    onSuccess: () => {
      // Invalidate and refetch stages list
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
      // Also invalidate students and schedules as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
    },
  });
};

// Subjects Hooks
export const useSubjects = () => {
  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: subjectsAPI.getAll,
  });
};

export const useSubjectsPaginated = (params: SubjectPaginationParams) => {
  return useQuery({
    queryKey: queryKeys.subjectsPaginated(params),
    queryFn: () => subjectsAPI.getPaginated(params),
  });
};

export const useSearchSubjects = (query: string) => {
  return useQuery({
    queryKey: queryKeys.subjectsSearch(query),
    queryFn: () => subjectsAPI.search(query),
    enabled: !!query.trim(),
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubjectRequest) => subjectsAPI.create(data),
    onSuccess: () => {
      // Invalidate and refetch subjects list
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      // Invalidate paginated subjects
      queryClient.invalidateQueries({ queryKey: ["subjects", "paginated"] });
      // Also invalidate stages as subject count might change
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateSubjectRequest>;
    }) => subjectsAPI.update(id, data),
    onSuccess: () => {
      // Invalidate and refetch subjects list
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      // Invalidate paginated subjects
      queryClient.invalidateQueries({ queryKey: ["subjects", "paginated"] });
      // Also invalidate stages as subject count might change
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subjectsAPI.delete(id),
    onSuccess: () => {
      // Invalidate and refetch subjects list
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects });
      // Invalidate paginated subjects
      queryClient.invalidateQueries({ queryKey: ["subjects", "paginated"] });
      // Also invalidate schedules as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
      // Also invalidate stages as subject count might change
      queryClient.invalidateQueries({ queryKey: queryKeys.stages });
    },
  });
};

// Schedules Hooks
export const useSchedules = () => {
  return useQuery({
    queryKey: queryKeys.schedules,
    queryFn: schedulesAPI.getAll,
  });
};

export const useSchedulesByStage = (stageId: string) => {
  return useQuery({
    queryKey: queryKeys.schedulesByStage(stageId),
    queryFn: () => schedulesAPI.getByStageId(stageId),
    enabled: !!stageId,
  });
};

export const useSchedulesByTeacher = (teacherId: string) => {
  return useQuery({
    queryKey: queryKeys.schedulesByTeacher(teacherId),
    queryFn: () => schedulesAPI.getByTeacherId(teacherId),
    enabled: !!teacherId,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduleRequest) => schedulesAPI.create(data),
    onSuccess: (newSchedule) => {
      // Invalidate and refetch all schedule queries
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
      queryClient.invalidateQueries({
        queryKey: queryKeys.schedulesByStage(newSchedule.stage.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.schedulesByTeacher(newSchedule.teacher.id),
      });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleRequest }) =>
      schedulesAPI.update(id, data),
    onSuccess: (updatedSchedule) => {
      // Invalidate and refetch all schedule queries
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
      queryClient.invalidateQueries({
        queryKey: queryKeys.schedulesByStage(updatedSchedule.stage.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.schedulesByTeacher(updatedSchedule.teacher.id),
      });
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => schedulesAPI.delete(id),
    onSuccess: (deletedSchedule) => {
      // Invalidate and refetch all schedule queries
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
      queryClient.invalidateQueries({
        queryKey: queryKeys.schedulesByStage(deletedSchedule.stage.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.schedulesByTeacher(deletedSchedule.teacher.id),
      });
    },
  });
};

// Exams Hooks
export const useExams = () => {
  return useQuery({
    queryKey: queryKeys.exams,
    queryFn: examsAPI.getAll,
  });
};

export const useExam = (id: string) => {
  return useQuery({
    queryKey: queryKeys.exam(id),
    queryFn: () => examsAPI.getById(id),
    enabled: !!id,
  });
};

export const useExamsByDate = (date: string) => {
  return useQuery({
    queryKey: queryKeys.examsByDate(date),
    queryFn: () => examsAPI.getByDate(date),
    enabled: !!date,
  });
};

export const useSearchExams = (query: string) => {
  return useQuery({
    queryKey: queryKeys.examsSearch(query),
    queryFn: () => examsAPI.search(query),
    enabled: !!query.trim(),
  });
};

export const useExamsCalendarDates = () => {
  return useQuery({
    queryKey: queryKeys.examsCalendarDates,
    queryFn: examsAPI.getCalendarDates,
  });
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExamRequest) => examsAPI.create(data),
    onSuccess: () => {
      // Invalidate and refetch exams list
      queryClient.invalidateQueries({ queryKey: queryKeys.exams });
    },
  });
};

export const useUpdateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExamRequest }) =>
      examsAPI.update(id, data),
    onSuccess: (updatedExam) => {
      // Invalidate and refetch exams list
      queryClient.invalidateQueries({ queryKey: queryKeys.exams });
      // Invalidate specific exam
      queryClient.invalidateQueries({
        queryKey: queryKeys.exam(updatedExam.id),
      });
      // Invalidate exams by date for the exam date
      const examDate = updatedExam.examDate.split("T")[0]; // Get date part only
      queryClient.invalidateQueries({
        queryKey: queryKeys.examsByDate(examDate),
      });
    },
  });
};

export const useDeleteExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => examsAPI.delete(id),
    onSuccess: (deletedExam) => {
      // Invalidate and refetch exams list
      queryClient.invalidateQueries({ queryKey: queryKeys.exams });
      // Invalidate exams by date for the exam date
      const examDate = deletedExam.examDate.split("T")[0]; // Get date part only
      queryClient.invalidateQueries({
        queryKey: queryKeys.examsByDate(examDate),
      });
    },
  });
};
