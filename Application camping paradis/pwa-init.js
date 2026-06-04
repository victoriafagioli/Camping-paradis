// Script pour activer la PWA
// À ajouter dans le <head> de chaque page HTML

(function() {
  // Vérifier que les Service Workers sont supportés
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        console.log('Service Worker enregistré avec succès:', registration);
        
        // Vérifier les mises à jour
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nouvelle version disponible - redémarrer pour mettre à jour');
            }
          });
        });
      }).catch(function(error) {
        console.log('Erreur Service Worker:', error);
      });
    });
  }

  // Demander la permission pour les notifications
  function demanderPermissionNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
          console.log('Notifications activées !');
          // Optionnel: Envoyer une première notification
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'NOTIFICATION_PERMISSION_GRANTED'
            });
          }
        }
      });
    }
  }

  // Appeler au chargement avec un délai
  window.addEventListener('load', function() {
    setTimeout(demanderPermissionNotifications, 3000);
  });

  // Permettre l'installation manuelle
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    window.deferredPrompt = e;
    
    // Afficher un bouton d'installation personnalisé (optionnel)
    const installButton = document.getElementById('install-app-btn');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', function() {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then(function(choiceResult) {
          if (choiceResult.outcome === 'accepted') {
            console.log('App installée !');
          }
          window.deferredPrompt = null;
        });
      });
    }
  });

  window.addEventListener('appinstalled', function() {
    console.log('L\'app a été installée sur l\'écran d\'accueil');
    window.deferredPrompt = null;
  });

  // Vérifier la connectivité
  window.addEventListener('online', function() {
    console.log('Connexion internet restaurée');
    if (document.body) {
      document.body.style.opacity = '1';
    }
  });

  window.addEventListener('offline', function() {
    console.log('Mode hors ligne');
    if (document.body) {
      document.body.style.opacity = '0.8';
    }
  });
})();
