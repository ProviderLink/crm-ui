# CRM-UI — Deep Audit

> **Project**: `crm-ui` (package name: `ui`)
> **Generated**: 2026-07-09
> **Root**: `/ats-crm-workspace/crm-ui/`

---

## 1. Tech Stack & Config

| Layer          | Technology                                     | Version          |
| -------------- | ---------------------------------------------- | ---------------- |
| Framework      | React                                          | ^19.2.4          |
| Language       | TypeScript                                     | ~5.9.3           |
| Build          | Vite                                           | ^8.0.1           |
| Routing        | react-router-dom                               | ^7.13.2          |
| State (server) | @tanstack/react-query                          | ^5.99.2          |
| State (client) | Redux Toolkit + react-redux                    | ^2.11.2 / ^9.2.0 |
| Forms          | react-hook-form + zod + @hookform/resolvers    | ^7.72.0 / ^4.3.6 |
| Styling        | Tailwind CSS v4 + shadcn/ui (Radix primitives) | ^4.2.2           |
| HTTP           | axios                                          | ^1.14.0          |
| Tables         | @tanstack/react-table                          | ^8.21.3          |
| Charts         | recharts                                       | 2.15.4           |
| DnD            | @dnd-kit/core + sortable                       | ^6.3.1 / ^10.0.0 |
| Dates          | date-fns + react-day-picker                    | ^4.1.0 / ^9.14.0 |
| Notifications  | sonner                                         | ^2.0.7           |
| Icons          | lucide-react                                   | ^1.7.0           |
| Theming        | next-themes                                    | ^0.4.6           |

### Build config

