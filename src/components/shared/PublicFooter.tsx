import axios from 'axios';
import { useEffect, useState } from 'react';

import { config } from '@/lib/config';

type Status =
  | { kind: 'checking' }
  | { kind: 'ok'; ms: number }
  | { kind: 'down' };

const DEMO = import.meta.env.VITE_DEMO === 'true';
const RECHECK_MS = 60_000;

/**
 * Asks the API whether it is reachable. Any answer below 500 counts as up, so
 * the "not signed in" reply of a protected route is enough. A plain axios call
 * is used on purpose: the app's own client would try to refresh a session.
 */
async function pingApi(): Promise<Status> {
  const started = performance.now();
  try {
    await axios.get(`${config.apiUrl}/crm/eod-submissions/context`, {
      timeout: 8000,
      validateStatus: s => s < 500,
    });
    return { kind: 'ok', ms: Math.round(performance.now() - started) };
  } catch {
    return { kind: 'down' };
  }
}

function ServiceStatus() {
  const [status, setStatus] = useState<Status>({ kind: 'checking' });

  useEffect(() => {
    if (DEMO) return;
    let alive = true;
    const check = () =>
      pingApi().then(s => {
        if (alive) setStatus(s);
      });
    check();
    const timer = setInterval(check, RECHECK_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const view = DEMO
    ? { dot: 'bg-text-tertiary', text: 'Demo environment' }
    : status.kind === 'ok'
      ? {
          dot: 'bg-status-success',
          text: `All systems operational · ${status.ms} ms`,
        }
      : status.kind === 'down'
        ? { dot: 'bg-status-error', text: 'Service unavailable' }
        : { dot: 'bg-text-tertiary animate-pulse', text: 'Checking system status…' };

  return (
    <p
      className="flex items-center gap-2 text-xs text-text-tertiary"
      role="status"
      aria-live="polite"
    >
      <span className={`size-1.5 rounded-full ${view.dot}`} aria-hidden />
      {view.text}
    </p>
  );
}

/** Footer of the public pages (home, sign in, reset password, invitation). */
export function PublicFooter() {
  return (
    <footer className="relative z-10 shrink-0 border-t border-[rgba(255,255,255,0.08)] px-6 py-3.5 flex flex-col items-center justify-between gap-1 bg-canvas sm:flex-row">
      <ServiceStatus />
      <p className="text-xs text-text-tertiary">
        © {new Date().getFullYear()} Arista CRM
      </p>
    </footer>
  );
}
