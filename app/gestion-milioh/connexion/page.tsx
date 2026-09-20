'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [resetSending, setResetSending] = useState(false)

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
      setError("Ce compte n'a pas accès à l'espace de gestion. Demande à une gestionnaire déjà en poste de t'ajouter depuis Réglages.")
      await signOut()
    }
  }

  async function handleGoogle() {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/gestion-milioh` },
    })
  }

  async function handleResetPassword() {
    setResetMessage('')
    if (!resetEmail.trim() || !supabase) return
    setResetSending(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe?admin=1`,
    })
    setResetSending(false)
    if (err) {
      setResetMessage("Impossible d'envoyer l'email pour le moment. Réessaie plus tard.")
    } else {
      setResetMessage('Si un compte existe avec cet email, un lien de réinitialisation vient d\u2019être envoyé.')
    }
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <Logo />
        <h1>Gestion</h1>
        <p className="muted">Espace réservé à la gestionnaire de Miliöh Sublime.</p>

        {!showReset ? (
          <>
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

            <button className="btn btn-outline full" style={{ marginTop: '.6rem' }} onClick={handleGoogle}>Continuer avec Google</button>

            <p className="muted" style={{ marginTop: '1.2rem', textAlign: 'center' }}>
              <button className="link-btn" onClick={() => { setShowReset(true); setResetEmail(email) }}>Mot de passe oublié ?</button>
            </p>
            <p className="muted" style={{ textAlign: 'center' }}>
              Pas encore de compte ? <Link href="/gestion-milioh/inscription" className="link-btn">Créer un compte</Link>
            </p>
          </>
        ) : (
          <>
            <label>Email
              <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="ton@email.com" />
            </label>
            {resetMessage && <p className="muted">{resetMessage}</p>}
            <button className="btn btn-primary full" style={{ marginTop: '.6rem' }} disabled={resetSending} onClick={handleResetPassword}>
              {resetSending ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
            </button>
            <p className="muted" style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button className="link-btn" onClick={() => setShowReset(false)}>Retour à la connexion</button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
