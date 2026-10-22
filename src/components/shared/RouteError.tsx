import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

import { Button } from '@/components/ui/button';

/**
 * Shown by the router when a route throws while rendering or a lazy chunk
 * fails to load (typically right after a redeploy), instead of a blank page.
 */
export function RouteError() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page failed to load. If the app was just updated, reloading usually
        fixes it.
      </p>
      {detail && (
        <p className="max-w-sm break-words font-mono text-xs text-muted-foreground/60">
          {detail}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
