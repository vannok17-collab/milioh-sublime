'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { useDemoMode } from '@/contexts/Providers'

export default function LoginPage() {
  const router = useRouter()
  const { demo } = useDemoMode()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')
    if (!email.trim() || !password) { setError('Renseigne ton email et ton mot de passe.'); return }
    if (!supabaseConfigured || !supabase) {
      setError("La connexion n'est pas disponible en mode démo (Supabase non configuré).")
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError('Email ou mot de passe incorrect.'); return }
    router.push('/profil')
  }

  async function handleGoogle() {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/profil` } })
  }

  return (
    <div className="page-content">
      <div className="checkout-card">
        <h1>Connexion</h1>
        {demo && <p className="muted">Mode démo : la connexion par compte n&apos;est pas disponible tant que la base de données n&apos;est pas connectée.</p>}
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" />
        </label>
        <label>Mot de passe
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </label>
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-primary full" style={{ marginTop: '1.2rem' }} disabled={loading} onClick={handleLogin}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <button className="btn btn-outline full" style={{ marginTop: '.6rem' }} onClick={handleGoogle}>Continuer avec Google</button>
        <p className="muted" style={{ marginTop: '1.2rem', textAlign: 'center' }}>
          Pas encore de compte ? <Link href="/inscription" className="link-btn">Créer un compte</Link>
        </p>
        <p className="muted" style={{ textAlign: 'center' }}>
          <Link href="/catalogue" className="link-btn">Continuer sans compte</Link>
        </p>
      </div>
    </div>
  )
}
