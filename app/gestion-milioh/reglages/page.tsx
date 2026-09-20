'use client'

import { useEffect, useState } from 'react'
import { Moon, Plus, Sun, Trash2, Truck, UserPlus, Users, X } from 'lucide-react'
import { useTheme } from '@/contexts/Providers'
import { addCommuneLivraison, grantGestionnaireAccess, listCommunesLivraison, listGestionnaireAccess, removeCommuneLivraison, revokeGestionnaireAccess, updateCommuneFrais } from '@/lib/data'
import type { GestionnaireAccess } from '@/lib/data'
import type { CommuneLivraison } from '@/lib/types'

export default function AdminSettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const [communes, setCommunes] = useState<CommuneLivraison[]>([])
  const [loading, setLoading] = useState(true)
  const [newNom, setNewNom] = useState('')
  const [newFrais, setNewFrais] = useState('')

  const [accesList, setAccesList] = useState<GestionnaireAccess[]>([])
  const [accesLoading, setAccesLoading] = useState(true)
  const [newAccesEmail, setNewAccesEmail] = useState('')
  const [accesError, setAccesError] = useState('')
  const [accesSaving, setAccesSaving] = useState(false)

  async function refreshAcces() {
    setAccesLoading(true)
    try {
      setAccesList(await listGestionnaireAccess())
    } catch (e: any) {
      setAccesError(e?.message ?? 'Impossible de charger la liste des accès.')
    }
    setAccesLoading(false)
  }
  useEffect(() => { refreshAcces() }, [])

  async function handleGrantAccess() {
    if (!newAccesEmail.trim()) return
    setAccesError('')
    setAccesSaving(true)
    try {
      await grantGestionnaireAccess(newAccesEmail.trim())
      setNewAccesEmail('')
      refreshAcces()
    } catch (e: any) {
      setAccesError(e?.message ?? "Impossible d'accorder cet accès.")
    }
    setAccesSaving(false)
  }

  async function handleRevokeAccess(email: string) {
    if (!confirm(`Retirer l'accès à l'espace de gestion pour ${email} ?`)) return
    setAccesError('')
    try {
      await revokeGestionnaireAccess(email)
      refreshAcces()
    } catch (e: any) {
      setAccesError(e?.message ?? "Impossible de retirer cet accès.")
    }
  }

  async function refresh() {
    setCommunes(await listCommunesLivraison())
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  async function handleFraisChange(nom: string, frais: number) {
    setCommunes((prev) => prev.map((c) => (c.nom === nom ? { ...c, frais } : c)))
    await updateCommuneFrais(nom, frais)
  }

  async function handleAdd() {
    if (!newNom.trim()) return
    await addCommuneLivraison(newNom.trim(), Number(newFrais) || 0)
    setNewNom(''); setNewFrais('')
    refresh()
  }

  async function handleDelete(nom: string) {
    if (!confirm(`Retirer "${nom}" des zones de livraison Abidjan ?`)) return
    await removeCommuneLivraison(nom)
    refresh()
  }

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

      <h3 style={{ marginTop: '2rem' }}><Truck size={16} style={{ verticalAlign: 'middle', marginRight: '.4rem' }} />Frais de livraison — Abidjan</h3>
      <p className="muted">Ces tarifs par commune s&apos;appliquent immédiatement dans le tunnel de commande client.</p>

      {loading ? (
        <div className="spinner" />
      ) : (
        <>
          <div className="inventory-list">
            {communes.map((c) => (
              <div key={c.nom} className="inventory-row">
                <div className="inventory-name"><strong>{c.nom}</strong></div>
                <div className="inline-field">
                  <small>Frais (FCFA)</small>
                  <input type="number" defaultValue={c.frais} onBlur={(e) => handleFraisChange(c.nom, Number(e.target.value) || 0)} />
                </div>
                <button className="icon-btn" onClick={() => handleDelete(c.nom)} aria-label="Supprimer"><Trash2 size={15} /></button>
              </div>
            ))}
            {communes.length === 0 && <p className="muted">Aucune zone de livraison configurée.</p>}
          </div>

          <div className="add-line" style={{ marginTop: '1rem' }}>
            <input placeholder="Nom de la commune ou zone" value={newNom} onChange={(e) => setNewNom(e.target.value)} />
            <input type="number" placeholder="Frais FCFA" value={newFrais} onChange={(e) => setNewFrais(e.target.value)} style={{ maxWidth: 110 }} />
            <button className="btn btn-primary" onClick={handleAdd}><Plus size={16} /></button>
          </div>
        </>
      )}

      <h3 style={{ marginTop: '2rem' }}><Users size={16} style={{ verticalAlign: 'middle', marginRight: '.4rem' }} />Accès à l&apos;espace de gestion</h3>
      <p className="muted">
        Pour laisser quelqu&apos;un d&apos;autre gérer la boutique (ex. en ton absence) : elle crée d&apos;abord son propre
        compte depuis la page de connexion de l&apos;espace de gestion (bouton &laquo; Créer un compte &raquo;), puis tu
        ajoutes son email ici pour lui donner l&apos;accès. Elle n&apos;a besoin de solliciter personne d&apos;autre.
      </p>

      {accesLoading ? (
        <div className="spinner" />
      ) : (
        <>
          <div className="inventory-list">
            {accesList.map((a) => (
              <div key={a.email} className="inventory-row">
                <div className="inventory-name">
                  <strong>{a.email}</strong>
                  <span>Accès depuis le {new Date(a.ajoute_le).toLocaleDateString('fr-FR')}</span>
                </div>
                <button className="icon-btn" onClick={() => handleRevokeAccess(a.email)} aria-label="Retirer l'accès"><X size={15} /></button>
              </div>
            ))}
            {accesList.length === 0 && <p className="muted">Aucun accès trouvé (étrange — tu es forcément dans cette liste).</p>}
          </div>

          {accesError && <p className="field-error">{accesError}</p>}

          <div className="add-line" style={{ marginTop: '1rem' }}>
            <input type="email" placeholder="Email du compte déjà créé" value={newAccesEmail} onChange={(e) => setNewAccesEmail(e.target.value)} />
            <button className="btn btn-primary" disabled={accesSaving} onClick={handleGrantAccess}><UserPlus size={16} /></button>
          </div>
        </>
      )}
    </div>
  )
}