- **Vite**: `@vitejs/plugin-react` + `@tailwindcss/vite` plugin. Path alias `@/` → `./src/`.
- **TypeScript**: 3-project composite setup (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`).
- **Deploy**: Vercel with SPA rewrite (`vercel.json` → all routes to `/index.html`).

### Environment

- Single required var: `VITE_API_URL` (e.g. `http://localhost:4000/api`).
- Optional dev quick-login vars: `VITE_DEV_VA_EMAIL`, `VITE_DEV_VA_PASSWORD`, etc.

---

## 2. Project Structure

```
src/
├── main.tsx                  # Entry: React 19 root, QueryClient + Redux Provider
├── App.tsx                   # AuthInitializer → AppRouter → Toaster
├── index.css                 # Tailwind import + theme tokens + shadcn CSS bridge
├── router/
│   └── index.tsx             # Single createBrowserRouter, lazy-loaded pages
├── layouts/
│   └── DashboardLayout.tsx   # Sidebar + header + <Outlet/> + nav progress bar
├── pages/
│   ├── HomePage.tsx          # Public landing
│   ├── NotFoundPage.tsx      # 404
│   ├── ProfilePage.tsx       # Shared profile (all roles)
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   └── AcceptInvitationPage.tsx
│   ├── va/                   # VA portal pages (5 pages)
│   ├── admin/                # Admin portal pages (10 pages)
│   ├── client/               # Client portal pages (2 pages)
├── components/
│   ├── ui/                   # 28 shadcn/ui primitives
│   ├── shared/               # AuthInitializer, ProtectedRoute, RoleGuard, ConfirmDialog, DataTable, StatCard
│   ├── performance-reviews/  # GenerateReviewModal
│   ├── app-sidebar.tsx       # Role-aware sidebar (nav config per role)
│   ├── app-logo.tsx          # Arista logo component
│   ├── site-header.tsx       # Top bar: sidebar trigger + date
│   ├── nav-main.tsx          # Sidebar nav list (active state from URL)
│   ├── nav-user.tsx          # Sidebar user menu (avatar, role badge, logout)
│   ├── nav-documents.tsx
│   ├── nav-secondary.tsx
│   ├── section-cards.tsx     # Placeholder stat cards (unused in prod)
│   └── data-table.tsx        # Generic table shell
├── services/                 # API layer (13 files, 1 per domain)
├── hooks/
│   ├── queries.ts            # Centralized React Query keys + hooks
│   ├── store.ts              # useAppDispatch / useAppSelector
│   ├── useMyAssignments.ts   # Wraps useMyAssignmentsQuery
│   ├── use-mobile.tsx        # useIsMobile (matchMedia 768px)
│   └── useCountUp.ts         # Animated counter
├── store/
│   ├── index.ts              # configureStore (auth only)
│   └── slices/
│       └── authSlice.ts      # Auth state: user, accessToken, isAuthenticated, isHydrated
├── types/                    # 9 type files (auth, work-entry, eod, assignment, ats, etc.)
└── lib/
    ├── api.ts                # Axios instance + interceptors (token attach, 401 refresh)
    ├── config.ts             # Validates VITE_API_URL
    ├── utils.ts              # cn() — clsx + twMerge
    └── time.ts               # formatMinutes, calcHours, todayString, nowTimeString
```

---

## 3. Authentication & Session

### Flow

1. **Startup**: `AuthInitializer` calls `/auth/refresh` (HttpOnly cookie) → gets access token → calls `/auth/me` → hydrates Redux auth store. Shows full-page spinner until hydrated.
2. **Login**: `LoginPage` → `login()` → `POST /auth/login` → stores user + accessToken in Redux (memory only, no localStorage).
3. **Token refresh**: Axios response interceptor — on 401, queues concurrent requests, calls `/auth/refresh`, replays queue with new token. On refresh failure → `clearAuth()` → redirect to `/login`.
4. **Logout**: `POST /auth/logout` (best-effort) + `clearAuth()` + navigate to `/login`.
5. **Password reset**: `/auth/forgot-password`, `/auth/reset-password`.
6. **Invitation**: `/auth/accept-invitation` page (no session required).

### State shape (Redux, `authSlice`)

```ts
{
  user: IUser | null,          // { id, email, name, role, atsId?, companyName? }
  accessToken: string | null,
  isAuthenticated: boolean,
  isHydrated: boolean           // false until initial refresh attempt completes
}
```

### Route protection

- `ProtectedRoute` — checks `isAuthenticated`, else redirects to `/login`.
- `RoleGuard` — checks `user.role` against allowed `roles[]`.

---

## 4. Routing Map

| Path                             | Component                            | Auth      | Roles             |
| -------------------------------- | ------------------------------------ | --------- | ----------------- |
| `/`                              | HomePage                             | Public    | —                 |
| `/login`                         | LoginPage                            | Public    | —                 |
| `/reset-password`                | ResetPasswordPage                    | Public    | —                 |
| `/accept-invitation`             | AcceptInvitationPage                 | Public    | —                 |
| `/profile`                       | ProfilePage                          | Protected | all               |
| `/va/dashboard`                  | VaDashboardPage                      | Protected | `va`              |
| `/va/work/new`                   | AddWorkEntryPage                     | Protected | `va`              |
| `/va/work/history`               | WorkHistoryPage                      | Protected | `va`              |
| `/va/eod/new`                    | EodSubmitPage                        | Protected | `va`              |
| `/va/eod/history`                | EodHistoryPage                       | Protected | `va`              |
| `/admin/dashboard`               | AdminDashboardPage                   | Protected | `admin`           |
| `/admin/assignments`             | AssignmentManagementPage             | Protected | `admin`           |
| `/admin/accounts`                | AccountManagementPage                | Protected | `admin`           |
| `/admin/account-managers`        | AccountManagersPage                  | Protected | `admin`           |
| `/admin/reminders`               | SurveyRemindersPage                  | Protected | `admin`           |
| `/admin/scorecards`              | ScorecardsPage                       | Protected | `admin`           |
| `/admin/work-entries`            | WorkEntriesPage                      | Protected | `admin`           |
| `/admin/eod-reports`             | EodReportsPage                       | Protected | `admin`           |
| `/admin/performance-reviews`     | PerformanceReviewsPage               | Protected | `admin`           |
| `/admin/performance-reviews/:id` | PerformanceReviewEditorPage          | Protected | `admin`           |
| `/am/dashboard`                  | AdminDashboardPage (shared)          | Protected | `account_manager` |
| `/am/assignments`                | AssignmentManagementPage (shared)    | Protected | `account_manager` |
| `/am/accounts`                   | AccountManagementPage (shared)       | Protected | `account_manager` |
| `/am/reminders`                  | SurveyRemindersPage (shared)         | Protected | `account_manager` |
| `/am/scorecards`                 | ScorecardsPage (shared)              | Protected | `account_manager` |
| `/am/work-entries`               | WorkEntriesPage (shared)             | Protected | `account_manager` |
| `/am/eod-reports`                | EodReportsPage (shared)              | Protected | `account_manager` |
| `/am/performance-reviews`        | PerformanceReviewsPage (shared)      | Protected | `account_manager` |
| `/am/performance-reviews/:id`    | PerformanceReviewEditorPage (shared) | Protected | `account_manager` |
| `/client/dashboard`              | ClientDashboardPage                  | Protected | `client`          |
| `/client/work`                   | WorkActivityPage                     | Protected | `client`          |
| `*`                              | NotFoundPage                         | —         | —                 |

> **Note**: Admin and account_manager share the same page components under different prefix paths. Sidebar navigation adapts per role via `roleConfigs` in `app-sidebar.tsx`.

---

## 5. API Layer

### Axios instance (`lib/api.ts`)

- `baseURL`: `VITE_API_URL` from env.
- `withCredentials: true` (sends HttpOnly cookies).
- **Request interceptor**: attaches `Authorization: Bearer <token>` from Redux.
- **Response interceptor**: transparent 401 → token refresh → replay failed request. Queues concurrent 401s to single refresh.

### Service modules (13 files)

| Service File                     | API Endpoints                                                                                                                        | CRUD               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| `auth.service.ts`                | `/auth/login`, `/auth/refresh`, `/auth/me`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password` | —                  |
| `work-entries.service.ts`        | `/work-entries` (GET list, POST create, PATCH update, DELETE)                                                                        | Full               |
| `eod-submissions.service.ts`     | `/eod-submissions` (GET list, POST create)                                                                                           | CR                 |
| `assignments.service.ts`         | `/assignments` (GET list, POST create, PATCH update, DELETE)                                                                         | Full               |
| `account-managers.service.ts`    | `/users?role=account_manager` (GET list, POST create, PATCH update)                                                                  | CRU                |
| `client-accounts.service.ts`     | `/client-accounts` (GET list, PATCH update)                                                                                          | RU                 |
| `ats.service.ts`                 | `/ats/clients`, `/ats/vas`, `/ats/team`                                                                                              | Read               |
| `scorecards.service.ts`          | `/scorecards` (GET list, POST generate)                                                                                              | R + generate       |
| `performance-reviews.service.ts` | `/performance-reviews` (GET list/detail, POST generate/regenerate, PATCH update/category)                                            | Full + AI generate |
| `reports.service.ts`             | `/reports/export` (GET blob download — CSV/Excel)                                                                                    | Export             |
| `survey-reminders.service.ts`    | `/survey-reminders` (GET list, PATCH update)                                                                                         | RU                 |
| `va-profiles.service.ts`         | `/va-profiles` (GET list, PATCH update)                                                                                              | RU                 |
| `admin.service.ts`               | `/admin/dashboard-stats`                                                                                                             | Read               |

### Data fetching pattern — React Query (`hooks/queries.ts`)

- **Query key factory**: `QK` object with deterministic keys per domain (e.g. `QK.workEntries`, `QK.scorecards(vaId)`).
- **Defaults**: `staleTime: 5min`, `gcTime: 30min`, `refetchOnWindowFocus: false`, `retry: 1`.
- **Hooks**: One `useXxxQuery` per resource, all exported from `queries.ts`.
- **Mutations**: Handled inline in page components using `useMutation` + `queryClient.invalidateQueries`.

---

## 6. Domain Types

| Type File               | Key Interfaces/Enums                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `auth.ts`               | `IUser`, `AuthState`, `UserRole` (`admin` \| `account_manager` \| `va` \| `client`)                             |
| `work-entry.ts`         | `IWorkEntry`, `WorkEntryCategory` (7 categories), `WorkEntryStatus` (`completed` \| `in_progress` \| `pending`) |
| `eod-submission.ts`     | `IEodSubmission` (shift start/end, hoursWorked, summary, pendingTasks, blockers)                                |
| `assignment.ts`         | `IAssignment` (va↔client link, status, accountManagerId, serviceType)                                           |
| `ats.ts`                | `IAtsClient`, `IAtsCandidate`, `IAtsUser` (read-only from ATS)                                                  |
| `client-account.ts`     | `IClientAccount` (healthStatus: green/yellow/red, BAA, onboarding, EMR, satisfaction)                           |
| `scorecard.ts`          | `IScorecard` (weekly: totalHours, productivityScore, eodComplianceRate, categoryDistribution)                   |
| `survey-reminder.ts`    | `ISurveyReminder` (3_day / 1_week / 30_day / monthly)                                                           |
| `va-profile.ts`         | `IVaProfile` (workloadLevel, burnoutRiskFlag, replacementRiskFlag)                                              |
| `performance-review.ts` | `IPerformanceReview`, `ReviewType` (6 types), `ReviewStatus`, `FinalRecommendation`, `RoleType` (14 VA roles)   |

---

## 7. UI Component Architecture

### shadcn/ui primitives (`components/ui/`)

28 Radix-based components: alert-dialog, avatar, badge, breadcrumb, button, calendar, card, chart, checkbox, date-picker-field, dialog, drawer, dropdown-menu, input, label, popover, select, separator, sheet, sidebar, skeleton, sonner, table, tabs, textarea, time-picker-field, toggle, toggle-group, tooltip.

### Shared components

- **AuthInitializer** — startup session hydration (calls `/auth/refresh` + `/auth/me`).
- **ProtectedRoute** — redirects unauthenticated users to `/login`.
- **RoleGuard** — restricts by `UserRole[]`, redirects mismatches to `/login`.
- **ConfirmDialog** — reusable confirmation modal.
- **DataTable** — generic table shell built on `@tanstack/react-table`.
- **StatCard** — metric display card.

### Layout

- **DashboardLayout**: `SidebarProvider` → `AppSidebar` + `SidebarInset` (header + scrollable `<Outlet/>`). Includes `NavProgress` bar during route transitions.
- **Sidebar**: Collapsible (`icon` mode). Role-aware navigation config. Sticky user menu with avatar, role badge, logout.
- **SiteHeader**: Sidebar trigger + current date display.

---

## 8. Cron Jobs & Background Tasks

**None in the frontend.** crm-ui is a pure SPA with no service workers, no background sync, and no scheduled tasks. All scheduled/automated work (scorecard generation, survey reminders, etc.) is handled by the backend (`crm-backend`).

---

## 9. Theming

- **CSS-first theming** via Tailwind v4 `@theme` + CSS custom properties.
- **Shadcn bridge**: `@theme inline` maps CSS vars (`--background`, `--primary`, etc.) to Tailwind tokens.
- **Dark mode**: `@custom-variant dark (&:is(.dark *))` — controlled by `next-themes`.
- **Brand colors**: `--color-lime` (#c7f33c), `--color-lime-pale` (#e1f2ae).
- **Status colors**: success (#10b981), warning (#f59e0b), error (#ef4444), info (#3b82f6).

---

## 10. Key Observations

1. **Single Redux slice**: Only `auth` is in Redux. All server state is in React Query. This is a clean separation.
2. **No lazy-loading boundaries beyond routes**: All pages are `React.lazy()` loaded at the router level, wrapped in a single `Suspense`.
3. **Admin & AM share pages**: The router mounts the same page components under `/admin/*` and `/am/*` paths. Sidebar navigation differs.
4. **No form library on login**: Login uses raw `useState` + `axios`, not `react-hook-form`.
5. **Token in memory only**: Access token never touches localStorage. Session survives refresh via HttpOnly cookie → `/auth/refresh`.
6. **No i18n, no analytics SDK, no error boundary** (beyond React Query's built-in retry).
7. **`section-cards.tsx`** has hardcoded placeholder data — appears to be a leftover from shadcn template.
8. **Dev quick-login**: Environment variables for dev credentials suggest a "quick login" feature in dev mode (not reviewed in page code — may be in `LoginPage.tsx`).
9. **No cron jobs**: Frontend only. Scheduled tasks are backend-side.
10. **Performance reviews** are the most complex feature — AI generation, category editing, goal regeneration, multi-status workflow, 14 VA role types, 6 review types.
