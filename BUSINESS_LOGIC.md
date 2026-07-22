# CRM — Business Logic & Architecture Decisions

> **Last updated**: 2026-07-18
> **Context**: `crm-ui` + `ats-crm-backend`

---

## 1. Roles & Access Model

| Role                       | Definition                                                                                | Provisioned By | Access Revoked By |
| -------------------------- | ----------------------------------------------------------------------------------------- | -------------- | ----------------- |
| **Client**                 | A company/individual who hired one or more VAs under one or more of their Jobs            | ATS            | ATS               |
| **VA** (Virtual Assistant) | A candidate who got hired to a Job under a Client                                         | ATS            | ATS               |
| **Account Manager** (AM)   | A user assigned by Admin to manage the Client–Job–VA relationship and monitor assignments | ATS            | ATS               |
| **Admin**                  | Full platform access — manages assignments, users, settings, and all operational data     | ATS            | ATS               |

### Single Source of Truth

**The ATS is the single source of truth** for:

- Who is a Client, VA, Account Manager, or Admin
- Who has access to the CRM (active / suspended / hold)
- User provisioning, de-provisioning, and management

**CRM does NOT create, edit, or deactivate users.** All user management happens in the ATS (`ats-ui-new`). The CRM only reads user data from the shared backend (`/shared/users`). Users appear in the read-only **Accounts** page (tabs: Clients, VAs, AMs, Admins).

CRM responsibilities:

- Authenticate users against the shared auth system
- Enforce role-based access per endpoint/feature
- Display which users currently have CRM access (read-only Accounts page)

---

## 2. Assignment Management

### Ownership

Assignments are **created, edited, and ended by Admin and Account Managers** in the CRM.

### Assignment Model

An assignment is the core operational link connecting:

```
Client ─── Job ─── VA ─── Account Manager
```

- A **VA** works for a **Client** under a specific **Job**
- An **Account Manager** is attached by Admin to monitor the assignment and handle communication between the Client and VA

### Multiplicity Rules

| Entity          | Can have...                                                                |
| --------------- | -------------------------------------------------------------------------- |
| VA              | Multiple assignments (if hired for multiple Jobs across different Clients) |
| Client          | Multiple Jobs, each with hired VAs → multiple assignments                  |
| Account Manager | One or many assignments across different Clients and VAs                   |

### Access on Assignments

| Role            | Create | Read | Update | Delete (End) |
| --------------- | :----: | :--: | :----: | :----------: |
| Admin           |   ✅   |  ✅  |   ✅   |      ✅      |
| Account Manager |   ✅   |  ✅  |   ✅   |      ✅      |
| Client          |   —    |  ✅  |   —    |      —       |
| VA              |   —    |  ✅  |   —    |      —       |

_Note: backend currently allows any AM to manage any assignment. Future scoping to assigned-only is TBD._

---

## 3. Work Entries & EOD Submissions

### Access Matrix

| Role            | Create | Read | Update | Delete |
| --------------- | :----: | :--: | :----: | :----: |
| VA              |   ✅   |  ✅  |   ✅   |   ✅   |
| Admin           |   —    |  ✅  |   —    |   —    |
| Account Manager |   —    |  ✅  |   —    |   —    |
| Client          |   —    |  ✅  |   —    |   —    |

- **Only VAs** create, update, and delete work entries and EOD submissions.
- **Admin, AM, and Client** have read-only access (scoped to their assignments/VAs).
- Backend routes currently allow `admin, account_manager` on POST/PATCH/DELETE for work entries and POST/PATCH for EOD — needs tightening to VA-only.

---

## 4. Accounts

All users (VA, Client, Account Manager, Admin) are displayed in the **Accounts** page as a read-only 4-tab view. No user creation, editing, or deactivation happens in the CRM — this is managed in `ats-ui-new`.

---

## 5. Reminders, Scorecards & Performance Reviews

| Feature                 | Description                                                                                                                         | Owner         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **Survey Reminders**    | Automated 3-day, 1-week, 30-day, and monthly check-in reminders. Triggered on assignment creation and dispatched via cron.          | Admin, AM     |
| **EOD Reminders**       | Daily 5 PM cron — checks missing EODs, emails VAs, logs compliance                                                                  | System (cron) |
| **Scorecards**          | Weekly productivity metrics per VA (hours, tasks, compliance rate, consistency score) — backend feature TBD                         | Admin, AM     |
| **Performance Reviews** | AI-generated (Claude) review templates — generated by Admin/AM, editable, completable. Categories, ratings, goals, recommendations. | Admin, AM     |

