import {
  AuthErrorBanner,
  AuthFieldError,
  AuthLink,
  AuthShell,
} from '@/components/shared/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authErrorMessage } from '@/lib/auth-errors';
import { acceptInvitation } from '@/services/auth.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

const schema = z
  .object({
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine(d => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <AuthShell
        title="Invalid link"
        subtitle="This invitation link is missing or malformed."
      >
        <AuthLink to="/login">← Back to sign in</AuthLink>
      </AuthShell>
    );
  }

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      await acceptInvitation(token!, data.password);
      setDone(true);
    } catch (err) {
      setError(
        authErrorMessage(err, 'This invitation link is invalid or has expired.')
      );
    }
  }

  return (
    <AuthShell
      title="Activate your account"
      subtitle="Set a password to complete your account setup."
    >
      {done ? (
        <div className="space-y-4">
          <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-surface-raised px-4 py-3 text-sm text-text-secondary">
            Account activated. You can now sign in.
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
            <Label
              htmlFor="password"
              className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-text-tertiary"
            >
              Password
            </Label>
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
            <Label
              htmlFor="confirm"
              className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-text-tertiary"
            >
              Confirm password
            </Label>
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
            {isSubmitting ? 'Activating…' : 'Activate account'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
