import { describe, expect, it } from 'vitest';

import { DEFAULT_WORK_ENTRY, schema } from './schema';

const valid = {
  assignmentId: 'a1',
  shiftStart: '09:00',
  shiftEnd: '17:00',
  workEntries: [{ ...DEFAULT_WORK_ENTRY, task: 'Calls', description: 'x' }],
  pendingTasks: 'None',
  blockers: 'None',
  communicatedWithClient: 'yes' as const,
};

const issues = (input: unknown) => {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map(i => i.message);
};

describe('EOD schema', () => {
  it('accepts a complete report', () => {
    expect(issues(valid)).toEqual([]);
  });

  it('rejects a shift that ends when it starts', () => {
    expect(issues({ ...valid, shiftEnd: '09:00' })).toContain(
      'Shift end must differ from the start'
    );
  });

  it('allows an overnight shift', () => {
    expect(
      issues({ ...valid, shiftStart: '22:00', shiftEnd: '02:00' })
    ).toEqual([]);
  });

  it('caps the time on one task at 8 hours', () => {
    const entry = { ...valid.workEntries[0]!, timeSpent: 481 };
    expect(issues({ ...valid, workEntries: [entry] })).toContain(
      'Maximum is 480 minutes (8 hours) per task'
    );
  });
});
