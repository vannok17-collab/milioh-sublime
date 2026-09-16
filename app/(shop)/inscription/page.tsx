'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { checkPasswordStrength } from '@/lib/password'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = password ? checkPasswordStrength(password) : null

  async function handleSignup() {
    setError('')
    if (!email.trim() || !password) { setError('Renseigne un email et un mot de passe.'); return }
    const s = checkPasswordStrength(password)
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
      <div className="page-content">
        <div className="confirmation">
          <h1>Compte créé</h1>
          <p className="muted">Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => router.push('/connexion')}>Aller à la connexion</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="checkout-card">
        <h1>Créer un compte</h1>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" />
        </label>
        <label>Mot de passe
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Au moins 8 caractères" />
        </label>
        {strength && <p className={strength.ok ? 'muted' : 'field-error'}>{strength.message}</p>}
        {error && <p className="field-error">{error}</p>}
        <button className="btn btn-primary full" style={{ marginTop: '1.2rem' }} disabled={loading} onClick={handleSignup}>
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
      </div>
    </div>
  )
}
