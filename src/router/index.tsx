import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))

// VA portal
const VaDashboardPage = lazy(() => import('@/pages/va/VaDashboardPage'))
const AddWorkEntryPage = lazy(() => import('@/pages/va/AddWorkEntryPage'))
const WorkHistoryPage = lazy(() => import('@/pages/va/WorkHistoryPage'))
const EodSubmitPage = lazy(() => import('@/pages/va/EodSubmitPage'))
const EodHistoryPage = lazy(() => import('@/pages/va/EodHistoryPage'))

// Admin portal
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AccountManagementPage = lazy(() => import('@/pages/admin/AccountManagementPage'))

// Client portal
const ClientDashboardPage = lazy(() => import('@/pages/client/ClientDashboardPage'))
const WorkActivityPage = lazy(() => import('@/pages/client/WorkActivityPage'))

// Fallback
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
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      {
        path: '/va',
        children: [
          { path: 'dashboard', element: <VaDashboardPage /> },
          { path: 'work/new', element: <AddWorkEntryPage /> },
          { path: 'work/history', element: <WorkHistoryPage /> },
          { path: 'eod/new', element: <EodSubmitPage /> },
          { path: 'eod/history', element: <EodHistoryPage /> },
        ],
      },
      {
        path: '/admin',
        children: [
          { path: 'dashboard', element: <AdminDashboardPage /> },
          { path: 'accounts', element: <AccountManagementPage /> },
        ],
      },
      {
        path: '/client',
        children: [
          { path: 'dashboard', element: <ClientDashboardPage /> },
          { path: 'work', element: <WorkActivityPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
