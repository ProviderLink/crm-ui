import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRoundIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-xl">
      {/* Profile info */}
      <Card className="border">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-text-secondary font-mono text-lg select-none">
              {user?.name
                ? user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : '?'}
            </div>
            {/* Name + role badge */}
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-lg font-semibold leading-tight truncate">
                {user?.name ?? '—'}
              </p>
              <span className="inline-flex w-fit items-center rounded font-mono text-[10px] font-medium uppercase tracking-[0.08em] bg-white/[0.04] px-2.5 py-0.5 text-text-secondary">
                {user?.role ? (roleLabel[user.role] ?? user.role) : '—'}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-5 mb-4 border-t border-border" />

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </span>
              <span className="text-sm font-medium break-all">
                {user?.email ?? '—'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                User ID
              </span>
              <span className="text-sm font-medium font-mono text-muted-foreground">
                {user?.id?.slice(0, 12) ?? '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <KeyRoundIcon className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('currentPassword')}
              />
              {errors.currentPassword && (
                <p className="text-xs text-destructive">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('newPassword')}
              />
              {errors.newPassword && (
                <p className="text-xs text-destructive">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-1">
              {isSubmitting ? 'Saving…' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
