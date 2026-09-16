'use client'

import { useEffect, useState } from 'react'
import { Printer, Truck, Wallet, MapPin } from 'lucide-react'
import { listOrders, updateOrderStatus, validateMobileMoneyPayment } from '@/lib/data'
import type { Order, OrderStatus } from '@/lib/types'
import { ORDER_STATUS_LABELS } from '@/lib/types'

const STATUS_OPTIONS: OrderStatus[] = ['en_attente_paiement', 'nouvelle', 'confirmee', 'expediee', 'livree', 'annulee']

function printTicket(o: Order) {
  const win = window.open('', '_blank', 'width=380,height=600')
  if (!win) return
  const lignes = o.articles.map((a) => `<tr><td>${a.quantite}x ${a.nom}</td><td style="text-align:right">${(a.prix_unitaire * a.quantite).toLocaleString('fr-FR')} FCFA</td></tr>`).join('')
  win.document.write(`
    <html><head><title>${o.numero}</title>
    <style>body{font-family:sans-serif;padding:16px;font-size:13px} h1{font-size:16px} table{width:100%;border-collapse:collapse} td{padding:4px 0}</style>
    </head><body>
      <h1>Miliöh Sublime</h1>
      <p>Commande <strong>${o.numero}</strong></p>
      <p>${o.client_nom} — ${o.client_telephone}</p>
      <table>${lignes}</table>
      <p>Livraison: ${o.frais_livraison.toLocaleString('fr-FR')} FCFA</p>
      <hr/>
      <p><strong>Total: ${o.total.toLocaleString('fr-FR')} FCFA</strong></p>
      <p>Paiement: ${o.paiement.methode === 'especes' ? 'Espèces à la livraison' : `Mobile Money (${o.paiement.operateur})`}</p>
    </body></html>
  `)
  win.document.close()
  win.focus()
  win.print()
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null)
  const [motif, setMotif] = useState('')

  async function refresh() {
    setOrders(await listOrders())
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  async function handleStatusChange(order: Order, statut: OrderStatus) {
    if (statut === 'annulee') {
      setCancelTarget(order)
      setMotif('')
      return
    }
    await updateOrderStatus(order.id, statut)
    refresh()
  }

  async function confirmCancel() {
    if (!cancelTarget || !motif.trim()) return
    await updateOrderStatus(cancelTarget.id, 'annulee', { motif_annulation: motif.trim() })
    setCancelTarget(null)
    refresh()
  }

  async function handleValidatePayment(order: Order) {
    await validateMobileMoneyPayment(order)
    refresh()
  }

  if (loading) return <div className="admin-page"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-section-heading"><h2>Commandes</h2></div>

      <div className="orders-list">
        {orders.map((o) => (
          <div key={o.id} className="admin-order">
            <div className="order-top">
              <div>
                <strong>{o.numero}</strong>
                <span>{o.client_nom} · {o.client_telephone}</span>
              </div>
              <span className="status">{ORDER_STATUS_LABELS[o.statut]}</span>
            </div>

            <div className="order-details">
              <span><Wallet /> {o.total.toLocaleString('fr-FR')} FCFA</span>
              <span><Truck /> {o.livraison.mode === 'livreur_client' ? 'Livreur client' : 'Miliöh Sublime'}</span>
              {o.livraison.commune && <span><MapPin /> {o.livraison.commune}</span>}
              <span>{o.articles.length} article(s)</span>
            </div>

            {o.statut === 'annulee' && o.motif_annulation && (
              <p className="field-error">Motif : {o.motif_annulation}</p>
            )}

            <div className="order-actions">
              <select value={o.statut} onChange={(e) => handleStatusChange(o, e.target.value as OrderStatus)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
              </select>
              {o.statut === 'en_attente_paiement' && (
                <button className="outline-btn" onClick={() => handleValidatePayment(o)}><Wallet size={14} /> Valider le paiement</button>
              )}
              <button className="outline-btn" onClick={() => printTicket(o)}><Printer size={14} /> Imprimer le ticket</button>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="muted">Aucune commande pour le moment.</p>}
      </div>

      {cancelTarget && (
        <div className="modal-overlay" onClick={() => setCancelTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Annuler {cancelTarget.numero}</h2>
            <p className="muted">Un motif est obligatoire — il sera visible par la cliente dans son suivi de commande.</p>
            <label>Motif d&apos;annulation
              <textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Ex. Article non disponible, rupture de stock..." />
            </label>
            <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => setCancelTarget(null)}>Retour</button>
              <button className="btn btn-primary full" disabled={!motif.trim()} onClick={confirmCancel}>Confirmer l&apos;annulation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
