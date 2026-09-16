const CACHE = 'milioh-sublime-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

// Network-first pour les pages de l'app, avec repli sur le cache pour
// permettre l'ouverture hors-ligne d'une page déjà visitée.
//
// IMPORTANT : on n'intercepte jamais une requête vers une autre origine
// (Supabase, Google Fonts, etc.) — un service worker par défaut capture
// TOUTES les requêtes émises par la page, y compris les appels API
// cross-origin, ce qui cassait silencieusement les requêtes vers Supabase.
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        const fallback = await caches.match('/')
        if (fallback) return fallback
        // Ne jamais renvoyer `undefined` : le navigateur exige une vraie
        // Response, sinon il lève "Failed to convert value to 'Response'".
        return new Response('Hors ligne', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain' } })
      })
  )
})
