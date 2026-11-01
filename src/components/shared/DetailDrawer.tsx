import { XIcon } from 'lucide-react';
import { createContext, useContext, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Tailwind needs whole class names, so each size lists its own. Below the
// breakpoint the close button sits inside the drawer's top-right corner; above
// it, beside the drawer's top-left corner.
const SIZES = {
  lg: {
    width: 'sm:max-w-lg',
    close: 'min-[700px]:-left-11 min-[700px]:right-auto min-[700px]:top-0',
    headerPad: 'pr-14 min-[700px]:pr-6',
  },
  xl: {
    width: 'sm:max-w-xl',
    close: 'min-[700px]:-left-11 min-[700px]:right-auto min-[700px]:top-0',
    headerPad: 'pr-14 min-[700px]:pr-6',
  },
  '2xl': {
    width: 'sm:max-w-2xl',
    close: 'min-[800px]:-left-11 min-[800px]:right-auto min-[800px]:top-0',
    headerPad: 'pr-14 min-[800px]:pr-6',
  },
  '3xl': {
    width: 'sm:max-w-3xl',
    close: 'min-[800px]:-left-11 min-[800px]:right-auto min-[800px]:top-0',
    headerPad: 'pr-14 min-[800px]:pr-6',
  },
} as const;

export type DrawerWidth = keyof typeof SIZES;

const HeaderPadContext = createContext<string>(SIZES.lg.headerPad);

/**
 * A panel that floats in from the right with a gap to the viewport, over a
 * list or table. Put a `DrawerHeader` and the body inside.
 */
export function DetailDrawer({
  open,
  onOpenChange,
  width = 'lg',
  closeLabel = 'Close',
  srTitle,
  srDescription,
  keepOpenOnOutsideClick = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width?: DrawerWidth;
  closeLabel?: string;
  /** Screen-reader-only title and description, when the header shows none. */
  srTitle?: string;
  srDescription?: string;
  /** Do not close on a click outside, so unsaved edits are not thrown away. */
  keepOpenOnOutsideClick?: boolean;
  children: ReactNode;
}) {
  const size = SIZES[width];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        // The built-in close button is hidden in favour of the one below.
        className={cn(
          'flex w-[calc(100vw-2rem)] flex-col gap-0 overflow-visible border-white/[0.14] bg-surface-raised p-0 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9)] [&>button:last-child]:hidden',
          size.width
        )}
        onInteractOutside={
          keepOpenOnOutsideClick ? e => e.preventDefault() : undefined
        }
      >
        {srTitle && <SheetTitle className="sr-only">{srTitle}</SheetTitle>}
        {srDescription && (
          <SheetDescription className="sr-only">
            {srDescription}
          </SheetDescription>
        )}
        <SheetClose asChild>
          <Button
            size="icon"
            variant="outline"
            aria-label={closeLabel}
            className={cn(
              'absolute right-3 top-3 z-10 size-8 rounded-md border-white/[0.14] bg-surface-raised',
              size.close
            )}
          >
            <XIcon className="size-4" />
          </Button>
        </SheetClose>
        <HeaderPadContext.Provider value={size.headerPad}>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
            {children}
          </div>
        </HeaderPadContext.Provider>
      </SheetContent>
    </Sheet>
  );
}

/** Top bar of a drawer; keeps clear of the close button on small screens. */
export function DrawerHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const pad = useContext(HeaderPadContext);
  return (
    <header
      className={cn(
        'flex items-center gap-3 border-b border-border px-6 py-4',
        pad,
        className
      )}
    >
      {children}
    </header>
  );
}
