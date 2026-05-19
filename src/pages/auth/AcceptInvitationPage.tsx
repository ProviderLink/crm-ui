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
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
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
              className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10 rounded-lg text-sm text-white placeholder:text-slate-600 border-white/[0.08] focus-visible:border-white/20 focus-visible:ring-0"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              {...register('password')}
            />
            {errors.password && (
              <FieldError message={errors.password.message!} />
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="confirm"
              className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest"
            >
              Confirm password
            </Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10 rounded-lg text-sm text-white placeholder:text-slate-600 border-white/[0.08] focus-visible:border-white/20 focus-visible:ring-0"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              {...register('confirm')}
            />
            {errors.confirm && <FieldError message={errors.confirm.message!} />}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 rounded-lg font-semibold text-sm bg-[#c7f33c] hover:bg-[#d4f75a] text-[#07101c] border-0 mt-1 transition-colors duration-150"
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
      className="relative min-h-screen sm:h-screen flex flex-col sm:overflow-hidden"
      style={{ background: '#07101c' }}
    >
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
          <filter id="grain-ai">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-ai)" />
        </svg>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 min-h-0">
        <div className="w-full max-w-[360px]">
          <div className="mb-10">
            <AppLogo size="md" className="text-white" />
          </div>
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>

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
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-1 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
      <span className="shrink-0 mt-0.5">⚠</span>
      {message}
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="text-xs text-red-400">{message}</p>;
}

function BackToLogin() {
  return (
    <p className="mt-5 text-center text-xs text-slate-500">
      <Link to="/login" className="hover:text-slate-300 transition-colors">
        ← Back to sign in
      </Link>
    </p>
  );
}
