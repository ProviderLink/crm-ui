import {
  AuthErrorBanner,
  AuthFieldError,
  AuthLink,
  AuthShell,
} from '@/components/shared/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPassword, resetPassword } from '@/services/auth.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

// ─── Schemas ────────────────────────────────────────────────

const requestSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

const confirmSchema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine(d => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type RequestForm = z.infer<typeof requestSchema>;
type ConfirmForm = z.infer<typeof confirmSchema>;

// ─── Page root ───────────────────────────────────────────────

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  return token ? <ConfirmStep token={token} /> : <RequestStep />;
}

// ─── Request step (enter email) ──────────────────────────────

function RequestStep() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestForm>({ resolver: zodResolver(requestSchema) });

  async function onSubmit(data: RequestForm) {
    setError(null);
    try {
      await forgotPassword(data.email);
      setSent(true);
      toast.success('Reset link sent — check your inbox.');
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        setError('Something went wrong. Please try again.');
        toast.error('Something went wrong. Please try again.');
      } else {
        setError('Unable to connect. Check your internet and try again.');
        toast.error('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your email to receive a reset link."
    >
      {sent ? (
        <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-surface-raised px-4 py-3 text-sm text-text-secondary">
          Check your inbox — a reset link is on its way.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {error && <AuthErrorBanner message={error} />}
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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 rounded-md font-medium text-sm bg-primary hover:bg-white text-text-inverse mt-1 transition-colors duration-150"
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
      <AuthLink to="/login">← Back to sign in</AuthLink>
    </AuthShell>
  );
}

// ─── Confirm step (set new password) ─────────────────────────

function ConfirmStep({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmForm>({ resolver: zodResolver(confirmSchema) });

  async function onSubmit(data: ConfirmForm) {
    setError(null);
    try {
      await resetPassword(token, data.password);
      setDone(true);
      toast.success('Password updated successfully.');
    } catch {
      setError('This reset link is invalid or has expired.');
      toast.error('This reset link is invalid or has expired.');
    }
  }

  return (
    <AuthShell
      title="Set new password"
      subtitle="Choose a strong password for your account."
    >
      {done ? (
        <div className="space-y-4">
          <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-surface-raised px-4 py-3 text-sm text-text-secondary">
            Password updated. You can now sign in.
          </div>
          <AuthLink to="/login">← Back to sign in</AuthLink>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {error && <AuthErrorBanner message={error} />}
          <div className="space-y-1.5">
            <div className="flex items-center">
              <Label
                htmlFor="password"
                className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-text-tertiary"
              >
                New password
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10 rounded-md text-sm"
              {...register('password')}
            />
            {errors.password && (
              <AuthFieldError message={errors.password.message!} />
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center">
              <Label
                htmlFor="confirm"
                className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-text-tertiary"
              >
                Confirm password
              </Label>
            </div>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10 rounded-md text-sm"
              {...register('confirm')}
            />
            {errors.confirm && (
              <AuthFieldError message={errors.confirm.message!} />
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 rounded-md font-medium text-sm bg-primary hover:bg-white text-text-inverse mt-1 transition-colors duration-150"
          >
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
