// frontend/public/sw.js - Service Worker for Background Web Push
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// รับ Push Notification จากเซิร์ฟเวอร์ (เด้งบนหน้าจอล็อก/แถบแจ้งเตือนแม้พับหน้าจอ)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'UPyes';
    const options = {
      body: payload.body || 'มีการแจ้งเตือนใหม่',
      icon: payload.icon || '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: {
        url: payload.url || '/swipe',
      },
      tag: 'upmatch-notif-' + Date.now(),
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error handling push event:', err);
  }
});

// เมื่อผู้ใช้แตะที่แถบแจ้งเตือน ให้เปิดหน้าต่างเว็บหรือสลับกลับไปที่แท็บนั้น
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/swipe';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
