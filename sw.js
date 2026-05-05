self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Хотел Тино РОМС';
  const options = {
    body: data.body || 'Ново известување',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/icon.png',
    tag: data.tag || 'hotel-tino-roms',
    vibrate: data.vibrate || [300, 100, 300],
    requireInteraction: !!data.requireInteraction,
    data: {
      url: data.url || '/',
      ...(data.data || {})
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(targetUrl);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
