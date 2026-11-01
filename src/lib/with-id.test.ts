import { describe, expect, it } from 'vitest';

import { withId } from './with-id';

describe('withId', () => {
  it('exposes _id as id', () => {
    expect(
      withId<{ id?: string; name: string }>({ _id: 'abc', name: 'x' })
    ).toEqual({
      _id: 'abc',
      id: 'abc',
      name: 'x',
    });
  });

  it('keeps an id that is already there', () => {
    expect(withId<{ id?: string }>({ id: 'k' }).id).toBe('k');
  });
});
