'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useCart } from '@/contexts/Providers'

export function ProductCard({ product }: { product: Product }) {
  const { toggleFavorite, isFavorite } = useCart()
  const liked = isFavorite(product.id)
  const price = product.en_promo && product.prix_promo != null ? product.prix_promo : product.prix_detail

  return (
    <div className="product-card">
      <div className="product-image">
        <Link href={`/produit/${product.id}`}>
          <img src={product.image_url ?? '/placeholder.jpg'} alt={product.nom} loading="lazy" decoding="async" />
        </Link>
        <button
          className={`heart ${liked ? 'liked' : ''}`}
          aria-label="Favori"
          onClick={(e) => { e.preventDefault(); toggleFavorite(product.id) }}
        >
          <Heart fill={liked ? 'currentColor' : 'none'} />
        </button>
        {product.en_promo && <span className="promo-badge">PROMO</span>}
        {product.stock <= 0 && <div className="sold-out-overlay">Épuisé</div>}
      </div>
      <Link href={`/produit/${product.id}`} className="link-plain">
        <div className="product-info">
          <h3>{product.nom}</h3>
          <p className="price">
            {price.toLocaleString('fr-FR')} FCFA
            {product.en_promo && product.prix_promo != null && <del>{product.prix_detail.toLocaleString('fr-FR')} FCFA</del>}
          </p>
        </div>
      </Link>
    </div>
  )
}
