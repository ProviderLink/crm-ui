/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DEMO API — temporary. An axios adapter that answers every CRM request from
 * in-memory data, so no backend or database is touched. Enabled only when
 * VITE_DEMO=true. Changes live in memory and reset on page refresh.
 */
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  assignments,
  candidates,
  clientAccounts,
  clients,
  daysAgo,
  eods,
  fmt,
  jobs,
  makeCategories,
  mkId,
  nextSeq,
  notes,
  reminders,
  reviews,
  scorecards,
  today,
  users,
  vaProfiles,
  workEntries,
} from './data';

const SESSION_KEY = 'demo-user-id';
const getSession = (): string | null => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};
const setSession = (id: string | null) => {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
};

const me = () => users.find(u => u._id === getSession()) as any | undefined;
const role = () => me()?.roles[0] as string | undefined;

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Responses are copies, like a real network response, so React Query sees a
// new value after the in-memory data is mutated.
const ok = (data: unknown, extra: Record<string, unknown> = {}) => ({
  data: {
    success: true,
    data: data === undefined ? data : JSON.parse(JSON.stringify(data)),
    ...extra,
  },
});
const list = (rows: any[]) =>
  ok(rows, { meta: { total: rows.length, page: 1, limit: 1000, totalPages: 1 } });

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

// ── Scoping ──────────────────────────────────────────────────────────────────
const visibleAssignments = (): any[] => {
  const u = me();
  if (!u) return [];
  switch (role()) {
    case 'account_manager':
      return assignments.filter(a => a.accountManagerId === u._id);
    case 'va':
      return assignments.filter(a => a.candidateId === u.candidateRef);
    case 'client':
      return assignments.filter(a => a.clientId === u.clientRef);
    default:
      return assignments;
  }
};
const visibleIds = () => new Set(visibleAssignments().map(a => a._id));
const byAssignment = (rows: any[]) => {
  const ids = visibleIds();
  return rows.filter(r => ids.has(r.assignmentId));
};
const eq = (rows: any[], key: string, v: string | null) =>
  v ? rows.filter(r => r[key] === v) : rows;
const inRange = (rows: any[], key: string, from: string | null, to: string | null) =>
  rows.filter(
    r =>
      (!from || String(r[key]).slice(0, 10) >= from) &&
      (!to || String(r[key]).slice(0, 10) <= to)
  );

const find = <T extends { _id?: string; id?: string }>(rows: T[], id: string): T => {
  const row = rows.find(r => r._id === id || r.id === id);
  if (!row) throw new HttpError(404, 'Not found');
  return row;
};

const fullName = (id: string) => {
  const u = users.find(x => x._id === id);
  return u ? `${u.firstName} ${u.lastName}` : '';
};

const touchNames = (row: any) => {
  const a = assignments.find(x => x._id === row.assignmentId);
  if (a) {
    row.candidateName = a.candidateName;
    row.companyName = a.companyName;
  }
  return row;
};

// ── Dashboard ────────────────────────────────────────────────────────────────
const dashboard = () => {
  const asg = visibleAssignments();
  const ids = new Set(asg.map(a => a._id));
  const t = today();
  const active = asg.filter(a => a.status === 'active');
  const eodToday = eods.filter(e => ids.has(e.assignmentId) && e.date === t);
  const weekFrom = fmt(daysAgo(7));
  const week = workEntries.filter(
    e => ids.has(e.assignmentId) && e.entryDate >= weekFrom
  );
  const totalMinutes = week.reduce((s, e) => s + e.timeSpent, 0);
  const perVa = new Map<string, any>();
  for (const e of week) {
    const r = perVa.get(e.candidateId) ?? {
      vaId: e.candidateId,
      vaName: e.candidateName,
      totalMinutes: 0,
      totalHours: 0,
      entriesCount: 0,
      tasksCompleted: 0,
    };
    r.totalMinutes += e.timeSpent;
    r.totalHours = Math.round((r.totalMinutes / 60) * 10) / 10;
    r.entriesCount++;
    if (e.status === 'completed') r.tasksCompleted++;
    perVa.set(e.candidateId, r);
  }
  const count = (s: string) => asg.filter(a => a.status === s).length;
  const missing = Math.max(active.length - eodToday.length, 0);
  return {
    overview: {
      totalAssignments: asg.length,
      activeAssignments: active.length,
      onHoldAssignments: count('on_hold'),
      endedAssignments: count('ended'),
      totalEodSubmissionsToday: eodToday.length,
      totalWorkEntriesToday: workEntries.filter(
        e => ids.has(e.assignmentId) && e.entryDate === t
      ).length,
      missingEodsToday: missing,
    },
    eodCompliance: {
      totalActive: active.length,
      submittedToday: eodToday.length,
      missingToday: missing,
      complianceRate: active.length
        ? Math.round((eodToday.length / active.length) * 100)
        : 100,
    },
    assignmentHealth: {
      active: active.length,
      on_hold: count('on_hold'),
      ended: count('ended'),
    },
    weeklyWorkHours: {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      entriesCount: week.length,
    },
    perVABreakdown: [...perVa.values()],
  };
};

