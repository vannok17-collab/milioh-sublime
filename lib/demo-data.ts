import type { Category, DiapoImage, Order, Product, Review, ReturnRequest } from './types'

// All demo data lives in localStorage under this prefix so it never
// touches a shared backend and is obviously scoped to one device.
const PREFIX = 'ms_demo_'

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

const SEED_CATEGORIES: Category[] = [
  { id: 'c1', nom: 'Colliers' },
  { id: 'c2', nom: 'Bracelets' },
  { id: 'c3', nom: 'Bagues' },
  { id: "c4", nom: "Boucles d'oreilles" },
  { id: 'c5', nom: 'Ensembles / Parures' },
]

const SEED_IMAGES = [
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
]

const SEED_PRODUCTS: Product[] = [
  { id: 'p1', nom: 'Collier Éclat Solaire', description: 'Collier plaqué or fin, maille délicate.', prix_detail: 25000, prix_gros: 20000, quantite_min_gros: 5, stock: 12, macro_categorie: 'Bijoux', sous_categorie_id: 'c1', image_url: SEED_IMAGES[0], en_promo: true, prix_promo: 19900 },
  { id: 'p2', nom: "Bracelet Perle d'Or", description: 'Bracelet fin serti de perles nacrées.', prix_detail: 18000, prix_gros: 15000, quantite_min_gros: 5, stock: 8, macro_categorie: 'Bijoux', sous_categorie_id: 'c2', image_url: SEED_IMAGES[1], en_promo: false, prix_promo: null },
  { id: 'p3', nom: 'Boucles Lumière', description: "Boucles d'oreilles pendantes, finition brillante.", prix_detail: 15000, prix_gros: 12000, quantite_min_gros: 6, stock: 0, macro_categorie: 'Femme', sous_categorie_id: 'c4', image_url: SEED_IMAGES[2], en_promo: false, prix_promo: null },
  { id: 'p4', nom: 'Bague Halo', description: 'Bague solitaire, anneau fin doré.', prix_detail: 22000, prix_gros: null, quantite_min_gros: 5, stock: 5, macro_categorie: 'Bijoux', sous_categorie_id: 'c3', image_url: SEED_IMAGES[0], en_promo: false, prix_promo: null },
  { id: 'p5', nom: 'Parure Impériale', description: 'Ensemble collier + boucles assorties.', prix_detail: 45000, prix_gros: 38000, quantite_min_gros: 3, stock: 3, macro_categorie: 'Promos', sous_categorie_id: 'c5', image_url: SEED_IMAGES[1], en_promo: true, prix_promo: 34900 },
  { id: 'p6', nom: 'Chaîne Homme Signature', description: 'Chaîne large, finition mate et brillante.', prix_detail: 30000, prix_gros: 25000, quantite_min_gros: 5, stock: 10, macro_categorie: 'Homme', sous_categorie_id: 'c1', image_url: SEED_IMAGES[2], en_promo: false, prix_promo: null },
]

const SEED_DIAPO: DiapoImage[] = [
  { id: 'd1', image_url: SEED_IMAGES[0], ordre: 0, produit_id: 'p1' },
  { id: 'd2', image_url: SEED_IMAGES[1], ordre: 1, produit_id: 'p5' },
  { id: 'd3', image_url: SEED_IMAGES[2], ordre: 2, produit_id: 'p6' },
]

export const demoStore = {
  categories: {
    all(): Category[] {
      return read('categories', SEED_CATEGORIES)
    },
    add(nom: string): Category {
      const list = demoStore.categories.all()
      const cat: Category = { id: uid(), nom }
      write('categories', [...list, cat])
      return cat
    },
    update(id: string, nom: string) {
      write('categories', demoStore.categories.all().map((c) => (c.id === id ? { ...c, nom } : c)))
    },
    remove(id: string) {
      write('categories', demoStore.categories.all().filter((c) => c.id !== id))
    },
  },
  products: {
    all(): Product[] {
      return read('products', SEED_PRODUCTS)
    },
    get(id: string): Product | undefined {
      return demoStore.products.all().find((p) => p.id === id)
    },
    add(p: Omit<Product, 'id'>): Product {
      const list = demoStore.products.all()
      const product: Product = { ...p, id: uid() }
      write('products', [...list, product])
      return product
    },
    update(id: string, patch: Partial<Product>) {
      write('products', demoStore.products.all().map((p) => (p.id === id ? { ...p, ...patch } : p)))
    },
    remove(id: string) {
      write('products', demoStore.products.all().filter((p) => p.id !== id))
    },
    decrementStock(id: string, qty: number) {
      write('products', demoStore.products.all().map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock - qty) } : p)))
    },
  },
  diapo: {
    all(): DiapoImage[] {
      return read('diapo', SEED_DIAPO).sort((a, b) => a.ordre - b.ordre)
    },
    add(image_url: string, produit_id: string | null) {
      const list = demoStore.diapo.all()
      write('diapo', [...list, { id: uid(), image_url, ordre: list.length, produit_id }])
    },
    remove(id: string) {
      write('diapo', demoStore.diapo.all().filter((d) => d.id !== id))
    },
    reorder(ids: string[]) {
      const list = demoStore.diapo.all()
      const byId = new Map(list.map((d) => [d.id, d]))
      write('diapo', ids.map((id, i) => ({ ...(byId.get(id) as DiapoImage), ordre: i })))
    },
  },
  reviews: {
    forProduct(produit_id: string): Review[] {
      return read('reviews', [] as Review[]).filter((r) => r.produit_id === produit_id)
    },
    add(r: Omit<Review, 'id' | 'created_at'>) {
      const list = read('reviews', [] as Review[])
      write('reviews', [...list, { ...r, id: uid(), created_at: new Date().toISOString() }])
    },
  },
  orders: {
    all(): Order[] {
      return read('orders', [] as Order[]).sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
    byNumero(numero: string): Order | undefined {
      return demoStore.orders.all().find((o) => o.numero.toLowerCase() === numero.toLowerCase())
    },
    add(order: Order) {
      write('orders', [order, ...demoStore.orders.all()])
    },
    update(id: string, patch: Partial<Order>) {
      write('orders', demoStore.orders.all().map((o) => (o.id === id ? { ...o, ...patch } : o)))
    },
  },
  returns: {
    all(): ReturnRequest[] {
      return read('returns', [] as ReturnRequest[]).sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
    add(r: ReturnRequest) {
      write('returns', [r, ...demoStore.returns.all()])
    },
    update(id: string, patch: Partial<ReturnRequest>) {
      write('returns', demoStore.returns.all().map((r) => (r.id === id ? { ...r, ...patch } : r)))
    },
  },
}

export { uid as demoUid }
