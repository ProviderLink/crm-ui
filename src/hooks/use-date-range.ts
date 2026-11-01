import { useState } from 'react';

import { addDaysToDateKey, todayString } from '@/lib/time';

/**
 * A from/to date filter that starts on the last `days` days. `isChanged` tells
 * whether the user moved it, and `reset` puts it back.
 */
export function useDateRange(days = 30) {
  const [defaults] = useState(() => ({
    from: addDaysToDateKey(todayString(), -days),
    to: todayString(),
  }));
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);

  return {
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    isChanged: dateFrom !== defaults.from || dateTo !== defaults.to,
    reset() {
      setDateFrom(defaults.from);
      setDateTo(defaults.to);
    },
  };
}
