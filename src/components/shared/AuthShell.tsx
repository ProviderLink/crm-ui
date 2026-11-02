import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { AppLogo } from '@/components/app-logo';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { cn } from '@/lib/utils';

/** Dark patterned page with the status footer; frame of every public page. */
export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        backgroundImage:
          "url('/assets/patterns/dark-square-four-triangle.svg')",
        backgroundRepeat: 'repeat',
        backgroundSize: '32px 32px',
      }}
    >
      {children}
      <PublicFooter />
    </div>
  );
}

/** A centred card of the sign-in family: logo, heading, then the form. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <PublicPage>
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4">
        <div className="w-full max-w-[360px]">
          <div className="mb-10">
            <AppLogo size="md" className="text-white" />
          </div>
          <div className="mb-7">
            <h1 className="text-2xl leading-tight font-medium tracking-[-0.02em] text-white">
              {title}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </PublicPage>
  );
}

export function AuthErrorBanner({
  message,
  className = 'mb-1',
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-md border border-[rgba(255,255,255,0.08)] bg-surface-raised px-4 py-3 text-sm text-status-error',
        className
      )}
    >
      <span className="mt-0.5 shrink-0" aria-hidden>
        ⚠
      </span>
      {message}
    </div>
  );
}

export function AuthFieldError({ message }: { message: string }) {
  return <p className="text-xs text-status-error">{message}</p>;
}

/** A small centred link under the form. */
export function AuthLink({
  to,
  className = 'mt-5',
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn('text-center text-xs text-text-tertiary', className)}>
      <Link
        to={to}
        className="transition-colors duration-150 hover:text-text-secondary"
      >
        {children}
      </Link>
    </p>
  );
}
