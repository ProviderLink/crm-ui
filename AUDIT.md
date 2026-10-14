# Arista CRM (frontend) — Full Codebase Audit

**Repo:** `ats-crm/crm` · **Audited:** 14 Oct 2026 · **Method:** read-only, every file read top to bottom (133 files, ~18,600 lines of TS/TSX plus config, CSS, docs; binary images inventoried for use). Nothing was built, run, edited or pushed.

**How to read this document**

- **Part A** is the synthesis: what the app is, structure, roles, backend connections, data model, and the ranked issue list.
- **Part B** is the detailed file-by-file audit: files read with line counts, per-file summary, route map, every flow by portal, UI/UX, styles, roles, every endpoint called, all types, dependencies, 30 numbered issues with `path:line`, and a status check of the earlier `CRM-UI-AUDIT.md`.
- Issue references like **[#6]** point to Part B §10. Backend references like **[BE-B #3]** point to the backend audit document.
- "Inferred" means reasoned from code, not observed at runtime.

**Limitations:** no dotfiles (`.env.example`, `.gitignore`) or `.git` in the copy, so env values and history were not checked.

---

# Part A — Synthesis

## A1. What the app is

The CRM is the post-hire side of the platform: it manages hired VAs (virtual assistants) and the client companies they work for. Users are **created in the ATS** (hiring a candidate provisions a VA login; creating an assignment provisions the client login); the CRM only reads them.

Four portals, one per role:
| Role | Prefix | Main jobs |
|---|---|---|
| VA | `/va` | Log work entries, submit the daily EOD (end-of-day) report, review history |
| Account Manager | `/am` | Same 10 pages as admin, reduced by `canManage = role === 'admin'` checks |
| Admin | `/admin` | Assignments (VA ↔ client), accounts (VA profiles, client accounts), survey reminders, scorecards, work entries, EOD reports, AI performance reviews, CSV/XLSX exports |
| Client | `/client` | Read-only dashboard and work activity of their VAs |

Public pages: `/`, `/login`, `/reset-password`, `/accept-invitation`.

## A2. Stack and dependencies

| Area         | Choice                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Framework    | React 19.2, TypeScript ~5.9 (strict on), Vite 8                                                                                |
| Routing      | react-router-dom 7, every page `lazy()` under one `<Suspense>`                                                                 |
| Auth state   | Redux Toolkit (single `auth` slice, token in memory)                                                                           |
| Server state | TanStack Query 5 (staleTime 5 min, gcTime 30 min, no refetch on focus)                                                         |
| HTTP         | axios with Bearer interceptor and queued single refresh on 401                                                                 |
| UI           | Tailwind 4 + shadcn on individual `@radix-ui/*` packages, lucide, sonner, react-day-picker, recharts **2.15.4** (ATS uses 3.8) |
| Forms        | react-hook-form + zod 4 on auth pages; local state elsewhere                                                                   |
| Unused       | `@dnd-kit/*`, `vaul`, `next-themes` (no provider), radix toggle/toggle-group                                                   |
| Missing      | `tw-animate-css` (all shadcn `animate-*` classes are no-ops), any test runner                                                  |

The ATS and CRM share almost nothing in code: different state libraries (Zustand vs Redux+Query), HTTP layers (fetch vs axios), Radix packaging, recharts major version, TypeScript major version, and visual language (ATS light/dark shadcn vs CRM dark-only monochrome). Only the backend contract ties them together.

## A3. Structure

```
crm/src
├── main.tsx, App.tsx (AuthInitializer + router + Toaster), index.css (dark-only tokens)
├── router/index.tsx        route map, ProtectedRoute + RoleGuard
├── layouts/DashboardLayout.tsx
├── pages/                  HomePage, NotFound, Profile, auth/*, va/*, admin/* (shared with AM), client/*
├── components/             sidebar/nav, shared/ (DataTable, ConfirmDialog, StatCard, guards), eod/, notes/, performance-reviews/, ui/ (shadcn)
├── services/               one file per backend resource (axios)
├── hooks/queries.ts        query-key factory QK + every useQuery hook
├── store/                  Redux auth slice
├── types/                  one file per domain
└── lib/                    api (axios), config, time helpers, utils
```

The layered `services → hooks/queries → pages` split is clean. The weak points are very large page files (`AccountManagementPage.tsx` 1,824 lines, `AssignmentManagementPage.tsx` 985, `PerformanceReviewEditorPage.tsx` 873), page-local copies of layout helpers (AuthShell, Section, Field, PageShell), and a lot of template leftovers (nav-documents, nav-secondary, geometric-bg, unused ui components, empty `favicon.svg` and `react.svg`, package name `"ui"`). Full tree with line counts: **§A9**.

## A4. Roles and permissions

- The front-end role is `roles[0]` of the backend user (`services/auth.service.ts` `mapUser`, default `'va'`), so multi-role users get whichever comes first and an ATS-first role breaks the redirect [#9].
- Guards: `ProtectedRoute` (logged in) and `RoleGuard([role])`, one role per portal; an admin cannot open `/am` or `/va`. Wrong role is sent to `/login`, not to their own home; there is no index route for `/va`, `/admin`, `/am`, `/client` [#8].
- Inside shared admin/AM pages, `canManage` hides create/edit/view of assignments, profile editing, review generate/edit/delete/complete, scorecard generation, survey reminder complete/skip and notes.
- **Mismatch with the backend:** the UI hides from AMs things the API allows (reviews, scorecards, reminders that are _assigned to_ AMs, profile edits) [#11], and calls endpoints AMs cannot use (`/shared/users` needs `team.read`), so AM filter dropdowns are empty (inferred) [#12]. The VA dashboard calls scorecards, which 403 for VAs [#12]. AMs cannot open assignment detail although the route exists [#7].

## A5. Connections to the backend

- Base `VITE_API_URL` (e.g. `http://localhost:4000/api/v1`); `config.ts` throws at import if missing.
- Auth: `POST /auth/login {app:'crm'}` → token in Redux; hydrate on load via `POST /auth/refresh-token {app:'crm'}` with the `refreshTokenCrm` httpOnly cookie; logout `POST /auth/logout {app:'crm'}`; invite via `/accept-invitation?token=` → `POST /auth/set-password`.
- Endpoints: ~50 calls across `/auth/*`, `/shared/users*`, `/crm/{dashboard, assignments, client-accounts, va-profiles, work-entries, eod-submissions, survey-reminders, scorecards, performance-reviews, reports}`, plus three ATS endpoints (`/ats/clients`, `/ats/candidates` with `limit=1000` and a 403 fallback to assignments, `/ats/clients/:id/notes`). Full table with methods and usage in Part B §7.
- **No sockets.** The backend emits `/crm` events (`eod:*`, `workEntry:*`, `assignment:*`, `performanceReview:*`) that nothing in the CRM listens to.
- **Contract problems:**
  - Error envelope: several handlers read `response.data.message` but the backend sends `response.data.error.message`, so server messages are lost [#10].
  - Lists cut at 20 rows: client accounts, VA profiles and survey reminders send no `limit`, backend default is 20 [#4].
  - Many screens fetch `limit=1000` and filter in the browser; backend does not cap or offer the needed filters (e.g. single assignment by id for the detail page) [#5].
  - The "generated every Sunday 11 PM" scorecard promise has no backend cron [#17]; EOD form sends `date`, contradicting BUSINESS_LOGIC [#16].
- Backend-side issues that directly affect CRM users (see backend audit): AM dashboard aggregates always empty because ids are not cast to ObjectId [BE-B #2]; VA can read admin notes and risk flags on their own profile [BE-B #1]; VA can backdate, edit or hard-delete EODs [BE-B #11]; regenerate-section prompts have no context and wipe ratings [BE-B #4].

## A6. Data model (frontend view)

`types/*.ts`: `IUser` (role admin/account_manager/va/client, clientRef), `IAssignment` (VA, client, AM, status active/paused/ended, schedule), `IWorkEntry` (7 categories, 3 statuses, minutes), `IEodSubmission` (dateKey, shift start/end, per-assignment entries, blockers, notes, client updates), `IEodContext`, `IClientAccount`, `IProvisionedClient`, `IHiredVa`, `IVaProfile`, `IScorecard`, `ISurveyReminder` (lacks the 60/90-day types the docs mention), `IPerformanceReview` (6 review types, 6 statuses, 6 final recommendations, 14 role types, 1–5 category ratings), notes. Full list: Part B §8.

## A7. UI/UX and styles — summary

- One dark monochrome theme (`<html class="dark">` hard-coded, no light palette). Status badges use identical classes for different statuses, so state is hard to read at a glance [#23].
- Broken styling: Tailwind v3 arbitrary-var syntax that v4 ignores (`calendar.tsx`, `chart.tsx`, `popover.tsx:20`), undefined tokens (`text-text-secondary`, `border-border-strong`), `hsl(var(--primary))` on hex tokens (dashboard chart has no fill), no animation plugin [#13, #22].
- Hard-coded hex colours everywhere bypass the tokens [#23].
- No error boundary; NavProgress never shows; ConfirmDialog loading state never visible; sidebar state not restored; time picker sets 12 AM if minutes typed first [#19, #26, #27, #29].
- Dates parsed as UTC in many places (one day early for users west of UTC); device "today" vs company "today" for EODs [#15].
- Accessibility: icon-only buttons without labels, mouse-only table rows [#21].

## A8. Consolidated issue list (ranked)

Part B has 30 numbered issues. Ranked summary:

### High

1. **Cached data leaks between users on the same tab.** Logout does a SPA navigate without `queryClient.clear()`, and most query keys are not user-scoped; a client logging in after an admin can see cached admin data for up to 30 min. [#2]
2. **Lists don't refresh after edit/delete** (query keys `['work-entries','anon']` don't match `['work-entries', uid]`). [#1]
3. **Silent truncation at 20 rows** for client accounts, VA profiles, survey reminders; assignment detail often can't find its own profile. [#4]
4. **Fetch-everything (`limit=1000`) and filter in the browser** on assignment detail, dashboards and work activity. [#5]
5. **Performance review editor wipes unsaved edits** whenever the review refetches; list not invalidated after save. [#6]
6. **First assignment for a new client may be impossible from the CRM** (dropdown lists only already-provisioned clients; provisioning happens on assignment create). Inferred; needs owner confirmation. [#3]

### Medium

7. AM cannot open assignment detail; "Go home" sends AMs to `/admin`; wrong-role users bounced to `/login`. [#7, #8]
8. `roles[0] ?? 'va'` role mapping; no clear "no CRM access" message. [#9]
9. Server error messages read from the wrong envelope path. [#10]
10. AM capabilities in the UI don't match the backend or BUSINESS_LOGIC (hidden actions, 403 calls). [#11, #12]
11. Dashboard chart fill invalid; Account Management "Add Profile" never opens; stale lists after profile save. [#13, #14]
12. UTC date parsing and device-vs-company "today". [#15]
13. Weak EOD / work-entry validation (no `timeSpent` max, same-day-only duplicate check). [#16]

### Low

Scorecard copy promises a cron that doesn't exist; survey reminders show raw user ids and overdue badges on completed items; ConfirmDialog loading invisible; EOD sheet mislabels blockers/notes as client-facing; accessibility gaps; v3 Tailwind syntax and undefined tokens; hard-coded hex; dead code and unused deps; favicon type mismatch and empty asset files; NavProgress never shows; sidebar cookie never read; sonner theme without provider; no error boundary; BUSINESS_LOGIC.md drift. [#17–#30]

### Ambiguities that need an owner decision

- Is the first assignment for a new client created in the ATS or the CRM? [#3]
- What exactly may an Account Manager do (docs vs UI vs API all differ)? [#11]
- Should the EOD form choose the date, or is it always "today" in company time? [#16, BE-B #11]
- Should VAs see draft/AI-generated reviews, and should clients ever see reviews (`sent_to_client` status exists)? [BE-B #18]

### Status of earlier audits

- `CRM-UI-AUDIT.md` (2026-07-09): many items outdated (routes and endpoint names changed, login now uses RHF+zod, dev quick-login removed); still true: single auth slice, lazy routes under one Suspense, shared admin/AM pages, RoleGuard → `/login`, no error boundary, dark-only with hard-coded colours, no tests. Part B §11.
- `AUDIT-2026-10-08.md` CRM items: `VITE_DEV_*` quick-login vars no longer read in `src`; no security headers in `vercel.json` (still open).

---

## A9. File tree (line counts in parentheses)

```
crm/
├── dist/  (committed build output, 73 files — not expanded)
├── public/
│   ├── assets/
│   │   └── patterns/
│   │       └── dark-square-four-triangle.svg  [0 KB]
│   ├── arista_crm.png  [9 KB]
│   ├── favicon.svg  [9 KB]
│   └── icons.svg  [4 KB]
├── src/
│   ├── assets/
│   │   ├── arista_crm.png  [9 KB]
│   │   ├── hero.png  [43 KB]
│   │   ├── react.svg  [4 KB]
│   │   └── vite.svg  [8 KB]
│   ├── components/
│   │   ├── eod/
│   │   │   └── EodDetailSheet.tsx  (211)
│   │   ├── notes/
│   │   │   └── NotesThread.tsx  (205)
│   │   ├── performance-reviews/
│   │   │   └── GenerateReviewModal.tsx  (505)
│   │   ├── shared/
│   │   │   ├── AuthInitializer.tsx  (43)
│   │   │   ├── ConfirmDialog.tsx  (65)
│   │   │   ├── DataTable.tsx  (319)
│   │   │   ├── ProtectedRoute.tsx  (7)
│   │   │   ├── RoleGuard.tsx  (14)
│   │   │   └── StatCard.tsx  (51)
│   │   ├── ui/
│   │   │   ├── alert-dialog.tsx  (139)
│   │   │   ├── avatar.tsx  (48)
│   │   │   ├── badge.tsx  (35)
│   │   │   ├── breadcrumb.tsx  (115)
│   │   │   ├── button.tsx  (57)
│   │   │   ├── calendar.tsx  (211)
│   │   │   ├── card.tsx  (83)
│   │   │   ├── chart.tsx  (369)
│   │   │   ├── checkbox.tsx  (30)
│   │   │   ├── date-picker-field.tsx  (67)
│   │   │   ├── dialog.tsx  (120)
│   │   │   ├── drawer.tsx  (118)
│   │   │   ├── dropdown-menu.tsx  (198)
│   │   │   ├── input.tsx  (22)
│   │   │   ├── label.tsx  (24)
│   │   │   ├── popover.tsx  (30)
│   │   │   ├── select.tsx  (158)
│   │   │   ├── separator.tsx  (29)
│   │   │   ├── sheet.tsx  (141)
│   │   │   ├── sidebar.tsx  (772)
│   │   │   ├── skeleton.tsx  (15)
│   │   │   ├── sonner.tsx  (45)
│   │   │   ├── table.tsx  (117)
│   │   │   ├── tabs.tsx  (55)
│   │   │   ├── textarea.tsx  (22)
│   │   │   ├── time-picker-field.tsx  (173)
│   │   │   ├── toggle-group.tsx  (59)
│   │   │   ├── toggle.tsx  (44)
│   │   │   └── tooltip.tsx  (28)
│   │   ├── app-logo.tsx  (40)
│   │   ├── app-sidebar.tsx  (152)
│   │   ├── geometric-bg.tsx  (77)
│   │   ├── nav-documents.tsx  (83)
│   │   ├── nav-main.tsx  (94)
│   │   ├── nav-secondary.tsx  (40)
│   │   ├── nav-user.tsx  (148)
│   │   └── site-header.tsx  (27)
│   ├── hooks/
│   │   ├── queries.ts  (259)
│   │   ├── store.ts  (6)
│   │   ├── use-mobile.tsx  (19)
│   │   ├── useCountUp.ts  (31)
│   │   └── useMyAssignments.ts  (6)
│   ├── layouts/
│   │   └── DashboardLayout.tsx  (40)
│   ├── lib/
│   │   ├── api.ts  (103)
│   │   ├── config.ts  (8)
│   │   ├── time.ts  (106)
│   │   └── utils.ts  (6)
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AccountManagementPage.tsx  (1824)
│   │   │   ├── AdminDashboardPage.tsx  (383)
│   │   │   ├── AssignmentDetailPage.tsx  (653)
│   │   │   ├── AssignmentManagementPage.tsx  (985)
│   │   │   ├── EodReportsPage.tsx  (424)
│   │   │   ├── PerformanceReviewEditorPage.tsx  (873)
│   │   │   ├── PerformanceReviewsPage.tsx  (450)
│   │   │   ├── ScorecardsPage.tsx  (251)
│   │   │   ├── SurveyRemindersPage.tsx  (276)
│   │   │   └── WorkEntriesPage.tsx  (333)
│   │   ├── auth/
│   │   │   ├── AcceptInvitationPage.tsx  (201)
│   │   │   ├── LoginPage.tsx  (204)
│   │   │   └── ResetPasswordPage.tsx  (297)
│   │   ├── client/
│   │   │   ├── ClientDashboardPage.tsx  (559)
│   │   │   └── WorkActivityPage.tsx  (400)
│   │   ├── va/
│   │   │   ├── AddWorkEntryPage.tsx  (451)
│   │   │   ├── EodHistoryPage.tsx  (285)
│   │   │   ├── EodSubmitPage.tsx  (706)
│   │   │   ├── VaDashboardPage.tsx  (297)
│   │   │   └── WorkHistoryPage.tsx  (511)
│   │   ├── HomePage.tsx  (204)
│   │   ├── NotFoundPage.tsx  (33)
│   │   └── ProfilePage.tsx  (186)
│   ├── router/
│   │   └── index.tsx  (210)
│   ├── services/
│   │   ├── account-managers.service.ts  (74)
│   │   ├── admin.service.ts  (43)
│   │   ├── assignments.service.ts  (60)
│   │   ├── ats.service.ts  (76)
│   │   ├── auth.service.ts  (82)
│   │   ├── client-accounts.service.ts  (39)
│   │   ├── eod-submissions.service.ts  (68)
│   │   ├── jobs.service.ts  (15)
│   │   ├── notes.service.ts  (53)
│   │   ├── performance-reviews.service.ts  (228)
│   │   ├── reports.service.ts  (38)
│   │   ├── scorecards.service.ts  (25)
│   │   ├── survey-reminders.service.ts  (23)
│   │   ├── va-profiles.service.ts  (47)
│   │   └── work-entries.service.ts  (57)
│   ├── store/
│   │   ├── slices/
│   │   │   └── authSlice.ts  (57)
│   │   └── index.ts  (11)
│   ├── types/
│   │   ├── assignment.ts  (35)
│   │   ├── ats.ts  (44)
│   │   ├── auth.ts  (16)
│   │   ├── client-account.ts  (41)
│   │   ├── eod-submission.ts  (88)
│   │   ├── note.ts  (32)
│   │   ├── performance-review.ts  (181)
│   │   ├── scorecard.ts  (17)
│   │   ├── survey-reminder.ts  (20)
│   │   ├── va-profile.ts  (23)
│   │   └── work-entry.ts  (56)
│   ├── App.css  (1)
│   ├── App.tsx  (12)
│   ├── index.css  (193)
│   └── main.tsx  (28)
├── BUSINESS_LOGIC.md  (157)
├── components.json  (21)
├── CRM-UI-AUDIT.md  (272)
├── eslint.config.js  (23)
├── index.html  (19)
├── package.json  (79)
├── pnpm-lock.yaml  [153 KB]
├── README.md  (43)
├── tsconfig.app.json  (33)
├── tsconfig.json  (13)
├── tsconfig.node.json  (26)
├── vercel.json  (5)
└── vite.config.ts  (13)
```

---

# Part B — Detailed audit

## CRM — complete file-by-file audit

Auditor scope: everything under `crm` except `dist/`, `pnpm-lock.yaml` and binary image contents. I only read files; nothing was built or run. All paths below are relative to `crm/` unless they start with `backend/`. "Inferred" means I reasoned it from the code and did not watch it happen at runtime.

---

### 1. Scope covered (every file + line count)

132 files are in scope. All text files were read in full.

**Root / config / docs**
| File | Lines |
|---|---|
| package.json | 79 |
| vite.config.ts | 13 |
| tsconfig.json | 13 |
| tsconfig.app.json | 33 |
| tsconfig.node.json | 26 |
| eslint.config.js | 23 |
| components.json | 21 |
| index.html | 19 |
| vercel.json | 5 |
| README.md | 43 |
| BUSINESS_LOGIC.md | 157 |
| CRM-UI-AUDIT.md | 272 |

**public/**: arista_crm.png (binary, 512x512), favicon.svg (0, empty), icons.svg (24), assets/patterns/dark-square-four-triangle.svg (8)

**src/ root**: main.tsx 28, App.tsx 12, App.css 1, index.css 193

**src/assets/**: arista_crm.png (binary), hero.png (binary), react.svg (0, empty), vite.svg (1)

**src/router**: index.tsx 210 · **src/layouts**: DashboardLayout.tsx 40

**src/lib**: api.ts 103, config.ts 8, time.ts 106, utils.ts 6

**src/store**: index.ts 11, slices/authSlice.ts 57

**src/hooks**: queries.ts 259, store.ts 6, use-mobile.tsx 19, useCountUp.ts 31, useMyAssignments.ts 6

**src/services**: account-managers 74, admin 43, assignments 60, ats 76, auth 82, client-accounts 39, eod-submissions 68, jobs 15, notes 53, performance-reviews 228, reports 38, scorecards 25, survey-reminders 23, va-profiles 47, work-entries 57 (all `*.service.ts`)

**src/types**: assignment 35, ats 44, auth 16, client-account 41, eod-submission 88, note 32, performance-review 181, scorecard 17, survey-reminder 20, va-profile 23, work-entry 56

**src/components (non-ui)**: app-logo 40, app-sidebar 152, geometric-bg 77, nav-documents 83, nav-main 94, nav-secondary 40, nav-user 148, site-header 27, eod/EodDetailSheet 211, notes/NotesThread 205, performance-reviews/GenerateReviewModal 505, shared/AuthInitializer 43, shared/ConfirmDialog 65, shared/DataTable 319, shared/ProtectedRoute 7, shared/RoleGuard 14, shared/StatCard 51

**src/components/ui** (3,324 lines in total): alert-dialog 139, avatar 48, badge 35, breadcrumb 115, button 57, calendar 211, card 83, chart 369, checkbox 30, date-picker-field 67, dialog 120, drawer 118, dropdown-menu 198, input 22, label 24, popover 30, select 158, separator 29, sheet 141, sidebar 772, skeleton 15, sonner 45, table 117, tabs 55, textarea 22, time-picker-field 173, toggle-group 59, toggle 44, tooltip 28

**src/pages**: HomePage 204, NotFoundPage 33, ProfilePage 186; auth/AcceptInvitationPage 201, auth/LoginPage 204, auth/ResetPasswordPage 297; va/VaDashboardPage 297, va/AddWorkEntryPage 451, va/WorkHistoryPage 511, va/EodSubmitPage 706, va/EodHistoryPage 285; admin/AccountManagementPage 1824, admin/AdminDashboardPage 383, admin/AssignmentDetailPage 653, admin/AssignmentManagementPage 985, admin/EodReportsPage 424, admin/PerformanceReviewEditorPage 873, admin/PerformanceReviewsPage 450, admin/ScorecardsPage 251, admin/SurveyRemindersPage 276, admin/WorkEntriesPage 333; client/ClientDashboardPage 559, client/WorkActivityPage 400

**Asset usage (from grep across src/ and index.html)**

- `public/arista_crm.png` is the favicon (`index.html`). The link declares `type="image/svg+xml"` for a PNG, which is a mismatch.
- `src/assets/arista_crm.png` is used by `components/app-logo.tsx`.
- `public/assets/patterns/dark-square-four-triangle.svg` is the background pattern on HomePage, LoginPage, ResetPasswordPage and AcceptInvitationPage.
- **Unused** (zero references): `public/favicon.svg` (empty file), `public/icons.svg` (Vite template social icons), `src/assets/hero.png`, `src/assets/react.svg` (empty), `src/assets/vite.svg`.

---

### 2. Per-folder / per-file summary

#### Config

- **package.json**:
  - The package name is still `"ui"` (template leftover).
  - Stack: React 19, Vite 8, TS ~5.9, react-router-dom 7, @reduxjs/toolkit, @tanstack/react-query 5, @tanstack/react-table, axios, react-hook-form + zod 4, Radix primitives, recharts 2.15.4, sonner, date-fns, react-day-picker 9, lucide, Tailwind v4 (`@tailwindcss/vite`), class-variance-authority, tailwind-merge.
  - Also present: `@dnd-kit/*` (zero imports in src), `vaul` (only `ui/drawer.tsx`, itself unused) and `next-themes` (only `ui/sonner.tsx`, with no ThemeProvider mounted).
  - A pnpm override pins lodash.
- **vite.config.ts**: React and Tailwind plugins, alias `@` → `src`. No dev proxy.
- **tsconfig.app.json**: strict mode with `noUnusedLocals`/`noUnusedParameters`, paths `@/*`. **tsconfig.node.json**: covers vite.config. **tsconfig.json**: references both.
- **eslint.config.js**: flat config with js, typescript-eslint, react-hooks and react-refresh; ignores dist.
- **components.json**: shadcn, style default, baseColor slate, cssVariables, aliases `@/components`, `@/lib/utils`.
- **index.html**: `<html class="dark">`, title, the favicon mismatch above, Google Fonts (Inter + JetBrains Mono).
- **vercel.json**: SPA rewrite of everything to `/index.html`.
- **README.md**:
  - Tells you to `cp .env.example .env`, but `.env.example` is not in this copy.
  - Documents `VITE_API_URL` (example `http://localhost:4000/api/v1`).
- **BUSINESS_LOGIC.md**: the domain write-up (roles, work entries, EOD, assignments, client accounts, surveys, scorecards, reviews, caching). Several claims are wrong; see Issues.
- **CRM-UI-AUDIT.md**: an earlier audit dated 2026-07-09. Its status is in §11.

#### src root

- **main.tsx**:
  - Creates the QueryClient with `staleTime` 5 min, `gcTime` 30 min, `refetchOnWindowFocus: false`, `retry: 1`.
  - Wraps the app in Redux Provider and QueryClientProvider inside StrictMode.
- **App.tsx**: `<AuthInitializer><AppRouter/></AuthInitializer>` plus `<Toaster position="bottom-right">`.
- **App.css**: a single comment; effectively empty.
- **index.css**: Tailwind v4 entry with dark-only tokens; details in §5.

#### lib

- **api.ts**:
  - Axios instance with `baseURL` from config and `withCredentials`.
  - The request interceptor attaches `Bearer` from Redux.
  - The response interceptor handles 401 for any request except refresh: it queues concurrent requests, calls `POST /auth/refresh-token {app:'crm'}` once, then replays them.
  - If the refresh fails: `clearAuth()` and `window.location.href='/login'` (api.ts:56-62, 94-95). The redirect is skipped during hydration.
- **config.ts**: throws at import time if `VITE_API_URL` is missing.
- **time.ts**:
  - `formatMinutes`, `calcHours` and `computeShiftHours` (the last two are identical, and the doc comment saying "Unlike calcHours" is stale).
  - `todayString` (device local date), `formatDateKeyShort/Long`, `addDaysToDateKey`, `weekdayOfDateKey`, `nowTimeString`.
- **utils.ts**: `cn()`.

#### store

- **index.ts**: `configureStore` with the auth reducer only.
- **authSlice.ts**:
  - State: `{user, accessToken, isHydrated}`.
  - Reducers: `setAuth`, `setUser` (identical bodies), `setAccessToken`, `setHydrated`, `clearAuth`.
  - The token lives in memory only, and refresh relies on an httpOnly cookie (inferred from `withCredentials`).

#### hooks

- **queries.ts**: the query-key factory `QK` (queries.ts:40-70) and every useQuery hook.
  - Only work entries, EOD submissions and the three assignment keys include the user id.
  - Four hooks are never used: `useAtsTeamQuery`, `useAtsJobsQuery`, `useClientAccountsQuery`, `useVaProfilesQuery`.
- **store.ts**: typed `useAppDispatch` / `useAppSelector`.
- **use-mobile.tsx**: matchMedia below 768px; used only by `ui/sidebar`.
- **useCountUp.ts**: rAF counter whose frame is never cancelled on unmount. It has no importers (dead).
- **useMyAssignments.ts**: thin wrapper over `useMyAssignmentsQuery`, used by AddWorkEntryPage and EodSubmitPage.

#### services

The full endpoint list is in §7. Notes per service:

- **account-managers**: AM and user lists via `/shared/users` (needs the `team.read` permission). The crm-accounts list goes to `/shared/users/crm-accounts`.
- **admin**: `getDashboardStats` and the `IDashboardStats` type.
- **assignments**: CRUD. `deleteAssignment` is never called.
- **ats**:
  - ATS clients and candidates with `limit=1000`, falling back to `/crm/assignments` on 403 and building pseudo-lists from it.
  - `getAtsTeam` → `/shared/users`.
- **auth**:
  - login, refresh/hydrate, logout (best-effort with a catch), forgot, reset, change and set password.
  - `mapUser` takes `role = roles[0] ?? 'va'`.
- **client-accounts**: provisioned list, list (no limit), hired-vas, PATCH.
- **eod-submissions**: list (`limit=1000`), context, create, delete, get.
- **jobs**: `GET /ats/jobs`, unused.
- **notes**: client notes (ATS) and VA notes (CRM).
- **performance-reviews**:
  - Full CRUD, complete, regenerate a section, and PDF export as a blob download.
  - Maps label dictionaries for type and status.
- **reports**: three CSV/XLSX export endpoints. They return a blob that the page downloads.
- **scorecards**: list and generate.
- **survey-reminders**: list (no limit) and PATCH.
- **va-profiles**: list (no limit), PATCH, and `getVaAssignments`.
- **work-entries**: list (`limit=1000`), create, PATCH. `deleteWorkEntry` is never called.

#### types

See §8.

#### router / layouts

- **router/index.tsx**: route map in §3.1. Every page is `lazy()`, all under a single `<Suspense>`.
- **DashboardLayout.tsx**:
  - `SidebarProvider`, `AppSidebar`, `SiteHeader`, `<Outlet/>`.
  - The `NavProgress` bar is driven by `useNavigation()`. That state never becomes "loading" because no routes have loaders, so the bar never shows (inferred).

#### components (non-ui)

- **app-logo**: logo image plus "Arista CRM" text.
- **app-sidebar**: a `roleConfigs` map from role to nav items:
  - VA: Dashboard, Add Work, Work History, Submit EOD, EOD History.
  - Admin and AM: Dashboard, Assignments, Accounts, Survey Reminders, Scorecards, Work Entries, EOD Reports, Performance Reviews.
  - Client: Dashboard, Work Activity.
- **nav-main**: renders nav items with an active state by path prefix.
- **nav-user**: avatar dropdown with Profile and Logout. Logout is `logout()` → `clearAuth()` → `navigate('/login')` (nav-user.tsx:67-71). It does not clear the query cache.
- **site-header**: sidebar trigger, page title, device date. `bg-[#0D0D0D]` is hard-coded.
- **nav-documents, nav-secondary, geometric-bg**: zero importers (template leftovers).
- **shared/AuthInitializer**:
  - On mount, calls `hydrateAuth()`, which does a refresh-token request.
  - Sets the user and token, then `setHydrated`. Shows a spinner until hydrated.
- **shared/ProtectedRoute**: redirects to `/login` when there is no user.
- **shared/RoleGuard**: a user without an allowed role is sent to `/login`, not to their own home.
- **shared/ConfirmDialog**: AlertDialog wrapper with a `loading` prop. The Radix Action closes the dialog on click, so the loading text never shows.
- **shared/DataTable**:
  - Generic @tanstack/react-table wrapper: sorting, global filter, pagination, row click, loading skeleton, empty state.
  - The error box uses hard-coded colours.
- **shared/StatCard**: card with label, value, hint and skeleton.
- **notes/NotesThread**: shows and adds notes for a client (ATS) or a VA (CRM). Admin only. Reads errors from `response.data.message`, which is the wrong envelope.
- **eod/EodDetailSheet**:
  - Sheet showing one EOD: entries, totals, blockers, notes, client updates.
  - Mislabels blockers as "Blockers / Client Updates" and notes as "Notes for Client".
  - Uses the wrong error envelope.
- **performance-reviews/GenerateReviewModal**:
  - Dialog to create an AI review: VA and client selection, type, period dates, role type, extra context.
  - Calls POST, then navigates to the editor.

#### components/ui

Standard shadcn components with local restyling (dark hex tokens).

- **Unused**: drawer, breadcrumb, table, toggle, toggle-group (toggle-group is imported only by toggle).
- **Used**: alert-dialog (ConfirmDialog), avatar (nav-user), badge, button, calendar (via date-picker-field), card, chart (AdminDashboard only), checkbox (AccountManagement), date-picker-field (12 pages), dialog (GenerateReviewModal), dropdown-menu (nav-user), input, label, popover, select, separator, sheet, sidebar, skeleton, sonner, tabs, textarea, time-picker-field (AddWorkEntry, EodSubmit), tooltip.
- **time-picker-field.tsx**: custom 24-hour list plus a minute box. The minute input applies when 2 digits are typed or on blur. If no hour is selected, typing minutes silently selects 00 (12 AM) (time-picker-field.tsx:61,70,78).
- **sidebar.tsx**:
  - shadcn sidebar with cookie persistence (`sidebar_state`). The cookie is written but never read back, since `defaultOpen` is not wired to it (sidebar.tsx:92, 65).
  - Ctrl/Cmd+B toggles the sidebar.
  - The outline variant uses `hsl(var(--sidebar-border))` while the tokens are hex/rgba, so the shadow is invalid (sidebar.tsx:529).
  - Uses the v3 `theme(spacing.4)` syntax (sidebar.tsx:238,250).
- **sonner.tsx**: `useTheme()` from next-themes with no provider, so the theme defaults to `'system'`. On a light-mode OS, sonner may switch to its light theme (inferred). The classNames partly override this.
- **popover.tsx:20**: `origin-[--radix-popover-content-transform-origin]` is v3 bare-var syntax, invalid in v4. Other components use `var(...)`.

#### pages

Feature details are in §3.

- **HomePage**: public landing page with a CTA to `/login`. If logged in, it links to the role dashboard.
- **NotFoundPage**: "Go home" link picked by role. The AM mapping is wrong; see Issues.
- **ProfilePage**: shows name, email and role, plus a change-password form (current, new, confirm). Errors show `err.message`, which is axios's generic text.
- **auth/LoginPage**: RHF + zod login. Redirects to `roleRedirect[user.role]` and includes a forgot-password flow.
- **auth/ResetPasswordPage**:
  - Without a `token` query param: a "request reset link" form.
  - With one: a new-password form, validated with zod (min 8, confirm).
- **auth/AcceptInvitationPage**: `token` param → set-password form → `POST /auth/set-password` → login.
- The **va/**, **admin/** (shared by admin and AM) and **client/** pages are covered in §3.

---

### 3. Features & user flows

#### 3.1 Route map (router/index.tsx)

| Path                                   | Page                          | Guard                                     |
| -------------------------------------- | ----------------------------- | ----------------------------------------- |
| `/`                                    | HomePage                      | public                                    |
| `/login`                               | LoginPage                     | public (no redirect if already logged in) |
| `/reset-password`                      | ResetPasswordPage             | public                                    |
| `/accept-invitation`                   | AcceptInvitationPage          | public                                    |
| `/profile`                             | ProfilePage (DashboardLayout) | ProtectedRoute (any role)                 |
| `/va/dashboard`                        | VaDashboardPage               | ProtectedRoute + RoleGuard['va']          |
| `/va/work/new`                         | AddWorkEntryPage              | RoleGuard['va']                           |
| `/va/work/history`                     | WorkHistoryPage               | RoleGuard['va']                           |
| `/va/eod/new`                          | EodSubmitPage                 | RoleGuard['va']                           |
| `/va/eod/history`                      | EodHistoryPage                | RoleGuard['va']                           |
| `/admin/dashboard`                     | AdminDashboardPage            | RoleGuard['admin']                        |
| `/admin/assignments`                   | AssignmentManagementPage      | RoleGuard['admin']                        |
| `/admin/assignments/:id`               | AssignmentDetailPage          | RoleGuard['admin']                        |
| `/admin/accounts`                      | AccountManagementPage         | RoleGuard['admin']                        |
| `/admin/reminders`                     | SurveyRemindersPage           | RoleGuard['admin']                        |
| `/admin/scorecards`                    | ScorecardsPage                | RoleGuard['admin']                        |
| `/admin/work-entries`                  | WorkEntriesPage               | RoleGuard['admin']                        |
| `/admin/eod-reports`                   | EodReportsPage                | RoleGuard['admin']                        |
| `/admin/performance-reviews`           | PerformanceReviewsPage        | RoleGuard['admin']                        |
| `/admin/performance-reviews/:id`       | PerformanceReviewEditorPage   | RoleGuard['admin']                        |
| `/am/*` (same 10 children as `/admin`) | same page components          | RoleGuard['account_manager']              |
| `/client/dashboard`                    | ClientDashboardPage           | RoleGuard['client']                       |
| `/client/work`                         | WorkActivityPage              | RoleGuard['client']                       |
| `*`                                    | NotFoundPage                  | public                                    |

- There is no index route for `/va`, `/admin`, `/am` or `/client`, so visiting a bare `/admin` falls to `*`.
- Admin and AM share page components. Pages switch behaviour on `user.role === 'admin'` (the "canManage" pattern).

#### 3.2 Authentication flows

- **Login**:
  - `POST /auth/login {email,password,app:'crm'}`, then `setAuth`, then navigate to the role home (LoginPage.tsx:48).
  - A backend 403 (no CRM app access) shows a generic error message.
- **Hydrate**: AuthInitializer → `POST /auth/refresh-token {app:'crm'}` with the cookie. Success sets the user; failure leaves the user null. Then `setHydrated`.
- **Forgot / reset**:
  - Forgot: `POST /auth/forgot-password {email}`.
  - The email link opens `/reset-password?token=`, which sends `POST /auth/reset-password {token,password}`.
- **Invitation**: `/accept-invitation?token=` → `POST /auth/set-password`. Clients and VAs are invited when an assignment is created (backend).
- **Change password**: ProfilePage → `POST /auth/change-password`.
- **Logout**: `POST /auth/logout` (best effort) → clearAuth → navigate. The query cache stays.

#### 3.3 VA portal (/va)

- **Dashboard** (VaDashboardPage):
  - Data: my assignments, work entries, EOD submissions, scorecards (scorecards return 403 for VAs, so the card shows N/A, VaDashboardPage.tsx:56).
  - Shows "Entries Today", hours this week, the latest EOD, assignment cards and recent entries.
  - "Today" and "week" use the device date (VaDashboardPage.tsx:61-66).
- **Add work entry** (AddWorkEntryPage):
  - Pick an active assignment, then enter date, start/end or minutes, category (7), description and status (3).
  - Sends `POST /crm/work-entries`, then invalidates `['work-entries']`.
  - There is no upper bound on timeSpent; the backend limit is 1–480.
- **Work history** (WorkHistoryPage):
  - Filterable table (date range defaults use UTC `toISOString`).
  - An edit sheet sends `PATCH /crm/work-entries/:id`, but the list does not refresh (key mismatch, issue 1).
- **Submit EOD** (EodSubmitPage):
  - Loads `GET /crm/eod-submissions/context`, which returns today's company date, shift and assignment info.
  - The form builds per-assignment entries (task, time, category), blockers, notes, client updates and shift times (using `calcHours`).
  - Sends `POST /crm/eod-submissions` with `date` included, which contradicts BUSINESS_LOGIC's "form sends no date".
  - The already-submitted check only looks at today's EODs.
- **EOD history** (EodHistoryPage):
  - Table of submissions; clicking a row opens EodDetailSheet.
  - Delete uses `DELETE /crm/eod-submissions/:id`, but the list does not refresh (issue 1).

#### 3.4 Admin portal (/admin)

- **Dashboard**:
  - `GET /crm/dashboard`: overview counts, EOD compliance, assignment health, weekly work hours (recharts) and a per-VA breakdown table.
  - Has a date-range picker.
- **Assignments** (AssignmentManagementPage):
  - Lists all assignments (`limit=1000`).
  - Create form: client (provisioned clients only), VA (ATS candidates), AM, start date, schedule and notes.
  - Edit sends PATCH with status, AM and notes. "View" goes to the detail page.
- **Assignment detail**:
  - Header, then tabs for work entries, EODs, reviews and notes.
  - Data comes from fetching everything and filtering on the client (issue 5).
- **Accounts** (AccountManagementPage):
  - Tabs for VAs and Clients. Profiles come from `GET /crm/va-profiles` and `/crm/client-accounts` (20-row default, issue 4).
  - Health and workload enrichment, a profile edit sheet (`PATCH /crm/va-profiles/:id`, `PATCH /crm/client-accounts/:id`) and the NotesThread.
- **Survey reminders**: `GET /crm/survey-reminders` (20-row default), then mark complete or skip via `PATCH /crm/survey-reminders/:id`.
- **Scorecards**: `GET /crm/scorecards` filtered by VA. "Generate" sends `POST /crm/scorecards/generate`.
- **Work entries / EOD reports**:
  - Cross-VA tables filtered by VA, client and date range.
  - Export goes to `GET /crm/reports/*/export` as a blob.
- **Performance reviews**:
  - List with filters. GenerateReviewModal creates a review.
  - The editor edits per-category ratings and comments, summary, recommendation and goals.
  - Regenerating a section sends `POST /:id/regenerate`. Complete sends PATCH `/:id/complete`. Also delete and PDF export.

#### 3.5 Account Manager portal (/am)

Uses the same 10 pages as admin, with reduced UI because `canManage = role==='admin'`:

- **Assignments**: the actions column, including View, is hidden, so AMs cannot open `/am/assignments/:id` from the UI (AssignmentManagementPage.tsx:183). The backend scopes data to the AM's own assignments (inferred from the `accountManagerId` filter).
- **Reviews and scorecards**: Generate, Edit and Delete are hidden. Survey reminders cannot be completed, even though they are assigned to AMs.
- **Accounts**: profile editing is hidden. Calls to `/shared/users` return 403 for AMs (no team.read), so the AM and admin lists fail (inferred).
- **Filters on reports and reviews pages**: the client filter depends on `/shared/users?role=client`, which returns 403, so the dropdown is empty (inferred).

#### 3.6 Client portal (/client)

- **Dashboard** (ClientDashboardPage):
  - My assignments (my-all), hired VAs (`GET /crm/client-accounts/:id/hired-vas`), work entries and EODs (`limit=1000`).
  - Per-VA cards, the latest EOD and hours this week.
  - Date keys are parsed with `new Date(dateKey)`, which is UTC (ClientDashboardPage.tsx:248, 403).
- **Work activity**: tabs for work entries and EOD reports across the client's VAs, filtered by VA and date. Clicking an EOD opens EodDetailSheet.

---

### 4. UI/UX observations

- **Visual style**: a single dark monochrome theme (black surfaces, white text, mono uppercase labels).
  - Status badges look nearly identical because the STATUS_STYLES maps have the same classes for different statuses, so status cannot be told apart at a glance.
  - Colour is barely used to show severity: overdue reminders and compliance problems are hard to spot.
- **Animations**: none of the Radix enter/exit animation classes do anything, because `tw-animate-css` is not imported (index.css). Dialogs, sheets and popovers snap in.
- **Loading**:
  - Skeletons are used in StatCard and the dashboards.
  - The route-level Suspense fallback is a single spinner.
  - NavProgress never shows.
- **Errors**:
  - Many mutations swallow server messages (wrong envelope), so users see a generic "Failed to ..." toast.
  - There is no React error boundary, so a render error blanks the page.
- **Wrong-role navigation**: users are bounced to `/login` instead of their own home, and while logged in they land on the login form.
- **Accessibility**:
  - Icon-only buttons (EOD history delete/view, several tables) have no `aria-label`.
  - Tables use row click without keyboard focus handling (DataTable `onRowClick` on `<tr>`).
- **Timezones**: device-local "today" is used in the header and dashboards, while EOD uses the company day from `/eod-submissions/context`, so the two can differ.
- **Duplicated layout helpers**: AuthShell, Section, Field and PageShell are repeated across pages instead of shared.
- **Dead affordances**:
  - The "Add Profile" button in AccountManagement never opens a form.
  - The Scorecards copy promises a Sunday 11 PM auto-generation that does not exist in the backend.

---

### 5. Styles

- **Setup**: Tailwind v4 through `@tailwindcss/vite`, no tailwind.config. `index.css` has:
  - `:root` tokens (hex/rgba): `--bg-*`, `--text-*`, `--border-*` and shadcn `--background`, `--primary`, `--sidebar-*` (index.css:61-69 for sidebar).
  - `@theme` fonts (Inter, JetBrains Mono).
  - `@theme inline`, which bridges `--color-*` to the tokens.
  - A base layer, a `.navprogress` keyframe, and the `.grid-blueprint` / `.meta-label` utilities (no usages).
- **Dark mode only**: there is no light palette, `<html class="dark">` is hard-coded, and next-themes is installed but no provider is mounted.
- **Tailwind v3 syntax that does nothing under v4**:
  - `calendar.tsx` (`h-[--cell-size]` etc.)
  - `chart.tsx` (`border-[--color-border] bg-[--color-bg]`)
  - `popover.tsx:20`
  - `sidebar.tsx:238,250` uses `theme(spacing.4)`, the legacy function. This may still compile (inferred).
- **Undefined utility tokens**: `text-text-secondary` (badge.tsx), `hover:border-border-strong` (button.tsx).
- **Colour format mismatch**: `hsl(var(--x))` is used where the tokens are hex: `AdminDashboardPage.tsx:67` (chart fill) and `sidebar.tsx:529`.
- **Hard-coded hex everywhere**: `#0D0D0D`, `#0F0F0F`, `#161616`, `#1A1A1A` in site-header, table, DataTable and many pages. This bypasses the tokens.
- **No animation plugin**: the `animate-in` / `fade-*` / `zoom-*` / `slide-*` classes are no-ops.

---

### 6. Roles & permissions

- **Front-end role** = `roles[0]` of the backend user (auth.service.ts `mapUser`), so a user with several roles gets whichever comes first. `UserRole` = `admin | account_manager | va | client` (types/auth.ts).
- **Guards**: `ProtectedRoute` (any logged-in user) and `RoleGuard(allowed)`. Each portal allows exactly one role, and an admin cannot open `/am` or `/va`.
- **Inside shared admin/AM pages**, `canManage = user.role === 'admin'` hides:
  - assignment create, edit and view;
  - account and profile editing;
  - review generate, edit, delete and complete;
  - scorecard generation;
  - survey reminder complete/skip;
  - notes (NotesThread is admin-only).
- **Backend enforcement** (checked in `backend/`):
  - client-accounts routes: admin + AM, except hired-vas, which also allows client.
  - scorecards: admin + AM only.
  - va-profiles `GET /:vaId`: also allows va.
  - notes: admin only.
  - survey reminders: admin + AM, including PATCH.
  - `/shared/users`: needs `team.read`.
  - `/shared/users/crm-accounts`: any authenticated user.
- **Mismatches**:
  - (a) The UI hides actions from AMs that the API and BUSINESS_LOGIC allow (reviews, scorecards, reminders, profile edits).
  - (b) The UI calls admin-only endpoints for AMs (`/shared/users`) and for VAs (scorecards), producing 403s.

---

### 7. Connections

#### 7.1 HTTP endpoints called (base `VITE_API_URL`, e.g. `/api/v1`)

| Method   | Path                                                      | Caller (service)         | Used?            |
| -------- | --------------------------------------------------------- | ------------------------ | ---------------- |
| POST     | /auth/login `{email,password,app:'crm'}`                  | auth                     | yes              |
| POST     | /auth/refresh-token `{app:'crm'}`                         | auth, api.ts interceptor | yes              |
| POST     | /auth/logout `{app:'crm'}`                                | auth                     | yes              |
| POST     | /auth/forgot-password `{email}`                           | auth                     | yes              |
| POST     | /auth/reset-password `{token,password}`                   | auth                     | yes              |
| POST     | /auth/change-password                                     | auth                     | yes              |
| POST     | /auth/set-password                                        | auth                     | yes              |
| GET      | /shared/users?role=account_manager[&isActive=true]        | account-managers         | yes              |
| GET      | /shared/users?role=va\|client\|admin                      | account-managers         | yes              |
| GET      | /shared/users                                             | ats (getAtsTeam)         | no (hook unused) |
| GET      | /shared/users/crm-accounts                                | account-managers         | yes              |
| GET      | /crm/dashboard                                            | admin                    | yes              |
| GET      | /crm/assignments?status=active                            | assignments (my)         | yes              |
| GET      | /crm/assignments                                          | assignments (my-all)     | yes              |
| GET      | /crm/assignments?status&accountManagerId&limit=1000       | assignments (all)        | yes              |
| GET      | /crm/assignments?candidateId&limit=100                    | va-profiles              | yes              |
| GET      | /crm/assignments?limit=1000                               | ats (403 fallback)       | yes              |
| POST     | /crm/assignments                                          | assignments              | yes              |
| PATCH    | /crm/assignments/:id                                      | assignments              | yes              |
| DELETE   | /crm/assignments/:id                                      | assignments              | no               |
| GET      | /ats/clients?limit=1000                                   | ats                      | yes              |
| GET      | /ats/candidates?limit=1000                                | ats                      | yes              |
| GET      | /ats/jobs                                                 | jobs                     | no               |
| GET/POST | /ats/clients/:id/notes                                    | notes                    | yes              |
| GET/POST | /crm/va-profiles/:vaId/notes                              | notes                    | yes              |
| GET      | /crm/client-accounts/provisioned                          | client-accounts          | yes              |
| GET      | /crm/client-accounts (no limit)                           | client-accounts          | yes              |
| GET      | /crm/client-accounts/:id/hired-vas                        | client-accounts          | yes              |
| PATCH    | /crm/client-accounts/:id                                  | client-accounts          | yes              |
| GET      | /crm/va-profiles (no limit)                               | va-profiles              | yes              |
| PATCH    | /crm/va-profiles/:id                                      | va-profiles              | yes              |
| GET      | /crm/work-entries?...&limit=1000                          | work-entries             | yes              |
| POST     | /crm/work-entries                                         | work-entries             | yes              |
| PATCH    | /crm/work-entries/:id                                     | work-entries             | yes              |
| DELETE   | /crm/work-entries/:id                                     | work-entries             | no               |
| GET      | /crm/eod-submissions?...&limit=1000                       | eod-submissions          | yes              |
| GET      | /crm/eod-submissions/context                              | eod-submissions          | yes              |
| GET      | /crm/eod-submissions/:id                                  | eod-submissions          | yes              |
| POST     | /crm/eod-submissions                                      | eod-submissions          | yes              |
| DELETE   | /crm/eod-submissions/:id                                  | eod-submissions          | yes              |
| GET      | /crm/survey-reminders (no limit)                          | survey-reminders         | yes              |
| PATCH    | /crm/survey-reminders/:id                                 | survey-reminders         | yes              |
| GET      | /crm/scorecards?vaId&limit=1000                           | scorecards               | yes              |
| POST     | /crm/scorecards/generate                                  | scorecards               | yes              |
| GET      | /crm/performance-reviews?...&limit=1000                   | performance-reviews      | yes              |
| POST     | /crm/performance-reviews                                  | performance-reviews      | yes              |
| GET      | /crm/performance-reviews/:id                              | performance-reviews      | yes              |
| PATCH    | /crm/performance-reviews/:id                              | performance-reviews      | yes              |
| PATCH    | /crm/performance-reviews/:id/complete                     | performance-reviews      | yes              |
| DELETE   | /crm/performance-reviews/:id                              | performance-reviews      | yes              |
| POST     | /crm/performance-reviews/:id/regenerate `{section}`       | performance-reviews      | yes              |
| GET      | /crm/performance-reviews/:id/export-pdf (blob)            | performance-reviews      | yes              |
| GET      | /crm/reports/work-entries/export?startDate&endDate&format | reports                  | yes              |
| GET      | /crm/reports/eod-submissions/export?...                   | reports                  | yes              |
| GET      | /crm/reports/performance/export?...                       | reports                  | yes              |

- **Response envelope** (backend/src/shared/utils/response.ts):
  - success: `{success, data, message, meta?}`
  - error: `{success:false, error:{code,message,details?}}`
  - Services unwrap `res.data.data`. Several error handlers read `res.data.message` instead.
- **No sockets, SSE or third-party services** in the frontend. Outside the API, the only network use is Google Fonts.

#### 7.2 Query keys

See queries.ts:40-70. User-scoped keys: workEntries, eodSubmissions, myAssignments, myAllAssignments, allAssignments. Every other key is global.

---

### 8. Data models / types

- **auth.ts**: `UserRole = 'admin'|'account_manager'|'va'|'client'`; `IUser {id,email,name,role,clientRef?}`.
- **assignment.ts**: `IAssignment` (id, candidateId/vaName, clientId/clientName, accountManagerId/name, status active|paused|ended, startDate, endDate?, schedule/notes, timestamps), plus create/update payloads.
- **ats.ts**: `IAtsVA`, `IAtsClient`, `IAtsTeamMember` (light ATS projections).
- **client-account.ts**: `IClientAccount` (profile fields such as industry, timezone, contacts and health), `IProvisionedClient`, `IHiredVa`, update payload.
- **eod-submission.ts**: `IEodEntry` (assignmentId, task, timeSpent, category), `IEodSubmission` (date, shift start/end, totals, blockers, notes, clientUpdates, entries), `CreateEodPayload` (date optional), `IEodContext`.
- **note.ts**: `IClientNote`, `IVaNote` and create payloads.
- **performance-review.ts**:
  - `ReviewType` (6), `ReviewStatus` (6), `FinalRecommendation` (6), `RoleType` (14).
  - `IReviewCategory` (rating 1–5, comments), `IPerformanceReview`, `IReviewFilters`, create/update payloads, `RATING_LABELS`.
  - `IUpdateCategoryPayload` is unused.
- **scorecard.ts**: `IScorecard` (vaId, weekStart, metrics, score).
- **survey-reminder.ts**: `SurveyType` (lacks the `60_day`/`90_day` types BUSINESS_LOGIC mentions), status, `ISurveyReminder` (assignment, dueDate, assignedTo id).
- **va-profile.ts**: `IVaProfile` (skills, timezone, availability, etc.).
- **work-entry.ts**: `WorkCategory` (7), `WorkStatus` (3), `IWorkEntry`, create/update payloads.
- **admin.service.ts**: `IDashboardStats` {overview, eodCompliance, assignmentHealth, weeklyWorkHours, perVABreakdown}.

---

### 9. Dependencies

- **Runtime**: react 19, react-dom, react-router-dom 7, @reduxjs/toolkit + react-redux, @tanstack/react-query 5, @tanstack/react-table 8, axios, react-hook-form, @hookform/resolvers, zod 4, @radix-ui/\* (alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, select, separator, slot, tabs, toggle, toggle-group, tooltip), recharts 2.15.4, sonner, date-fns, react-day-picker 9, lucide-react, cva, clsx, tailwind-merge, tailwindcss 4.
- **Unused or near-unused**:
  - `@dnd-kit/*`: 0 imports.
  - `vaul`: only the unused drawer.
  - `next-themes`: sonner only, no provider.
  - Radix toggle and toggle-group: unused components.
- **Dev**: vite 8, @vitejs/plugin-react, typescript ~5.9, eslint 9 + plugins, @types/\*.
- **Missing**: `tw-animate-css` (needed by the shadcn animation classes). There are no tests and no test runner.

---

### 10. ISSUES

1. **High — Bug / caching**: invalidation uses the wrong query keys, so lists do not refresh after an edit or delete.
   - Where: `QK.workEntries()` and `QK.eodSubmissions()` with no uid give `['work-entries','anon']` and `['eod-submissions','anon']` (queries.ts:41-42). Called at `pages/va/WorkHistoryPage.tsx:502` (after an edit) and `pages/va/EodHistoryPage.tsx:172` (after a delete).
   - Why it is wrong: these keys do not prefix-match the user-scoped keys `['work-entries', <uid>]`.
   - Effect: the edited or deleted row stays stale for up to 5 minutes.
   - Fix: invalidate `['work-entries']` and `['eod-submissions']`, or pass the uid.

2. **High — Security / privacy**: logout leaves the React Query cache, and most keys are not user-scoped.
   - Where: `components/nav-user.tsx:67-71` logs out with an SPA `navigate`, with no `queryClient.clear()`. Keys like `['ats','vas']`, `['client-accounts', …]`, `['dashboard-stats']`, `['performance-reviews', …]` and `['scorecards', …]` have no user id (queries.ts:48-69).
   - Effect: if a second user logs in on the same tab within `gcTime` (30 min), they can see the first user's cached admin data. For example, a client logging in after an admin.
   - BUSINESS_LOGIC §10 claims the cache is scoped per user, which is false.
   - The 401 path (api.ts:56-62, 94-95) does a full reload, so it is safe.
   - Fix: `queryClient.clear()` on logout and login.

3. **High — Business logic**: new clients cannot be given their first assignment from the CRM.
   - Where: the create-assignment form offers only _provisioned_ clients (`useProvisionedClientsQuery`; AssignmentManagementPage.tsx:365-388, 840).
   - Why: the backend's `createAssignment` is what provisions the client user and sends the invite (backend CRM assignment service).
   - Effect: a brand-new ATS client never shows up in the dropdown. The empty-state text hints that hiring happens in the ATS. This is inferred and ambiguous: the ATS may create the first assignment.
   - Fix: list ATS clients (hired) in the dropdown, or document that the ATS must create the first assignment.

4. **High — Bug / data truncation**: lists are cut off at 20 rows because no `limit` is sent and the backend defaults to 20.
   - Where: `client-accounts.service.ts` (`getClientAccounts`), `va-profiles.service.ts` (`getVaProfiles`), `survey-reminders.service.ts`.
   - Affected callers: `AccountManagementPage.tsx:1658,1722` (profile and health enrichment missing beyond 20), `AssignmentDetailPage.tsx:248,253` (fetches every profile to find one, so it often finds none) and the Survey Reminders page (only 20 reminders, silently).
   - Fix: add server-side pagination or filters (`GET /crm/va-profiles/:vaId`, an id filter).

5. **High — Performance / correctness**: the client fetches everything with `limit=1000` and filters locally.
   - Where: `AssignmentDetailPage.tsx:231-244` fetches all assignments, work entries and EODs to show one assignment. The same pattern is in the VA dashboard, the client dashboard and the work-activity page (services use `limit=1000`).
   - Effect: silent truncation past 1000 rows and heavy payloads. Backend CRM controllers do not cap the limit (inferred from the backend paginationSchema not being applied).
   - Fix: use server filters (`assignmentId`, date range), add a `GET /crm/assignments/:id`, and paginate.

6. **High — Data loss**: the performance review editor wipes unsaved edits.
   - Where: `PerformanceReviewEditorPage.tsx:170-185` has a useEffect that resets every field of local form state whenever `review` changes. Any `invalidateQueries` (after regenerating one section, or after save) refetches and overwrites unsaved edits in other sections.
   - Also: after save or complete, the list key `QK.performanceReviews()` is not invalidated, so the list shows a stale status.
   - Fix: reset only on id change, or merge only the regenerated section; invalidate `['performance-reviews']`.

7. **Medium — Roles / navigation**: an AM cannot open the assignment detail page.
   - Where: the actions column, including View, renders only when `canManage` (AssignmentManagementPage.tsx:183), yet the route `/am/assignments/:id` exists.
   - Fix: show View to AMs.

8. **Medium — Navigation**: the "Go home" link sends AMs to the wrong portal.
   - Where: NotFoundPage maps `account_manager` → `/admin/dashboard` (NotFoundPage.tsx:7-13).
   - Effect: RoleGuard then redirects to `/login`.
   - Related: RoleGuard sends any wrong role to `/login` (RoleGuard.tsx), and LoginPage has no "already authenticated" redirect, so a logged-in user sees the login form.
   - Fix: map to `/am/dashboard`, and send wrong-role users to their own home.

9. **Medium — Auth**: role handling is fragile.
   - Where: `mapUser` uses `roles[0] ?? 'va'` (auth.service.ts). A non-CRM first role (for example an ATS recruiter role) or a multi-role user gets an undefined `roleRedirect[role]` (LoginPage.tsx:48). The default `'va'` silently grants VA-portal UI.
   - Also: a 403 (no CRM app access) shows a generic error.
   - Fix: pick the first CRM role, and show a clear "no CRM access" message.

10. **Medium — Error handling**: server error messages are read from the wrong place.
    - Where: `response.data.message` is read instead of `response.data.error.message` in `NotesThread.tsx:89,122`, `EodDetailSheet.tsx` (error read), and `AssignmentManagementPage.tsx:356,672`. `ProfilePage` shows the axios `err.message` ("Request failed with status code 400").
    - Effect: server validation messages are lost.
    - Fix: a shared `getApiError(err)` helper.

11. **Medium — Roles**: the AM's capabilities do not match the API or BUSINESS_LOGIC.
    - Where: Generate/Edit/Delete reviews, Generate scorecards, survey reminder complete/skip and profile edits are hidden for AMs (`canManage`), though the backend allows AMs.
    - Effect: survey reminders are _assigned to_ AMs, but AMs cannot mark them done (SurveyRemindersPage.tsx:171-176).
    - Fix: align with the backend RBAC.

12. **Medium — Roles**: AM pages call admin-only endpoints and get 403s.
    - Where: `/shared/users` (needs team.read) is called from AccountManagementPage (`useAccountManagersQuery`, `useCrmAdminUsersQuery`) and from the PerformanceReviews, EodReports and WorkEntries filters (`useCrmVaUsersQuery`, `useCrmClientUsersQuery`).
    - Effect: the client filter is empty for AMs (inferred). The VA dashboard also calls scorecards, which return 403 for VAs, so the card shows N/A (VaDashboardPage.tsx:56).
    - Fix: use `/shared/users/crm-accounts` or role-appropriate endpoints, and skip scorecards for VAs.

13. **Medium — UI bug**: the dashboard chart fill is invalid.
    - Where: `AdminDashboardPage.tsx:67` uses `hsl(var(--primary))` while `--primary` is hex. `sidebar.tsx:529` has the same pattern.
    - Effect: the chart has no fill.
    - Fix: `var(--primary)`.

14. **Medium — Bug**: several Account Management actions do not work.
    - "Add Profile" (AccountManagementPage.tsx:574-596) never shows the form because of an early return.
    - Saving a profile does not invalidate `'va-profiles-list'` or `'client-accounts-list'`, so the list is stale.
    - A client user without `clientRef` sees the "Internal staff accounts" text (1600-1609).
    - There is a dynamic `import()` of api (≈1665), duplicate query keys, and table columns rebuilt on every render.
    - Fix: correct the render branch, invalidate the lists, and memoize the columns.

15. **Medium — Dates / timezones**: date strings are parsed as UTC, which shifts days for users west of UTC.
    - Where `new Date('YYYY-MM-DD')`, `toISOString().slice(0,10)` or `toLocaleDateString` on date keys is used:
      - range defaults: `WorkHistoryPage.tsx:298-306`, `EodReportsPage.tsx:31-39`, `WorkEntriesPage.tsx:35-43`
      - date display: `VaDashboardPage.tsx:249,256`, `ClientDashboardPage.tsx:248,403`, `AssignmentDetailPage.tsx:71-78,541-549`
      - `AccountManagementPage` `fmtDate` / `toYMD`
    - Effect: dates display one day early, and default ranges can be off by a day.
    - Also: "today" uses the device date, while EOD uses the company day.
    - Fix: use the `lib/time.ts` date-key helpers consistently.

16. **Medium — Validation / logic**: EOD and work-entry validation is weak.
    - `EodSubmitPage` sends `date`, which contradicts BUSINESS_LOGIC's "form sends no date". Either the doc or the code is wrong; this is ambiguous.
    - The "already submitted" check only looks at today's EODs.
    - There is no max for `timeSpent` (backend allows 1–480) in AddWorkEntry or WorkHistory, so users get a server 400 with a lost message.
    - EOD entries duplicate work-entry data, so the two can disagree.

17. **Low — Content**: the Scorecards page has a false promise and a filter gap.
    - The copy says scorecards are "generated every Sunday at 11 PM" (ScorecardsPage.tsx:173-174), but the backend `jobs/index.ts` schedules only eodCompliance and surveyDispatcher.
    - The VA filter is not scoped to the AM (193), and `scoreColor` has duplicate branches.

18. **Low — UX**: the Survey Reminders page has several display gaps.
    - The "For" column shows a raw user id.
    - Labels are missing for `60_day`/`90_day`.
    - The overdue badge also shows on completed reminders.
    - "Due" is compared against the device date.

19. **Low — UX**: ConfirmDialog's loading state never shows. The Radix Action closes the dialog immediately, so "Completing…"/"Deleting…" is never seen and errors appear after it closes (ConfirmDialog.tsx).

20. **Low — Content**: EodDetailSheet mislabels fields.
    - Blockers are labelled "Blockers / Client Updates" and notes "Notes for Client" (EodDetailSheet.tsx). This could make a VA's internal notes look client-facing.
    - On AssignmentDetailPage, the "EODs" stat counts the filtered list, not this week, and "Reviews" counts across clients.

21. **Low — Accessibility**:
    - Icon-only buttons have no `aria-label` (EodHistoryPage, table actions).
    - The delete error renders at the bottom of the page, away from the action.
    - DataTable row-click is not keyboard reachable.

22. **Low — Styles**: Tailwind v3 syntax and undefined tokens do nothing in v4.
    - v3 arbitrary-var syntax: calendar.tsx (`[--cell-size]`), chart.tsx (`[--color-border]`), popover.tsx:20.
    - Undefined tokens: `text-text-secondary` (badge.tsx), `border-border-strong` (button.tsx).
    - `tw-animate-css` is missing, so every animate-in/out class is a no-op.
    - Fix: convert to `(--x)` or `var(--x)` and add the plugin.

23. **Low — Styles / maintainability**: hard-coded hex colours (`#0D0D0D`, `#0F0F0F`, `#161616`, `#1A1A1A`) in site-header, table, DataTable and pages bypass the tokens.
    - The theme is dark-only, with `class="dark"` hard-coded.
    - Status style maps are identical, so statuses are not distinguishable.

24. **Low — Dead code**:
    - Components and hooks: nav-documents, nav-secondary, geometric-bg, ui/drawer, ui/breadcrumb, ui/table, ui/toggle, ui/toggle-group, useCountUp.
    - jobs.service and the hooks useAtsJobsQuery, useAtsTeamQuery, useClientAccountsQuery, useVaProfilesQuery.
    - Service functions and types: deleteAssignment, deleteWorkEntry, IUpdateCategoryPayload, `computeShiftHours` (a duplicate of calcHours), and `setUser` (a duplicate of setAuth).
    - The `.grid-blueprint` and `.meta-label` CSS classes.
    - Stale Firestore comments in AssignmentManagementPage.tsx:91-98, 665-667.
    - Unused deps: @dnd-kit, vaul. next-themes has no provider.

25. **Low — Assets / config**:
    - The favicon link says `type="image/svg+xml"` but points at a PNG (index.html).
    - `public/favicon.svg` and `src/assets/react.svg` are empty files; hero.png, vite.svg and icons.svg are unused.
    - The package name is `"ui"`.
    - README references a `.env.example` that is absent.

26. **Low — UX**: NavProgress never shows.
    - Where: `DashboardLayout.tsx` uses `useNavigation()`. The state is never "loading" without route loaders.
    - Fix: drive it from Suspense or `useIsFetching`.

27. **Low — UX**: sidebar and picker quirks.
    - The sidebar writes the `sidebar_state` cookie but never reads it back (sidebar.tsx:92 vs defaultOpen at 65), so the collapsed state is lost on reload.
    - TimePickerField: typing minutes before choosing an hour silently sets 12 AM (time-picker-field.tsx:61,70,78).

28. **Low — Toasts**: sonner's `useTheme()` runs without a ThemeProvider and defaults to `'system'`. On a light-mode OS, toasts may render in the light theme against a dark app (inferred; ui/sonner.tsx:16).

29. **Low — Resilience**: there is no React error boundary or route `errorElement`, so a render or lazy-chunk load failure (for example after a redeploy) shows a blank page or the router's default error screen (router/index.tsx).

30. **Low — Docs**: BUSINESS_LOGIC.md disagrees with the code in several places:
    - caching per user (§10, false);
    - "EOD form sends no date" (false);
    - Sunday scorecard cron (absent in the backend);
    - 60/90-day survey types (absent in the frontend types);
    - AM permissions (the UI is more restrictive).

**Open questions**

- Is first-assignment creation meant to happen in the ATS (issue 3)?
- Is the backend scoping of AM data correct? I did not trace every CRM service filter.
- Is `theme(spacing.4)` still accepted by Tailwind v4 in this build? I did not build it.

---

### 11. Earlier audit (CRM-UI-AUDIT.md, 2026-07-09): what still holds and what is outdated

**Outdated or fixed**

- It lists an `/admin/account-managers` route; that no longer exists, and accounts live at `/admin/accounts`.
- It references `section-cards.tsx` and `data-table.tsx`; both are gone, replaced by `shared/DataTable.tsx` and `StatCard.tsx`.
- Its endpoint names are outdated:
  - `/work-entries` → now `/crm/work-entries`
  - `/users?role=…` with POST/PATCH user management → now read-only `/shared/users`
  - `/ats/vas` and `/ats/team` → now `/ats/candidates` and `/shared/users`
  - `/admin/dashboard-stats` → now `/crm/dashboard`
  - `/auth/refresh` → now `/auth/refresh-token`
  - `/auth/me` → no longer called
- "No form library on login" is fixed: login now uses RHF + zod.
- The dev quick-login env vars are gone.
- Its `VITE_API_URL` example (`/api`) differs from the current README (`/api/v1`).
- It does not cover AssignmentDetailPage, NotesThread, EodDetailSheet, performance reviews or client accounts, which were added since.

**Still holds**

- There is a single Redux slice (auth) and the token is kept in memory.
- Routes are lazy-loaded under a single Suspense.
- Admin and AM share page components and differ only by role checks.
- RoleGuard redirects wrong roles to `/login`.
- There is no error boundary.
- The theme is dark-only with heavy hard-coded colours.
- There are no tests.

---

_End of audit. Read-only review; no code, config or repository was changed._
