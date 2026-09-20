'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { checkPasswordStrength, checkStrongPassword } from '@/lib/password'
import { Logo } from '@/components/Logo'

// Page partagée : ouverte depuis le lien envoyé par email (client ou admin),
// Supabase établit automatiquement une session "recovery" en arrivant ici.
function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get('admin') === '1'
  const checkStrength = isAdmin ? checkStrongPassword : checkPasswordStrength
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return
    // Le lien email contient un jeton que le client Supabase échange
    // automatiquement contre une session au chargement de la page.
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const strength = password ? checkStrength(password) : null

  async function handleSubmit() {
    setError('')
    if (!supabase) return
    const s = checkStrength(password)
    if (!s.ok) { setError(s.message); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError("Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré — redemande-en un."); return }
    setSuccess(true)
    setTimeout(() => router.push('/'), 2000)
  }

  if (!supabaseConfigured) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <Logo />
          <h1>Indisponible</h1>
          <p className="muted">La réinitialisation du mot de passe nécessite une connexion à la base de données.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-login">
      <div className="login-card">
        <Logo />
        <h1>Nouveau mot de passe</h1>
        {success ? (
          <p className="muted">Mot de passe mis à jour. Redirection...</p>
        ) : !ready ? (
          <p className="muted">Ouverture du lien de réinitialisation...</p>
        ) : (
          <>
            <label>Nouveau mot de passe
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isAdmin ? 'Au moins 10 caractères, majuscule, minuscule, chiffre, symbole' : 'Au moins 8 caractères'} />
            </label>
            {strength && <p className={strength.ok ? 'muted' : 'field-error'}>{strength.message}</p>}
            {error && <p className="field-error">{error}</p>}
            <button className="btn btn-primary full" style={{ marginTop: '1rem' }} disabled={loading} onClick={handleSubmit}>
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="admin-login"><div className="spinner" /></div>}>
      <ResetPasswordInner />
    </Suspense>
  )
}
