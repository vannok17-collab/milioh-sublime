import type { MobileOperator } from './types'

// Numéros en dur plutôt qu'en variables d'environnement : les variables
// d'environnement Vercel posaient problème (non prises en compte après
// déploiement), donc ces valeurs réelles sont directement dans le code.
// Pour les changer : modifier ici, puis git push (redéploiement automatique).

// Numéro WhatsApp de la boutique (format international, sans le +).
export const WHATSAPP_NUMBER = '225101477411'

// Chaque opérateur Mobile Money a son propre numéro de réception.
export const MOBILE_MONEY_NUMBERS: Record<MobileOperator, string> = {
  Orange: '0707 905 222',
  MTN: '0545 577 511',
  Wave: '0101 477 411 ou 0707 905 222 ou 0545 577 511',
  Moov: '0101 477 411',
}

export function mobileMoneyNumberFor(operateur: MobileOperator): string {
  return MOBILE_MONEY_NUMBERS[operateur]
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
