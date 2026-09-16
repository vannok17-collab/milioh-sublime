import type { MobileOperator } from './types'

// Numéro WhatsApp de la boutique (format international, sans le +).
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '2250000000000'

// Chaque opérateur Mobile Money a son propre numéro de réception — ils ne
// partagent jamais le même compte. Un opérateur non configuré retombe sur
// un texte explicite plutôt que d'afficher un faux numéro.
export const MOBILE_MONEY_NUMBERS: Record<MobileOperator, string> = {
  Orange: process.env.NEXT_PUBLIC_MOBILE_MONEY_ORANGE || 'Numéro non configuré',
  MTN: process.env.NEXT_PUBLIC_MOBILE_MONEY_MTN || 'Numéro non configuré',
  Wave: process.env.NEXT_PUBLIC_MOBILE_MONEY_WAVE || 'Numéro non configuré',
  Moov: process.env.NEXT_PUBLIC_MOBILE_MONEY_MOOV || 'Numéro non configuré',
}

export function mobileMoneyNumberFor(operateur: MobileOperator): string {
  return MOBILE_MONEY_NUMBERS[operateur]
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
