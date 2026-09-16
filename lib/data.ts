import { supabase, supabaseConfigured, isDemoMode, reportConnectionFailure, reportConnectionSuccess } from './supabase'
import { demoStore, demoUid } from './demo-data'
import { generateOrderNumber } from './order'
import type {
  Category, DiapoImage, Order, OrderStatus, Product, Review, ReturnRequest, ReturnStatus,
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

// ---------- Products ----------
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
