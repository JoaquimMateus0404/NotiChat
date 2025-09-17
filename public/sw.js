// Service Worker para notificações push
const CACHE_NAME = 'notichat-v1'

self.addEventListener('install', (event) => {
  console.log('Service Worker instalado')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      badge: '/badge-icon.png',
      tag: data.tag,
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: data.data || {}
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Abrir ou focar na janela do app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Se já há uma janela aberta, focar nela
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Caso contrário, abrir nova janela
      if (self.clients.openWindow) {
        const targetUrl = event.notification.data?.url || '/'
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
