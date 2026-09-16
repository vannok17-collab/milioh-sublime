'use client'

import { useState } from 'react'
import { Search, Truck, PackageCheck, CircleCheck, Ban, Clock } from 'lucide-react'
import { getOrderByNumero, cancelOrder } from '@/lib/data'
import type { Order, OrderStatus } from '@/lib/types'
import { ORDER_STATUS_LABELS } from '@/lib/types'

const TIMELINE: OrderStatus[] = ['nouvelle', 'confirmee', 'expediee', 'livree']
const TIMELINE_ICONS: Partial<Record<OrderStatus, typeof Clock>> = { nouvelle: Clock, confirmee: CircleCheck, expediee: Truck, livree: PackageCheck }

export default function TrackingPage() {
  const [numero, setNumero] = useState('')
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  async function search() {
    if (!numero.trim()) return
    setLoading(true)
    const o = await getOrderByNumero(numero.trim())
    setOrder(o ?? null)
    setLoading(false)
  }

  async function handleCancel() {
    if (!order) return
    setCancelling(true)
    await cancelOrder(order.id, 'Annulée par la cliente')
    const fresh = await getOrderByNumero(order.numero)
    setOrder(fresh ?? null)
    setCancelling(false)
  }

  const canCancel = order && order.statut !== 'expediee' && order.statut !== 'livree' && order.statut !== 'annulee'
  const currentIndex = order ? TIMELINE.indexOf(order.statut) : -1

  return (
    <div className="page-content tracking-card">
      <div className="page-title"><h1>Suivi de commande</h1></div>
      <div className="search-box">
        <Search />
        <input placeholder="Numéro de commande (MS-2026-XXXXX)" value={numero} onChange={(e) => setNumero(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
        <button className="btn btn-primary" onClick={search} disabled={loading}>{loading ? '...' : 'Suivre'}</button>
      </div>

      {order === null && <div className="empty"><h2>Aucune commande trouvée pour ce numéro</h2></div>}

      {order && (
        <div className="tracking-result">
          <div className="tracking-head">
            <div><span>Numéro</span><strong>{order.numero}</strong></div>
            <div><span>Total</span><strong>{order.total.toLocaleString('fr-FR')} FCFA</strong></div>
          </div>

          {order.statut === 'annulee' ? (
            <div className="error-banner" style={{ marginTop: '1.2rem' }}>
              <Ban size={14} style={{ marginRight: 6 }} />
              Commande annulée{order.motif_annulation ? ` — Motif : ${order.motif_annulation}` : ''}
            </div>
          ) : order.statut === 'en_attente_paiement' ? (
            <div className="toast" style={{ marginTop: '1.2rem' }}>
              <Clock /> En attente de confirmation du paiement Mobile Money.
            </div>
          ) : (
            <div className="timeline">
              {TIMELINE.map((s, i) => {
                const Icon = TIMELINE_ICONS[s]!
                return (
                  <span key={s} className={i <= currentIndex ? 'done' : ''}>
                    <Icon />
                    {ORDER_STATUS_LABELS[s]}
                  </span>
                )
              })}
            </div>
          )}

          {(order.livraison.type === 'interieur' || order.livraison.type === 'international') && order.tracking_numero && (
            <div className="admin-card" style={{ marginTop: '1.2rem' }}>
              <p className="muted">Transporteur : {order.livraison.compagnie_transport}</p>
              <p className="muted">N° de suivi : {order.tracking_numero}</p>
              {order.instructions_retrait && <p className="muted">{order.instructions_retrait}</p>}
            </div>
          )}

          {canCancel && (
            <button className="btn btn-outline full" style={{ marginTop: '1.5rem' }} disabled={cancelling} onClick={handleCancel}>
              {cancelling ? 'Annulation...' : 'Annuler ma commande'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
