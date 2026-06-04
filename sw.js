// Service Worker pour Camping Paradis PWA
// Permet: notifications push, cache hors ligne, etc.

const CACHE_NAME = 'camping-paradis-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/kayak.html',
  '/laverie.html',
  '/locations.html',
  '/wifi.html',
  '/restaurant.html',
  '/epicerie.html',
  '/petit-dejeuner.html',
  '/horaires.html',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Erreur cache:', err))
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Stratégie Network First, puis Cache
self.addEventListener('fetch', event => {
  // Pour les images, utiliser le cache en priorité
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
        .catch(() => new Response('Image non disponible'))
    );
    return;
  }

  // Pour le reste, essayer le réseau d'abord
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cloner la réponse
        const responseClone = response.clone();
        
        // Mettre en cache si ce n'est pas un POST
        if (event.request.method === 'GET') {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Si le réseau échoue, utiliser le cache
        return caches.match(event.request)
          .then(response => response || new Response('Hors ligne - Page non en cache'));
      })
  );
});

// Recevoir les messages Push
self.addEventListener('push', event => {
  if (!event.data) {
    console.log('Push reçu sans données');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nouvelle notification de Camping Paradis',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%2334BDEF" width="192" height="192"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="80" fill="white" font-family="Arial">🏕️</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle fill="%2334BDEF" cx="48" cy="48" r="48"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="50" fill="white">🏕️</text></svg>',
      tag: data.tag || 'camping-paradis',
      requireInteraction: data.requireInteraction || false,
      actions: [
        {
          action: 'open',
          title: 'Ouvrir'
        },
        {
          action: 'close',
          title: 'Fermer'
        }
      ],
      data: {
        url: data.url || '/'
      }
    };

    if (data.image) {
      options.image = data.image;
    }

    event.waitUntil(
      self.registration.showNotification('Camping Paradis', options)
    );
  } catch (e) {
    console.error('Erreur parsing push:', e);
    event.waitUntil(
      self.registration.showNotification('Camping Paradis', {
        body: event.data.text()
      })
    );
  }
});

// Cliquer sur la notification
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Vérifier si l'app est déjà ouverte
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Fermer la notification
self.addEventListener('notificationclose', event => {
  console.log('Notification fermée');
});
