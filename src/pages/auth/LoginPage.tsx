import aristaLogo from '@/assets/arista_crm.png'
import { DevQuickLogin } from '@/components/dev/DevQuickLogin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppDispatch } from '@/hooks/store'
import { login } from '@/services/auth.service'
import { setAuth } from '@/store/slices/authSlice'
import type { UserRole } from '@/types/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

const roleRedirect: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  account_manager: '/am/dashboard',
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
      toast.success('Welcome back!')
      navigate(roleRedirect[result.user.role], { replace: true })
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response
          ?.status
        if (status === 401 || status === 400) {
          setError('Invalid email or password.')
          toast.error('Invalid email or password.')
        } else {
          setError('Something went wrong. Please try again.')
          toast.error('Something went wrong. Please try again.')
        }
      } else {
        setError('Unable to connect. Check your internet and try again.')
        toast.error('Unable to connect. Check your internet.')
      }
    }
  }

  return (
    <div
      className="relative min-h-screen sm:h-screen flex flex-col sm:overflow-hidden"
      style={{ background: '#07101c' }}
    >
      {/* ── Background ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(199,243,60,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(199,243,60,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '5px 5px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(7,16,28,0.85) 100%)',
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[320px] blur-[120px] opacity-[0.10]"
          style={{ background: '#c7f33c' }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      {/* ── Form area ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 min-h-0">
        <div className="w-full max-w-[360px]">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <img src={aristaLogo} alt="" className="h-6 w-6 object-contain" />
            <span className="text-white font-semibold text-base tracking-tight">
              Arista CRM
            </span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
              Sign in
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Internal workspace — authorised access only.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <div className="flex items-center">
                <Label
                  htmlFor="email"
                  className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
                >
                  Email
                </Label>
              </div>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="h-10 rounded-lg text-sm text-white placeholder:text-slate-600 border-white/[0.08] focus-visible:border-white/20 focus-visible:ring-0"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
                >
                  Password
                </Label>
                <Link
                  to="/reset-password"
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-10 rounded-lg text-sm text-white placeholder:text-slate-600 border-white/[0.08] focus-visible:border-white/20 focus-visible:ring-0"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-lg font-semibold text-sm bg-[#c7f33c] hover:bg-[#d4f75a] text-[#07101c] border-0 mt-1 transition-colors duration-150"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-[#07101c]/30 border-t-[#07101c] animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-6">
              <DevQuickLogin />
            </div>
          )}

          {/* Back to home */}
          <p className="mt-6 text-center text-xs text-slate-600">
            <Link to="/" className="hover:text-slate-400 transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 shrink-0 border-t border-white/[0.05] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-slate-600">
            All systems operational
          </span>
        </div>
        <p className="text-xs text-slate-700">
          © {new Date().getFullYear()} Arista CRM
        </p>
      </footer>
    </div>
  )
}
