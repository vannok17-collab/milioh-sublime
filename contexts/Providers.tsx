'use client'

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, supabaseConfigured, checkConnection, onDemoModeChange, isDemoMode, demoModeReason } from '@/lib/supabase'
import { isGestionnaire } from '@/lib/data'
import type { CartLine, Product } from '@/lib/types'

// ---------------- Theme (single shared setting, shop + admin) ----------------
type Theme = 'dark' | 'light'
interface ThemeCtx { theme: Theme; toggleTheme: () => void }
const ThemeContext = createContext<ThemeCtx | null>(null)

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = window.localStorage.getItem('ms_theme') as Theme | null
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
    window.localStorage.setItem('ms_theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within Providers')
  return ctx
}

// ---------------- Demo mode ----------------
interface DemoCtx { demo: boolean; reason: string; recheck: () => void }
const DemoContext = createContext<DemoCtx | null>(null)

function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [demo, setDemo] = useState(isDemoMode())
  const [reason, setReason] = useState(demoModeReason())

  useEffect(() => {
    checkConnection()
    const unsub = onDemoModeChange((d, r) => {
      setDemo(d)
      setReason(r)
    })
    return () => { unsub() }
  }, [])

  const recheck = useCallback(() => {
    checkConnection()
  }, [])

  return <DemoContext.Provider value={{ demo, reason, recheck }}>{children}</DemoContext.Provider>
}
export function useDemoMode() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemoMode must be used within Providers')
  return ctx
}

// ---------------- Cart + Favorites (localStorage, no account needed) ----------------
interface CartCtx {
  lines: CartLine[]
  addToCart: (produit_id: string, quantite: number) => void
  updateQuantity: (produit_id: string, quantite: number) => void
  removeFromCart: (produit_id: string) => void
  clearCart: () => void
  favorites: string[]
  toggleFavorite: (produit_id: string) => void
  isFavorite: (produit_id: string) => boolean
}
const CartContext = createContext<CartCtx | null>(null)

function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    try {
      const c = window.localStorage.getItem('ms_cart')
      const f = window.localStorage.getItem('ms_favorites')
      if (c) setLines(JSON.parse(c))
      if (f) setFavorites(JSON.parse(f))
    } catch {}
  }, [])

  useEffect(() => { window.localStorage.setItem('ms_cart', JSON.stringify(lines)) }, [lines])
  useEffect(() => { window.localStorage.setItem('ms_favorites', JSON.stringify(favorites)) }, [favorites])

  const addToCart = useCallback((produit_id: string, quantite: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.produit_id === produit_id)
      if (existing) return prev.map((l) => (l.produit_id === produit_id ? { ...l, quantite: l.quantite + quantite } : l))
      return [...prev, { produit_id, quantite }]
    })
  }, [])

  const updateQuantity = useCallback((produit_id: string, quantite: number) => {
    setLines((prev) => (quantite <= 0 ? prev.filter((l) => l.produit_id !== produit_id) : prev.map((l) => (l.produit_id === produit_id ? { ...l, quantite } : l))))
  }, [])

  const removeFromCart = useCallback((produit_id: string) => {
    setLines((prev) => prev.filter((l) => l.produit_id !== produit_id))
  }, [])

  const clearCart = useCallback(() => setLines([]), [])

  const toggleFavorite = useCallback((produit_id: string) => {
    setFavorites((prev) => (prev.includes(produit_id) ? prev.filter((id) => id !== produit_id) : [...prev, produit_id]))
  }, [])

  const isFavorite = useCallback((produit_id: string) => favorites.includes(produit_id), [favorites])

  return (
    <CartContext.Provider value={{ lines, addToCart, updateQuantity, removeFromCart, clearCart, favorites, toggleFavorite, isFavorite }}>
      {children}
    </CartContext.Provider>
  )
}
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within Providers')
  return ctx
}

// ---------------- Auth (single Supabase Auth for clients + gestionnaire) ----------------
interface AuthCtx {
  user: User | null
  loading: boolean
  isAdmin: boolean
  adminChecked: boolean
  signOut: () => Promise<void>
}
const AuthContext = createContext<AuthCtx | null>(null)

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setLoading(false)
      setAdminChecked(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelled = false
    setAdminChecked(false)
    if (!user) {
      setIsAdmin(false)
      setAdminChecked(true)
      return
    }
    isGestionnaire(user.id).then((ok) => {
      if (!cancelled) {
        setIsAdmin(ok)
        setAdminChecked(true)
      }
    })
    return () => { cancelled = true }
  }, [user])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
  }, [])

  return <AuthContext.Provider value={{ user, loading, isAdmin, adminChecked, signOut }}>{children}</AuthContext.Provider>
}
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within Providers')
  return ctx
}

// ---------------- Composition root ----------------
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DemoModeProvider>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </DemoModeProvider>
    </ThemeProvider>
  )
}