// ── Reviews ──────────────────────────────────────────────────────────────────
const visibleReviews = () => {
  if (role() !== 'account_manager') return reviews;
  const mine = visibleAssignments();
  return reviews.filter(r =>
    mine.some(a => a.candidateId === r.candidateId && a.clientId === r.clientId)
  );
};

const downloadBlob = (text: string, type: string) => ({
  data: new Blob([text], { type }),
});

// ── Router ───────────────────────────────────────────────────────────────────
type Ctx = { q: URLSearchParams; body: any; m: RegExpMatchArray };
type Handler = (c: Ctx) => any;
const routes: Array<[string, RegExp, Handler]> = [];
const on = (method: string, path: string, h: Handler) =>
  routes.push([method, new RegExp(`^${path}/?$`), h]);

const toUser = (u: any) => ({
  _id: u._id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  roles: u.roles,
  clientRef: u.clientRef ?? null,
});

// Auth
on('POST', '/auth/login', ({ body }) => {
  const u = users.find(x => x.email === String(body.email).toLowerCase());
  if (!u) throw new HttpError(400, 'Invalid email or password');
  setSession(u._id);
  return ok({ accessToken: `demo-${u._id}`, user: toUser(u) });
});
on('POST', '/auth/refresh-token', () => {
  const u = me();
  if (!u) throw new HttpError(401, 'No session');
  return ok({ accessToken: `demo-${u._id}`, user: toUser(u) });
});
on('POST', '/auth/logout', () => {
  setSession(null);
  return ok(null);
});
for (const p of ['forgot-password', 'reset-password', 'set-password', 'change-password'])
  on('POST', `/auth/${p}`, () => ok(null));

// Users / lookups
on('GET', '/shared/users/crm-accounts', () => {
  const asg = visibleAssignments();
  const vaIds = new Set(asg.map(a => a.candidateId));
  const clIds = new Set(asg.map(a => a.clientId));
  const scoped = role() === 'account_manager';
  return ok({
    vas: users.filter(u => u.roles[0] === 'va' && (!scoped || vaIds.has((u as any).candidateRef))),
    clients: users.filter(u => u.roles[0] === 'client' && (!scoped || clIds.has((u as any).clientRef))),
  });
});
on('GET', '/shared/users', ({ q }) => {
  const r = q.get('role');
  const active = q.get('isActive') === 'true';
  return list(users.filter(u => (!r || u.roles.includes(r)) && (!active || u.isActive)));
});
on('GET', '/ats/clients', () => list(clients));
on('GET', '/ats/candidates', () => list(candidates));
on('GET', '/ats/jobs', () => list(jobs));

// Assignments
on('GET', '/crm/assignments', ({ q }) => {
  let rows = visibleAssignments();
  rows = eq(rows, 'status', q.get('status'));
  rows = eq(rows, 'accountManagerId', q.get('accountManagerId'));
  rows = eq(rows, 'candidateId', q.get('candidateId'));
  rows = eq(rows, 'clientId', q.get('clientId'));
  return list(clone(rows));
});
on('GET', '/crm/assignments/([^/]+)', ({ m }) => ok(find(assignments, m[1]!)));
on('POST', '/crm/assignments', ({ body }) => {
  const c = find(clients as any[], body.clientId);
  const v = find(candidates as any[], body.candidateId);
  const row = {
    _id: mkId('9', nextSeq() + 100),
    ...body,
    status: body.status ?? 'active',
    endDate: body.endDate ?? null,
    companyName: c.companyName,
    candidateName: `${v.firstName} ${v.lastName}`,
    accountManagerName: fullName(body.accountManagerId),
    accountManagerEmail: users.find(u => u._id === body.accountManagerId)?.email,
    createdAt: new Date().toISOString(),
  };
  assignments.unshift(row);
  return ok(row);
});
on('PATCH', '/crm/assignments/([^/]+)', ({ m, body }) => {
  const a = find(assignments, m[1]!);
  if (a.status === 'ended') throw new HttpError(400, 'Cannot update an ended assignment');
  Object.assign(a, body);
  if (body.accountManagerId) a.accountManagerName = fullName(body.accountManagerId);
  return ok(a);
});
on('DELETE', '/crm/assignments/([^/]+)', ({ m }) => {
  const a = find(assignments, m[1]!);
  a.status = 'ended';
  a.endDate = a.endDate ?? today();
  return ok(a);
});

