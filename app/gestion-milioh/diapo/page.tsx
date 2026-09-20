'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Search, Trash2, Upload } from 'lucide-react'
import { addDiapoImage, getProductsByIds, listDiapo, queryProducts, removeDiapoImage, reorderDiapo } from '@/lib/data'
import { uploadImage } from '@/lib/storage'
import type { DiapoImage, Product } from '@/lib/types'

export default function DiapoPage() {
  const [images, setImages] = useState<DiapoImage[]>([])
  const [linkedProducts, setLinkedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Recherche du produit à lier — on ne charge jamais tout le catalogue ici,
  // seulement les quelques résultats correspondant à ce que la gestionnaire tape.
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])

  async function refresh() {
    const d = await listDiapo()
    setImages(d)
    const ids = Array.from(new Set(d.map((i) => i.produit_id).filter(Boolean))) as string[]
    setLinkedProducts(await getProductsByIds(ids))
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return }
    const t = setTimeout(() => {
      queryProducts({ search: productSearch, pageSize: 8 }).then((res) => setProductResults(res.items))
    }, 300)
    return () => clearTimeout(t)
  }, [productSearch])

  const [uploading, setUploading] = useState(false)

  function handleFile(file: File) {
    setUploading(true)
    uploadImage(file, 'diapo').then((url) => { setNewUrl(url); setUploading(false) })
  }

  async function handleAdd() {
    if (!newUrl) return
    await addDiapoImage(newUrl, selectedProduct?.id ?? null)
    setNewUrl(''); setSelectedProduct(null); setProductSearch(''); setProductResults([])
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
          <div className="search-box">
            <Search />
            <input
              placeholder="Rechercher un produit à lier..."
              value={selectedProduct ? selectedProduct.nom : productSearch}
              onChange={(e) => { setSelectedProduct(null); setProductSearch(e.target.value) }}
            />
          </div>
        </label>
        {!selectedProduct && productResults.length > 0 && (
          <div className="inventory-list" style={{ marginTop: '.4rem' }}>
            {productResults.map((p) => (
              <button
                key={p.id}
                className="inventory-row"
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => { setSelectedProduct(p); setProductResults([]) }}
              >
                <img src={p.image_url ?? '/placeholder.jpg'} alt={p.nom} loading="lazy" />
                <div className="inventory-name"><strong>{p.nom}</strong></div>
              </button>
            ))}
          </div>
        )}

        <button className="btn btn-primary full" disabled={!newUrl} onClick={handleAdd}>Ajouter au bandeau</button>
      </div>

      <div className="inventory-list">
        {images.map((img, i) => (
          <div key={img.id} className="inventory-row">
            <img src={img.image_url} alt="" loading="lazy" decoding="async" />
            <div className="inventory-name">
              <strong>Image {i + 1}</strong>
              <span>{linkedProducts.find((p) => p.id === img.produit_id)?.nom ?? 'Aucun produit lié'}</span>
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
