import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from '@/hooks/store';
import { roleHome } from '@/lib/role-home';
import { NoCrmAccessError, login, logout } from '@/services/auth.service';
import { setAuth } from '@/store/slices/authSlice';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { PublicFooter } from '@/components/shared/PublicFooter';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const NO_ACCESS_MESSAGE =
  'Your account does not have access to the CRM. Contact your administrator.';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Already signed in (for example following a bookmark): skip the form.
  const signedInUser = useAppSelector(s => s.auth.user);
  if (signedInUser) {
    return <Navigate to={roleHome[signedInUser.role]} replace />;
  }

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      const result = await login(data);
      // Never carry cached data over from a previous session on this tab.
      queryClient.clear();
      dispatch(setAuth({ user: result.user, accessToken: result.accessToken }));
      toast.success('Welcome back!');
      navigate(roleHome[result.user.role], { replace: true });
    } catch (err) {
      if (err instanceof NoCrmAccessError) {
        // The server already issued a session; end it so no cookie lingers.
        await logout();
        setError(NO_ACCESS_MESSAGE);
        toast.error(NO_ACCESS_MESSAGE);
      } else if (err && typeof err === 'object' && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response
          ?.status;
        if (status === 403) {
          setError(NO_ACCESS_MESSAGE);
          toast.error(NO_ACCESS_MESSAGE);
        } else if (status === 401 || status === 400) {
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
        backgroundColor: 'var(--bg-canvas)',
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
            <p className="text-sm text-text-secondary mt-1">
              Internal workspace — authorised access only.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-md border border-[rgba(255,255,255,0.08)] bg-surface-raised px-4 py-3 text-sm text-status-error flex items-start gap-2">
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
                  className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-text-tertiary"
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
                <p className="text-xs text-status-error">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-text-tertiary"
                >
                  Password
                </Label>
                <Link
                  to="/reset-password"
                  className="text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150"
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
                <p className="text-xs text-status-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-md font-medium text-sm bg-primary hover:bg-white text-text-inverse mt-1 transition-colors duration-150"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-text-inverse/30 border-t-text-inverse animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Back to home */}
          <p className="mt-6 text-center text-xs text-text-tertiary">
            <Link
              to="/"
              className="hover:text-text-secondary transition-colors duration-150"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <PublicFooter />
    </div>
  );
}
