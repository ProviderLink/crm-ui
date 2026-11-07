import { AxiosError, type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/lib/api';

import { getAllAssignments, getMyAssignments } from './assignments.service';
import { getAtsClients } from './ats.service';
import { login } from './auth.service';
import { getClientAccount } from './client-accounts.service';
import { listNotes } from './notes.service';
import {
  generateReview,
  getReview,
  updateReview,
} from './performance-reviews.service';
import { exportReport } from './reports.service';
import { getWorkEntries } from './work-entries.service';

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  LONG_REQUEST_TIMEOUT_MS: 120_000,
}));
vi.mock('@/lib/download', () => ({ downloadBlob: vi.fn() }));

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const patch = vi.mocked(api.patch);

const httpError = (status: number) =>
  new AxiosError('x', 'ERR_BAD_REQUEST', undefined, null, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: {},
  } as AxiosResponse);

beforeEach(() => vi.clearAllMocks());

describe('assignments', () => {
  it('asks for a large page, with the filters that are set', async () => {
    get.mockResolvedValue({ data: { data: [] } });
    await getAllAssignments({ accountManagerId: 'am1' });
    expect(get).toHaveBeenCalledWith(
      '/crm/assignments?accountManagerId=am1&limit=1000'
    );
  });

  it("asks for a VA's active assignments, not the default 20", async () => {
    get.mockResolvedValue({ data: { data: [] } });
    await getMyAssignments();
    expect(get).toHaveBeenCalledWith(
      '/crm/assignments?status=active&limit=1000'
    );
  });
});

describe('work entries', () => {
  it('sends only the filters that are set', async () => {
    get.mockResolvedValue({ data: { data: [] } });
    await getWorkEntries({ dateFrom: '2026-10-01', dateTo: undefined });
    expect(get).toHaveBeenCalledWith(
      '/crm/work-entries?dateFrom=2026-10-01&limit=1000&page=1'
    );
  });
});

describe('client accounts', () => {
  it('is null when the client has no profile yet', async () => {
    get.mockRejectedValue(httpError(404));
    expect(await getClientAccount('k1')).toBeNull();
  });

  it('rethrows any other failure', async () => {
    get.mockRejectedValue(httpError(500));
    await expect(getClientAccount('k1')).rejects.toBeTruthy();
  });
});

describe('ATS clients', () => {
  it('falls back to the clients on own assignments when forbidden', async () => {
    get.mockImplementation(async url => {
      if (url === '/ats/clients') throw httpError(403);
      return {
        data: {
          data: [
            { candidateId: 'c1', clientId: 'k1', companyName: 'Sunrise' },
            { candidateId: 'c2', clientId: 'k1', companyName: 'Sunrise' },
          ],
        },
      };
    });
    const clients = await getAtsClients();
    expect(clients).toEqual([
      { id: 'k1', companyName: 'Sunrise', status: 'active' },
    ]);
  });

  it('does not hide other failures behind the fallback', async () => {
    get.mockRejectedValue(httpError(500));
    await expect(getAtsClients()).rejects.toBeTruthy();
  });
});

describe('notes', () => {
  const note = (id: string, createdAt: string) => ({ _id: id, createdAt });

  it('lists client notes oldest first, whatever order they arrive in', async () => {
    get.mockResolvedValue({
      data: {
        data: [note('new', '2026-10-02'), note('old', '2026-10-01')],
      },
    });
    const notes = await listNotes('client', 'k1');
    expect(notes.map(n => n._id)).toEqual(['old', 'new']);
  });

  it('keeps the order of VA notes', async () => {
    get.mockResolvedValue({
      data: { data: [note('b', '2026-10-02'), note('a', '2026-10-01')] },
    });
    const notes = await listNotes('va', 'v1');
    expect(notes.map(n => n._id)).toEqual(['b', 'a']);
  });
});

