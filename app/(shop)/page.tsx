'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { listDiapo, listProducts } from '@/lib/data'
import type { DiapoImage, Product } from '@/lib/types'
import { MACRO_CATEGORIES } from '@/lib/types'
import { ProductCard } from '@/components/shop/ProductCard'

const CATEGORY_IMAGES: Record<string, string> = {
  Bijoux: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=400&q=70',
  Femme: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=70',
  Homme: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=70',
  Bébé: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=400&q=70',
  Maison: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=70',
  Promos: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=70',
}

export default function HomePage() {
  const [diapo, setDiapo] = useState<DiapoImage[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listDiapo(), listProducts()]).then(([d, p]) => {
      setDiapo(d)
      setProducts(p)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (diapo.length < 2) return
    const t = setInterval(() => setSlide((s) => (s + 1) % diapo.length), 4500)
    return () => clearInterval(t)
  }, [diapo.length])

  const featured = products.filter((p) => p.en_promo).slice(0, 4)
  const current = diapo[slide]
  const currentProduct = current ? products.find((p) => p.id === current.produit_id) : undefined

  return (
    <div className="page-content">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Bijouterie en ligne · Abidjan</p>
          <h1>Sublimez chaque <em>instant</em></h1>
          <p>Des bijoux d&apos;exception, sélectionnés avec soin, livrés partout à Abidjan et en Côte d&apos;Ivoire.</p>
          <Link href={currentProduct ? `/produit/${currentProduct.id}` : '/catalogue'} className="btn btn-primary">
            Découvrir <ArrowRight />
          </Link>
        </div>
        {current && (
          <Link href={currentProduct ? `/produit/${currentProduct.id}` : '/catalogue'} className="hero-orb link-plain">
            <img src={current.image_url} alt={currentProduct?.nom ?? 'Miliöh Sublime'} loading="eager" fetchPriority="high" decoding="async" />
          </Link>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Explorer</p>
            <h2>Catégories</h2>
          </div>
        </div>
        <div className="category-grid">
          {MACRO_CATEGORIES.map((cat) => (
            <Link key={cat} href={`/catalogue?categorie=${encodeURIComponent(cat)}`} className="category-tile">
              <img src={CATEGORY_IMAGES[cat]} alt={cat} loading="lazy" decoding="async" />
              <span>{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">En ce moment</p>
              <h2>Promotions</h2>
            </div>
            <Link href="/catalogue?categorie=Promos" className="text-link">Tout voir <ArrowRight /></Link>
          </div>
          <div className="product-grid">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {loading && <div className="spinner" />}
    </div>
  )
}
