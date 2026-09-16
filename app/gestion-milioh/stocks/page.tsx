'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import { addProduct, listCategories, listProducts, removeProduct, updateProduct } from '@/lib/data'
import { uploadImage } from '@/lib/storage'
import type { Category, MacroCategory, Product } from '@/lib/types'
import { MACRO_CATEGORIES } from '@/lib/types'

const emptyForm = {
  nom: '', description: '', prix_detail: '', prix_gros: '', quantite_min_gros: '5', stock: '',
  macro_categorie: 'Bijoux' as MacroCategory, sous_categorie_id: '', image_url: '',
}

export default function StocksPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const [p, c] = await Promise.all([listProducts(), listCategories()])
    setProducts(p); setCategories(c); setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function handleAdd() {
    if (!form.nom.trim() || !form.prix_detail) return
    setSaving(true)
    await addProduct({
      nom: form.nom.trim(),
      description: form.description.trim(),
      prix_detail: Number(form.prix_detail),
      prix_gros: form.prix_gros ? Number(form.prix_gros) : null,
      quantite_min_gros: Number(form.quantite_min_gros) || 5,
      stock: Number(form.stock) || 0,
      macro_categorie: form.macro_categorie,
      sous_categorie_id: form.sous_categorie_id || null,
      image_url: form.image_url || null,
      en_promo: false,
      prix_promo: null,
    })
    setForm(emptyForm)
    setShowForm(false)
    setSaving(false)
    refresh()
  }

  const [uploading, setUploading] = useState(false)

  async function handleImageUpload(file: File) {
    setUploading(true)
    const url = await uploadImage(file, 'produits')
    setForm((f) => ({ ...f, image_url: url }))
    setUploading(false)
  }

  async function patchProduct(id: string, patch: Partial<Product>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    await updateProduct(id, patch)
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet article ?')) return
    await removeProduct(id)
    refresh()
  }

  if (loading) return <div className="admin-page"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-section-heading">
        <h2>Stocks</h2>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}><Plus size={16} /> Ajouter</button>
      </div>

      {showForm && (
        <div className="admin-card add-form">
          <h3>Nouvel article</h3>
          <label>Nom<input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></label>
          <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="form-grid">
            <label>Prix détail<input type="number" value={form.prix_detail} onChange={(e) => setForm({ ...form, prix_detail: e.target.value })} /></label>
            <label>Prix gros (optionnel)<input type="number" value={form.prix_gros} onChange={(e) => setForm({ ...form, prix_gros: e.target.value })} /></label>
            <label>Qté min. gros<input type="number" value={form.quantite_min_gros} onChange={(e) => setForm({ ...form, quantite_min_gros: e.target.value })} /></label>
            <label>Stock<input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label>
            <label>Macro-catégorie
              <select value={form.macro_categorie} onChange={(e) => setForm({ ...form, macro_categorie: e.target.value as MacroCategory })}>
                {MACRO_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>Sous-catégorie
              <select value={form.sous_categorie_id} onChange={(e) => setForm({ ...form, sous_categorie_id: e.target.value })}>
                <option value="">Aucune</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
          </div>
          <label className="upload">
            <Upload />
            {uploading ? 'Compression en cours...' : form.image_url ? 'Image sélectionnée ✓' : 'Choisir une photo'}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
          </label>
          <button className="btn btn-primary full" disabled={saving} onClick={handleAdd}>{saving ? 'Ajout...' : 'Ajouter l\u2019article'}</button>
        </div>
      )}

      <div className="inventory-list">
        {products.map((p) => (
          <div key={p.id} className="inventory-row">
            <img src={p.image_url ?? '/placeholder.jpg'} alt={p.nom} loading="lazy" decoding="async" />
            <div className="inventory-name">
              <strong>{p.nom}</strong>
              <span>{p.macro_categorie}{categories.find((c) => c.id === p.sous_categorie_id) ? ` · ${categories.find((c) => c.id === p.sous_categorie_id)!.nom}` : ''}</span>
            </div>
            <div className="inline-field">
              <small>Détail</small>
              <input type="number" defaultValue={p.prix_detail} onBlur={(e) => patchProduct(p.id, { prix_detail: Number(e.target.value) })} />
            </div>
            <div className="inline-field">
              <small>Gros</small>
              <input type="number" defaultValue={p.prix_gros ?? ''} onBlur={(e) => patchProduct(p.id, { prix_gros: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div className="inline-field">
              <small>Stock</small>
              <input type="number" defaultValue={p.stock} onBlur={(e) => patchProduct(p.id, { stock: Number(e.target.value) })} />
            </div>
            <label className="promo-check">
              <input type="checkbox" checked={p.en_promo} onChange={(e) => patchProduct(p.id, { en_promo: e.target.checked })} />
              Promo
            </label>
            {p.en_promo && (
              <div className="inline-field">
                <small>Prix promo</small>
                <input type="number" defaultValue={p.prix_promo ?? ''} onBlur={(e) => patchProduct(p.id, { prix_promo: e.target.value ? Number(e.target.value) : null })} />
              </div>
            )}
            <button className="icon-btn" onClick={() => handleDelete(p.id)} aria-label="Supprimer"><Trash2 /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
