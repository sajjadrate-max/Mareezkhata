// مریضوں کا کھاتہ — آف لائن کے لیے سروس ورکر
const CACHE = 'mareez-khata-v22';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-512-maskable.png', './apple-touch-icon.png', './favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // صفحہ: پہلے انٹرنیٹ سے تازہ، نہ ملے تو محفوظ کاپی
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copy));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  // اپنی فائلیں اور گوگل فونٹ: محفوظ کاپی فوراً، پیچھے سے تازہ
  if (url.origin === location.origin || url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
