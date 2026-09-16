export type MacroCategory = 'Bijoux' | 'Femme' | 'Homme' | 'Bébé' | 'Maison' | 'Promos'

export const MACRO_CATEGORIES: MacroCategory[] = ['Bijoux', 'Femme', 'Homme', 'Bébé', 'Maison', 'Promos']

export interface Category {
  id: string
  nom: string
  created_at?: string
}

export interface Product {
  id: string
  nom: string
  description: string
  prix_detail: number
  prix_gros: number | null
  quantite_min_gros: number
  stock: number
  macro_categorie: MacroCategory
  sous_categorie_id: string | null
  image_url: string | null
  en_promo: boolean
  prix_promo: number | null
  created_at?: string
}

export interface DiapoImage {
  id: string
  image_url: string
  ordre: number
  produit_id: string | null
}

export interface Review {
  id: string
  produit_id: string
  auteur: string
  note: number
  commentaire: string
  created_at?: string
}

export type OrderStatus =
  | 'en_attente_paiement'
  | 'nouvelle'
  | 'confirmee'
  | 'expediee'
  | 'livree'
  | 'annulee'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente_paiement: 'En attente de paiement',
  nouvelle: 'Nouvelle',
  confirmee: 'Confirmée',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
}

export type DeliveryMode = 'boutique' | 'livreur_client'
export type DeliveryZoneType = 'abidjan' | 'interieur' | 'international'
export type PaymentMethod = 'especes' | 'mobile_money'
export type MobileOperator = 'Orange' | 'MTN' | 'Wave' | 'Moov'

export interface OrderItem {
  produit_id: string
  nom: string
  prix_unitaire: number
  quantite: number
  mode_gros: boolean
}

export interface OrderDelivery {
  mode: DeliveryMode
  type: DeliveryZoneType
  commune?: string
  frais: number
  adresse?: string
  latitude?: number
  longitude?: number
  ville?: string
  compagnie_transport?: string
  pays_destination?: string
}

export interface OrderPayment {
  methode: PaymentMethod
  operateur?: MobileOperator
  id_transaction?: string
  valide: boolean
}

export interface Order {
  id: string
  numero: string
  client_nom: string
  client_telephone: string
  client_email: string | null
  client_user_id: string | null
  articles: OrderItem[]
  total_articles: number
  frais_livraison: number
  total: number
  livraison: OrderDelivery
  paiement: OrderPayment
  statut: OrderStatus
  motif_annulation: string | null
  tracking_numero: string | null
  instructions_retrait: string | null
  created_at: string
}

export type ReturnReason =
  | 'article_defectueux'
  | 'taille_incorrecte'
  | 'article_non_conforme'
  | 'colis_endommage'
  | 'erreur_commande'
  | 'autre'

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  article_defectueux: 'Article défectueux',
  taille_incorrecte: 'Taille incorrecte',
  article_non_conforme: 'Article non conforme',
  colis_endommage: 'Colis endommagé',
  erreur_commande: 'Erreur de commande',
  autre: 'Autre',
}

export type ReturnStatus = 'en_cours' | 'acceptee' | 'refusee' | 'remboursee'

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  en_cours: 'En cours',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  remboursee: 'Remboursée',
}

export interface ReturnRequest {
  id: string
  commande_numero: string
  client_user_id: string | null
  motif: ReturnReason
  description: string
  statut: ReturnStatus
  created_at: string
}

export interface CartLine {
  produit_id: string
  quantite: number
}

export interface Notification {
  id: string
  titre: string
  message: string
  lue: boolean
  created_at: string
}
