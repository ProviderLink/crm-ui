import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword, resetPassword } from '@/services/auth.service'

// ─── Schemas ────────────────────────────────────────────────

const requestSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

const confirmSchema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type RequestForm = z.infer<typeof requestSchema>
type ConfirmForm = z.infer<typeof confirmSchema>

// ─── Page root ───────────────────────────────────────────────

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  return token ? <ConfirmStep token={token} /> : <RequestStep />
}

// ─── Request step (enter email) ──────────────────────────────

function RequestStep() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestForm>({ resolver: zodResolver(requestSchema) })

  async function onSubmit(data: RequestForm) {
    setError(null)
    try {
      await forgotPassword(data.email)
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <AuthShell title="Reset password" subtitle="Enter your email to receive a reset link">
      {sent ? (
        <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
          Check your inbox — a reset link is on its way.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && <ErrorBanner message={error} />}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-[#0F172A]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className="rounded-xl border-slate-200 focus-visible:ring-blue-400/40"
              {...register('email')}
            />
            {errors.email && <FieldError message={errors.email.message!} />}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black hover:bg-black/90 text-white rounded-xl h-10 font-medium transition-opacity"
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
      <BackToLogin />
    </AuthShell>
  )
}

// ─── Confirm step (set new password) ─────────────────────────

function ConfirmStep({ token }: { token: string }) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmForm>({ resolver: zodResolver(confirmSchema) })

  async function onSubmit(data: ConfirmForm) {
    setError(null)
    try {
      await resetPassword(token, data.password)
      setDone(true)
    } catch {
      setError('This reset link is invalid or has expired.')
    }
  }

  return (
    <AuthShell title="Set new password" subtitle="Choose a strong password for your account">
      {done ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
            Password updated. You can now sign in.
          </div>
          <BackToLogin />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && <ErrorBanner message={error} />}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-[#0F172A]">
              New password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="rounded-xl border-slate-200 focus-visible:ring-blue-400/40"
              {...register('password')}
            />
            {errors.password && <FieldError message={errors.password.message!} />}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-sm font-medium text-[#0F172A]">
              Confirm password
            </Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="rounded-xl border-slate-200 focus-visible:ring-blue-400/40"
              {...register('confirm')}
            />
            {errors.confirm && <FieldError message={errors.confirm.message!} />}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black hover:bg-black/90 text-white rounded-xl h-10 font-medium transition-opacity"
          >
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}

// ─── Shared layout + micro-components ────────────────────────

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-xl font-semibold text-[#0F172A] tracking-tight">
            Arista CRM
          </span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-2xl font-semibold text-[#0F172A] mb-1">{title}</h1>
          <p className="text-sm text-[#64748B] mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
      {message}
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs text-red-500">{message}</p>
}

function BackToLogin() {
  return (
    <p className="mt-4 text-center text-sm text-[#64748B]">
      <Link to="/login" className="text-slate-500 hover:text-[#0F172A] hover:underline">
        Back to sign in
      </Link>
    </p>
  )
}