// Work entries
on('GET', '/crm/work-entries', ({ q }) => {
  let rows = byAssignment(workEntries);
  rows = eq(rows, 'assignmentId', q.get('assignmentId'));
  rows = eq(rows, 'candidateId', q.get('candidateId'));
  rows = eq(rows, 'clientId', q.get('clientId'));
  rows = inRange(rows, 'entryDate', q.get('dateFrom'), q.get('dateTo'));
  return list(clone(rows).sort((a, b) => b.entryDate.localeCompare(a.entryDate)));
});
on('POST', '/crm/work-entries', ({ body }) => {
  const a = find(assignments, body.assignmentId);
  if (a.status === 'ended') throw new HttpError(400, 'Cannot add work entries to an ended assignment');
  const row = touchNames({
    _id: mkId('7', nextSeq() + 1000),
    ...body,
    candidateId: a.candidateId,
    clientId: a.clientId,
    createdAt: new Date().toISOString(),
  });
  workEntries.unshift(row);
  return ok(row);
});
on('PATCH', '/crm/work-entries/([^/]+)', ({ m, body }) => ok(Object.assign(find(workEntries, m[1]!), body)));
on('DELETE', '/crm/work-entries/([^/]+)', ({ m }) => {
  workEntries.splice(workEntries.indexOf(find(workEntries, m[1]!)), 1);
  return ok({ deleted: true });
});

// EODs
on('GET', '/crm/eod-submissions/context', () => ok({ dateKey: today(), timezone: 'America/Chicago' }));
on('GET', '/crm/eod-submissions', ({ q }) => {
  let rows = byAssignment(eods);
  rows = eq(rows, 'assignmentId', q.get('assignmentId'));
  rows = eq(rows, 'candidateId', q.get('candidateId'));
  rows = eq(rows, 'clientId', q.get('clientId'));
  const d = q.get('date');
  rows = inRange(rows, 'date', d ?? q.get('dateFrom'), d ?? q.get('dateTo'));
  return list(clone(rows).sort((a, b) => b.date.localeCompare(a.date)));
});
on('GET', '/crm/eod-submissions/([^/]+)', ({ m }) => ok(find(eods, m[1]!)));
on('POST', '/crm/eod-submissions', ({ body }) => {
  const a = find(assignments, body.assignmentId);
  if (a.status === 'ended') throw new HttpError(400, 'Cannot submit EOD for an ended assignment');
  const date = body.date ?? today();
  if (eods.some(e => e.assignmentId === a._id && e.date === date))
    throw new HttpError(409, `EOD already submitted for this assignment on ${date}`);
  const [sh, sm] = body.shiftStart.split(':').map(Number);
  const [eh, em] = body.shiftEnd.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  const row = touchNames({
    _id: mkId('8', nextSeq() + 1000),
    ...body,
    candidateId: a.candidateId,
    clientId: a.clientId,
    date,
    dateKey: date,
    dateTimezone: 'America/Chicago',
    hoursWorked: Math.round((mins / 60) * 100) / 100,
    createdAt: new Date().toISOString(),
  });
  eods.unshift(row);
  return ok(row);
});
on('DELETE', '/crm/eod-submissions/([^/]+)', ({ m }) => {
  eods.splice(eods.indexOf(find(eods, m[1]!)), 1);
  return ok(null);
});

// Dashboard / reports
on('GET', '/crm/dashboard', () => ok(dashboard()));
on('GET', '/crm/reports/(work-entries|eod-submissions|performance)/export', ({ q, m }) => {
  const fmtType = q.get('format') === 'xlsx' ? 'application/vnd.ms-excel' : 'text/csv';
  const rows =
    m[1] === 'work-entries'
      ? byAssignment(workEntries).map(e => `${e.entryDate},${e.candidateName},${e.taskCategory},${e.timeSpent}`)
      : byAssignment(eods).map(e => `${e.date},${e.candidateName},${e.hoursWorked}`);
  return downloadBlob(['Demo export', ...rows].join('\n'), fmtType);
});

