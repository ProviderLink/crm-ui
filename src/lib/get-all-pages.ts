import api from '@/lib/api';
import { LIST_LIMIT, toQueryString } from '@/lib/api-query';

/** Safety stop, so a bad `totalPages` can never loop forever. */
const MAX_PAGES = 50;

/**
 * Every row of a paged list. Loads page after page until the server's
 * `totalPages` is reached, so long lists are never silently cut off.
 */
export async function getAllPages<T>(
  path: string,
  params: Record<string, string | number | null | undefined> = {}
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data } = await api.get<{
      data: T[];
      meta?: { totalPages?: number };
    }>(`${path}?${toQueryString({ ...params, limit: LIST_LIMIT, page })}`);
    rows.push(...data.data);
    const totalPages = data.meta?.totalPages ?? 1;
    if (page >= totalPages || data.data.length === 0) break;
  }
  return rows;
}
