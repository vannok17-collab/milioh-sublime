import { supabase, supabaseConfigured, isDemoMode, reportConnectionFailure, reportConnectionSuccess } from './supabase'
import { demoStore, demoUid } from './demo-data'
import { generateOrderNumber } from './order'
import type {
  Category, CommuneLivraison, DiapoImage, MacroCategory, MacroCategoryRow, Order, OrderStatus, Product, Review, ReturnRequest, ReturnStatus,
} from './types'

/** Runs `op` against Supabase; on any failure (or if not configured) falls back to `fallback`. */
async function withFallback<T>(op: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!supabaseConfigured || isDemoMode()) return fallback()
  try {
    const result = await op()
    reportConnectionSuccess()
    return result
  } catch (e: any) {
    reportConnectionFailure(e?.message ? `Connexion à la base de données perdue (${e.message}).` : 'Connexion à la base de données perdue.')
    return fallback()
  }
}

// ---------- Categories ----------
export async function listCategories(): Promise<Category[]> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('categories').select('*').order('nom')
    if (error) throw error
    return data as Category[]
  }, () => demoStore.categories.all())
}

export async function addCategory(nom: string): Promise<Category> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('categories').insert({ nom }).select().single()
    if (error) throw error
    return data as Category
  }, () => demoStore.categories.add(nom))
}

export async function updateCategory(id: string, nom: string): Promise<void> {
  await withFallback(async () => {
    const { error } = await supabase!.from('categories').update({ nom }).eq('id', id)
    if (error) throw error
  }, () => demoStore.categories.update(id, nom))
}

export async function removeCategory(id: string): Promise<void> {
  await withFallback(async () => {
    const { error } = await supabase!.from('categories').delete().eq('id', id)
    if (error) throw error
  }, () => demoStore.categories.remove(id))
}

// ---------- Macro-catégories ----------
// Gérées comme les sous-catégories (nom = clé primaire, référencée par
// produits.macro_categorie) : la gestionnaire peut les ajouter, les
// renommer (répercuté automatiquement sur les articles concernés) et les
// supprimer, tant qu'aucun article ne l'utilise encore.
export async function listMacroCategories(): Promise<MacroCategoryRow[]> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('macro_categories').select('*').order('ordre')
    if (error) throw error
    return data as MacroCategoryRow[]
  }, () => demoStore.macroCategories.all())
}

export async function addMacroCategory(nom: string): Promise<MacroCategoryRow> {
  return withFallback(async () => {
    const { data: existing } = await supabase!.from('macro_categories').select('ordre').order('ordre', { ascending: false }).limit(1)
    const ordre = existing && existing.length > 0 ? (existing[0] as { ordre: number }).ordre + 1 : 0
    const { data, error } = await supabase!.from('macro_categories').insert({ nom, ordre }).select().single()
    if (error) throw error
    return data as MacroCategoryRow
  }, () => demoStore.macroCategories.add(nom))
}

export async function renameMacroCategory(nom: string, nouveauNom: string): Promise<void> {
  await withFallback(async () => {
    const { error } = await supabase!.from('macro_categories').update({ nom: nouveauNom }).eq('nom', nom)
    if (error) throw error
  }, () => demoStore.macroCategories.rename(nom, nouveauNom))
}

export async function removeMacroCategory(nom: string): Promise<void> {
  if (!supabaseConfigured || isDemoMode()) {
    demoStore.macroCategories.remove(nom)
    return
  }
  const { error } = await supabase!.from('macro_categories').delete().eq('nom', nom)
  if (error) {
    if (error.code === '23503') {
      // Contrainte volontaire (on delete restrict) : on ne masque jamais ce
      // cas derrière le mode démo, c'est une vraie erreur de validation à
      // montrer à la gestionnaire, pas un problème de connexion.
      throw new Error('Impossible de supprimer : des articles utilisent encore cette macro-catégorie. Réaffecte-les d\u2019abord.')
    }
    reportConnectionFailure(error.message ? `Connexion à la base de données perdue (${error.message}).` : 'Connexion à la base de données perdue.')
    throw error
  }
  reportConnectionSuccess()
}

// ---------- Frais de livraison (communes d'Abidjan) ----------
// Autrefois codés en dur, modifiables désormais par la gestionnaire
// (Réglages), et utilisés directement dans le tunnel de commande.
export async function listCommunesLivraison(): Promise<CommuneLivraison[]> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('communes_livraison').select('*').order('ordre')
    if (error) throw error
    return data as CommuneLivraison[]
  }, () => demoStore.communesLivraison.all())
}

