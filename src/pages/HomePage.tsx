import { AppLogo } from '@/components/app-logo';
import {
  BarChart2,
  ChevronRight,
  Eye,
  Shield,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const flow = [
  {
    step: '01',
    icon: Shield,
    role: 'Admin',
    verb: 'Assigns',
    desc: 'Creates accounts, assigns VAs, sets reminders',
  },
  {
    step: '02',
    icon: Zap,
    role: 'VA',
    verb: 'Executes',
    desc: 'Logs work entries, submits daily EODs',
  },
  {
    step: '03',
    icon: BarChart2,
    role: 'Manager',
    verb: 'Reviews',
    desc: 'Monitors scorecards and team performance',
  },
  {
    step: '04',
    icon: Eye,
    role: 'Client',
    verb: 'Views',
    desc: 'Tracks activity and work reports',
  },
];

export default function HomePage() {
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
      {/* ── Nav ── */}
      <nav className="relative z-10 shrink-0 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <AppLogo size="md" className="text-white" />
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(255,255,255,0.12)] bg-transparent px-5 py-2 text-sm font-medium text-text-secondary hover:border-[rgba(255,255,255,0.20)] hover:text-white transition-colors duration-150"
        >
          Sign in
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </nav>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 min-h-0 py-10 sm:py-0">
        {/* Intro text */}
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-text-tertiary mb-3 text-center">
          Internal operations platform
        </p>
        <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-[-0.02em] text-center mb-3">
          Four roles. One workflow.
        </h1>
        <p className="text-sm text-text-secondary text-center max-w-sm mb-10 leading-relaxed">
          Manage assignments, log work, review performance, and track client
          activity — all in one place.
        </p>

        {/* ── Workflow graphic ── */}
        <div className="w-full max-w-[640px]">
          {/* "How it works" label */}
          <div className="flex items-center gap-3 mb-7">
            <div
              className="flex-1 h-px"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-text-tertiary shrink-0">
              How it works
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Desktop: track + nodes */}
          <div className="relative hidden sm:block">
            {/* Track line */}
            <div
              className="absolute top-[22px]"
              style={{
                left: '12.5%',
                right: '12.5%',
                height: '1px',
                background: 'rgba(255,255,255,0.08)',
              }}
            />
            {/* Arrows */}
            {[25, 50, 75].map(pos => (
              <div
                key={pos}
                className="absolute top-[16px] w-3 h-3 flex items-center justify-center"
                style={{ left: `calc(${pos}% - 6px)` }}
              >
                <ChevronRight className="h-3 w-3 text-white/20" />
              </div>
            ))}

            {/* Nodes */}
            <div className="grid grid-cols-4">
              {flow.map(({ step, icon: Icon, role, verb, desc }) => (
                <div key={role} className="flex flex-col items-center gap-3">
                  {/* Icon circle */}
                  <div className="relative z-10 h-11 w-11 rounded-full border border-[rgba(255,255,255,0.12)] flex items-center justify-center shrink-0 bg-surface-raised">
                    <Icon className="h-5 w-5 text-text-secondary" />
                  </div>
                  {/* Text */}
                  <div className="text-center px-1">
                    <span className="font-mono text-[10px] font-medium text-text-tertiary">
                      {step}
                    </span>
                    <p className="text-sm font-medium text-white leading-tight mt-0.5">
                      {role}
                    </p>
                    <p className="text-xs font-medium text-text-secondary mt-0.5 mb-2">
                      {verb}
                    </p>
                    <p className="text-xs text-text-tertiary leading-snug">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: 2×2 grid */}
          <div className="grid grid-cols-2 gap-3 sm:hidden">
            {flow.map(({ step, icon: Icon, role, verb, desc }) => (
              <div
                key={role}
                className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-surface-raised p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-8 w-8 rounded-md border border-[rgba(255,255,255,0.12)] flex items-center justify-center bg-transparent">
                    <Icon className="h-4 w-4 text-text-secondary" />
                  </div>
                  <span className="font-mono text-[10px] text-white/20">
                    {step}
                  </span>
                </div>
                <p className="text-sm font-medium text-white leading-none">
                  {role}
                </p>
                <p className="text-xs font-medium text-text-secondary mt-1 mb-2">
                  {verb}
                </p>
                <p className="text-xs text-text-tertiary leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 mb-2 sm:mb-0">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium bg-primary text-text-inverse hover:bg-white transition-colors duration-150"
          >
            Access Workspace
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 shrink-0 border-t border-[rgba(255,255,255,0.08)] px-6 py-3.5 flex items-center justify-between bg-canvas">
        <span />
        <p className="text-xs text-text-tertiary">
          © {new Date().getFullYear()} Arista CRM
        </p>
      </footer>
    </div>
  );
}
