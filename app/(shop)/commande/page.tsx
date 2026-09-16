'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CreditCard, MapPin, Truck, WalletCards } from 'lucide-react'
import { useCart, useAuth } from '@/contexts/Providers'
import { listProducts, createOrder, decrementStock } from '@/lib/data'
import type { DeliveryZoneType, MobileOperator, Order, OrderDelivery, OrderItem, PaymentMethod, Product } from '@/lib/types'
import { COMMUNES_ABIDJAN, COUNTRY_CODES, PAYS_INTERNATIONAL, TRANSPORTEURS_INTERIEUR, TRANSPORTEURS_INTERNATIONAL, validatePhoneDigits } from '@/lib/delivery'
import { MOBILE_MONEY_NUMBERS, whatsappLink } from '@/lib/config'
import { whatsappOrderMessage } from '@/lib/order'

const STEPS = ['Coordonnées', 'Livraison', 'Paiement', 'Confirmation']

export default function CheckoutPage() {
  const router = useRouter()
  const { lines, clearCart } = useCart()
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [step, setStep] = useState(0)

  // Step 1 — coordonnées
  const [nom, setNom] = useState('')
  const [countryIdx, setCountryIdx] = useState(0)
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [phoneError, setPhoneError] = useState('')

  // Step 2 — livraison
  const [mode, setMode] = useState<'boutique' | 'livreur_client'>('boutique')
  const [zoneType, setZoneType] = useState<DeliveryZoneType>('abidjan')
  const [commune, setCommune] = useState(COMMUNES_ABIDJAN[0].nom)
  const [adresse, setAdresse] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState('')
  const [ville, setVille] = useState('')
  const [compagnie, setCompagnie] = useState(TRANSPORTEURS_INTERIEUR[0])
  const [paysDestination, setPaysDestination] = useState(PAYS_INTERNATIONAL[0])
  const [transporteurIntl, setTransporteurIntl] = useState(TRANSPORTEURS_INTERNATIONAL[0])

  // Step 3 — paiement
  const [methode, setMethode] = useState<PaymentMethod>('especes')
  const [operateur, setOperateur] = useState<MobileOperator>('Orange')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [placing, setPlacing] = useState(false)

  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)

  useEffect(() => { listProducts().then(setProducts) }, [])

  const items: OrderItem[] = useMemo(() => {
    return lines
      .map((l) => {
        const p = products.find((pr) => pr.id === l.produit_id)
        if (!p) return null
        const wholesale = p.prix_gros != null && l.quantite >= p.quantite_min_gros
        const prix = wholesale ? (p.prix_gros as number) : (p.en_promo && p.prix_promo != null ? p.prix_promo : p.prix_detail)
        return { produit_id: p.id, nom: p.nom, prix_unitaire: prix, quantite: l.quantite, mode_gros: wholesale }
      })
      .filter(Boolean) as OrderItem[]
  }, [lines, products])

  const totalArticles = items.reduce((s, i) => s + i.prix_unitaire * i.quantite, 0)

  const frais = useMemo(() => {
    if (mode === 'livreur_client') return 0
    if (zoneType === 'abidjan') return COMMUNES_ABIDJAN.find((c) => c.nom === commune)?.frais ?? 0
    return 0 // interieur/international : frais convenus avec le transporteur, non facturés en ligne
  }, [mode, zoneType, commune])

  const total = totalArticles + frais
  const country = COUNTRY_CODES[countryIdx]

  if (items.length === 0 && !createdOrder) {
    return (
      <div className="page-content">
        <div className="empty"><h2>Ton panier est vide</h2></div>
      </div>
    )
  }

  function validateStep1() {
    if (!nom.trim() || !telephone.trim()) return false
    if (!validatePhoneDigits(telephone, country)) {
      setPhoneError(`Le numéro doit contenir ${country.digits} chiffres pour ${country.pays}.`)
      return false
    }
    setPhoneError('')
    return true
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setGeoStatus('Géolocalisation non disponible sur cet appareil.'); return }
    setGeoStatus('Localisation en cours...')
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus('Position enregistrée ✓') },
      () => setGeoStatus("Permission refusée ou position indisponible."),
    )
  }

  function buildLivraison(): OrderDelivery {
    if (mode === 'livreur_client') return { mode, type: zoneType, frais: 0 }
    if (zoneType === 'abidjan') return { mode, type: zoneType, commune, frais, adresse, latitude: coords?.lat, longitude: coords?.lng }
    if (zoneType === 'interieur') return { mode, type: zoneType, frais: 0, ville, compagnie_transport: compagnie }
    return { mode, type: zoneType, frais: 0, pays_destination: paysDestination, compagnie_transport: transporteurIntl }
  }

  async function placeOrder(paiementValide: boolean, idTransaction?: string) {
    setPlacing(true)
    const livraison = buildLivraison()
    const order = await createOrder({
      client_nom: nom,
      client_telephone: `${country.indicatif} ${telephone}`,
      client_email: email || null,
      client_user_id: user?.id ?? null,
      articles: items,
      total_articles: totalArticles,
      frais_livraison: frais,
      total,
      livraison,
      paiement: { methode, operateur: methode === 'mobile_money' ? operateur : undefined, id_transaction: idTransaction, valide: paiementValide },
      statut: methode === 'mobile_money' ? 'en_attente_paiement' : 'nouvelle',
      motif_annulation: null,
      tracking_numero: null,
      instructions_retrait: null,
    })
    await Promise.all(items.map((i) => decrementStock(i.produit_id, i.quantite)))
    clearCart()
    setCreatedOrder(order)
    setStep(3)
    setPlacing(false)
    window.open(whatsappLink(whatsappOrderMessage(order.numero, order.total, order.articles)), '_blank')
  }

  async function handlePayerClick() {
    if (methode === 'especes') {
      await placeOrder(false)
    } else {
      setShowPaymentModal(true)
    }
  }

  async function confirmMobileMoneyPayment() {
    if (!transactionId.trim()) return
    setShowPaymentModal(false)
    await placeOrder(false, transactionId.trim())
  }

  return (
    <div className="page-content">
      <div className="checkout-steps">
        {STEPS.map((label, i) => (
          <Fragment key={label}>
            {i > 0 && <i />}
            <span className={i <= step ? 'active' : ''}>
              {i < step ? <Check size={14} /> : i + 1}
              <small>{label}</small>
            </span>
          </Fragment>
        ))}
      </div>

      <div className="checkout-card">
        {step === 0 && (
          <>
            <h1>Coordonnées</h1>
            <label>Nom complet
              <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ton nom" />
            </label>
            <label>Pays
              <select value={countryIdx} onChange={(e) => setCountryIdx(Number(e.target.value))}>
                {COUNTRY_CODES.map((c, i) => <option key={c.pays} value={i}>{c.pays} ({c.indicatif})</option>)}
              </select>
            </label>
            <label>Téléphone
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder={`Numéro (${country.digits} chiffres)`} />
            </label>
            {phoneError && <p className="field-error">{phoneError}</p>}
            <label>Email (optionnel)
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" />
            </label>
            <button className="btn btn-primary full" style={{ marginTop: '1.5rem' }} onClick={() => validateStep1() && setStep(1)}>
              Continuer
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h1>Livraison</h1>
            <label>Qui livre ?</label>
            <div className="choice-grid">
              <button className={mode === 'boutique' ? 'chosen' : ''} onClick={() => setMode('boutique')}><Truck /> Miliöh Sublime livre <Check /></button>
              <button className={mode === 'livreur_client' ? 'chosen' : ''} onClick={() => setMode('livreur_client')}><Truck /> Mon livreur récupère <Check /></button>
            </div>

            {mode === 'boutique' && (
              <>
                <label>Zone</label>
                <div className="choice-grid three">
                  <button className={zoneType === 'abidjan' ? 'chosen' : ''} onClick={() => setZoneType('abidjan')}>Abidjan <Check /></button>
                  <button className={zoneType === 'interieur' ? 'chosen' : ''} onClick={() => setZoneType('interieur')}>Intérieur <Check /></button>
                  <button className={zoneType === 'international' ? 'chosen' : ''} onClick={() => setZoneType('international')}>International <Check /></button>
                </div>

                {zoneType === 'abidjan' && (
                  <>
                    <label>Commune
                      <select value={commune} onChange={(e) => setCommune(e.target.value)}>
                        {COMMUNES_ABIDJAN.map((c) => <option key={c.nom} value={c.nom}>{c.nom} — {c.frais.toLocaleString('fr-FR')} FCFA</option>)}
                      </select>
                    </label>
                    <label>Adresse
                      <input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Quartier, rue, repère..." />
                    </label>
                    <button className="location-link" onClick={useMyLocation}><MapPin /> Utiliser ma position actuelle</button>
                    {geoStatus && <p className="muted" style={{ marginTop: '-0.8rem', fontSize: 11 }}>{geoStatus}</p>}
                  </>
                )}

                {zoneType === 'interieur' && (
                  <>
                    <label>Ville
                      <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ex. Bouaké, Yamoussoukro..." />
                    </label>
                    <label>Compagnie de transport
                      <select value={compagnie} onChange={(e) => setCompagnie(e.target.value)}>
                        {TRANSPORTEURS_INTERIEUR.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                  </>
                )}

                {zoneType === 'international' && (
                  <>
                    <label>Pays de destination
                      <select value={paysDestination} onChange={(e) => setPaysDestination(e.target.value)}>
                        {PAYS_INTERNATIONAL.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </label>
                    <label>Transporteur
                      <select value={transporteurIntl} onChange={(e) => setTransporteurIntl(e.target.value)}>
                        {TRANSPORTEURS_INTERNATIONAL.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                  </>
                )}
              </>
            )}
            {mode === 'livreur_client' && <p className="muted">Ton livreur récupérera la commande à la boutique (Bingerville). Frais de livraison : 0 FCFA.</p>}

            <div style={{ display: 'flex', gap: '.6rem', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>Retour</button>
              <button className="btn btn-primary full" onClick={() => setStep(2)}>Continuer</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Paiement</h1>
            <div className="payment-options">
              <button className={methode === 'especes' ? 'chosen' : ''} onClick={() => setMethode('especes')}><WalletCards /> Espèces à la livraison <Check /></button>
              <button className={methode === 'mobile_money' ? 'chosen' : ''} onClick={() => setMethode('mobile_money')}><CreditCard /> Mobile Money <Check /></button>
            </div>

            {methode === 'mobile_money' && (
              <div className="mobile-money">
                <p>Choisis ton opérateur :</p>
                <div className="operator-row">
                  {(['Orange', 'MTN', 'Wave', 'Moov'] as const).map((op) => (
                    <button key={op} className={operateur === op ? 'chosen' : ''} onClick={() => setOperateur(op)}>{op}</button>
                  ))}
                </div>
                <p className="muted">Les instructions de transfert s&apos;afficheront après avoir cliqué sur « Payer ».</p>
              </div>
            )}

            <div className="summary" style={{ marginTop: '1.2rem' }}>
              <div><span>Articles</span><span>{totalArticles.toLocaleString('fr-FR')} FCFA</span></div>
              <div><span>Livraison</span><span>{frais.toLocaleString('fr-FR')} FCFA</span></div>
              <div className="summary-total"><span>Total</span><strong>{total.toLocaleString('fr-FR')} FCFA</strong></div>
            </div>

            <div style={{ display: 'flex', gap: '.6rem', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>Retour</button>
              <button className="btn btn-primary full" disabled={placing} onClick={handlePayerClick}>
                {placing ? 'Envoi...' : 'Payer'}
              </button>
            </div>
          </>
        )}

        {step === 3 && createdOrder && (
          <div className="confirmation">
            <div className="success-icon"><Check /></div>
            <h1>Commande enregistrée</h1>
            <p className="muted">Numéro de commande</p>
            <h2 className="gold">{createdOrder.numero}</h2>
            <p className="muted" style={{ marginTop: '1rem' }}>
              Ta commande a été transmise à la boutique sur WhatsApp. Tu peux suivre son statut à tout moment avec ce numéro.
            </p>
            <div style={{ display: 'flex', gap: '.6rem', marginTop: '1.5rem', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => router.push('/suivi')}>Suivre ma commande</button>
              <button className="btn btn-primary" onClick={() => router.push('/')}>Retour à l&apos;accueil</button>
            </div>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Paiement {operateur} Money</h2>
            <p className="muted">
              Envoie {total.toLocaleString('fr-FR')} FCFA au numéro <strong className="gold">{MOBILE_MONEY_NUMBERS[operateur]}</strong> ({operateur} Money),
              puis saisis ci-dessous l&apos;identifiant de transaction reçu par SMS.
            </p>
            <label>Identifiant de transaction
              <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Ex. MP240905.1234.A56789" />
            </label>
            <button className="btn btn-primary full" style={{ marginTop: '1rem' }} disabled={!transactionId.trim() || placing} onClick={confirmMobileMoneyPayment}>
              Valider le paiement
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
