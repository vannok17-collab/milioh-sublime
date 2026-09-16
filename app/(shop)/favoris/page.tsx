'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useCart } from '@/contexts/Providers'
import { listProducts } from '@/lib/data'
import type { Product } from '@/lib/types'
import { ProductCard } from '@/components/shop/ProductCard'

export default function FavoritesPage() {
  const { favorites } = useCart()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => { listProducts().then(setProducts) }, [])

  const favProducts = products.filter((p) => favorites.includes(p.id))

  return (
    <div className="page-content">
      <div className="page-title"><h1>Favoris</h1></div>
      {favProducts.length === 0 ? (
        <div className="empty"><Heart /><h2>Aucun favori pour l&apos;instant</h2></div>
      ) : (
        <div className="product-grid">
          {favProducts.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
