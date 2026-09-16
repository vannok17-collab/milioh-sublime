'use client'

import { useEffect, useState } from 'react'
import { listReturns, updateReturnStatus } from '@/lib/data'
import type { ReturnRequest, ReturnStatus } from '@/lib/types'
import { RETURN_REASON_LABELS, RETURN_STATUS_LABELS } from '@/lib/types'

const STATUS_OPTIONS: ReturnStatus[] = ['en_cours', 'acceptee', 'refusee', 'remboursee']

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setReturns(await listReturns())
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  async function handleChange(r: ReturnRequest, statut: ReturnStatus) {
    await updateReturnStatus(r.id, statut)
    refresh()
  }

  if (loading) return <div className="admin-page"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-section-heading"><h2>Retours</h2></div>
      <div className="orders-list">
        {returns.map((r) => (
          <div key={r.id} className="admin-order">
            <div className="order-top">
              <div>
                <strong>{r.commande_numero}</strong>
                <span>{RETURN_REASON_LABELS[r.motif]}</span>
              </div>
              <span className="status">{RETURN_STATUS_LABELS[r.statut]}</span>
            </div>
            <p className="muted">{r.description}</p>
            <div className="order-actions">
              <select value={r.statut} onChange={(e) => handleChange(r, e.target.value as ReturnStatus)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{RETURN_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
        ))}
        {returns.length === 0 && <p className="muted">Aucune demande de retour pour le moment.</p>}
      </div>
    </div>
  )
}
