import type { Metadata } from 'next'
import AdminShell from '@/components/admin/AdminShell'

// Manifeste dédié : si la gestionnaire fait "Ajouter à l'écran d'accueil"
// depuis une page /gestion-milioh/*, le raccourci créé démarre directement
// sur la connexion admin — pas sur l'accueil client (qui utilise le
// manifest.webmanifest racine, avec son propre start_url).
export const metadata: Metadata = {
  manifest: '/manifest-admin.webmanifest',
}

export default function GestionLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
