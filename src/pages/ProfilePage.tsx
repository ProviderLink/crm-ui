import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppSelector } from '@/hooks/store';
import { getApiError } from '@/lib/api-error';
import { changePassword } from '@/services/auth.service';

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  account_manager: 'Account Manager',
  va: 'Virtual Assistant',
  client: 'Client',
};

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine(d => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PwForm = z.infer<typeof pwSchema>;

export default function ProfilePage() {
  const user = useAppSelector(s => s.auth.user);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PwForm>({ resolver: zodResolver(pwSchema) });

  async function onSubmit(data: PwForm) {
    setServerError('');
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully.');
      reset();
    } catch (err: unknown) {
      setServerError(getApiError(err, 'Failed to change password.'));
    }
  }

  const name = user?.name ?? '—';
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fields: {
    id: 'currentPassword' | 'newPassword' | 'confirmPassword';
    label: string;
    autoComplete: string;
  }[] = [
    {
      id: 'currentPassword',
      label: 'Current password',
      autoComplete: 'current-password',
    },
    { id: 'newPassword', label: 'New password', autoComplete: 'new-password' },
    {
      id: 'confirmPassword',
      label: 'Confirm new password',
      autoComplete: 'new-password',
    },
  ];

  return (
    <div className="relative flex flex-1 flex-col">
      {/* A faint, fine dot pattern across the whole content area */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:16px_16px]"
      />
      <div className="relative flex max-w-lg flex-col gap-8 p-4 md:p-6">
        {/* Who you are */}
        <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-background/80 p-4 backdrop-blur-sm">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-lg font-medium text-text-secondary select-none">
            {initials || '?'}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold">{name}</h1>
              <span className="inline-flex items-center rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                {user?.role ? (roleLabel[user.role] ?? user.role) : '—'}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {user?.email ?? '—'}
            </p>
          </div>
        </div>

        {/* Change password */}
        <section className="space-y-4 border-t border-border pt-6">
          <h2 className="text-sm font-semibold">Change password</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            {serverError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}

            {fields.map(f => (
              <div key={f.id} className="flex flex-col gap-1.5">
                <Label htmlFor={f.id} className="text-xs text-muted-foreground">
                  {f.label}
                </Label>
                <Input
                  id={f.id}
                  type="password"
                  autoComplete={f.autoComplete}
                  {...register(f.id)}
                />
                {errors[f.id] && (
                  <p className="text-xs text-destructive">
                    {errors[f.id]?.message}
                  </p>
                )}
              </div>
            ))}

            <div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Update password'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
