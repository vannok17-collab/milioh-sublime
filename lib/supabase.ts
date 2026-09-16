import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * `configured` is true only when the two env vars are present.
 * `connectionOk` starts as configured and flips to false the moment any
 * real Supabase call fails, so a broken connection is never silent
 * (see checkConnection / reportConnectionFailure below).
 */
export const supabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

type DemoListener = (isDemo: boolean, reason: string) => void
const listeners = new Set<DemoListener>()
let demoState = !supabaseConfigured
let demoReason = supabaseConfigured ? '' : 'Supabase non configuré (variables d\'environnement manquantes).'

export function isDemoMode() {
  return demoState
}

export function demoModeReason() {
  return demoReason
}

export function onDemoModeChange(fn: DemoListener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function setDemoMode(value: boolean, reason: string) {
  if (demoState === value) return
  demoState = value
  demoReason = reason
  listeners.forEach((fn) => fn(demoState, demoReason))
}

/** Call this after any Supabase network operation to keep demo-mode state honest. */
export function reportConnectionFailure(reason: string) {
  setDemoMode(true, reason)
}

export function reportConnectionSuccess() {
  if (supabaseConfigured) setDemoMode(false, '')
}

/** Pings a lightweight table to verify the DB is actually reachable, not just configured. */
export async function checkConnection(): Promise<boolean> {
  if (!supabaseConfigured || !supabase) {
    setDemoMode(true, 'Supabase non configuré (variables d\'environnement manquantes).')
    return false
  }
  try {
    const { error } = await supabase.from('categories').select('id').limit(1)
    if (error) {
      setDemoMode(true, `Connexion à la base de données impossible (${error.message}).`)
      return false
    }
    reportConnectionSuccess()
    return true
  } catch (e) {
    setDemoMode(true, 'Connexion à la base de données impossible.')
    return false
  }
}
