import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { RoleGuard } from '@/components/shared/RoleGuard';
import { RouteError } from '@/components/shared/RouteError';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom';

// Home (public)
const HomePage = lazy(() => import('@/pages/HomePage'));

// Auth (public)
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const AcceptInvitationPage = lazy(
  () => import('@/pages/auth/AcceptInvitationPage')
);

// Shared (all authenticated roles)
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

// VA portal
const VaDashboardPage = lazy(() => import('@/pages/va/VaDashboardPage'));
const AddWorkEntryPage = lazy(() => import('@/pages/va/AddWorkEntryPage'));
const WorkHistoryPage = lazy(() => import('@/pages/va/WorkHistoryPage'));
const EodSubmitPage = lazy(() => import('@/pages/va/EodSubmitPage'));
const EodHistoryPage = lazy(() => import('@/pages/va/EodHistoryPage'));

// Admin portal
const AdminDashboardPage = lazy(
  () => import('@/pages/admin/AdminDashboardPage')
);
const AssignmentManagementPage = lazy(
  () => import('@/pages/admin/AssignmentManagementPage')
);
const AccountManagementPage = lazy(
  () => import('@/pages/admin/AccountManagementPage')
);
const SurveyRemindersPage = lazy(
  () => import('@/pages/admin/SurveyRemindersPage')
);
const ScorecardsPage = lazy(() => import('@/pages/admin/ScorecardsPage'));
const WorkEntriesPage = lazy(() => import('@/pages/admin/WorkEntriesPage'));
const EodReportsPage = lazy(() => import('@/pages/admin/EodReportsPage'));
const PerformanceReviewsPage = lazy(
  () => import('@/pages/admin/PerformanceReviewsPage')
);

// Account manager portal
const AmDashboardPage = lazy(() => import('@/pages/am/AmDashboardPage'));
const AmActivityPage = lazy(() => import('@/pages/am/AmActivityPage'));
const AmCheckinsPage = lazy(() => import('@/pages/am/AmCheckinsPage'));
const AmPerformancePage = lazy(() => import('@/pages/am/AmPerformancePage'));
const AmAssignmentsPage = lazy(
  () => import('@/pages/am/AmAssignmentsPage')
);

// Client portal
const ClientDashboardPage = lazy(
  () => import('@/pages/client/ClientDashboardPage')
);
const WorkActivityPage = lazy(() => import('@/pages/client/WorkActivityPage'));

// 404
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function SuspenseLayout() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Outlet />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    element: <SuspenseLayout />,
    errorElement: <RouteError />,
    children: [
      // Public routes
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/accept-invitation', element: <AcceptInvitationPage /> },

      // Protected — must be authenticated
      {
        element: <ProtectedRoute />,
        children: [
          // Shared profile page (all roles)
          {
            element: <DashboardLayout />,
            children: [{ path: 'profile', element: <ProfilePage /> }],
          },

          // VA portal
          {
            path: '/va',
            element: <RoleGuard roles={['va']} />,
            children: [
              {
                element: <DashboardLayout />,
                children: [
                  { path: 'dashboard', element: <VaDashboardPage /> },
                  { path: 'work/new', element: <AddWorkEntryPage /> },
                  { path: 'work/history', element: <WorkHistoryPage /> },
                  { path: 'eod/new', element: <EodSubmitPage /> },
                  { path: 'eod/history', element: <EodHistoryPage /> },
                ],
              },
            ],
          },

          // Admin portal — admin only
          {
            path: '/admin',
            element: <RoleGuard roles={['admin']} />,
            children: [
              {
                element: <DashboardLayout />,
                children: [
                  { path: 'dashboard', element: <AdminDashboardPage /> },
                  {
                    path: 'assignments',
                    element: <AssignmentManagementPage />,
                  },
                  { path: 'accounts', element: <AccountManagementPage /> },
                  { path: 'reminders', element: <SurveyRemindersPage /> },
                  { path: 'scorecards', element: <ScorecardsPage /> },
                  { path: 'work-entries', element: <WorkEntriesPage /> },
                  { path: 'eod-reports', element: <EodReportsPage /> },
                  {
                    path: 'performance-reviews',
                    element: <PerformanceReviewsPage />,
                  },
                ],
              },
            ],
          },

          // Account Manager portal
          {
            path: '/am',
            element: <RoleGuard roles={['account_manager']} />,
            children: [
              {
                element: <DashboardLayout />,
                children: [
                  { path: 'dashboard', element: <AmDashboardPage /> },
                  { path: 'assignments', element: <AmAssignmentsPage /> },
                  { path: 'accounts', element: <AccountManagementPage /> },
                  { path: 'reminders', element: <AmCheckinsPage /> },
                  { path: 'performance', element: <AmPerformancePage /> },
                  {
                    path: 'scorecards',
                    element: <Navigate to="/am/performance?tab=scorecards" replace />,
                  },
                  { path: 'activity', element: <AmActivityPage /> },
                  {
                    path: 'work-entries',
                    element: <Navigate to="/am/activity" replace />,
                  },
                  {
                    path: 'eod-reports',
                    element: <Navigate to="/am/activity?tab=reports" replace />,
                  },
                  {
                    path: 'performance-reviews',
                    element: <Navigate to="/am/performance" replace />,
                  },
                ],
              },
            ],
          },

          // Client portal
          {
            path: '/client',
            element: <RoleGuard roles={['client']} />,
            children: [
              {
                element: <DashboardLayout />,
                children: [
                  { path: 'dashboard', element: <ClientDashboardPage /> },
                  { path: 'work', element: <WorkActivityPage /> },
                ],
              },
            ],
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
