# CRM — Business Logic

What `crm-ui` and the backend (`ats-crm-backend`, `/api/v1/crm/*`) actually do. The full system reference is `ats/BUSINESS_LOGIC.md`; when this file and the code disagree, the code wins.

---

## 1. Roles & Access

The CRM has four portals. The browser picks one from the user's **first role**.

| Role | Portal | Created by |
| ---- | ------ | ---------- |
| **VA** | `/va` | Automatically when a candidate is hired in the ATS (invite email) |
| **Client** | `/client` | Automatically when the first assignment for that client is created (invite to the primary contact), or manually by an admin |
| **Account Manager (AM)** | `/am` | Admin, in the ATS Team page |
| **Admin** | `/admin` | Admin, in the ATS Team page |

- **The ATS is the source of truth for users.** The CRM never creates, edits, deactivates or deletes users. It only reads them and accepts invitations (`/accept-invitation`).
- Login is `POST /auth/login` with `app: 'crm'`. The access token is kept in memory, the refresh token is an httpOnly cookie (`refreshTokenCrm`). The 401 interceptor refreshes once and replays queued requests; if the refresh fails the user goes to `/login`.
- CRM users need `appAccess` to include `crm`. An ATS-only user who logs in here is not sent to any portal (the role has no CRM page).
- Route protection: `ProtectedRoute` (signed in) + `RoleGuard` (role). The server enforces access again on every call (`requireAppAccess('crm')` + `requireRoles(...)`; admin always passes).

### Server-side scoping

| Role | Sees |
| ---- | ---- |
| VA | Only records where `candidateId` equals their `candidateRef` |
| Client | Only records where `clientId` equals their `clientRef` |
| AM | Only assignments where they are the account manager, plus the work entries, EODs, EOD reminders, scorecards and reviews tied to them |
| Admin | Everything |

A VA or client account without its ref gets 403 instead of falling back to a client-supplied id.

---

## 2. Assignments

An assignment links **VA ↔ Client**, managed by an **Account Manager**. A VA can have many assignments; an AM can manage many.

| Action | Admin | AM | Client | VA |
| ------ | :---: | :-: | :----: | :-: |
| List / view | all | own | own client's | own |
| Create | ✅ | API only, for themselves | — | — |
| Update / end | ✅ | own | — | — |

- The **CRM UI lets only admins** create, edit or end assignments; AMs get a read-only list of their own. The API is more permissive for AMs (create for themselves, update/end their own).
- Fields: VA, client, account manager, service type, start date, optional end date, status (`active`, `on_hold`, `ended`), notes.
- **Create** checks that the VA (candidate) and client exist, provisions the client's CRM user if none exists (invite to the client's primary contact), and creates the survey reminders (§6).
- An **ended** assignment is read-only; ending sets `endDate` if empty. Work entries and EODs can no longer be added to it.
- The assignment list is joined with names (`candidateName`, `companyName`, `accountManagerName/Email`).

---

## 3. Work Entries (VA)

- Fields: assignment, date, time (HH:MM), task category, description, minutes (1–480), status (`completed`, `in_progress`, `pending`), notes.
- **Create / update / delete: VA only**, and only on their own assignments. (An admin also passes the role check.) Admin, AM and client read.
- The server copies `candidateId` and `clientId` from the assignment.
- **Delete is a soft delete.** Deleted entries disappear from lists, reports, the dashboard and scorecards. The VA UI supports add and edit; it has no delete button.

---

## 4. EOD (End-of-Day) Submissions (VA)

- **One EOD per assignment per company business day.** A second submit gets 409 `EOD_ALREADY_SUBMITTED` (unique index on assignment + `dateKey`).
- **The day is the company day**, from the company timezone in ATS Settings — never the VA's device clock. `GET /crm/eod-submissions/context` returns today's `dateKey`; the form sends no date. An optional `date` (`YYYY-MM-DD`) is accepted by the API.
- Fields: shift start/end (HH:MM, company clock), structured work entries (task, description, quantity, status, minutes), pending tasks, blockers, notes, **"communicated with the client?"** (`yes|no|other`, required) and a note for the client.
- **Hours are computed by the server** from the shift; an end time before the start counts as an overnight shift.
- A VA can delete their own EODs (permanent) in the UI; the API also lets them edit one (hours are recomputed). Creating is refused on an ended assignment.
- Old EODs may have only a free-text `summaryOfWork`. API responses show `date` as the business-day key.
- Admin, AM and client can read; AMs only for their assignments, clients only for their VAs.

---

## 5. Accounts, Profiles & Notes

The **Accounts** page lists the CRM users by type (clients, VAs, AMs, admins). Clients and VAs for an AM are limited to those on their assignments.

