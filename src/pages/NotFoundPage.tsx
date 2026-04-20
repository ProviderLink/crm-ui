import { useAppSelector } from '@/hooks/store'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  const user = useAppSelector(s => s.auth.user)

  const homeHref = user
    ? user.role === 'va'
      ? '/va/dashboard'
      : user.role === 'client'
        ? '/client/dashboard'
        : '/admin/dashboard'
    : '/login'

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <p className="text-6xl font-bold text-primary mb-4">404</p>
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        The page you're looking for doesn't exist or you don't have access to
        it.
      </p>
      <Link
        to={homeHref}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Go home
      </Link>
    </div>
  )
}
