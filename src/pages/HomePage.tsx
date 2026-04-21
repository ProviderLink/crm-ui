import aristaLogo from '@/assets/arista_crm.png'
import {
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Eye,
  Shield,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const flow = [
  {
    step: '01',
    icon: Shield,
    role: 'Admin',
    verb: 'Assigns',
    desc: 'Creates accounts, assigns VAs, sets reminders',
    hex: '#c7f33c',
  },
  {
    step: '02',
    icon: Zap,
    role: 'VA',
    verb: 'Executes',
    desc: 'Logs work entries, submits daily EODs',
    hex: '#10b981',
  },
  {
    step: '03',
    icon: BarChart2,
    role: 'Manager',
    verb: 'Reviews',
    desc: 'Monitors scorecards and team performance',
    hex: '#3b82f6',
  },
  {
    step: '04',
    icon: Eye,
    role: 'Client',
    verb: 'Views',
    desc: 'Tracks activity and work reports',
    hex: '#f59e0b',
  },
]

export default function HomePage() {
  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: '#07101c' }}
    >
      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Fine square grid — structured, Linear/Vercel style */}
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
        {/* Vignette — dark edges pull focus inward */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(7,16,28,0.85) 100%)',
          }}
        />
        {/* Single centered lime glow — sits behind content, not on top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[320px] blur-[120px] opacity-[0.10]"
          style={{ background: '#c7f33c' }}
        />
        {/* Subtle grain texture via SVG noise */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 shrink-0 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <img src={aristaLogo} alt="Arista CRM" className="h-6 w-6 object-contain" />
          <span className="text-white font-semibold text-base tracking-tight">Arista CRM</span>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-medium text-slate-400 hover:border-white/20 hover:text-white transition-all duration-150"
        >
          Sign in
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </nav>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 min-h-0">

        {/* Intro text */}
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-600 mb-3">
          Internal operations platform
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-center mb-3">
          Four roles. One workflow.
        </h1>
        <p className="text-sm text-slate-500 text-center max-w-sm mb-10 leading-relaxed">
          Manage assignments, log work, review performance, and track client activity — all in one place.
        </p>

        {/* ── Workflow graphic ── */}
        <div className="w-full max-w-[640px]">

          {/* "How it works" label */}
          <div className="flex items-center gap-3 mb-7">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07))' }} />
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-600 shrink-0">
              How it works
            </span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.07))' }} />
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
                background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.08) 10%, rgba(255,255,255,0.08) 90%, transparent 100%)',
              }}
            />
            {/* Arrows — midway between each pair: 25%, 50%, 75% */}
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
              {flow.map(({ step, icon: Icon, role, verb, desc, hex }) => (
                <div key={role} className="flex flex-col items-center gap-3">
                  {/* Icon circle */}
                  <div
                    className="relative z-10 h-11 w-11 rounded-full border flex items-center justify-center shrink-0"
                    style={{
                      background: `${hex}14`,
                      borderColor: `${hex}30`,
                      boxShadow: `0 0 16px ${hex}22`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: hex }} />
                  </div>
                  {/* Text */}
                  <div className="text-center px-1">
                    <span className="text-[10px] font-mono font-semibold" style={{ color: `${hex}80` }}>
                      {step}
                    </span>
                    <p className="text-sm font-bold text-white/90 leading-tight mt-0.5">{role}</p>
                    <p className="text-xs font-semibold mt-0.5 mb-2" style={{ color: hex }}>{verb}</p>
                    <p className="text-xs text-slate-600 leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: 2×2 grid */}
          <div className="grid grid-cols-2 gap-3 sm:hidden">
            {flow.map(({ step, icon: Icon, role, verb, desc, hex }) => (
              <div
                key={role}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${hex}14`, border: `1px solid ${hex}30` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: hex }} />
                  </div>
                  <span className="text-xs font-mono text-white/20">{step}</span>
                </div>
                <p className="text-sm font-bold text-white/90 leading-none">{role}</p>
                <p className="text-xs font-semibold mt-1 mb-2" style={{ color: hex }}>{verb}</p>
                <p className="text-xs text-slate-600 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#07101c] hover:opacity-90 transition-opacity"
            style={{ background: '#c7f33c' }}
          >
            Access Workspace
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 shrink-0 border-t border-white/[0.05] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-slate-600">All systems operational</span>
        </div>
        <p className="text-xs text-slate-700">© {new Date().getFullYear()} Arista CRM</p>
      </footer>
    </div>
  )
}
