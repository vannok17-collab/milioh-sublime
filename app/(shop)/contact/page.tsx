'use client'

import { MessageCircle, Phone, MapPin } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { whatsappLink, WHATSAPP_NUMBER } from '@/lib/config'

export default function ContactPage() {
  return (
    <div className="page-content">
      <div className="contact-hero">
        <Logo />
        <h2>Miliöh Sublime</h2>
        <p>Bingerville, Abidjan — Côte d&apos;Ivoire</p>
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
        <a href="https://maps.google.com/?q=Bingerville,Abidjan" target="_blank" rel="noreferrer">
          <MapPin />
          <div><strong>Boutique</strong><span>Bingerville, Abidjan</span></div>
        </a>
      </div>
    </div>
  )
}
