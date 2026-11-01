import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The frame of a page inside the dashboard layout. `overlays` are drawers and
 * dialogs that belong to the page but sit outside its content column.
 */
export function Page({
  variant = 'list',
  overlays,
  children,
}: {
  /** `list`: one padded section. `dashboard`: several full-width sections. */
  variant?: 'list' | 'dashboard';
  overlays?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div
        className={cn(
          'flex flex-col py-4',
          variant === 'dashboard' ? 'gap-6 md:py-6' : 'gap-4 md:gap-6 md:py-6'
        )}
      >
        {children}
      </div>
      {overlays}
    </div>
  );
}

/** A horizontally padded block of a page. */
export function PageSection({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('px-4 lg:px-6', className)}>{children}</div>;
}

/** Title and one line of description, with optional buttons on the right. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  const heading = (
    <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
  );
  const subheading = description && (
    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
  );
  if (!actions)
    return (
      <div className="mb-6">
        {heading}
        {subheading}
      </div>
    );
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        {heading}
        {subheading}
      </div>
      {actions}
    </div>
  );
}
