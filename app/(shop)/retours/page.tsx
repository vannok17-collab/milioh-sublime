'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { createReturn } from '@/lib/data'
import type { ReturnReason } from '@/lib/types'
import { RETURN_REASON_LABELS, RETURN_STATUS_LABELS } from '@/lib/types'
import { useAuth } from '@/contexts/Providers'
import { getOrderByNumero } from '@/lib/data'

export default function ReturnsPage() {
  const { user } = useAuth()
  const [numero, setNumero] = useState('')
  const [motif, setMotif] = useState<ReturnReason>('article_defectueux')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function submit() {
    if (!numero.trim() || !description.trim()) return
    setSubmitting(true)
    const order = await getOrderByNumero(numero.trim())
    if (!order) {
      setResult({ ok: false, message: 'Ce numéro de commande est introuvable.' })
      setSubmitting(false)
      return
    }
    const r = await createReturn({ commande_numero: order.numero, client_user_id: user?.id ?? null, motif, description: description.trim() })
    setResult({ ok: true, message: `Demande enregistrée — statut : ${RETURN_STATUS_LABELS[r.statut]}.` })
    setNumero(''); setDescription('')
    setSubmitting(false)
  }

  return (
    <div className="page-content">
      <div className="page-title"><h1>Retours &amp; Réclamations</h1></div>
      <div className="form-card">
        <p>Décris ton problème, nous te répondrons rapidement.</p>
        <label>Numéro de commande
          <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="MS-2026-XXXXX" />
        </label>
        <label>Motif
          <select value={motif} onChange={(e) => setMotif(e.target.value as ReturnReason)}>
            {Object.entries(RETURN_REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explique le problème rencontré..." />
        </label>
        {result && <p className={result.ok ? 'toast' : 'field-error'}>{result.message}</p>}
        <button className="btn btn-primary full" style={{ marginTop: '1rem' }} disabled={submitting} onClick={submit}>
          <RotateCcw /> Envoyer la demande
        </button>
      </div>
    </div>
  )
}
