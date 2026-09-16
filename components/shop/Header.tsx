'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingBag, CircleUserRound, Truck, Heart, RotateCcw, MessageCircle, UserPlus, Sparkles } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useCart, useAuth } from '@/contexts/Providers'

export function Header() {
  const [open, setOpen] = useState(false)
  const { lines } = useCart()
  const { user } = useAuth()
  const count = lines.reduce((n, l) => n + l.quantite, 0)

  return (
    <>
      <header className="shop-header">
        <button className="icon-btn" aria-label="Menu" onClick={() => setOpen(true)}>
          <Menu />
        </button>
        <Link href="/" className="link-plain">
          <Logo compact />
        </Link>
        <div className="header-actions">
          <Link href={user ? '/profil' : '/connexion'} className="icon-btn" aria-label="Profil">
            <CircleUserRound />
          </Link>
          <Link href="/panier" className="icon-btn cart-icon" aria-label="Panier">
            <ShoppingBag />
            {count > 0 && <span>{count}</span>}
          </Link>
        </div>
      </header>

      {open && (
        <div className="menu-overlay" onClick={() => setOpen(false)}>
          <aside className="side-menu" onClick={(e) => e.stopPropagation()}>
            <div className="menu-head">
              <Logo compact />
              <button className="icon-btn" onClick={() => setOpen(false)}><X /></button>
            </div>
            <nav className="menu-links">
              <Link href="/suivi" onClick={() => setOpen(false)}><Truck /> Suivi de commande</Link>
              <Link href="/favoris" onClick={() => setOpen(false)}><Heart /> Favoris</Link>
              <Link href="/retours" onClick={() => setOpen(false)}><RotateCcw /> Retours &amp; Réclamations</Link>
              <Link href="/contact" onClick={() => setOpen(false)}><MessageCircle /> Contact</Link>
              {!user && <Link href="/inscription" onClick={() => setOpen(false)}><UserPlus /> Créer un compte</Link>}
            </nav>
            <div className="menu-note">
              <Sparkles />
              <span>Miliöh Sublime — bijoux d&apos;exception à Abidjan.</span>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
