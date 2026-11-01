import { describe, expect, it } from 'vitest';

import { LIST_LIMIT, toQueryString } from './api-query';

describe('toQueryString', () => {
  it('joins the values that are set', () => {
    expect(toQueryString({ status: 'active', limit: 1000 })).toBe(
      'status=active&limit=1000'
    );
  });

  it('leaves out undefined, null and empty values', () => {
    expect(toQueryString({ a: undefined, b: null, c: '', d: 'x', e: 0 })).toBe(
      'd=x&e=0'
    );
  });

  it('encodes values', () => {
    expect(toQueryString({ q: 'a b&c' })).toBe('q=a+b%26c');
  });

  it('is empty when nothing is set', () => {
    expect(toQueryString({})).toBe('');
  });

  it('keeps the page size the lists ask for', () => {
    expect(LIST_LIMIT).toBe(1000);
  });
});
