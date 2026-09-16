'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LockKeyhole } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { useAuth, useDemoMode } from '@/contexts/Providers'

export default function AdminLoginPage() {
  const router = useRouter()
  const { demo } = useDemoMode()
  const { user, isAdmin, adminChecked, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [awaitingCheck, setAwaitingCheck] = useState(false)

  useEffect(() => {
    if (!awaitingCheck || !adminChecked) return
    setAwaitingCheck(false)
    if (isAdmin) {
      router.replace('/gestion-milioh')
    } else if (user) {
      setError("Ce compte n'a pas accès à l'espace de gestion.")
      signOut()
    }
  }, [awaitingCheck, adminChecked, isAdmin, user, router, signOut])

  async function handleLogin() {
    setError('')
    if (demo) {
      setError('Espace de gestion indisponible en mode démo (Supabase non configuré).')
      return
    }
    if (!email.trim() || !password) { setError('Renseigne ton email et ton mot de passe.'); return }
    if (!supabase || !supabaseConfigured) { setError('Connexion à la base de données indisponible.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError('Email ou mot de passe incorrect.'); return }
    setAwaitingCheck(true)
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <Logo />
        <h1>Gestion</h1>
        <p className="muted">Espace réservé à la gestionnaire de Miliöh Sublime.</p>
        <form onSubmit={(e) => { e.preventDefault(); handleLogin() }}>
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="gestion@miliohsublime.ci" />
          </label>
          <label>Mot de passe
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="btn btn-primary full" disabled={loading || awaitingCheck}>
            <LockKeyhole size={16} /> {loading || awaitingCheck ? 'Vérification...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
