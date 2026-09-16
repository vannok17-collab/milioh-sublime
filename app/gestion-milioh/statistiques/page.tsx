'use client'

import { useEffect, useMemo, useState } from 'react'
import { listOrders } from '@/lib/data'
import type { Order } from '@/lib/types'

export default function StatisticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { listOrders().then((o) => { setOrders(o); setLoading(false) }) }, [])

  const valid = useMemo(() => orders.filter((o) => o.statut !== 'annulee'), [orders])
  const chiffreAffaires = useMemo(() => valid.reduce((s, o) => s + o.total, 0), [valid])

  const bestSellers = useMemo(() => {
    const map = new Map<string, number>()
    valid.forEach((o) => o.articles.forEach((a) => map.set(a.nom, (map.get(a.nom) ?? 0) + a.quantite)))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [valid])

  const maxQty = bestSellers[0]?.[1] ?? 1

  if (loading) return <div className="admin-page"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-section-heading"><h2>Statistiques</h2></div>

      <div className="metric-grid">
        <div className="metric"><span>Commandes</span><strong>{valid.length}</strong></div>
        <div className="metric"><span>Chiffre d&apos;affaires</span><strong>{chiffreAffaires.toLocaleString('fr-FR')}</strong><small>FCFA</small></div>
        <div className="metric"><span>Panier moyen</span><strong>{valid.length ? Math.round(chiffreAffaires / valid.length).toLocaleString('fr-FR') : 0}</strong><small>FCFA</small></div>
      </div>

      <div className="admin-card chart-card">
        <h3>Articles les plus vendus</h3>
        {bestSellers.length === 0 ? (
          <p className="muted">Pas encore assez de données.</p>
        ) : (
          <div className="fake-chart">
            <div className="chart-bars">
              {bestSellers.map(([nom, qty]) => (
                <div key={nom} style={{ height: `${Math.max(10, (qty / maxQty) * 100)}%` }}>
                  <span>{nom.length > 10 ? nom.slice(0, 9) + '…' : nom} ({qty})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
