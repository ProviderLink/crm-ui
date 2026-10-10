# Arista CRM (UI)

Post-hire management frontend for the unified ATS/CRM backend (`ats-crm-backend`). It covers day-to-day work of hired VAs and the people who manage them.

**Stack:** React 19, TypeScript, Vite, React Router, Redux Toolkit (auth), TanStack Query (data), Tailwind 4 + shadcn/ui, axios.

## Getting started

Requires Node >= 20.19 and pnpm >= 10.

```bash
pnpm install
cp .env.example .env   # set VITE_API_URL, e.g. http://localhost:4000/api/v1
pnpm dev
```

| Script       | Purpose                     |
| ------------ | --------------------------- |
| `pnpm dev`   | Start the dev server        |
| `pnpm build` | Type-check and build `dist` |
| `pnpm lint`  | Run ESLint                  |

## Portals

| Role              | Routes     | What they do                                                              |
| ----------------- | ---------- | ------------------------------------------------------------------------- |
| VA                | `/va`      | Log work, submit and review daily EODs                                    |
| Account Manager   | `/am`      | Own assignments, work entries, EOD reports, scorecards, reviews, reminders |
| Admin             | `/admin`   | Same as account manager, for all assignments; also creates assignments    |
| Client            | `/client`  | Read-only view of their VAs' work                                         |

Users are created and managed in the ATS; the CRM only reads them. Public pages: `/login`, `/reset-password`, `/accept-invitation`.

## Notes

- Access token lives in memory only; the refresh token is an httpOnly cookie (`app: 'crm'`).
- "Today" for EODs is the company business day set in the ATS settings, not the device clock.
- Account managers cannot read ATS lists, so their VA/client filters are built from their own assignments.
- More detail: [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md).

## Deploy

Vercel, auto-deployed from `main`. `vercel.json` rewrites all routes to `index.html`.