export async function addCommuneLivraison(nom: string, frais: number): Promise<CommuneLivraison> {
  return withFallback(async () => {
    const { data: existing } = await supabase!.from('communes_livraison').select('ordre').order('ordre', { ascending: false }).limit(1)
    const ordre = existing && existing.length > 0 ? (existing[0] as { ordre: number }).ordre + 1 : 0
    const { data, error } = await supabase!.from('communes_livraison').insert({ nom, frais, ordre }).select().single()
    if (error) throw error
    return data as CommuneLivraison
  }, () => demoStore.communesLivraison.add(nom, frais))
}

export async function updateCommuneFrais(nom: string, frais: number): Promise<void> {
  await withFallback(async () => {
    const { error } = await supabase!.from('communes_livraison').update({ frais }).eq('nom', nom)
    if (error) throw error
  }, () => demoStore.communesLivraison.updateFrais(nom, frais))
}

export async function removeCommuneLivraison(nom: string): Promise<void> {
  await withFallback(async () => {
    const { error } = await supabase!.from('communes_livraison').delete().eq('nom', nom)
    if (error) throw error
  }, () => demoStore.communesLivraison.remove(nom))
}

// ---------- Products ----------
export interface ProductQuery {
  search?: string
  macro?: MacroCategory | 'Tous'
  sousCategorieId?: string | 'Toutes'
  sort?: 'defaut' | 'az' | 'prix_asc' | 'prix_desc'
  page?: number // 0-based
  pageSize?: number
}

export interface ProductPage {
  items: Product[]
  hasMore: boolean
}

const DEFAULT_PAGE_SIZE = 24

/**
 * Requête paginée + filtrée côté base de données (recherche, catégories, tri).
 * Contrairement à l'ancien listProducts() qui chargeait tout le catalogue à
 * chaque visite, celle-ci ne transporte jamais plus d'une page à la fois —
 * indispensable pour rester rapide avec plusieurs milliers d'articles.
 */
export async function queryProducts(q: ProductQuery = {}): Promise<ProductPage> {
  const page = q.page ?? 0
  const pageSize = q.pageSize ?? DEFAULT_PAGE_SIZE
  const from = page * pageSize
  const to = from + pageSize - 1 // on demande un article de plus pour savoir s'il y a une page suivante

  return withFallback(async () => {
    let query = supabase!.from('produits').select('*')
    if (q.macro && q.macro !== 'Tous') query = query.eq('macro_categorie', q.macro)
    if (q.sousCategorieId && q.sousCategorieId !== 'Toutes') query = query.eq('sous_categorie_id', q.sousCategorieId)
    if (q.search?.trim()) {
      const s = q.search.trim().replace(/[%_]/g, '')
      query = query.or(`nom.ilike.%${s}%,description.ilike.%${s}%`)
    }
    switch (q.sort) {
      case 'az': query = query.order('nom', { ascending: true }); break
      case 'prix_asc': query = query.order('prix_detail', { ascending: true }); break
      case 'prix_desc': query = query.order('prix_detail', { ascending: false }); break
      default: query = query.order('created_at', { ascending: false })
    }
    const { data, error } = await query.range(from, to + 1)
    if (error) throw error
    const rows = data as Product[]
    return { items: rows.slice(0, pageSize), hasMore: rows.length > pageSize }
  }, () => {
    let list = demoStore.products.all()
    if (q.macro && q.macro !== 'Tous') list = list.filter((p) => p.macro_categorie === q.macro)
    if (q.sousCategorieId && q.sousCategorieId !== 'Toutes') list = list.filter((p) => p.sous_categorie_id === q.sousCategorieId)
    if (q.search?.trim()) {
      const s = q.search.trim().toLowerCase()
      list = list.filter((p) => p.nom.toLowerCase().includes(s) || p.description.toLowerCase().includes(s))
    }
    const withPrice = (p: Product) => (p.en_promo && p.prix_promo != null ? p.prix_promo : p.prix_detail)
    switch (q.sort) {
      case 'az': list = [...list].sort((a, b) => a.nom.localeCompare(b.nom)); break
      case 'prix_asc': list = [...list].sort((a, b) => withPrice(a) - withPrice(b)); break
      case 'prix_desc': list = [...list].sort((a, b) => withPrice(b) - withPrice(a)); break
    }
    const slice = list.slice(from, from + pageSize)
    return { items: slice, hasMore: list.length > from + pageSize }
  })
}

