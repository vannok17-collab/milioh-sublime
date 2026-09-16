'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Trash2, Upload } from 'lucide-react'
import { addDiapoImage, listDiapo, listProducts, removeDiapoImage, reorderDiapo } from '@/lib/data'
import { uploadImage } from '@/lib/storage'
import type { DiapoImage, Product } from '@/lib/types'

export default function DiapoPage() {
  const [images, setImages] = useState<DiapoImage[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [newProduit, setNewProduit] = useState('')

  async function refresh() {
    const [d, p] = await Promise.all([listDiapo(), listProducts()])
    setImages(d); setProducts(p); setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const [uploading, setUploading] = useState(false)

  function handleFile(file: File) {
    setUploading(true)
    uploadImage(file, 'diapo').then((url) => { setNewUrl(url); setUploading(false) })
  }

  async function handleAdd() {
    if (!newUrl) return
    await addDiapoImage(newUrl, newProduit || null)
    setNewUrl(''); setNewProduit('')
    refresh()
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = images.findIndex((i) => i.id === id)
    const target = idx + dir
    if (target < 0 || target >= images.length) return
    const ids = images.map((i) => i.id)
    ;[ids[idx], ids[target]] = [ids[target], ids[idx]]
    await reorderDiapo(ids)
    refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Retirer cette image du bandeau ?')) return
    await removeDiapoImage(id)
    refresh()
  }

  if (loading) return <div className="admin-page"><div className="spinner" /></div>

  return (
    <div className="admin-page">
      <div className="admin-section-heading"><h2>Diapo</h2></div>
      <p className="muted">Ces images défilent sur l&apos;accueil de la boutique, dans l&apos;ordre ci-dessous.</p>

      <div className="admin-card add-form">
        <h3>Ajouter une image</h3>
        <label className="upload">
          <Upload />
          {newUrl ? 'Image sélectionnée ✓' : uploading ? 'Compression en cours...' : 'Choisir une image'}
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
        <label>Produit mis en avant (optionnel)
          <select value={newProduit} onChange={(e) => setNewProduit(e.target.value)}>
            <option value="">Aucun</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </label>
        <button className="btn btn-primary full" disabled={!newUrl} onClick={handleAdd}>Ajouter au bandeau</button>
      </div>

      <div className="inventory-list">
        {images.map((img, i) => (
          <div key={img.id} className="inventory-row">
            <img src={img.image_url} alt="" loading="lazy" decoding="async" />
            <div className="inventory-name">
              <strong>Image {i + 1}</strong>
              <span>{products.find((p) => p.id === img.produit_id)?.nom ?? 'Aucun produit lié'}</span>
            </div>
            <button className="icon-btn" disabled={i === 0} onClick={() => move(img.id, -1)} aria-label="Monter"><ArrowUp size={16} /></button>
            <button className="icon-btn" disabled={i === images.length - 1} onClick={() => move(img.id, 1)} aria-label="Descendre"><ArrowDown size={16} /></button>
            <button className="icon-btn" onClick={() => handleDelete(img.id)} aria-label="Supprimer"><Trash2 size={16} /></button>
          </div>
        ))}
        {images.length === 0 && <p className="muted">Aucune image dans le bandeau.</p>}
      </div>
    </div>
  )
}
