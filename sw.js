// ── Service Worker — Camping Paradis ────────────────────────────────
const CACHE_NAME = 'camping-paradis-v2';
const ASSETS = [
  '/Camping-paradis/',
  '/Camping-paradis/index.html',
  '/Camping-paradis/manifest.json',
  '/Camping-paradis/i18n.js',
  '/Camping-paradis/images/camping-hero (3).jpg',
  '/Camping-paradis/images/piki.png',

  // Vie au camping
  '/Camping-paradis/horaires.html',
  '/Camping-paradis/plan.html',
  '/Camping-paradis/images/plan-camping.jpg',
  '/Camping-paradis/checkin.html',
  '/Camping-paradis/pot-accueil.html',

  // Services
  '/Camping-paradis/kayak.html',
  '/Camping-paradis/laverie.html',
  '/Camping-paradis/locations.html',
  '/Camping-paradis/wifi.html',

  // Restauration & Bar
  '/Camping-paradis/snack.html',
  '/Camping-paradis/bar.html',
  '/Camping-paradis/epicerie.html',
  '/Camping-paradis/petit-dejeuner.html',

  // Autour du camping
  '/Camping-paradis/activites.html',
  '/Camping-paradis/activites-plein-air.html',
  '/Camping-paradis/nautiques.html',
  '/Camping-paradis/canyoning.html',
  '/Camping-paradis/restaurant.html',
  '/Camping-paradis/gorges-ain.html',
  '/Camping-paradis/commerces.html',
  '/Camping-paradis/visite-nantua.html',
  '/Camping-paradis/sous-la-pluie.html',

  // Activités plein air
  '/Camping-paradis/balade-equestre.html',
  '/Camping-paradis/escalade.html',
  '/Camping-paradis/fermes-a-visiter.html',
  '/Camping-paradis/golf.html',
  '/Camping-paradis/parapente.html',
  '/Camping-paradis/parcs.html',
  '/Camping-paradis/peche.html',
  '/Camping-paradis/tir-arc-paintball.html',
  '/Camping-paradis/toboggans-mini-golf.html',

  // Animations
  '/Camping-paradis/programme.html',
  '/Camping-paradis/club-enfants.html',

  // Circulation
  '/Camping-paradis/barriere.html',
  '/Camping-paradis/vehicule-electrique.html',

  // Météo
  '/Camping-paradis/meteo.html'
];

// Installation : mise en cache des ressources
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('Cache ouvert');
      // addAll échoue en bloc si UN fichier manque → on cache fichier par fichier
      return Promise.all(
        ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('Pré-cache impossible pour :', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch : réseau en priorité, cache en fallback
self.addEventListener('fetch', function(e) {
  // Ne pas intercepter les requêtes API météo
  if (e.request.url.includes('open-meteo.com')) return;

  // Pages HTML : toujours revalider auprès du serveur (évite les versions périmées
  // après une mise à jour du site) ; le cache ne sert qu'en mode hors-ligne.
  var isPage = e.request.mode === 'navigate' ||
               (e.request.destination === 'document') ||
               e.request.url.endsWith('.html');

  var fetchRequest = isPage
    ? fetch(e.request, { cache: 'no-cache' })
    : fetch(e.request);

  e.respondWith(
    fetchRequest
      .then(function(resp) {
        // Mettre à jour le cache avec la réponse réseau
        var respClone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, respClone);
        });
        return resp;
      })
      .catch(function() {
        // Réseau indisponible → utiliser le cache
        return caches.match(e.request);
      })
  );
});