/** Produits en promo pour l'accueil — jamais tout le catalogue. */
export async function listFeaturedProducts(limit = 4): Promise<Product[]> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('produits').select('*').eq('en_promo', true).order('created_at', { ascending: false }).limit(limit)
    if (error) throw error
    return data as Product[]
  }, () => demoStore.products.all().filter((p) => p.en_promo).slice(0, limit))
}

/** Récupère uniquement les produits demandés (panier, favoris) — jamais tout le catalogue. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []
  return withFallback(async () => {
    const { data, error } = await supabase!.from('produits').select('*').in('id', ids)
    if (error) throw error
    return data as Product[]
  }, () => demoStore.products.all().filter((p) => ids.includes(p.id)))
}

/** @deprecated Conservé pour les usages ponctuels (ex. petits catalogues de démo) — préférer queryProducts. */
export async function listProducts(): Promise<Product[]> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('produits').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as Product[]
  }, () => demoStore.products.all())
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('produits').select('*').eq('id', id).single()
    if (error) throw error
    return data as Product
  }, () => demoStore.products.get(id))
}

export async function addProduct(p: Omit<Product, 'id'>): Promise<Product> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('produits').insert(p).select().single()
    if (error) throw error
    return data as Product
  }, () => demoStore.products.add(p))
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<void> {
  await withFallback(async () => {
    const { error } = await supabase!.from('produits').update(patch).eq('id', id)
    if (error) throw error
  }, () => demoStore.products.update(id, patch))
}

export async function removeProduct(id: string): Promise<void> {
  await withFallback(async () => {
    const { error } = await supabase!.from('produits').delete().eq('id', id)
    if (error) throw error
  }, () => demoStore.products.remove(id))
}

export async function decrementStock(id: string, qty: number): Promise<void> {
  await withFallback(async () => {
    const { data, error: e1 } = await supabase!.from('produits').select('stock').eq('id', id).single()
    if (e1) throw e1
    const newStock = Math.max(0, (data as { stock: number }).stock - qty)
    const { error } = await supabase!.from('produits').update({ stock: newStock }).eq('id', id)
    if (error) throw error
  }, () => demoStore.products.decrementStock(id, qty))
}

// ---------- Diapo ----------
export async function listDiapo(): Promise<DiapoImage[]> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('diapo').select('*').order('ordre')
    if (error) throw error
    return data as DiapoImage[]
  }, () => demoStore.diapo.all())
}

export async function addDiapoImage(image_url: string, produit_id: string | null): Promise<void> {
  await withFallback(async () => {
    const current = await listDiapo()
    const { error } = await supabase!.from('diapo').insert({ image_url, produit_id, ordre: current.length })
    if (error) throw error
  }, () => demoStore.diapo.add(image_url, produit_id))
}

export async function removeDiapoImage(id: string): Promise<void> {
  await withFallback(async () => {
    const { error } = await supabase!.from('diapo').delete().eq('id', id)
    if (error) throw error
  }, () => demoStore.diapo.remove(id))
}

export async function reorderDiapo(ids: string[]): Promise<void> {
  await withFallback(async () => {
    await Promise.all(ids.map((id, i) => supabase!.from('diapo').update({ ordre: i }).eq('id', id)))
  }, () => demoStore.diapo.reorder(ids))
}

// ---------- Reviews ----------
export async function listReviews(produit_id: string): Promise<Review[]> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('avis').select('*').eq('produit_id', produit_id).order('created_at', { ascending: false })
    if (error) throw error
    return data as Review[]
  }, () => demoStore.reviews.forProduct(produit_id))
}

export async function addReview(r: Omit<Review, 'id' | 'created_at'>): Promise<void> {
  await withFallback(async () => {
    const { error } = await supabase!.from('avis').insert(r)
    if (error) throw error
  }, () => demoStore.reviews.add(r))
}

// ---------- Orders ----------
export async function createOrder(order: Omit<Order, 'id' | 'numero' | 'created_at'>): Promise<Order> {
  const numero = generateOrderNumber()
  const created_at = new Date().toISOString()
  return withFallback(async () => {
    const { data, error } = await supabase!.from('commandes').insert({ ...order, numero }).select().single()
    if (error) throw error
    return data as Order
  }, () => {
    const full: Order = { ...order, id: demoUid(), numero, created_at }
    demoStore.orders.add(full)
    return full
  })
}

