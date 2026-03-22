import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { Outlet } from "react-router-dom";
import MainLayout from "../Layout";
import ProtectedRoute from "../components/ProtectedRoute";

// Lazy load components with type assertions
const Home = lazy(
  () => import("../pages/Home") as Promise<{ default: React.FC }>
);
const Teachers = lazy(
  () => import("../pages/Teachers") as Promise<{ default: React.FC }>
);
const AddTeacher = lazy(
  () => import("../pages/AddTeacher") as Promise<{ default: React.FC }>
);
const Students = lazy(
  () => import("../pages/Students") as Promise<{ default: React.FC }>
);
const AddStudent = lazy(
  () => import("../pages/AddStudent") as Promise<{ default: React.FC }>
);
const StudentDetails = lazy(
  () =>
    import("../views/students/StudentDetails") as Promise<{ default: React.FC }>
);
const Stages = lazy(
  () => import("../pages/Stages") as Promise<{ default: React.FC }>
);
const AddStage = lazy(
  () => import("../pages/AddStage") as Promise<{ default: React.FC }>
);
const Subjects = lazy(
  () => import("../pages/Subjects") as Promise<{ default: React.FC }>
);
const AddSubject = lazy(
  () => import("../pages/AddSubject") as Promise<{ default: React.FC }>
);
const Exams = lazy(
  () => import("../pages/Exams") as Promise<{ default: React.FC }>
);
const AddExam = lazy(
  () => import("../views/exams/AddExam") as Promise<{ default: React.FC }>
);
const StageSchedule = lazy(
  () =>
    import("../views/stages/StageSchedule") as Promise<{ default: React.FC }>
);
const StageDetails = lazy(
  () => import("../views/stages/StageDetails") as Promise<{ default: React.FC }>
);
const TeacherSchedule = lazy(
  () =>
    import("../views/teachers/TeacherSchedule") as Promise<{
      default: React.FC;
    }>
);
const NotFound = lazy(
  () => import("../pages/NotFound") as Promise<{ default: React.FC }>
);
const Settings = lazy(
  () => import("../pages/Settings") as Promise<{ default: React.FC }>
);
const Posts = lazy(
  () => import("../pages/Posts") as Promise<{ default: React.FC }>
);
const Grades = lazy(
  () => import("../pages/Grades") as Promise<{ default: React.FC }>
);
const Login = lazy(
  () => import("../pages/Login") as Promise<{ default: React.FC }>
);
const ActivationKeys = lazy(
  () => import("../pages/ActivationKeys") as Promise<{ default: React.FC }>
);
const Chats = lazy(
  () => import("../pages/Chats") as Promise<{ default: React.FC }>
);

// Loading component
const LoadingFallback = () => <div>Loading...</div>;

// Route configuration
export const routes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout children={<Outlet />} />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: "teachers",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Teachers />
          </Suspense>
        ),
      },
      {
        path: "teachers/add",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AddTeacher />
          </Suspense>
        ),
      },
      {
        path: "teachers/:teacherId/schedule",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <TeacherSchedule />
          </Suspense>
        ),
      },
      {
        path: "students",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Students />
          </Suspense>
        ),
      },
      {
        path: "students/add",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AddStudent />
          </Suspense>
        ),
      },
      {
        path: "students/:studentId",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <StudentDetails />
          </Suspense>
        ),
      },
      {
        path: "stages",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Stages />
          </Suspense>
        ),
      },
      {
        path: "stages/add",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AddStage />
          </Suspense>
        ),
      },
      {
        path: "stages/:stageId",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <StageDetails />
          </Suspense>
        ),
      },
      {
        path: "stages/:stageId/schedule",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <StageSchedule />
          </Suspense>
        ),
      },
      {
        path: "subjects",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Subjects />
          </Suspense>
        ),
      },
      {
        path: "subjects/add",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AddSubject />
          </Suspense>
        ),
      },
      {
        path: "exams",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Exams />
          </Suspense>
        ),
      },
      {
        path: "exams/add",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AddExam />
          </Suspense>
        ),
      },
      {
        path: "posts",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Posts />
          </Suspense>
        ),
      },
      {
        path: "grades",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Grades />
          </Suspense>
        ),
      },
      {
        path: "activation-keys",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ActivationKeys />
          </Suspense>
        ),
      },
      {
        path: "chats",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Chats />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Settings />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <NotFound />
          </Suspense>
        ),
      },
    ],
  },
];