---

## 5. AI Provider Configuration

Which AI provider is active (OpenAI vs. Anthropic Claude) is determined by the **ATS General Settings** — not the CRM.

Check the ATS settings endpoint: `ats-crm-backend` → `/api/v1/shared/settings`

The CRM consumes whatever AI provider is configured at the ATS level. Performance review generation uses Claude by default, as configured in `ats-crm-backend`.

---

## 6. Accounts Page (CRM)

The Accounts page in CRM is a **read-only view** showing:

- Which **Clients** currently have CRM access
- Which **Account Managers** are active
- Which **VAs** are provisioned
- Whether there are **multiple Admins**

It does NOT allow creating, editing, or deactivating users. All user management (give access, revoke, hold, suspend) happens in the ATS.

---

## 7. Authentication & Security

### Auth Features

| Feature                                       | Supported |
| --------------------------------------------- | :-------: |
| Login (email + password)                      |    ✅     |
| Logout                                        |    ✅     |
| Forgot Password                               |    ✅     |
| Reset Password                                |    ✅     |
| Change Password (from within app)             |    ✅     |
| Accept Invitation (set initial password)      |    ✅     |
| Session persistence (HttpOnly refresh cookie) |    ✅     |
| Transparent token refresh (401 interceptor)   |    ✅     |

### RBAC Enforcement

The entire CRM platform is built on **proper Role-Based Access Control**:

- **Middleware-level**: `authenticate` (JWT verification) + `requireAppAccess('crm')` + `requireRoles(...)` + `requirePermission(resource, action)`
- **Route-level**: Every CRM endpoint is gated by role and permission
- **Frontend-level**: `ProtectedRoute` (auth check) + `RoleGuard` (role check) on every route
- **Data-level**: Backend services filter data by the requesting user's role and ownership

Permissions follow a hierarchy: `manage > write > read`, `schedule > write > read`, `approve > write > read`.

---

## 8. Dashboard Requirements

The CRM dashboard must be:

- **Better** — more useful metrics than just raw counts
- **Easy** — glanceable, no training needed to interpret
- **Understandable** — clear labels, obvious meaning
- **Insightful** — surface problems proactively (missing EODs, low compliance, overloaded VAs)

Key metrics to surface:

- Active assignments count and trend
- Work entries logged today
- EOD submission rate (compliance %)
- Missing EOD alerts
- Per-VA and per-Client activity breakdown
- Weekly work hours summary

---

## 9. UI/UX Design Principles

The CRM UI will follow these principles:

- **Modern** — clean, minimal, uses the established design system
- **User-friendly** — intuitive navigation, clear CTAs, helpful empty states
- **Standard** — follows common SaaS patterns users already know
- **Responsive** — works on desktop and mobile (vertical form layouts, responsive tables, touch-friendly controls)
- **Consistent** — same component library (shadcn/ui + Tailwind) across all pages
- **Accessible** — proper contrast, keyboard navigation, screen-reader friendly

---

## 10. Data Ownership Summary

| Data                           | System of Record |                  CRM Access                  |
| ------------------------------ | :--------------: | :------------------------------------------: |
| Clients (master data)          |       ATS        |        Read-only (via `/ats/clients`)        |
| Candidates / VAs (master data) |       ATS        |      Read-only (via `/ats/candidates`)       |
| Jobs                           |       ATS        |             Read-only reference              |
| Users (roles, access, status)  |       ATS        |       Read-only (via `/shared/users`)        |
| Assignments                    |     **CRM**      |       Full CRUD (admin), Read (others)       |
| Work Entries                   |     **CRM**      |           CRUD (VA), Read (others)           |
| EOD Submissions                |     **CRM**      |           CRU (VA), Read (others)            |
| EOD Reminders                  |     **CRM**      |      System-generated, Read (admin/AM)       |
| Survey Reminders               |     **CRM**      |               CRUD (admin/AM)                |
| Performance Reviews            |     **CRM**      | Generate/Edit/Complete (admin/AM), Read (VA) |
| Scorecards                     |     **CRM**      |           Generate/Read (admin/AM)           |
| Activity Logs                  |      Shared      |                 Read (admin)                 |
| Settings (AI provider, etc.)   |       ATS        |                  Read-only                   |
