import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** The deployed site. Auth emails always point here in production — never localhost. */
export const PRODUCTION_SITE_URL = 'https://primpaiisways.netlify.app'
const NETLIFY_HOST = 'primpaiisways.netlify.app'

const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || 'https://vflgcsubicihvmzetyjk.supabase.co'
// Publishable key only (sb_publishable_…). The legacy "anon" JWT is accepted as a fallback.
const PUBLISHABLE_KEY: string =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/** Refuse anything that looks like a privileged key so it can never be used in the browser. */
function keyProblem(key: string): string | null {
  if (!key) return 'missing'
  if (key.startsWith('sb_secret_')) return 'secret'
  if (key.split('.').length === 3) {
    try {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      if (payload?.role === 'service_role') return 'secret'
    } catch {
      /* not a JWT we can read — let Supabase validate it */
    }
  }
  return null
}

export const supabaseKeyProblem = keyProblem(PUBLISHABLE_KEY)
export const supabaseConfigured = supabaseKeyProblem === null

let client: SupabaseClient | null = null

/** Browser-only Supabase client (session is stored in localStorage on this device). */
export function getSupabase(): SupabaseClient {
  if (!supabaseConfigured) throw new Error('Supabase is not configured')
  client ??= createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Implicit flow: email links work even when opened on a different device/browser.
      flowType: 'implicit',
    },
  })
  return client
}

/**
 * Base URL used for email confirmation and password reset links.
 * Local dev uses the current origin; production and Netlify deploy previews use
 * their own Netlify origin; anything else falls back to the production domain.
 */
export function authSiteUrl(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    const { origin, hostname } = window.location
    if (import.meta.env.DEV) return origin
    if (hostname === NETLIFY_HOST || hostname.endsWith(`--${NETLIFY_HOST}`)) return origin
  }
  return configured || PRODUCTION_SITE_URL
}
