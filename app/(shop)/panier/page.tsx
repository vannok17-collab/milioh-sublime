'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '@/contexts/Providers'
import { listProducts } from '@/lib/data'
import type { Product } from '@/lib/types'

export default function CartPage() {
  const { lines, updateQuantity, removeFromCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => { listProducts().then(setProducts) }, [])

  const items = lines
    .map((l) => ({ line: l, product: products.find((p) => p.id === l.produit_id) }))
    .filter((i) => i.product) as { line: typeof lines[number]; product: Product }[]

  const total = items.reduce((sum, { line, product }) => {
    const price = product.en_promo && product.prix_promo != null ? product.prix_promo : product.prix_detail
    return sum + price * line.quantite
  }, 0)

  if (items.length === 0) {
    return (
      <div className="page-content">
        <div className="page-title"><h1>Panier</h1></div>
        <div className="empty">
          <ShoppingBag />
          <h2>Ton panier est vide</h2>
          <Link href="/catalogue" className="btn btn-primary">Voir le catalogue</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-title"><h1>Panier</h1></div>
      <div className="cart-list">
        {items.map(({ line, product }) => {
          const price = product.en_promo && product.prix_promo != null ? product.prix_promo : product.prix_detail
          return (
            <div key={product.id} className="cart-item">
              <img src={product.image_url ?? '/placeholder.jpg'} alt={product.nom} loading="lazy" decoding="async" />
              <div className="cart-item-copy">
                <h3>{product.nom}</h3>
                <p>{price.toLocaleString('fr-FR')} FCFA</p>
                <div className="quantity">
                  <button onClick={() => updateQuantity(product.id, line.quantite - 1)}><Minus size={14} /></button>
                  <b>{line.quantite}</b>
                  <button onClick={() => updateQuantity(product.id, line.quantite + 1)}><Plus size={14} /></button>
                </div>
              </div>
              <button className="delete-btn" onClick={() => removeFromCart(product.id)} aria-label="Retirer">
                <Trash2 />
              </button>
            </div>
          )
        })}
      </div>

      <div className="summary">
        <div><span>Sous-total</span><span>{total.toLocaleString('fr-FR')} FCFA</span></div>
        <div><span>Livraison</span><span>Calculée à l&apos;étape suivante</span></div>
        <div className="summary-total"><span>Total</span><strong>{total.toLocaleString('fr-FR')} FCFA</strong></div>
      </div>
      <Link href="/commande" className="btn btn-primary full" style={{ marginTop: '1rem' }}>Passer la commande</Link>
    </div>
  )
}
