import { useAppDispatch, useAppSelector } from '@/hooks/store';
import { hydrate } from '@/services/auth.service';
import { clearAuth, setUser } from '@/store/slices/authSlice';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Runs once on mount. Calls /auth/refresh-token to obtain a fresh access token
 * and user profile from the HttpOnly refreshTokenCrm cookie.
 * Shows a full-page spinner while this is in progress.
 */
export function AuthInitializer({ children }: Props) {
  const dispatch = useAppDispatch();
  const isHydrated = useAppSelector(s => s.auth.isHydrated);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    hydrate()
      .then(({ user, accessToken }) => {
        dispatch(setUser({ user, accessToken }));
      })
      .catch(() => {
        dispatch(clearAuth());
      });
  }, [dispatch]); // dispatch is stable — safe to include

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
