'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { listCategories, listMacroCategories, queryProducts } from '@/lib/data'
import type { Category, MacroCategoryRow, Product } from '@/lib/types'
import { ProductCard } from '@/components/shop/ProductCard'

type Sort = 'defaut' | 'az' | 'prix_asc' | 'prix_desc'
const PAGE_SIZE = 24

function CatalogueInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [macroCategories, setMacroCategories] = useState<MacroCategoryRow[]>([])
  const [macro, setMacro] = useState<string>(params.get('categorie') || 'Tous')
  const [sub, setSub] = useState<string | 'Toutes'>('Toutes')
  const [sort, setSort] = useState<Sort>('defaut')

  // Recherche débattue à 350ms : évite une requête base de données à chaque
  // frappe — essentiel pour rester réactif avec un très grand catalogue.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    listCategories().then(setCategories)
    listMacroCategories().then(setMacroCategories)
  }, [])

  const requestId = useRef(0)

  const runQuery = useCallback((targetPage: number, replace: boolean) => {
    const id = ++requestId.current
    if (replace) setLoading(true); else setLoadingMore(true)
    queryProducts({ search: debouncedQuery, macro, sousCategorieId: sub, sort, page: targetPage, pageSize: PAGE_SIZE }).then((res) => {
      if (id !== requestId.current) return // une requête plus récente est déjà partie, on ignore celle-ci
      setProducts((prev) => (replace ? res.items : [...prev, ...res.items]))
      setHasMore(res.hasMore)
      setPage(targetPage)
      setLoading(false)
      setLoadingMore(false)
    })
  }, [debouncedQuery, macro, sub, sort])

  useEffect(() => { runQuery(0, true) }, [debouncedQuery, macro, sub, sort]) // eslint-disable-line react-hooks/exhaustive-deps

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
        {['Tous', ...macroCategories.map((c) => c.nom)].map((cat) => (
          <button
            key={cat}
            className={macro === cat ? 'selected' : ''}
            onClick={() => { setMacro(cat); router.replace(cat === 'Tous' ? '/catalogue' : `/catalogue?categorie=${encodeURIComponent(cat)}`) }}
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
        <p>{products.length} article{products.length > 1 ? 's' : ''}{hasMore ? '+' : ''}</p>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="defaut">Tri par défaut</option>
          <option value="az">A → Z</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="prix_desc">Prix décroissant</option>
        </select>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : products.length === 0 ? (
        <div className="empty">
          <SlidersHorizontal />
          <h2>Aucun article ne correspond à ta recherche</h2>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {hasMore && (
            <button className="btn btn-outline full" style={{ marginTop: '1.2rem' }} disabled={loadingMore} onClick={() => runQuery(page + 1, false)}>
              {loadingMore ? 'Chargement...' : 'Voir plus d\u2019articles'}
            </button>
          )}
        </>
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
