export interface Commune {
  nom: string
  frais: number
}

// Tarifs par commune d'Abidjan — de 0 (retrait en main propre) à ~5000 FCFA
// pour les communes les plus éloignées du centre de distribution.
export const COMMUNES_ABIDJAN: Commune[] = [
  { nom: 'Retrait en boutique (Bingerville)', frais: 0 },
  { nom: 'Bingerville', frais: 1000 },
  { nom: 'Cocody', frais: 1500 },
  { nom: 'Plateau', frais: 1500 },
  { nom: 'Marcory', frais: 2000 },
  { nom: 'Treichville', frais: 2000 },
  { nom: 'Koumassi', frais: 2500 },
  { nom: 'Adjamé', frais: 2500 },
  { nom: 'Yopougon', frais: 3500 },
  { nom: 'Abobo', frais: 3500 },
  { nom: 'Port-Bouët', frais: 3000 },
  { nom: 'Attécoubé', frais: 3000 },
  { nom: "Songon", frais: 5000 },
  { nom: 'Anyama', frais: 5000 },
]

export const TRANSPORTEURS_INTERIEUR = ['UTB', 'UTRACI', 'STIF', 'Adjamé Express', 'Autre']
export const TRANSPORTEURS_INTERNATIONAL = ['DHL', 'UPS', 'EMS Côte d\'Ivoire', 'Colis privé (fret aérien)', 'Autre']

export interface CountryCode {
  pays: string
  indicatif: string
  digits: number
}

// Longueur du numéro local (hors indicatif) attendue par pays.
export const COUNTRY_CODES: CountryCode[] = [
  { pays: "Côte d'Ivoire", indicatif: '+225', digits: 10 },
  { pays: 'France', indicatif: '+33', digits: 9 },
  { pays: 'États-Unis', indicatif: '+1', digits: 10 },
  { pays: 'Sénégal', indicatif: '+221', digits: 9 },
  { pays: 'Mali', indicatif: '+223', digits: 8 },
  { pays: 'Burkina Faso', indicatif: '+226', digits: 8 },
  { pays: 'Ghana', indicatif: '+233', digits: 9 },
  { pays: 'Cameroun', indicatif: '+237', digits: 9 },
  { pays: 'Belgique', indicatif: '+32', digits: 9 },
  { pays: 'Canada', indicatif: '+1', digits: 10 },
]

export function validatePhoneDigits(localNumber: string, country: CountryCode): boolean {
  const digitsOnly = localNumber.replace(/\D/g, '')
  return digitsOnly.length === country.digits
}

export const PAYS_INTERNATIONAL = [
  'France', 'États-Unis', 'Canada', 'Belgique', 'Sénégal', 'Mali', 'Burkina Faso', 'Ghana', 'Cameroun', 'Autre',
]
