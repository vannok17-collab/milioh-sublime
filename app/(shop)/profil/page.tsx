'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, CircleUserRound, Heart, LogOut, Moon, Sun, Truck } from 'lucide-react'
import { useAuth, useTheme } from '@/contexts/Providers'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  )

  async function requestNotifications() {
    if (!('Notification' in window)) { setNotifStatus('unsupported'); return }
    const perm = await Notification.requestPermission()
    setNotifStatus(perm)
    // NOTE: la permission navigateur est acquise ici. L'envoi réel de
    // notifications nécessite en plus une clé VAPID côté serveur et une
    // fonction d'envoi (Supabase Edge Function) — non configurées ici.
    // Activer la permission seule ne suffit donc pas à recevoir des messages.
  }

  if (!user) {
    return (
      <div className="page-content">
        <div className="empty">
          <CircleUserRound />
          <h2>Connecte-toi pour accéder à ton profil</h2>
          <Link href="/connexion" className="btn btn-primary">Connexion</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="profile-card">
        <div className="profile-avatar">{user.email?.[0]?.toUpperCase() ?? '?'}</div>
        <div>
          <h2>{user.email}</h2>
          <p>Cliente Miliöh Sublime</p>
        </div>
      </div>

      <div className="settings-menu">
        <button onClick={toggleTheme}>
          <div>{theme === 'dark' ? <Moon /> : <Sun />}<span>Thème<strong>{theme === 'dark' ? 'Sombre' : 'Clair'}</strong></span></div>
          <span className={`switch ${theme === 'dark' ? 'on' : ''}`} />
        </button>
        <button onClick={requestNotifications}>
          <div><Bell /><span>Notifications push<strong>
            {notifStatus === 'granted' ? 'Activées' : notifStatus === 'denied' ? 'Refusées' : notifStatus === 'unsupported' ? 'Non supportées' : 'Non activées'}
          </strong></span></div>
        </button>
        <Link href="/suivi"><div><Truck /><span>Suivi de commande</span></div></Link>
        <Link href="/favoris"><div><Heart /><span>Favoris</span></div></Link>
      </div>
      {/* L'espace de gestion (/gestion-milioh) n'est jamais lié depuis le menu client, par choix de conception. */}

      <button className="logout" onClick={signOut}><LogOut size={16} /> Déconnexion</button>
    </div>
  )
}
