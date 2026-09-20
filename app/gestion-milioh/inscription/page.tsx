'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { checkStrongPassword } from '@/lib/password'
import { Logo } from '@/components/Logo'

export default function AdminSignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = password ? checkStrongPassword(password) : null

  async function handleSignup() {
    setError('')
    if (!email.trim() || !password) { setError('Renseigne un email et un mot de passe.'); return }
    const s = checkStrongPassword(password)
    if (!s.ok) { setError(s.message); return }
    if (!supabaseConfigured || !supabase) { setError("L'inscription n'est pas disponible en mode démo."); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <Logo />
          <h1>Compte créé</h1>
          <p className="muted">
            Vérifie ta boîte mail pour confirmer ton adresse. Une fois confirmé, transmets ton email à une
            gestionnaire déjà en poste — elle doit t&apos;ajouter depuis Réglages pour que tu puisses accéder à
            l&apos;espace de gestion.
          </p>
          <Link href="/gestion-milioh/connexion" className="btn btn-primary full" style={{ marginTop: '1rem' }}>Aller à la connexion</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <Logo />
        <h1>Créer un compte</h1>
        <p className="muted">Une fois ton compte créé, une gestionnaire déjà en poste devra t&apos;accorder l&apos;accès depuis Réglages.</p>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" />
        </label>
        <label>Mot de passe
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Au moins 10 caractères, majuscule, minuscule, chiffre, symbole" />
        </label>
        {strength && <p className={strength.ok ? 'muted' : 'field-error'}>{strength.message}</p>}
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-primary full" style={{ marginTop: '1.2rem' }} disabled={loading} onClick={handleSignup}>
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
        <p className="muted" style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link href="/gestion-milioh/connexion" className="link-btn">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}
