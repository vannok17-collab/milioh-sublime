'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // L'absence de service worker ne doit jamais bloquer l'application.
      })
    }
  }, [])
  return null
}
