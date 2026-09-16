'use client'

import { AlertTriangle } from 'lucide-react'
import { useDemoMode } from '@/contexts/Providers'

export function DemoBanner() {
  const { demo, reason } = useDemoMode()
  if (!demo) return null
  return (
    <div className="demo-banner">
      <AlertTriangle />
      <span>Mode démo — {reason || "les données ne sont pas partagées ni sauvegardées durablement."}</span>
    </div>
  )
}
