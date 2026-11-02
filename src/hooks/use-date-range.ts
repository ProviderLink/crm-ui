import { useState } from 'react';

import { addDaysToDateKey } from '@/lib/time';

/**
 * A from/to date filter that starts on the last `days` days up to `today` (the
 * company's business day, see `useCompanyDay`). Until the user picks a date it
 * follows `today`, so it is right once the server's day arrives and after
 * midnight. `isChanged` tells whether the user moved it, and `reset` puts it
 * back.
 */
export function useDateRange(today: string, days = 30) {
  const defaultFrom = addDaysToDateKey(today, -days);
  // `null` follows the default window; a value (even '') is the user's choice.
  const [fromChoice, setDateFrom] = useState<string | null>(null);
  const [toChoice, setDateTo] = useState<string | null>(null);
  const dateFrom = fromChoice ?? defaultFrom;
  const dateTo = toChoice ?? today;

  return {
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    isChanged: dateFrom !== defaultFrom || dateTo !== today,
    reset() {
      setDateFrom(null);
      setDateTo(null);
    },
  };
}