export async function getOrderByNumero(numero: string): Promise<Order | undefined> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('commandes').select('*').ilike('numero', numero).maybeSingle()
    if (error) throw error
    return (data as Order) ?? undefined
  }, () => demoStore.orders.byNumero(numero))
}

export async function listOrders(): Promise<Order[]> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('commandes').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as Order[]
  }, () => demoStore.orders.all())
}

export async function updateOrderStatus(id: string, statut: OrderStatus, extra?: Partial<Order>): Promise<void> {
  await withFallback(async () => {
    const { error } = await supabase!.from('commandes').update({ statut, ...extra }).eq('id', id)
    if (error) throw error
  }, () => demoStore.orders.update(id, { statut, ...extra }))
}

export async function cancelOrder(id: string, motif: string): Promise<void> {
  await updateOrderStatus(id, 'annulee', { motif_annulation: motif })
}

export async function validateMobileMoneyPayment(order: Order): Promise<void> {
  await updateOrderStatus(order.id, 'nouvelle', { paiement: { ...order.paiement, valide: true } })
}

// ---------- Returns ----------
export async function listReturns(): Promise<ReturnRequest[]> {
  return withFallback(async () => {
    const { data, error } = await supabase!.from('retours').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as ReturnRequest[]
  }, () => demoStore.returns.all())
}

export async function createReturn(r: Omit<ReturnRequest, 'id' | 'created_at' | 'statut'>): Promise<ReturnRequest> {
  const created_at = new Date().toISOString()
  return withFallback(async () => {
    const { data, error } = await supabase!.from('retours').insert({ ...r, statut: 'en_cours' }).select().single()
    if (error) throw error
    return data as ReturnRequest
  }, () => {
    const full: ReturnRequest = { ...r, id: demoUid(), created_at, statut: 'en_cours' }
    demoStore.returns.add(full)
    return full
  })
}

export async function updateReturnStatus(id: string, statut: ReturnStatus): Promise<void> {
  await withFallback(async () => {
    const { error } = await supabase!.from('retours').update({ statut }).eq('id', id)
    if (error) throw error
  }, () => demoStore.returns.update(id, { statut }))
}

// ---------- Gestionnaires ----------
export async function isGestionnaire(userId: string): Promise<boolean> {
  if (!supabaseConfigured || isDemoMode()) {
    // Mode démo : identifiants fictifs bien connus, jamais un vrai compte.
    return userId === 'demo-gestionnaire'
  }
  try {
    const { data, error } = await supabase!.from('gestionnaires').select('user_id').eq('user_id', userId).maybeSingle()
    if (error) throw error
    reportConnectionSuccess()
    return Boolean(data)
  } catch (e: any) {
    reportConnectionFailure('Connexion à la base de données perdue lors de la vérification du compte gestionnaire.')
    return false
  }
}

// ---------- Gestion des accès (déléguer l'espace de gestion à quelqu'un d'autre) ----------
// Ces trois fonctions passent par des fonctions Postgres (RPC) plutôt que
// des requêtes directes sur `gestionnaires` : la table ne référence que des
// user_id, et retrouver un email nécessite de lire auth.users, non
// accessible directement au client. Voir 0001_init.sql pour le détail.
export interface GestionnaireAccess {
  email: string
  ajoute_le: string
}

export async function listGestionnaireAccess(): Promise<GestionnaireAccess[]> {
  if (!supabaseConfigured || isDemoMode() || !supabase) return []
  const { data, error } = await supabase.rpc('list_gestionnaires')
  if (error) throw error
  return data as GestionnaireAccess[]
}

export async function grantGestionnaireAccess(email: string): Promise<void> {
  if (!supabaseConfigured || isDemoMode() || !supabase) {
    throw new Error("Indisponible en mode démo — connecte d'abord Supabase.")
  }
  const { error } = await supabase.rpc('add_gestionnaire_by_email', { p_email: email })
  if (error) throw error
}

export async function revokeGestionnaireAccess(email: string): Promise<void> {
  if (!supabaseConfigured || isDemoMode() || !supabase) {
    throw new Error("Indisponible en mode démo — connecte d'abord Supabase.")
  }
  const { error } = await supabase.rpc('remove_gestionnaire_by_email', { p_email: email })
  if (error) throw error
}
