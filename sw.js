// Hotel Tino ROMS - Service Worker
// This file runs in the background even when the app is closed
// It receives push notifications and shows them on the locked screen

const CACHE_NAME = 'hotel-tino-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// This fires when a push notification arrives - even when app is closed/phone locked
self.addEventListener('push', e => {
  if (!e.data) return;
  
  let data;
  try { data = e.data.json(); } 
  catch { data = { title: 'Хотел Тино', body: e.data.text() }; }

  const options = {
    body: data.body || '',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'roms-notification',
    renotify: true,
    requireInteraction: true, // Stay on screen until dismissed
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: '👀 Отвори' },
      { action: 'dismiss', title: 'Затвори' }
    ]
  };

  e.waitUntil(
    self.registration.showNotification(data.title || 'Хотел Тино РOMS', options)
  );
});

// When notification is tapped - open the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  
  if (e.action === 'dismiss') return;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open it
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