// Reminders
on('GET', '/crm/survey-reminders', () =>
  list(role() === 'account_manager' ? reminders.filter(r => r.assignedTo === me().id || r.assignedTo === me()._id) : reminders)
);
on('PATCH', '/crm/survey-reminders/([^/]+)', ({ m, body }) => ok(Object.assign(find(reminders, m[1]!), body)));

// Scorecards
on('GET', '/crm/scorecards', ({ q }) => {
  const ids = visibleIds();
  const rows = eq(scorecards.filter(s => ids.has(s.assignmentId)), 'vaId', q.get('vaId'));
  return list(clone(rows).sort((a, b) => b.weekStart.localeCompare(a.weekStart)));
});
on('POST', '/crm/scorecards/generate', ({ body }) => {
  const targets = visibleAssignments().filter(
    a => a.status === 'active' && (!body?.vaId || a.candidateId === body.vaId)
  );
  const weekStart = fmt(daysAgo((new Date().getDay() + 6) % 7));
  for (const a of targets) {
    const mine = workEntries.filter(e => e.assignmentId === a._id && e.entryDate >= weekStart);
    const hours = mine.reduce((s, e) => s + e.timeSpent, 0) / 60;
    const done = mine.filter(e => e.status === 'completed').length;
    const eod = Math.min(100, Math.round((eods.filter(e => e.assignmentId === a._id && e.date >= weekStart).length / 7) * 100));
    const score = Math.round(Math.min(hours / 40, 1) * 30 + Math.min(done / 21, 1) * 20 + (eod / 100) * 40 + 10);
    const next = {
      id: mkId('5', nextSeq() + 1000),
      vaId: a.candidateId,
      assignmentId: a._id,
      vaName: a.candidateName,
      companyName: a.companyName,
      weekStart,
      weekEnd: fmt(daysAgo(((new Date().getDay() + 6) % 7) - 6)),
      totalHours: Math.round(hours * 10) / 10,
      totalTasksCompleted: done,
      avgTasksPerDay: Math.round((done / 7) * 10) / 10,
      eodComplianceRate: eod,
      onTimeSubmissionRate: 100,
      productivityScore: score,
      categoryDistribution: {},
      generatedAt: new Date().toISOString(),
    };
    const i = scorecards.findIndex(s => s.assignmentId === a._id && s.weekStart === weekStart);
    if (i >= 0) scorecards[i] = next;
    else scorecards.unshift(next);
  }
  return ok({ generated: targets.length });
});

// Client accounts
on('GET', '/crm/client-accounts/provisioned', () =>
  ok(clients.map(c => ({ clientId: c._id, companyName: c.companyName })))
);
on('GET', '/crm/client-accounts/([^/]+)/hired-vas', ({ m }) => {
  const ids = new Set(assignments.filter(a => a.clientId === m[1]).map(a => a.candidateId));
  return ok(candidates.filter(c => ids.has(c._id)).map(c => ({ id: c._id, firstName: c.firstName, lastName: c.lastName })));
});
on('GET', '/crm/client-accounts', () => {
  const ids = new Set(visibleAssignments().map(a => a.clientId));
  return list(clientAccounts.filter(c => role() !== 'account_manager' || ids.has(c.clientId)));
});
on('GET', '/crm/client-accounts/([^/]+)', ({ m }) => ok(find(clientAccounts, m[1]!)));
on('PATCH', '/crm/client-accounts/([^/]+)', ({ m, body }) => ok(Object.assign(find(clientAccounts, m[1]!), body)));

// VA profiles
on('GET', '/crm/va-profiles', () => list(vaProfiles));
on('GET', '/crm/va-profiles/([^/]+)/notes', ({ m }) => ok(notes[`va:${m[1]}`] ?? []));
on('POST', '/crm/va-profiles/([^/]+)/notes', ({ m, body }) => ok(addNote(`va:${m[1]}`, body)));
on('GET', '/crm/va-profiles/([^/]+)', ({ m }) => ok(find(vaProfiles, m[1]!)));
on('PATCH', '/crm/va-profiles/([^/]+)', ({ m, body }) => ok(Object.assign(find(vaProfiles, m[1]!), body)));
on('GET', '/ats/clients/([^/]+)/notes', ({ m }) => ok(notes[`client:${m[1]}`] ?? []));
on('POST', '/ats/clients/([^/]+)/notes', ({ m, body }) => ok(addNote(`client:${m[1]}`, body)));

