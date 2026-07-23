import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { acceptInvitation } from '@/services/auth.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
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
        <BackToLogin />
      </AuthShell>
    );
  }

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      await acceptInvitation(token!, data.password);
      setDone(true);
    } catch {
      setError('This invitation link is invalid or has expired.');
    }
  }

  return (
    <AuthShell
      title="Activate your account"
      subtitle="Set a password to complete your account setup."
    >
      {done ? (
        <div className="space-y-4">
          <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[#121212] px-4 py-3 text-sm text-[#A0A0A0]">
            Account activated. You can now sign in.
          </div>
          <BackToLogin />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {error && <ErrorBanner message={error} />}
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#6E6E6E]"
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
              <FieldError message={errors.password.message!} />
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="confirm"
              className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#6E6E6E]"
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
            {errors.confirm && <FieldError message={errors.confirm.message!} />}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 rounded-md font-medium text-sm bg-[#E8E6E1] hover:bg-white text-[#0D0D0D] mt-1 transition-colors duration-150"
          >
            {isSubmitting ? 'Activating…' : 'Activate account'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
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
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 min-h-0">
        <div className="w-full max-w-[360px]">
          <div className="mb-10">
            <AppLogo size="md" className="text-white" />
          </div>
          <div className="mb-7">
            <h1 className="text-2xl font-medium text-white tracking-[-0.02em] leading-tight">
              {title}
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>

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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-1 rounded-md border border-[rgba(255,255,255,0.08)] bg-[#121212] px-4 py-3 text-sm text-[#F87171] flex items-start gap-2">
      <span className="shrink-0 mt-0.5">⚠</span>
      {message}
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs text-[#F87171]">{message}</p>;
}

function BackToLogin() {
  return (
    <p className="mt-5 text-center text-xs text-[#6E6E6E]">
      <Link
        to="/login"
        className="hover:text-[#A0A0A0] transition-colors duration-150"
      >
        ← Back to sign in
      </Link>
    </p>
  );
}
