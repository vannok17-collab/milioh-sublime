import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/contexts/Providers'
import { DemoBanner } from '@/components/DemoBanner'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'Miliöh Sublime — Bijoux d\u2019exception à Abidjan',
  description: 'Découvrez les bijoux Miliöh Sublime, livrés à Abidjan et partout en Côte d\u2019Ivoire.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
}
export const viewport: Viewport = { colorScheme: 'dark light', themeColor: '#0A0A0A', userScalable: false }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="dark">
      <head>
        {/* Polices chargées via <link> plutôt que next/font : fonctionne même
            si l'environnement de build n'a pas accès à fonts.googleapis.com. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>
          <DemoBanner />
          {children}
        </Providers>
        <ServiceWorkerRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
