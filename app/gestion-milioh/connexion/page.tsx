'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LockKeyhole } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { isGestionnaire } from '@/lib/data'
import { useAuth, useDemoMode } from '@/contexts/Providers'

export default function AdminLoginPage() {
  const router = useRouter()
  const { demo } = useDemoMode()
  const { signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')
    if (demo) {
      setError('Espace de gestion indisponible en mode démo (Supabase non configuré).')
      return
    }
    if (!email.trim() || !password) { setError('Renseigne ton email et ton mot de passe.'); return }
    if (!supabase || !supabaseConfigured) { setError('Connexion à la base de données indisponible.'); return }

    setLoading(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err || !data.user) {
      setLoading(false)
      setError('Email ou mot de passe incorrect.')
      return
    }

    // On vérifie l'appartenance à la table `gestionnaires` directement avec
    // l'utilisateur renvoyé par la connexion, sans dépendre de l'état du
    // contexte qui n'est pas encore à jour à cet instant précis.
    const autorise = await isGestionnaire(data.user.id)
    setLoading(false)

    if (autorise) {
      router.replace('/gestion-milioh')
    } else {
      setError("Ce compte n'a pas accès à l'espace de gestion.")
      await signOut()
    }
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
          <button type="submit" className="btn btn-primary full" disabled={loading}>
            <LockKeyhole size={16} /> {loading ? 'Vérification...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
