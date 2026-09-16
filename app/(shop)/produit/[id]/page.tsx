'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, MessageCircle, Minus, Plus, Info } from 'lucide-react'
import { getProduct, listReviews, addReview } from '@/lib/data'
import type { Product, Review } from '@/lib/types'
import { useCart } from '@/contexts/Providers'
import { StarRating } from '@/components/StarRating'
import { whatsappLink } from '@/lib/config'
import { whatsappInfoMessage } from '@/lib/order'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { addToCart, toggleFavorite, isFavorite } = useCart()
  const [product, setProduct] = useState<Product | null | undefined>(undefined)
  const [reviews, setReviews] = useState<Review[]>([])
  const [wholesale, setWholesale] = useState(false)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [author, setAuthor] = useState('')
  const [note, setNote] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getProduct(id).then((p) => setProduct(p ?? null))
    listReviews(id).then(setReviews)
  }, [id])

  useEffect(() => {
    if (product?.prix_gros != null && wholesale && qty < product.quantite_min_gros) {
      setQty(product.quantite_min_gros)
    }
  }, [wholesale, product, qty])

  if (product === undefined) return <div className="page-content"><div className="spinner" /></div>
  if (product === null) {
    return (
      <div className="page-content">
        <button className="back-link" onClick={() => router.back()}><ArrowLeft /> Retour</button>
        <div className="empty"><h2>Produit introuvable</h2></div>
      </div>
    )
  }

  const canWholesale = product.prix_gros != null
  const usingWholesale = canWholesale && wholesale && qty >= product.quantite_min_gros
  const unitPrice = usingWholesale ? (product.prix_gros as number) : (product.en_promo && product.prix_promo != null ? product.prix_promo : product.prix_detail)
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.note, 0) / reviews.length : 0
  const liked = isFavorite(product.id)

  async function submitReview() {
    if (!author.trim() || !comment.trim()) return
    setSubmitting(true)
    await addReview({ produit_id: product!.id, auteur: author.trim(), note, commentaire: comment.trim() })
    const fresh = await listReviews(product!.id)
    setReviews(fresh)
    setAuthor(''); setComment(''); setNote(5)
    setSubmitting(false)
  }

  return (
    <div className="page-content detail-page">
      <button className="back-link" onClick={() => router.back()}><ArrowLeft /> Retour</button>
      <div className="detail-image">
        <img src={product.image_url ?? '/placeholder.jpg'} alt={product.nom} loading="eager" fetchPriority="high" decoding="async" />
      </div>
      <div className="detail-copy">
        <p className="eyebrow">{product.macro_categorie}</p>
        <h1>{product.nom}</h1>
        <p className="detail-price">
          {unitPrice.toLocaleString('fr-FR')} FCFA
          {product.en_promo && !usingWholesale && product.prix_promo != null && <del>{product.prix_detail.toLocaleString('fr-FR')} FCFA</del>}
        </p>
        {reviews.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', margin: '.4rem 0' }}>
            <StarRating value={avg} />
            <small className="muted">{avg.toFixed(1)} ({reviews.length} avis)</small>
          </div>
        )}

        <p className="description">{product.description}</p>

        {canWholesale && (
          <div className="wholesale">
            <Info />
            <span>
              Prix de gros dès {product.quantite_min_gros} pièces ({(product.prix_gros as number).toLocaleString('fr-FR')} FCFA/pièce).
            </span>
            <label style={{ marginLeft: 'auto', display: 'flex', gap: '.3rem', alignItems: 'center' }}>
              <input type="checkbox" checked={wholesale} onChange={(e) => setWholesale(e.target.checked)} />
              Gros
            </label>
          </div>
        )}

        <div className="quantity-row">
          <div className="quantity">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={14} /></button>
            <b>{qty}</b>
            <button onClick={() => setQty((q) => q + 1)}><Plus size={14} /></button>
          </div>
          <span className="muted">{product.stock > 0 ? `${product.stock} en stock` : 'Épuisé'}</span>
        </div>

        <div className="detail-actions">
          <button className="favorite-btn" onClick={() => toggleFavorite(product.id)} aria-label="Favori">
            <Heart fill={liked ? 'currentColor' : 'none'} color={liked ? 'var(--gold)' : undefined} />
          </button>
          <button
            className="btn btn-primary full"
            disabled={product.stock <= 0}
            onClick={() => { addToCart(product.id, qty); setAdded(true); setTimeout(() => setAdded(false), 1800) }}
          >
            {added ? 'Ajouté ✓' : product.stock <= 0 ? 'Épuisé' : 'Ajouter au panier'}
          </button>
        </div>

        <a href={whatsappLink(whatsappInfoMessage(product.nom))} target="_blank" rel="noreferrer" className="btn btn-outline full" style={{ marginTop: '.6rem' }}>
          <MessageCircle /> Se renseigner sur WhatsApp
        </a>

        <section className="section">
          <div className="section-heading"><h2>Avis clients</h2></div>
          {reviews.length === 0 && <p className="muted">Aucun avis pour le moment.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {reviews.map((r) => (
              <div key={r.id} className="review-card">
                <StarRating value={r.note} />
                <p style={{ margin: '.4rem 0' }}>{r.commentaire}</p>
                <small>— {r.auteur}</small>
              </div>
            ))}
          </div>

          <div className="form-card" style={{ marginTop: '1.2rem' }}>
            <label>Ton nom
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Ton prénom" />
            </label>
            <label>Note
              <StarRating value={note} onChange={setNote} size={22} />
            </label>
            <label>Commentaire
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ton avis sur cet article..." />
            </label>
            <button className="btn btn-primary" disabled={submitting} onClick={submitReview}>Publier l&apos;avis</button>
          </div>
        </section>
      </div>
    </div>
  )
}
