import * as React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useStore } from '@/lib/store'
import type { NavKey } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MusicMiniPlayer } from '@/components/music-player'
import { useAuth } from '@/lib/auth'
import { supabaseConfigured, supabaseKeyProblem } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogOut } from 'lucide-react'

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

function AccountGate() {
  const auth = useAuth()
  const [mode, setMode] = React.useState<'login' | 'register' | 'reset'>('login')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setNotice('')
    try {
      if (mode === 'login') {
        const error = await auth.signIn(email, password)
        if (error) setNotice(error)
      } else if (mode === 'register') {
        const result = await auth.signUp(email, password)
        if (result.error) setNotice(result.error)
        else setNotice(result.needsConfirmation ? 'Akun berhasil dibuat. Buka email untuk konfirmasi, lalu kembali dan login.' : 'Akun berhasil dibuat!')
      } else {
        const error = await auth.requestPasswordReset(email)
        setNotice(error ?? 'Link reset password sudah dikirim jika email terdaftar.')
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.') }
    finally { setBusy(false) }
  }
  if (auth.status === 'loading') return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Menyiapkan Primpaii&apos;s Way…</div>
  if (!supabaseConfigured || auth.status === 'unconfigured') return <div className="grid min-h-dvh place-items-center p-5"><div className="pw-card max-w-lg p-7 text-center"><h1 className="font-display text-3xl font-extrabold">Primpaii&apos;s Way</h1><p className="mt-3 text-sm text-muted-foreground">Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di Environment variables Netlify, lalu deploy ulang.</p><p className="mt-2 text-xs text-muted-foreground">Kode konfigurasi: {supabaseKeyProblem}</p></div></div>
  if (auth.status === 'signedOut') return <div className="pw-surface relative grid min-h-dvh place-items-center overflow-hidden p-5"><div className="pw-card w-full max-w-md p-7 sm:p-9"><div className="text-center"><div className="font-display text-3xl font-extrabold">Primpaii&apos;s Way</div><p className="pw-ornament mt-2">꒷꒦︶꒷꒦︶ ๋ ࣭ ⭑꒷꒦</p><h1 className="mt-5 text-xl font-extrabold">{mode === 'login' ? 'Welcome back, pretty!' : mode === 'register' ? 'Create your little space' : 'Reset password'}</h1><p className="mt-1 text-sm text-muted-foreground">{mode === 'login' ? 'Login untuk membuka dashboard jualanmu.' : mode === 'register' ? 'Buat akun agar data jualan tersimpan aman.' : 'Kami akan mengirim link reset ke emailmu.'}</p></div><form onSubmit={submit} className="mt-7 space-y-4"><div className="space-y-2"><Label htmlFor="auth-email">Email</Label><Input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" /></div>{mode !== 'reset' && <div className="space-y-2"><Label htmlFor="auth-password">Password</Label><Input id="auth-password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 8 karakter" /></div>}<Button className="w-full" disabled={busy}>{busy ? 'Memproses…' : mode === 'login' ? 'Login' : mode === 'register' ? 'Buat akun' : 'Kirim link reset'}</Button></form>{notice && <p role="status" className="mt-4 rounded-xl bg-accent p-3 text-sm">{notice}</p>}{auth.linkError && <p className="mt-3 text-sm text-destructive">{auth.linkError}</p>}<div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm"><button className="text-primary underline" onClick={()=>{setMode(mode==='login'?'register':'login');setNotice('')}}>{mode==='login'?'Buat akun baru':'Kembali ke login'}</button><button className="text-muted-foreground underline" onClick={()=>{setMode(mode==='reset'?'login':'reset');setNotice('')}}>{mode==='reset'?'Login':'Lupa password?'}</button></div></div></div>
  return null
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { appearance, loading, loadError } = useStore()
  const auth = useAuth()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (auth.status !== 'signedIn') return <AccountGate />
  if (auth.recovery) return <div className="grid min-h-dvh place-items-center p-5"><form className="pw-card w-full max-w-md space-y-4 p-7" onSubmit={async (e) => { e.preventDefault(); const form = e.currentTarget; const data = new FormData(form); const password = String(data.get('new-password') ?? ''); if (password.length < 8) { window.alert('Password minimal 8 karakter.'); return } const error = await auth.updatePassword(password); if (error) window.alert(error) }}><h1 className="font-display text-2xl font-extrabold">Buat password baru</h1><Label htmlFor="new-password">Password baru</Label><Input id="new-password" name="new-password" type="password" minLength={8} required /><Button className="w-full">Simpan password</Button></form></div>
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
        <div className="space-y-2 p-3">
          <MusicMiniPlayer />
          <div className="rounded-xl bg-muted/60 p-3"><p className="truncate text-xs text-muted-foreground">{auth.user?.email}</p><Button variant="ghost" size="sm" className="mt-1 w-full justify-start" onClick={() => void auth.signOut()}><LogOut /> Keluar</Button></div>
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
          {loading && <div className="mb-4 rounded-xl bg-accent/70 px-4 py-2 text-xs text-muted-foreground">Memuat data akun…</div>}
          {loadError && <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"><strong>Data belum berhasil dimuat.</strong><p className="mt-1">Pastikan SQL database sudah dijalankan di Supabase. Detail: {loadError}</p></div>}
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
