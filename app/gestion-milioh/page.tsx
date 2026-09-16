'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Box, Package, RotateCcw, TrendingUp } from 'lucide-react'
import { listOrders, listProducts, listReturns } from '@/lib/data'
import type { Order, Product, ReturnRequest } from '@/lib/types'
import { ORDER_STATUS_LABELS } from '@/lib/types'

const LOW_STOCK_THRESHOLD = 3

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listOrders(), listProducts(), listReturns()]).then(([o, p, r]) => {
      setOrders(o); setProducts(p); setReturns(r); setLoading(false)
    })
  }, [])

  const enCours = useMemo(() => orders.filter((o) => o.statut !== 'livree' && o.statut !== 'annulee'), [orders])
  const retoursOuverts = useMemo(() => returns.filter((r) => r.statut === 'en_cours'), [returns])
  const stockFaible = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD), [products])
  const ruptures = useMemo(() => products.filter((p) => p.stock === 0), [products])
  const totalStock = useMemo(() => products.reduce((s, p) => s + p.stock, 0), [products])
  const recentOrders = orders.slice(0, 5)

  if (loading) return <div className="admin-page"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="welcome-row"><h2>Dashboard</h2></div>

      <div className="metric-grid">
        <div className="metric">
          <span>Commandes en cours</span>
          <strong>{enCours.length}</strong>
        </div>
        <div className="metric">
          <span>Articles en stock</span>
          <strong>{totalStock}</strong>
        </div>
        <div className="metric">
          <span>Retours ouverts</span>
          <strong>{retoursOuverts.length}</strong>
        </div>
      </div>

      {(stockFaible.length > 0 || ruptures.length > 0) && (
        <div className="admin-card insight-card" style={{ marginTop: '1.2rem' }}>
          <AlertTriangle />
          <h3>Alertes stock</h3>
          {ruptures.length > 0 && <p>{ruptures.length} article(s) en rupture : {ruptures.map((p) => p.nom).join(', ')}</p>}
          {stockFaible.length > 0 && <p>{stockFaible.length} article(s) en stock faible (≤ {LOW_STOCK_THRESHOLD}) : {stockFaible.map((p) => p.nom).join(', ')}</p>}
          <Link href="/gestion-milioh/stocks" className="text-link">Voir les stocks</Link>
        </div>
      )}

      <div className="admin-card" style={{ marginTop: '1.2rem' }}>
        <div className="card-heading">
          <h3>5 dernières commandes</h3>
          <Link href="/gestion-milioh/commandes" className="text-link">Tout voir</Link>
        </div>
        {recentOrders.length === 0 && <p className="muted">Aucune commande pour le moment.</p>}
        {recentOrders.map((o) => (
          <div key={o.id} className="order-row">
            <div className="order-avatar">{o.client_nom[0]?.toUpperCase() ?? '?'}</div>
            <div>
              <strong>{o.numero}</strong>
              <span>{o.client_nom} · {o.total.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <span className="status">{ORDER_STATUS_LABELS[o.statut]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
