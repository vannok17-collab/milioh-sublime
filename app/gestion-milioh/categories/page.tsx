'use client'

import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { addCategory, listCategories, removeCategory, updateCategory } from '@/lib/data'
import type { Category } from '@/lib/types'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  async function refresh() {
    setCategories(await listCategories())
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

  if (loading) return <div className="admin-page"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-section-heading"><h2>Catégories</h2></div>
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