- **Client accounts** (`/crm/client-accounts`, admin + AM API): CRM profile fields on the ATS client — health (`green|yellow|red`), BAA signed and date, EMR system, onboarding complete, SOP received, satisfaction (1–5), open issues, last check-in, account owner, service start, primary/secondary contact, notes. `provisioned` lists clients that have an active CRM user.
- **VA profiles** (`/crm/va-profiles`, one per VA, auto-created): workload (`low|normal|high|overloaded`), satisfaction, burnout flag, replacement-risk flag, last check-in, notes. A VA can read their own.
- **Editing is admin-only in the UI** (the API allows admin and AM).
- **Internal notes threads** for a client or a VA (call / email / meeting / message / other) are **admin-only** end to end.
- `GET /crm/client-accounts/:id/hired-vas` returns the VAs hired for a client; a client can call it only for their own id.

---

## 6. Reminders, Scorecards, Reviews

### Survey reminders (admin and AM)

Created automatically for each new assignment, assigned to its account manager, due after the start date:

| Type | Due |
| ---- | --- |
| `3_day` | +3 days |
| `1_week` | +7 days |
| `30_day` | +30 days |
| `monthly` | +60 days |

Other types exist for manual creation (`60_day`, `90_day`). Statuses: `pending → sent → completed | skipped`. The 9:00 cron emails the account manager for every `pending` reminder due by the end of today and marks it `sent`. Admin/AM can create and update reminders in the API; the UI page updates them.

### EOD reminders (cron)

At 17:00 company time, every `active` assignment without an EOD for today's business day gets an email to the VA and an `EodReminder` record (`sent` or `failed`). Admin/AM can read them (AMs: own). Both crons run once per local day, are not replayed after downtime, and take a database lock.

### Scorecards (weekly, admin and AM)

`POST /crm/scorecards/generate` builds or refreshes the **current week** for every active assignment (or one VA), one per VA + assignment + week. Metrics: hours, tasks completed, tasks/day, EOD compliance %, on-time submission %, productivity score and category mix. Score = EOD compliance 40 + work volume (hours ÷ 40) 30 + tasks completed 20 + on-time submission 10. Soft-deleted work entries are excluded. Read access: admin and AM (AM limited to own assignments).

### Performance reviews (admin and AM; VA reads own)

- **Generate** (AI, Claude or OpenAI per ATS Settings): needs VA, client, review type, period and role; optional job, client expectations and manager notes. Result is a draft with a role summary, responsibilities, strengths, improvement areas, goals and 6–8 rating categories.
- **Edit** categories (1–5 ratings, comments), overall rating, client satisfaction, final recommendation and manager summary; regenerate categories, goals or the summary; status may be set to `draft`, `ai_generated`, `in_review`, `sent_to_client` or `archived`.
- **Complete** (`PATCH /:id/complete`) locks the review: no further edits or regeneration.
- Delete and PDF export are available; a VA can view and export only their own. AMs can act only on VAs they manage.

---

## 7. Dashboard & Reports

**Admin / AM dashboard** (`GET /crm/dashboard`; AMs see only their assignments, and an AM with none sees zeros):

- Assignment counts by status.
- EODs submitted today (company day), work entries today, missing-EOD count (EOD reminders sent today — so it fills in after the 17:00 job), and compliance % = EODs today ÷ active assignments.
- Weekly hours and per-VA / per-client breakdowns, and the latest 10 EODs.
- Soft-deleted work entries are excluded.

**Reports** (admin and AM; AMs limited to own): CSV or Excel exports of work entries, EOD submissions (one row per EOD in the client's reporting format) and completed performance reviews. In CSV, cells starting with `=`, `+`, `-` or `@` are prefixed with `'` so spreadsheets do not run them as formulas. The dashboard and EOD pages offer the export buttons.

**VA and client dashboards** are built in the browser from their own scoped lists. The client portal has a dashboard and a Work Activity page, both read-only.

---

## 8. Data the CRM reads from the ATS

| Data | Owner | How the CRM gets it |
| ---- | ----- | ------------------- |
| Users, roles, status | ATS | `/shared/users` (needs team read), `/shared/users/crm-accounts` (scoped, any signed-in user) |
| Clients, VAs (candidates), jobs | ATS | `/ats/clients`, `/ats/candidates`, `/ats/jobs` |
| Company timezone, AI provider | ATS Settings | read server-side |
| Assignments, work entries, EODs, reminders, scorecards, reviews, VA/client CRM profiles | CRM | `/crm/*` |

Account managers have **no ATS access**, so `/ats/*` answers 403 for them. For VA and client filters the UI then builds the lists from the AM's own assignments. Other lookups that need team read (such as the account-manager list) are empty for AMs; names come from the joined assignment data instead.

---

## 9. Realtime

The backend emits `assignment:*`, `workEntry:*`, `eod:submitted|updated|deleted` and `performanceReview:*` on the `/crm` socket, to a room only admins and AMs join. The CRM UI does not use sockets today; it relies on React Query (5-minute stale time, no refetch on focus).

---

## 10. UI notes

- Stack: React 19, Vite, React Router, Redux Toolkit (auth only), TanStack Query, axios, Tailwind 4 + shadcn/ui, Zod + react-hook-form.
- Query keys that hold per-user data include the user id, so a different login never reuses another user's cache.
- Dates that are business days are `YYYY-MM-DD` strings and are formatted from their parts, never through `new Date(key)`, to avoid off-by-one days.
