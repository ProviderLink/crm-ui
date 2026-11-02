import { describe, expect, it } from 'vitest';

import { hasBlocker } from './blockers';

describe('hasBlocker', () => {
  it('ignores empty answers and "None" in its usual spellings', () => {
    for (const blockers of ['', '  ', 'None', 'none.', 'N/A', 'nil', '--'])
      expect(hasBlocker({ blockers })).toBe(false);
  });

  it('counts a real blocker', () => {
    expect(hasBlocker({ blockers: 'Waiting on the client for logins' })).toBe(
      true
    );
    expect(hasBlocker({ blockers: 'None of the logins work' })).toBe(true);
  });
});
