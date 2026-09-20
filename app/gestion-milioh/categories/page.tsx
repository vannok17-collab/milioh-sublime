'use client'

import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { addCategory, addMacroCategory, listCategories, listMacroCategories, removeCategory, removeMacroCategory, renameMacroCategory, updateCategory } from '@/lib/data'
import type { Category, MacroCategoryRow } from '@/lib/types'

export default function CategoriesPage() {
  // ---------- Sous-catégories ----------
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // ---------- Macro-catégories ----------
  const [macroCategories, setMacroCategories] = useState<MacroCategoryRow[]>([])
  const [newMacroName, setNewMacroName] = useState('')
  const [editingMacro, setEditingMacro] = useState<string | null>(null)
  const [editMacroValue, setEditMacroValue] = useState('')
  const [macroError, setMacroError] = useState('')

  const [loading, setLoading] = useState(true)

  async function refresh() {
    const [cats, macros] = await Promise.all([listCategories(), listMacroCategories()])
    setCategories(cats)
    setMacroCategories(macros)
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  async function handleAdd() {
    if (!newName.trim()) return
    await addCategory(newName.trim())
    setNewName('')
    refresh()
  }

  async function saveEdit(id: string) {
    if (!editValue.trim()) return
    await updateCategory(id, editValue.trim())
    setEditingId(null)
    refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette catégorie ? Les articles associés garderont leur macro-catégorie.')) return
    await removeCategory(id)
    refresh()
  }

  async function handleAddMacro() {
    if (!newMacroName.trim()) return
    setMacroError('')
    try {
      await addMacroCategory(newMacroName.trim())
      setNewMacroName('')
      refresh()
    } catch (e: any) {
      setMacroError(e?.message ?? "Impossible d'ajouter cette macro-catégorie.")
    }
  }

  async function saveMacroEdit(nom: string) {
    if (!editMacroValue.trim()) return
    setMacroError('')
    try {
      await renameMacroCategory(nom, editMacroValue.trim())
      setEditingMacro(null)
      refresh()
    } catch (e: any) {
      setMacroError(e?.message ?? 'Impossible de renommer cette macro-catégorie.')
    }
  }

  async function handleDeleteMacro(nom: string) {
    if (!confirm(`Supprimer la macro-catégorie "${nom}" ?`)) return
    setMacroError('')
    try {
      await removeMacroCategory(nom)
      refresh()
    } catch (e: any) {
      setMacroError(e?.message ?? 'Impossible de supprimer cette macro-catégorie.')
    }
  }

  if (loading) return <div className="admin-page"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-section-heading"><h2>Catégories</h2></div>

      <h3 style={{ marginTop: '.5rem' }}>Macro-catégories</h3>
      <p className="muted">Ce sont les grandes vignettes de l&apos;accueil et les onglets principaux du catalogue (Bijoux, Femme, Homme...). Une catégorie encore utilisée par un article ne peut pas être supprimée.</p>

      <div className="add-line">
        <input placeholder="Nom de la macro-catégorie" value={newMacroName} onChange={(e) => setNewMacroName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddMacro()} />
        <button className="btn btn-primary" onClick={handleAddMacro}><Plus size={16} /></button>
      </div>
      {macroError && <p className="field-error">{macroError}</p>}

      <div className="simple-list">
        {macroCategories.map((c) => (
          <div key={c.nom}>
            {editingMacro === c.nom ? (
              <input value={editMacroValue} onChange={(e) => setEditMacroValue(e.target.value)} onBlur={() => saveMacroEdit(c.nom)} onKeyDown={(e) => e.key === 'Enter' && saveMacroEdit(c.nom)} autoFocus style={{ flex: 1 }} />
            ) : (
              <strong>{c.nom}</strong>
            )}
            <button className="icon-btn" onClick={() => { setEditingMacro(c.nom); setEditMacroValue(c.nom) }} aria-label="Modifier"><Pencil size={15} /></button>
            <button className="icon-btn" onClick={() => handleDeleteMacro(c.nom)} aria-label="Supprimer"><Trash2 size={15} /></button>
          </div>
        ))}
        {macroCategories.length === 0 && <p className="muted">Aucune macro-catégorie pour le moment.</p>}
      </div>

      <h3 style={{ marginTop: '2rem' }}>Sous-catégories</h3>
      <p className="muted">Ces sous-catégories apparaissent immédiatement dans le formulaire Stocks et comme filtres dans le catalogue client.</p>

      <div className="add-line">
        <input placeholder="Nom de la sous-catégorie" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <button className="btn btn-primary" onClick={handleAdd}><Plus size={16} /></button>
      </div>

      <div className="simple-list">
        {categories.map((c) => (
          <div key={c.id}>
            {editingId === c.id ? (
              <input value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => saveEdit(c.id)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.id)} autoFocus style={{ flex: 1 }} />
            ) : (
              <strong>{c.nom}</strong>
            )}
            <button className="icon-btn" onClick={() => { setEditingId(c.id); setEditValue(c.nom) }} aria-label="Modifier"><Pencil size={15} /></button>
            <button className="icon-btn" onClick={() => handleDelete(c.id)} aria-label="Supprimer"><Trash2 size={15} /></button>
          </div>
        ))}
        {categories.length === 0 && <p className="muted">Aucune sous-catégorie pour le moment.</p>}
      </div>
    </div>
  )
}
