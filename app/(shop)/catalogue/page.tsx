'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { listCategories, listProducts } from '@/lib/data'
import type { Category, MacroCategory, Product } from '@/lib/types'
import { MACRO_CATEGORIES } from '@/lib/types'
import { ProductCard } from '@/components/shop/ProductCard'

type Sort = 'defaut' | 'az' | 'prix_asc' | 'prix_desc'

function CatalogueInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [macro, setMacro] = useState<MacroCategory | 'Tous'>((params.get('categorie') as MacroCategory) || 'Tous')
  const [sub, setSub] = useState<string | 'Toutes'>('Toutes')
  const [sort, setSort] = useState<Sort>('defaut')

  useEffect(() => {
    Promise.all([listProducts(), listCategories()]).then(([p, c]) => {
      setProducts(p)
      setCategories(c)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    let list = products
    if (macro !== 'Tous') list = list.filter((p) => p.macro_categorie === macro)
    if (sub !== 'Toutes') list = list.filter((p) => p.sous_categorie_id === sub)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((p) => p.nom.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    const withPrice = (p: Product) => (p.en_promo && p.prix_promo != null ? p.prix_promo : p.prix_detail)
    switch (sort) {
      case 'az': return [...list].sort((a, b) => a.nom.localeCompare(b.nom))
      case 'prix_asc': return [...list].sort((a, b) => withPrice(a) - withPrice(b))
      case 'prix_desc': return [...list].sort((a, b) => withPrice(b) - withPrice(a))
      default: return list
    }
  }, [products, macro, sub, query, sort])

  return (
    <div className="page-content">
      <div className="page-title">
        <h1>Catalogue</h1>
      </div>

      <div className="search-box">
        <Search />
        <input placeholder="Rechercher un article..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="chips">
        {['Tous', ...MACRO_CATEGORIES].map((cat) => (
          <button
            key={cat}
            className={macro === cat ? 'selected' : ''}
            onClick={() => { setMacro(cat as MacroCategory | 'Tous'); router.replace(cat === 'Tous' ? '/catalogue' : `/catalogue?categorie=${encodeURIComponent(cat)}`) }}
          >
            {cat}
          </button>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="chips">
          <button className={sub === 'Toutes' ? 'selected' : ''} onClick={() => setSub('Toutes')}>Toutes sous-catégories</button>
          {categories.map((c) => (
            <button key={c.id} className={sub === c.id ? 'selected' : ''} onClick={() => setSub(c.id)}>{c.nom}</button>
          ))}
        </div>
      )}

      <div className="catalogue-toolbar">
        <p>{filtered.length} article{filtered.length > 1 ? 's' : ''}</p>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="defaut">Tri par défaut</option>
          <option value="az">A → Z</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="prix_desc">Prix décroissant</option>
        </select>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="empty">
          <SlidersHorizontal />
          <h2>Aucun article ne correspond à ta recherche</h2>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}

export default function CataloguePage() {
  return (
    <Suspense fallback={<div className="spinner" />}>
      <CatalogueInner />
    </Suspense>
  )
}
