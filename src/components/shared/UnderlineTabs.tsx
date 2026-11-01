import type { ReactNode } from 'react';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Underline tabs: a flat bar with a line under the active tab. Use inside the
 * `Tabs` root in place of the boxed `TabsList` / `TabsTrigger`.
 */
export function UnderlineTabsList({ children }: { children: ReactNode }) {
  return (
    <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
      {children}
    </TabsList>
  );
}

export function UnderlineTab({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className="-mb-px gap-2 rounded-none border-b-2 border-transparent px-0 pt-1 pb-3 text-muted-foreground hover:text-foreground data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground"
    >
      {children}
    </TabsTrigger>
  );
}

/** The small number after a tab's label. */
export function TabCount({
  alert = false,
  children,
}: {
  alert?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`text-xs font-normal tabular-nums ${alert ? 'text-destructive' : 'text-muted-foreground'}`}
    >
      {children}
    </span>
  );
}