function addNote(key: string, body: any) {
  const now = new Date().toISOString();
  const n = {
    _id: mkId('4', nextSeq() + 1000),
    method: body.method,
    content: body.content,
    author: me()?._id ?? null,
    authorName: me() ? fullName(me()._id) : '',
    createdAt: now,
    updatedAt: now,
  };
  (notes[key] ??= []).push(n);
  return n;
}

// Performance reviews
on('GET', '/crm/performance-reviews/([^/]+)/export-pdf', () => downloadBlob('%PDF-1.4 demo', 'application/pdf'));
on('GET', '/crm/performance-reviews', ({ q }) => {
  let rows = visibleReviews();
  rows = eq(rows, 'candidateId', q.get('candidateId'));
  rows = eq(rows, 'clientId', q.get('clientId'));
  rows = eq(rows, 'status', q.get('status'));
  return list(clone(rows));
});
on('GET', '/crm/performance-reviews/([^/]+)', ({ m }) => ok(find(reviews, m[1]!)));
on('POST', '/crm/performance-reviews', ({ body }) => {
  const a =
    assignments.find(x => x.candidateId === body.candidateId && x.clientId === body.clientId) ?? assignments[0];
  const row = {
    ...clone(reviews[0]),
    _id: mkId('2', nextSeq() + 1000),
    candidateId: body.candidateId,
    clientId: body.clientId,
    candidateName: a.candidateName,
    clientName: a.companyName,
    reviewType: body.reviewType,
    reviewPeriodStart: body.reviewPeriodStart,
    reviewPeriodEnd: body.reviewPeriodEnd,
    status: 'ai_generated',
    categories: makeCategories(false),
    overallRating: null,
    finalRecommendation: null,
    finalManagerSummary: '',
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  reviews.unshift(row);
  return ok(row);
});
on('PATCH', '/crm/performance-reviews/([^/]+)/complete', ({ m }) => {
  const r = find(reviews, m[1]!);
  r.status = 'completed';
  r.completedAt = new Date().toISOString();
  return ok(r);
});
on('PATCH', '/crm/performance-reviews/([^/]+)', ({ m, body }) => {
  const r = find(reviews, m[1]!);
  if (r.status === 'completed') throw new HttpError(400, 'Completed reviews cannot be edited');
  const { aiGenerated, ...rest } = body;
  Object.assign(r, rest);
  if (aiGenerated) r.aiGenerated = { ...r.aiGenerated, ...aiGenerated };
  return ok(r);
});
on('DELETE', '/crm/performance-reviews/([^/]+)', ({ m }) => {
  reviews.splice(reviews.indexOf(find(reviews, m[1]!)), 1);
  return ok(null);
});
on('POST', '/crm/performance-reviews/([^/]+)/regenerate', ({ m, body }) => {
  const r = find(reviews, m[1]!);
  if (body.section === 'categories') r.categories = makeCategories(false);
  if (body.section === 'goals') r.aiGenerated.goals = ['New goal A (demo)', 'New goal B (demo)'];
  if (body.section === 'summary') r.finalManagerSummary = `${r.finalManagerSummary} (polished by demo AI)`.trim();
  return ok(r);
});

// ── Adapter ──────────────────────────────────────────────────────────────────
export const demoAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const url = new URL(config.url ?? '', 'http://demo.local');
  const q = url.searchParams;
  for (const [k, v] of Object.entries((config.params ?? {}) as Record<string, unknown>))
    if (v !== undefined && v !== null) q.set(k, String(v));

  const path = url.pathname.replace(/^\/api\/v1/, '');
  const method = (config.method ?? 'get').toUpperCase();
  let body: any = config.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      /* leave as is */
    }
  }

  const respond = (status: number, data: unknown): AxiosResponse => ({
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  });

  await new Promise(r => setTimeout(r, 150)); // feel like a network

  try {
    // Role gate: everything except auth needs a session.
    if (!path.startsWith('/auth/') && !me()) throw new HttpError(401, 'Not signed in');

    for (const [rMethod, re, handler] of routes) {
      if (rMethod !== method) continue;
      const m = path.match(re);
      if (!m) continue;
      const result = handler({ q, body: body ?? {}, m });
      return respond(200, result.data instanceof Blob ? result.data : result.data);
    }
    throw new HttpError(404, `Demo API has no route for ${method} ${path}`);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    const message = e instanceof Error ? e.message : 'Demo error';
    if (!(e instanceof HttpError)) console.error('[demo-api]', e);
    throw new AxiosError(
      message,
      String(status),
      config,
      null,
      respond(status, { success: false, message, error: { message } })
    );
  }
};
