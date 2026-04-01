import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppDispatch } from '@/hooks/store'
import { setAuth } from '@/store/slices/authSlice'
import { login } from '@/services/auth.service'
import type { UserRole } from '@/types/auth'
import { DevQuickLogin } from '@/components/dev/DevQuickLogin'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

const roleRedirect: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  account_manager: '/admin/dashboard',
  va: '/va/dashboard',
  client: '/client/dashboard',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      const result = await login(data)
      dispatch(setAuth({ user: result.user, accessToken: result.accessToken }))
      navigate(roleRedirect[result.user.role], { replace: true })
    } catch {
      setError('Invalid email or password.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <span className="text-xl font-semibold text-foreground tracking-tight">
            Arista CRM
          </span>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="rounded-xl border-input focus-visible:ring-ring/40"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Link
                  to="/reset-password"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="rounded-xl border-input focus-visible:ring-ring/40"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl h-10 font-medium mt-2"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>

          </form>
        </div>

        {import.meta.env.DEV && <DevQuickLogin />}

      </div>
    </div>
  )
}
