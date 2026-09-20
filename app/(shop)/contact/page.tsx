'use client'

import { MessageCircle, Phone } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { whatsappLink, WHATSAPP_NUMBER } from '@/lib/config'

export default function ContactPage() {
  return (
    <div className="page-content">
      <div className="contact-hero">
        <Logo />
        <h2>Miliöh Sublime</h2>
        <p>Livraison à Abidjan et partout en Côte d&apos;Ivoire</p>
      </div>
      <div className="contact-links">
        <a href={whatsappLink('Bonjour, j\u2019ai une question pour Miliöh Sublime.')} target="_blank" rel="noreferrer">
          <MessageCircle />
          <div><strong>WhatsApp</strong><span>Réponse rapide</span></div>
        </a>
        <a href={`tel:+${WHATSAPP_NUMBER}`}>
          <Phone />
          <div><strong>Appeler</strong><span>+{WHATSAPP_NUMBER}</span></div>
        </a>
      </div>
    </div>
  )
}
