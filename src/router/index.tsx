import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { RoleGuard } from '@/components/shared/RoleGuard'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom'

// Auth (public)
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))

// VA portal
const VaDashboardPage = lazy(() => import('@/pages/va/VaDashboardPage'))
const AddWorkEntryPage = lazy(() => import('@/pages/va/AddWorkEntryPage'))
const WorkHistoryPage = lazy(() => import('@/pages/va/WorkHistoryPage'))
const EodSubmitPage = lazy(() => import('@/pages/va/EodSubmitPage'))
const EodHistoryPage = lazy(() => import('@/pages/va/EodHistoryPage'))

// Admin portal
const AdminDashboardPage = lazy(
  () => import('@/pages/admin/AdminDashboardPage')
)
const AssignmentManagementPage = lazy(
  () => import('@/pages/admin/AssignmentManagementPage')
)
const AccountManagementPage = lazy(
  () => import('@/pages/admin/AccountManagementPage')
)
const SurveyRemindersPage = lazy(
  () => import('@/pages/admin/SurveyRemindersPage')
)
const ScorecardsPage = lazy(() => import('@/pages/admin/ScorecardsPage'))
const WorkEntriesPage = lazy(() => import('@/pages/admin/WorkEntriesPage'))
const EodReportsPage = lazy(() => import('@/pages/admin/EodReportsPage'))

// Client portal
const ClientDashboardPage = lazy(
  () => import('@/pages/client/ClientDashboardPage')
)
const WorkActivityPage = lazy(() => import('@/pages/client/WorkActivityPage'))

// 404
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function SuspenseLayout() {
  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  )
}

const router = createBrowserRouter([
  {
    element: <SuspenseLayout />,
    children: [
      // Public routes
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },

      // Protected — must be authenticated
      {
        element: <ProtectedRoute />,
        children: [
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

          // Admin portal — admin + account_manager
          {
            path: '/admin',
            element: <RoleGuard roles={['admin', 'account_manager']} />,
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
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