describe('sign-in', () => {
  const reply = (roles: string[]) => ({
    data: {
      data: {
        accessToken: 't',
        user: {
          _id: 'u1',
          email: 'a@b.c',
          firstName: 'A',
          lastName: 'B',
          roles,
        },
      },
    },
  });

  it('takes the first CRM role of a user who also holds ATS roles', async () => {
    post.mockResolvedValue(reply(['recruiter', 'va']));
    const { user } = await login({ email: 'a@b.c', password: 'x' });
    expect(user.role).toBe('va');
  });

  it('refuses a user with no CRM role', async () => {
    post.mockResolvedValue(reply(['recruiter']));
    await expect(login({ email: 'a@b.c', password: 'x' })).rejects.toThrow(
      /does not have access/
    );
  });
});

describe('performance reviews', () => {
  const backendReview = {
    _id: 'r1',
    candidateId: 'c1',
    clientId: 'k1',
    reviewType: '30_day',
    status: 'ai_generated',
    aiGenerated: {
      roleSummary: 'Scheduler',
      coreResponsibilities: 'Book visits',
      goals: ['Faster'],
    },
    reviewPeriodStart: '2026-10-01T00:00:00.000Z',
    categories: [{ _id: 'cat1', categoryName: 'Quality', sortOrder: 1 }],
  };

  it('maps a backend review to the shape the app uses', async () => {
    get.mockResolvedValue({ data: { data: backendReview } });
    const review = await getReview('r1');
    expect(review).toMatchObject({
      id: 'r1',
      vaId: 'c1',
      reviewType: '30-Day',
      reviewStatus: 'AI Generated',
      roleSummary: 'Scheduler',
      coreResponsibilities: ['Book visits'],
      goalsNextPeriod: ['Faster'],
      reviewPeriodStart: '2026-10-01',
      reviewPeriodEnd: '',
    });
    expect(review.categories?.[0]?.id).toBe('cat1');
  });

  it('sends the VA as the candidate and the review type in backend form', async () => {
    post.mockResolvedValue({ data: { data: backendReview } });
    await generateReview({
      vaId: 'c1',
      clientId: 'k1',
      reviewType: '90-Day',
      reviewPeriodStart: '2026-10-01',
      reviewPeriodEnd: '2026-10-31',
      roleType: 'Scheduler VA',
      jobDescription: 'x',
      clientExpectations: 'y',
    });
    expect(post.mock.calls[0]?.[1]).toMatchObject({
      candidateId: 'c1',
      reviewType: '90_day',
    });
    // AI generation can take a while.
    expect(post.mock.calls[0]?.[2]).toMatchObject({ timeout: 120_000 });
  });

  it('wraps the AI-written text and maps the status when saving', async () => {
    patch.mockResolvedValue({ data: { data: backendReview } });
    await updateReview('r1', {
      roleSummary: 'New',
      goalsNextPeriod: ['A'],
      reviewStatus: 'In Review',
      overallRating: 4,
    });
    expect(patch.mock.calls[0]?.[1]).toEqual({
      aiGenerated: { roleSummary: 'New', goals: ['A'] },
      overallRating: 4,
      status: 'in_review',
    });
  });

  it('never sets Completed through a plain save', async () => {
    patch.mockResolvedValue({ data: { data: backendReview } });
    await updateReview('r1', { reviewStatus: 'Completed' });
    expect(patch.mock.calls[0]?.[1]).toEqual({});
  });
});

describe('report export', () => {
  it('asks for a file, with room for a big one', async () => {
    get.mockResolvedValue({ data: new Blob(['a']) });
    await exportReport('eod', '2026-10-01', '2026-10-31', 'xlsx');
    expect(get).toHaveBeenCalledWith('/crm/reports/eod-submissions/export', {
      params: {
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        format: 'xlsx',
      },
      responseType: 'blob',
      timeout: 120_000,
    });
  });
});

describe('review PDF name', () => {
  it('uses the VA name, lower-cased and hyphenated', async () => {
    const { reviewPdfFilename } = await import('./performance-reviews.service');
    expect(reviewPdfFilename('Ayesha  Rahman ')).toBe(
      'performance-review-ayesha-rahman.pdf'
    );
    expect(reviewPdfFilename()).toBe('performance-review-review.pdf');
  });
});
