/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DEMO DATA — temporary, front-end only. Delete the whole `src/demo` folder and
 * the two lines in `src/lib/api.ts` when UI testing is done.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export const fmt = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export const today = (): string => fmt(new Date());
const iso = (n: number, h = 17, m = 0): string => {
  const d = daysAgo(n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

/** 24-char hex-looking ids so they look like real Mongo ids. */
export const mkId = (prefix: string, n: number): string =>
  `${prefix}${String(n).padStart(23, '0')}`.slice(0, 24);

export const ID = {
  admin: mkId('a', 1),
  am1: mkId('b', 1),
  am2: mkId('b', 2),
  va: (n: number) => mkId('c', n),
  client: (n: number) => mkId('d', n),
  vaUser: (n: number) => mkId('e', n),
  clientUser: (n: number) => mkId('f', n),
  assignment: (n: number) => mkId('9', n),
};

const person = (
  _id: string,
  firstName: string,
  lastName: string,
  email: string,
  role: string,
  extra: Record<string, unknown> = {}
) => ({
  _id,
  id: _id,
  firstName,
  lastName,
  email,
  roles: [role],
  isActive: true,
  emailVerified: true,
  isInviteAccepted: true,
  createdAt: iso(90),
  ...extra,
});

const candidates = [
  { n: 1, f: 'Ayesha', l: 'Rahman' },
  { n: 2, f: 'Marco', l: 'Santos' },
  { n: 3, f: 'Priya', l: 'Nair' },
  { n: 4, f: 'Tomas', l: 'Novak' },
  { n: 5, f: 'Lena', l: 'Fischer' },
].map(c => ({
  _id: ID.va(c.n),
  id: ID.va(c.n),
  firstName: c.f,
  lastName: c.l,
  email: `${c.f.toLowerCase()}@demo.test`,
  status: 'hired',
}));

const clients = [
  { n: 1, name: 'Sunrise Family Clinic', contact: 'Dr. Helen Brooks' },
  { n: 2, name: 'Lakeview Dental Group', contact: 'Mark Ellison' },
  { n: 3, name: 'Metro Billing Partners', contact: 'Janet Cruz' },
].map(c => ({
  _id: ID.client(c.n),
  id: ID.client(c.n),
  companyName: c.name,
  email: `office${c.n}@client.demo.test`,
  status: 'active',
  contacts: [
    {
      name: c.contact,
      email: `contact${c.n}@client.demo.test`,
      phone: `555-010${c.n}`,
      position: 'Practice Manager',
      isPrimary: true,
    },
  ],
}));

// Demo logins (any password works):
//   admin@demo.test · am@demo.test · va@demo.test · client@demo.test
export const users = [
  person(ID.admin, 'Alex', 'Morgan', 'admin@demo.test', 'admin'),
  person(ID.am1, 'Sarah', 'Collins', 'am@demo.test', 'account_manager'),
  person(ID.am2, 'David', 'Park', 'am2@demo.test', 'account_manager'),
  ...candidates.map((c, i) =>
    person(
      ID.vaUser(i + 1),
      c.firstName,
      c.lastName,
      i === 0 ? 'va@demo.test' : c.email,
      'va',
      { candidateRef: c._id }
    )
  ),
  ...clients.map((c, i) =>
    person(
      ID.clientUser(i + 1),
      c.contacts[0]!.name.split(' ')[0]!,
      c.contacts[0]!.name.split(' ').slice(1).join(' '),
      i === 0 ? 'client@demo.test' : c.contacts[0]!.email,
      'client',
      { clientRef: c._id }
    )
  ),
];

// va n → client n, with a few extras. am1 manages 1-3, am2 manages 4-6.
const asg = [
  { n: 1, va: 1, cl: 1, am: ID.am1, st: 'active', svc: 'Medical Receptionist', start: 60 },
  { n: 2, va: 2, cl: 1, am: ID.am1, st: 'active', svc: 'Scheduler', start: 45 },
  { n: 3, va: 3, cl: 2, am: ID.am1, st: 'on_hold', svc: 'Insurance Verification', start: 30 },
  { n: 4, va: 4, cl: 2, am: ID.am2, st: 'active', svc: 'Billing', start: 20 },
  { n: 5, va: 5, cl: 3, am: ID.am2, st: 'active', svc: 'Denials / AR Follow-Up', start: 10 },
  { n: 6, va: 1, cl: 3, am: ID.am2, st: 'ended', svc: 'Data Entry', start: 120, end: 70 },
];

const nameOf = (id: string) => {
  const u = users.find(x => x._id === id)!;
  return `${u.firstName} ${u.lastName}`;
};

export const assignments = asg.map(a => ({
  _id: ID.assignment(a.n),
  candidateId: ID.va(a.va),
  clientId: ID.client(a.cl),
  companyName: clients[a.cl - 1]!.companyName,
  candidateName: `${candidates[a.va - 1]!.firstName} ${candidates[a.va - 1]!.lastName}`,
  accountManagerId: a.am,
  accountManagerName: nameOf(a.am),
  accountManagerEmail: users.find(u => u._id === a.am)!.email,
  status: a.st,
  serviceType: a.svc,
  startDate: fmt(daysAgo(a.start)),
  endDate: a.end ? fmt(daysAgo(a.end)) : null,
  notes: a.n === 1 ? 'Front desk coverage, 9am–5pm clinic time.' : null,
  createdAt: iso(a.start),
})) as any[];

const weekdays = (count: number, skipToday = false): string[] => {
  const out: string[] = [];
  for (let i = skipToday ? 1 : 0; out.length < count; i++) {
    const d = daysAgo(i);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(fmt(d));
  }
  return out;
};

const CATS = [
  'Administrative',
  'Clinical Coordination',
  'Data Entry',
  'Communication',
  'Research',
  'Scheduling',
];
const TASKS = [
  'Confirmed next-day patient appointments',
  'Entered insurance details into the EMR',
  'Followed up on unpaid claims',
  'Answered patient calls and emails',
  'Updated the referral tracker',
  'Verified eligibility for new patients',
];

let seq = 1;
const activeAsg = assignments.filter(a => a.status !== 'ended');

export const workEntries = activeAsg.flatMap(a =>
  weekdays(10).flatMap((date, di) =>
    [0, 1, 2].map(k => {
      const status = di === 0 && k === 2 ? 'in_progress' : 'completed';
      return {
        _id: mkId('7', seq++),
        assignmentId: a._id,
        candidateId: a.candidateId,
        clientId: a.clientId,
        candidateName: a.candidateName,
        companyName: a.companyName,
        entryDate: date,
        entryTime: `${pad(9 + k * 2)}:00`,
        taskCategory: CATS[(di + k + a.candidateId.length) % CATS.length],
        taskDescription: TASKS[(di + k * 2) % TASKS.length],
        // Different VAs work different amounts, so charts have something to show.
        timeSpent:
          Math.round(([45, 90, 120][k]! * [1, 0.8, 0.5, 1.25, 0.65][Number(a.candidateId.slice(-1)) - 1]!) / 5) * 5,
        status,
        notes: k === 1 && di % 3 === 0 ? 'Waiting on client reply.' : '',
        createdAt: iso(di),
      };
    })
  )
) as any[];

// EODs: every active assignment, last 8 weekdays. Skip one day on assignment 2,
// and skip today for assignment 1 so a VA can try the submit form.
export const eods = activeAsg
  .filter(a => a.status === 'active')
  .flatMap(a =>
    weekdays(8).flatMap((date, di) => {
      if (a._id === ID.assignment(1) && di === 0) return [];
      if (a._id === ID.assignment(2) && di === 3) return [];
      return [
        {
          _id: mkId('8', seq++),
          assignmentId: a._id,
          candidateId: a.candidateId,
          clientId: a.clientId,
          candidateName: a.candidateName,
          companyName: a.companyName,
          date,
          dateKey: date,
          dateTimezone: 'America/Chicago',
          shiftStart: '09:00',
          shiftEnd: '17:00',
          hoursWorked: 8,
          summaryOfWork: null,
          workEntries: [
            {
              task: 'Appointment confirmations',
              description: 'Called and emailed patients for tomorrow',
              quantity: 24,
              status: 'completed',
              timeSpent: 150,
            },
            {
              task: 'Claims follow-up',
              description: 'Reviewed aged claims and sent reminders',
              quantity: 12,
              status: di % 4 === 0 ? 'in_progress' : 'completed',
              timeSpent: 180,
            },
          ],
          pendingTasks: 'Two claims awaiting payer response.',
          blockers: di % 4 === 0 ? 'EMR was slow in the afternoon.' : '',
          notes: '',
          communicatedWithClient: di % 3 === 0 ? 'no' : 'yes',
          clientNote: di % 3 === 0 ? null : 'Everything on track.',
          createdAt: iso(di, 17, 20),
        },
      ];
    })
  ) as any[];

// Variety for the EOD table: some reports with 3+ tasks, and one legacy report
// that only has free text.
eods.forEach((e, i) => {
  if (i % 4 === 1) {
    e.workEntries.push({
      task: 'Referral tracker update',
      description: 'Updated the tracker',
      quantity: 8,
      status: 'pending',
      timeSpent: 45,
    });
    e.workEntries.push({
      task: 'Insurance eligibility checks',
      description: 'Verified new patients',
      quantity: 0,
      status: 'completed',
      timeSpent: 60,
    });
  }
  if (i === 5) {
    e.workEntries = [];
    e.summaryOfWork =
      'Handled the front desk queue, confirmed tomorrow’s appointments and followed up on two unpaid claims. Spent the afternoon on the referral tracker.';
  }
});

const rem = (
  n: number,
  a: any,
  type: string,
  due: number,
  status: string
) => ({
  _id: mkId('6', n),
  relatedType: 'assignment',
  relatedId: a._id,
  surveyType: type,
  dueDate: iso(due),
  completedDate: status === 'completed' ? iso(due) : undefined,
  status,
  assignedTo: a.accountManagerId,
  createdAt: a.createdAt,
});

export const reminders = [
  rem(1, assignments[0], '3_day', 57, 'completed'),
  rem(2, assignments[0], '1_week', 53, 'completed'),
  rem(3, assignments[0], '30_day', 30, 'completed'),
  rem(4, assignments[0], 'monthly', 0, 'pending'),
  rem(5, assignments[1], '30_day', 15, 'sent'),
  rem(6, assignments[1], 'monthly', -15, 'pending'),
  rem(7, assignments[3], '1_week', 13, 'skipped'),
  rem(8, assignments[3], '30_day', -10, 'pending'),
  rem(9, assignments[4], '3_day', 7, 'sent'),
  rem(10, assignments[4], '1_week', 3, 'pending'),
] as any[];

// Extra reminders so the table spans more than one page.
{
  const types = ['3_day', '1_week', '30_day', 'monthly'];
  const statuses = ['pending', 'sent', 'completed', 'skipped'];
  for (let i = 0; i < 18; i++) {
    const a = assignments[i % 5]!;
    reminders.push(
      rem(11 + i, a, types[i % 4]!, 40 - i * 4, statuses[(i * 3) % 4]!)
    );
  }
}

export const scorecards = activeAsg
  .filter(a => a.status === 'active')
  .flatMap(a =>
    [0, 7, 14, 21].map((offset, i) => {
      const ws = daysAgo(((new Date().getDay() + 6) % 7) + offset);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      return {
        id: mkId('5', seq++),
        vaId: a.candidateId,
        assignmentId: a._id,
        vaName: a.candidateName,
        companyName: a.companyName,
        weekStart: fmt(ws),
        weekEnd: fmt(we),
        totalHours: 34 - i * 3,
        totalTasksCompleted: 18 - i * 2,
        avgTasksPerDay: 2.6 - i * 0.3,
        eodComplianceRate: 71 - i * 14,
        onTimeSubmissionRate: 100 - i * 20,
        productivityScore: 82 - i * 12,
        categoryDistribution: { Administrative: 6, 'Data Entry': 5, Communication: 4, Scheduling: 3 },
        generatedAt: iso(offset),
      };
    })
  ) as any[];

export const clientAccounts = clients.map((c, i) => ({
  id: c._id,
  _id: c._id,
  clientId: c._id,
  companyName: c.companyName,
  accountOwnerId: i < 2 ? ID.am1 : ID.am2,
  serviceStartDate: fmt(daysAgo(120 - i * 30)),
  emrSystem: ['Epic', 'Dentrix', 'athenahealth'][i],
  baaSigned: i !== 2,
  baaSignedDate: i !== 2 ? fmt(daysAgo(110)) : undefined,
  onboardingComplete: i !== 2,
  sopReceived: i === 0,
  primaryContact: c.contacts[0]!.name,
  primaryContactEmail: c.contacts[0]!.email,
  primaryContactPhone: c.contacts[0]!.phone,
  secondaryContact: '',
  lastClientCheckin: fmt(daysAgo(5 + i * 9)),
  satisfactionScore: [5, 4, 3][i],
  healthStatus: ['green', 'yellow', 'red'][i],
  openIssuesCount: [0, 2, 5][i],
  notes: i === 2 ? 'Escalated: wants faster claim turnaround.' : '',
  createdAt: iso(120),
  updatedAt: iso(2),
})) as any[];

export const vaProfiles = candidates.map((c, i) => ({
  id: c._id,
  _id: c._id,
  vaId: c._id,
  workloadLevel: ['normal', 'high', 'low', 'overloaded', 'normal'][i],
  satisfactionScore: [5, 4, 3, 2, 4][i],
  burnoutRiskFlag: i === 3,
  replacementRiskFlag: i === 2,
  lastVaCheckin: fmt(daysAgo(4 + i * 3)),
  notes: '',
  createdAt: iso(90),
  updatedAt: iso(3),
})) as any[];

const note = (n: number, method: string, content: string, ago: number, by: string) => ({
  _id: mkId('4', n),
  method,
  content,
  author: by,
  authorName: nameOf(by),
  createdAt: iso(ago),
  updatedAt: iso(ago),
});

/** key = `client:<id>` or `va:<id>` */
export const notes: Record<string, any[]> = {
  [`client:${ID.client(1)}`]: [
    note(1, 'call', 'Kickoff call. Client wants confirmations done by 4pm.', 40, ID.am1),
    note(2, 'email', 'Sent the weekly summary; client happy.', 6, ID.am1),
  ],
  [`client:${ID.client(3)}`]: [
    note(3, 'meeting', 'Escalation meeting about claim turnaround.', 4, ID.admin),
  ],
  [`va:${ID.va(1)}`]: [
    note(4, 'message', 'Checked in on workload, doing fine.', 8, ID.am1),
  ],
  [`va:${ID.va(4)}`]: [
    note(5, 'call', 'Mentioned long hours. Watch for burnout.', 3, ID.am2),
  ],
};

const cats = [
  'Communication',
  'Reliability & Attendance',
  'Task Accuracy',
  'Initiative',
  'Client Responsiveness',
  'Process Adherence',
];

export const makeCategories = (rated: boolean) =>
  cats.map((name, i) => ({
    _id: mkId('3', seq++),
    categoryName: name,
    categoryDescription: `How well the VA performs on ${name.toLowerCase()}.`,
    reviewQuestions: ['What went well this period?', 'What should improve?'],
    suggestedKpis: ['Response time under 2h', 'Error rate under 2%'],
    managerCommentPrompt: 'Add concrete examples.',
    rating: rated ? [4, 5, 4, 3, 4, 5][i] : null,
    managerComments: rated ? 'Consistent and dependable.' : '',
    sortOrder: i + 1,
  }));

const review = (
  n: number,
  a: any,
  type: string,
  status: string,
  rated: boolean
) => ({
  _id: mkId('2', n),
  candidateId: a.candidateId,
  clientId: a.clientId,
  candidateName: a.candidateName,
  clientName: a.companyName,
  jobId: null,
  reviewType: type,
  reviewPeriodStart: fmt(daysAgo(30)),
  reviewPeriodEnd: fmt(daysAgo(1)),
  status,
  aiGenerated: {
    roleSummary: `${a.serviceType} VA supporting ${a.companyName}.`,
    coreResponsibilities: ['Handle daily queue', 'Keep records accurate', 'Report daily'],
    strengths: 'Reliable, communicates early, accurate with data.',
    areasForImprovement: 'Could be more proactive on follow-ups.',
    goals: ['Reduce turnaround by 10%', 'Own the weekly summary'],
    finalRecommendation: 'Continue placement.',
    generatedAt: iso(10),
  },
  categories: makeCategories(rated),
  overallRating: rated ? 4 : null,
  clientSatisfactionScore: null,
  managerRatingInputs: null,
  finalRecommendation: rated ? 'Continue Placement' : null,
  finalManagerSummary: rated ? 'Solid performer; keep going.' : '',
  generatedByUserId: a.accountManagerId,
  reviewedByUserId: null,
  reviewerName: a.accountManagerName,
  createdAt: iso(10),
  updatedAt: iso(2),
  completedAt: status === 'completed' ? iso(2) : null,
});

export const reviews = [
  review(1, assignments[0], '30_day', 'completed', true),
  review(2, assignments[1], '60_day', 'in_review', true),
  review(3, assignments[3], '30_day', 'ai_generated', false),
  review(4, assignments[4], 'client_satisfaction', 'draft', false),
] as any[];

// Extra reviews so the table spans more than one page.
{
  const types = ['30_day', '60_day', '90_day', 'annual', 'client_satisfaction', 'corrective_coaching'];
  const statuses = ['draft', 'ai_generated', 'in_review', 'sent_to_client', 'completed', 'archived'];
  for (let i = 0; i < 13; i++) {
    reviews.push(
      review(5 + i, assignments[i % 5], types[i % 6]!, statuses[(i * 5) % 6]!, i % 3 !== 0)
    );
  }
}

export const jobs = clients.map((c, i) => ({
  _id: mkId('1', i + 1),
  id: mkId('1', i + 1),
  title: 'Virtual Assistant',
  clientId: c._id,
  status: 'open',
}));

export { candidates, clients };
export const nextSeq = () => seq++;
