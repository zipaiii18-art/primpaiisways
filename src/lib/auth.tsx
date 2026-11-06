import * as React from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { authSiteUrl, getSupabase, supabaseConfigured } from './supabase'

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'unconfigured'

interface Auth {
  status: AuthStatus
  session: Session | null
  user: User | null
  /** True after the user arrived from a password-reset email. */
  recovery: boolean
  /** Error carried back from an email link (expired / already used), if any. */
  linkError: string | null
  clearLinkError: () => void
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
  resendConfirmation: (email: string) => Promise<string | null>
  requestPasswordReset: (email: string) => Promise<string | null>
  updatePassword: (password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<Auth | null>(null)

/** Friendly Indonesian copy for the most common Supabase Auth errors. */
export function authMessage(raw: string | undefined | null): string {
  const m = (raw ?? '').toLowerCase()
  if (!m) return 'Terjadi kesalahan. Coba lagi ya.'
  if (m.includes('invalid login credentials')) return 'Email atau password salah.'
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Cek inbox (atau folder spam) untuk link konfirmasi.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Email ini sudah terdaftar. Silakan login.'
  if (m.includes('password should be') || m.includes('weak password')) return 'Password terlalu lemah — minimal 8 karakter, kombinasikan huruf dan angka.'
  if (m.includes('same password') || m.includes('different from the old')) return 'Password baru harus berbeda dari password lama.'
  if (m.includes('rate limit') || m.includes('security purposes') || m.includes('too many'))
    return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
  if (m.includes('expired') || (m.includes('invalid') && m.includes('link'))) return 'Link sudah kedaluwarsa atau sudah dipakai. Minta link baru ya.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Tidak bisa terhubung ke server. Periksa koneksi internet.'
  return raw ?? 'Terjadi kesalahan.'
}

/** Reads `error_description` that Supabase appends to redirect URLs (hash or query). */
function readLinkError(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const desc = params.get('error_description') ?? query.get('error_description')
  const code = params.get('error_code') ?? query.get('error_code')
  if (!desc && !code) return null
  if (code === 'otp_expired') return 'Link sudah kedaluwarsa atau sudah dipakai. Minta link baru ya.'
  return authMessage(desc?.replace(/\+/g, ' '))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>('loading')
  const [session, setSession] = React.useState<Session | null>(null)
  const [recovery, setRecovery] = React.useState(false)
  const [linkError, setLinkError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!supabaseConfigured) {
      setStatus('unconfigured')
      return
    }
    // Capture link errors before the client tidies the URL.
    const err = readLinkError()
    if (err) setLinkError(err)
    if (window.location.hash.includes('type=recovery')) setRecovery(true)

    const supabase = getSupabase()
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setStatus(data.session ? 'signedIn' : 'signedOut')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
      setSession(next)
      setStatus(next ? 'signedIn' : 'signedOut')
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = React.useMemo<Auth>(() => {
    const sb = () => getSupabase()
    return {
      status,
      session,
      user: session?.user ?? null,
      recovery,
      linkError,
      clearLinkError: () => setLinkError(null),
      async signIn(email, password) {
        const { error } = await sb().auth.signInWithPassword({ email: email.trim(), password })
        return error ? authMessage(error.message) : null
      },
      async signUp(email, password) {
        const { data, error } = await sb().auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: authSiteUrl() },
        })
        if (error) return { error: authMessage(error.message), needsConfirmation: false }
        // Supabase hides existing accounts by returning a user without identities.
        if (data.user && data.user.identities?.length === 0)
          return { error: 'Email ini sudah terdaftar. Silakan login atau reset password.', needsConfirmation: false }
        return { error: null, needsConfirmation: !data.session }
      },
      async resendConfirmation(email) {
        const { error } = await sb().auth.resend({
          type: 'signup',
          email: email.trim(),
          options: { emailRedirectTo: authSiteUrl() },
        })
        return error ? authMessage(error.message) : null
      },
      async requestPasswordReset(email) {
        const { error } = await sb().auth.resetPasswordForEmail(email.trim(), {
          redirectTo: authSiteUrl(),
        })
        return error ? authMessage(error.message) : null
      },
      async updatePassword(password) {
        const { error } = await sb().auth.updateUser({ password })
        if (error) return authMessage(error.message)
        setRecovery(false)
        return null
      },
      async signOut() {
        await sb().auth.signOut()
      },
    }
  }, [status, session, recovery, linkError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): Auth {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
