'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LayoutDashboard, Box, Tag, Image as ImageIcon, Package, BarChart3, RotateCcw, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/Providers'
import { Logo } from '@/components/Logo'

const TABS = [
  { href: '/gestion-milioh', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gestion-milioh/stocks', label: 'Stocks', icon: Box },
  { href: '/gestion-milioh/categories', label: 'Catégories', icon: Tag },
  { href: '/gestion-milioh/diapo', label: 'Diapo', icon: ImageIcon },
  { href: '/gestion-milioh/commandes', label: 'Commandes', icon: Package },
  { href: '/gestion-milioh/statistiques', label: 'Statistiques', icon: BarChart3 },
  { href: '/gestion-milioh/retours', label: 'Retours', icon: RotateCcw },
  { href: '/gestion-milioh/reglages', label: 'Réglages', icon: Settings },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, isAdmin, adminChecked, signOut } = useAuth()

  // Pages accessibles sans être déjà gestionnaire : connexion, création de
  // compte, réinitialisation du mot de passe.
  const isPublicAdminPage = pathname === '/gestion-milioh/connexion' || pathname === '/gestion-milioh/inscription'

  useEffect(() => {
    if (isPublicAdminPage) return
    if (loading || !adminChecked) return
    if (!user || !isAdmin) router.replace('/gestion-milioh/connexion')
  }, [isPublicAdminPage, loading, adminChecked, user, isAdmin, router])

  if (isPublicAdminPage) return <>{children}</>

  if (loading || !adminChecked) {
    return <div className="admin-shell"><div className="admin-page"><div className="spinner" /></div></div>
  }

  if (!user || !isAdmin) {
    return <div className="admin-shell"><div className="admin-page"><div className="spinner" /></div></div>
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Logo compact />
        <div className="admin-title">
          <p className="eyebrow">Espace de gestion</p>
          <h1>Miliöh Sublime</h1>
        </div>
        <button className="icon-btn" onClick={signOut} aria-label="Déconnexion"><LogOut /></button>
      </header>
      <nav className="admin-tabs">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === '/gestion-milioh' ? pathname === href : pathname.startsWith(href)
          return (
            <button key={href} className={active ? 'active' : ''} onClick={() => router.push(href)}>
              <Icon />
              {label}
            </button>
          )
        })}
      </nav>
      <div className="admin-content">
        {children}
      </div>
    </div>
  )
}
