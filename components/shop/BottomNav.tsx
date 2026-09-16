'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, MessageCircle, ShoppingBag, UserRound } from 'lucide-react'
import { useCart } from '@/contexts/Providers'

const TABS = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/catalogue', label: 'Catalogue', icon: LayoutGrid },
  { href: '/contact', label: 'Contact', icon: MessageCircle },
  { href: '/panier', label: 'Panier', icon: ShoppingBag },
  { href: '/profil', label: 'Profil', icon: UserRound },
]

export function BottomNav() {
  const pathname = usePathname()
  const { lines } = useCart()
  const count = lines.reduce((n, l) => n + l.quantite, 0)

  return (
    <nav className="bottom-nav">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link key={href} href={href} className={active ? 'active' : ''}>
            <span style={{ position: 'relative' }}>
              <Icon />
              {href === '/panier' && count > 0 && <b>{count}</b>}
            </span>
            <small>{label}</small>
          </Link>
        )
      })}
    </nav>
  )
}
