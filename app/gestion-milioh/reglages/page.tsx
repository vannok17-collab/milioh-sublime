'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/Providers'

export default function AdminSettingsPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="admin-page">
      <div className="admin-section-heading"><h2>Réglages</h2></div>
      <div className="settings-list">
        <div>
          {theme === 'dark' ? <Moon /> : <Sun />}
          <div>
            <strong>Thème</strong>
            <span>{theme === 'dark' ? 'Sombre' : 'Clair'} — synchronisé avec la boutique cliente</span>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            Basculer
          </button>
        </div>
      </div>
    </div>
  )
}
