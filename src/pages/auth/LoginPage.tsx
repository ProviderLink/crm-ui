import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch } from '@/hooks/store';
import { login } from '@/services/auth.service';
import { setAuth } from '@/store/slices/authSlice';
import type { UserRole } from '@/types/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const roleRedirect: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  account_manager: '/am/dashboard',
  va: '/va/dashboard',
  client: '/client/dashboard',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      const result = await login(data);
      dispatch(setAuth({ user: result.user, accessToken: result.accessToken }));
      toast.success('Welcome back!');
      navigate(roleRedirect[result.user.role], { replace: true });
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response
          ?.status;
        if (status === 401 || status === 400) {
          setError('Invalid email or password.');
          toast.error('Invalid email or password.');
        } else {
          setError('Something went wrong. Please try again.');
          toast.error('Something went wrong. Please try again.');
        }
      } else {
        setError('Unable to connect. Check your internet and try again.');
        toast.error('Unable to connect. Check your internet.');
      }
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{
        backgroundColor: '#0A0A0A',
        backgroundImage:
          "url('/assets/patterns/dark-square-four-triangle.svg')",
        backgroundRepeat: 'repeat',
        backgroundSize: '32px 32px',
      }}
    >
      {/* ── Form area ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 min-h-0">
        <div className="w-full max-w-[360px]">
          {/* Logo */}
          <div className="mb-10">
            <AppLogo size="md" className="text-white" />
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-medium text-white tracking-[-0.02em] leading-tight">
              Sign in
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1">
              Internal workspace — authorised access only.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-md border border-[rgba(255,255,255,0.08)] bg-[#121212] px-4 py-3 text-sm text-[#F87171] flex items-start gap-2">
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
                  className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#6E6E6E]"
                >
                  Email
                </Label>
              </div>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="h-10 rounded-md text-sm"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-[#F87171]">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#6E6E6E]"
                >
                  Password
                </Label>
                <Link
                  to="/reset-password"
                  className="text-xs text-[#6E6E6E] hover:text-[#A0A0A0] transition-colors duration-150"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-10 rounded-md text-sm"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-[#F87171]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-md font-medium text-sm bg-[#E8E6E1] hover:bg-white text-[#0D0D0D] mt-1 transition-colors duration-150"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-[#0D0D0D]/30 border-t-[#0D0D0D] animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Back to home */}
          <p className="mt-6 text-center text-xs text-[#6E6E6E]">
            <Link
              to="/"
              className="hover:text-[#A0A0A0] transition-colors duration-150"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 shrink-0 border-t border-[rgba(255,255,255,0.08)] px-6 py-3.5 flex items-center justify-between bg-[#0A0A0A]">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#6E6E6E]" />
          <span className="text-xs text-[#6E6E6E]">
            All systems operational
          </span>
        </div>
        <p className="text-xs text-[#6E6E6E]">
          © {new Date().getFullYear()} Arista CRM
        </p>
      </footer>
    </div>
  );
}
