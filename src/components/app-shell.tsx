import { Link, useRouterState } from '@tanstack/react-router'
import { useStore } from '@/lib/store'
import type { NavKey } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MusicMiniPlayer } from '@/components/music-player'

export const NAV: { key: NavKey; label: string; to: '/' | '/rekapan' | '/reminder' | '/garansi' | '/setting' }[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/' },
  { key: 'rekapan', label: 'Rekapan', to: '/rekapan' },
  { key: 'reminder', label: 'Reminder', to: '/reminder' },
  { key: 'garansi', label: 'Garansi', to: '/garansi' },
  { key: 'setting', label: 'Setting', to: '/setting' },
]

export const ORNAMENT = '꒷꒦︶꒷꒦︶ ๋ ࣭ ⭑꒷꒦'

const FLOATERS = [
  { s: 'ꕤ', left: 6, delay: 0, dur: 38, size: 18 },
  { s: '☁️', left: 18, delay: 9, dur: 46, size: 22 },
  { s: '𓆩♡𓆪', left: 33, delay: 18, dur: 42, size: 16 },
  { s: '𝜗𝜚', left: 52, delay: 4, dur: 50, size: 18 },
  { s: '𑄝੭', left: 68, delay: 14, dur: 44, size: 18 },
  { s: 'ꕤ', left: 81, delay: 24, dur: 40, size: 14 },
  { s: '☁️', left: 92, delay: 30, dur: 48, size: 18 },
]

function FloatingDecorations() {
  return (
    <div className="pw-float-layer" aria-hidden="true">
      {FLOATERS.map((f, i) => (
        <span
          key={i}
          className="pw-float"
          style={
            {
            left: `${f.left}%`,
            fontSize: f.size,
            animationDuration: `${f.dur}s`,
            animationDelay: `-${f.delay}s`,
            '--pw-top': `${10 + ((i * 13) % 75)}%`,
            } as React.CSSProperties
          }
        >
          {f.s}
        </span>
      ))}
    </div>
  )
}

export function BrandTitle({ compact = false }: { compact?: boolean }) {
  const { appearance } = useStore()
  const size = compact
    ? 'text-3xl'
    : appearance.titleSize === 'sm'
      ? 'text-3xl sm:text-4xl'
      : appearance.titleSize === 'lg'
        ? 'text-5xl sm:text-6xl'
        : 'text-4xl sm:text-5xl'
  return (
    <div className="flex flex-col items-center text-center">
      <span className={cn('pw-title font-bold', size)}>Primpaii&apos;s Way</span>
      <span className="pw-ornament mt-1" aria-hidden="true">
        {ORNAMENT}
      </span>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { appearance } = useStore()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  return (
    <div className="pw-surface relative min-h-dvh">
      <FloatingDecorations />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur lg:flex">
        <div className="px-5 pt-8 pb-6">
          <Link to="/" aria-label="Primpaii's Way — Dashboard">
            <BrandTitle compact />
          </Link>
        </div>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((n) => {
            const active = isActive(n.to)
            return (
              <Link
                key={n.key}
                to={n.to}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors motion-reduce:transition-none',
                  active
                    ? 'bg-accent text-accent-foreground shadow-[inset_3px_0_0_var(--pw-sweet)]'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'grid size-8 place-items-center rounded-xl text-base',
                    active ? 'bg-primary/30 text-[#b0436f] dark:text-primary' : 'bg-muted/60',
                  )}
                  aria-hidden="true"
                >
                  {appearance.symbols[n.key]}
                </span>
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3">
          <MusicMiniPlayer />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 px-4 pt-3 pb-2 backdrop-blur lg:hidden">
        <Link to="/" aria-label="Primpaii's Way — Dashboard">
          <BrandTitle compact />
        </Link>
      </header>

      <main className="relative z-10 pb-28 lg:pb-10 lg:pl-64">
        <div className="mx-auto w-full max-w-content px-4 py-6 sm:px-6 lg:py-10">
          <p className="mb-4 rounded-full border border-border bg-card/70 px-4 py-1.5 text-center text-[11px] font-semibold text-muted-foreground">
            ☁️ Preview mode — sample orders shown; changes reset on refresh until cloud sync is switched on.
          </p>
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((n) => {
            const active = isActive(n.to)
            return (
              <Link
                key={n.key}
                to={n.to}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold',
                  active ? 'text-[#b0436f] dark:text-primary' : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'grid h-7 min-w-10 place-items-center rounded-full px-2 text-sm',
                    active && 'bg-accent',
                  )}
                  aria-hidden="true"
                >
                  {appearance.symbols[n.key]}
                </span>
                {n.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export function PageHeader({
  symbol,
  title,
  subtitle,
  actions,
}: {
  symbol: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span className="mr-2 text-[#d07aa0]" aria-hidden="true">
            {symbol}
          </span>
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={cn('pw-pill', tone)}>{children}</span>
}
