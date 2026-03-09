const CACHE_NAME = 'fribane-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/app', '/css/app.css', '/js/app.js']);
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    timestamp: data.timestamp || Date.now(),
    requireInteraction: true,
    data: data.data || {},
    actions: [
      { action: 'view', title: 'Se trafik' },
      { action: 'dismiss', title: 'Luk' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('https://trafikkort.vejdirektoratet.dk')
    );
  }
});
