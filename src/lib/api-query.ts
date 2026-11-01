/**
 * `a=1&b=2` from the filters that are set; empty values are left out. The
 * backend returns 20 rows when no `limit` is sent, so lists ask for a large
 * page by passing `limit`.
 */
export function toQueryString(
  params: Record<string, string | number | null | undefined>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '')
      search.set(key, String(value));
  }
  return search.toString();
}

/** Page size for lists the pages filter and sort themselves. */
export const LIST_LIMIT = 1000;
