export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(10000 + Math.random() * 90000) // 5 digits
  return `MS-${year}-${random}`
}

export function whatsappOrderMessage(numero: string, total: number, articles: { nom: string; quantite: number }[]): string {
  const lignes = articles.map((a) => `• ${a.quantite}x ${a.nom}`).join('\n')
  return `Nouvelle commande ${numero}\n${lignes}\nTotal: ${total.toLocaleString('fr-FR')} FCFA`
}

export function whatsappInfoMessage(nomProduit: string): string {
  return `Bonjour, je souhaite me renseigner sur : ${nomProduit}`
}
