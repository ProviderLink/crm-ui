import {
  AuthErrorBanner,
  AuthFieldError,
  AuthLink,
  AuthShell,
} from '@/components/shared/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppDispatch, useAppSelector } from '@/hooks/store';
import { authErrorMessage } from '@/lib/auth-errors';
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

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

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
      void navigate(roleHome[result.user.role], { replace: true });
    } catch (err) {
      // The server already issued a session; end it so no cookie lingers.
      if (err instanceof NoCrmAccessError) await logout();
      setError(authErrorMessage(err, 'Invalid email or password.'));
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Internal workspace — authorised access only."
    >
      {error && <AuthErrorBanner message={error} className="mb-5" />}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
          {errors.email && <AuthFieldError message={errors.email.message!} />}
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

      <AuthLink to="/" className="mt-6">
        ← Back to home
      </AuthLink>
    </AuthShell>
  );
}
