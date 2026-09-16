import { Header } from '@/components/shop/Header'
import { BottomNav } from '@/components/shop/BottomNav'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Header />
      {children}
      <BottomNav />
    </div>
  )
}
