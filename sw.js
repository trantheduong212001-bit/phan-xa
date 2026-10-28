// Lưu sẵn toàn bộ app để mở được khi mất mạng.
// Mỗi bản mới: đổi PHIEN_BAN (bộ kiểm bắt khớp với app.js) và thêm tệp mới vào TEP (bộ kiểm bắt thiếu).
const PHIEN_BAN = '0.7.1';
const KHO_DEM = 'phanxa-' + PHIEN_BAN;
const TEP = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './noi-dung.js',
  './man-hoi-dap.js',
  './man-cung-me.js',
  './man-danh-may.js',
  './man-on-tap.js',
  './man-sao-luu.js',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './js/chon-giong.js',
  './js/cung-me.js',
  './js/danh-may.js',
  './js/do-tre.js',
  './js/duyet.js',
  './js/giong.js',
  './js/hoi-dap.js',
  './js/kho.js',
  './js/ma-tien-do.js',
  './js/micro.js',
  './js/nghe-mic.js',
  './js/on-tap.js',
  './js/phien-am-thanh.js',
  './js/tach-cau.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(KHO_DEM).then(c => c.addAll(TEP)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ds => Promise.all(ds.filter(k => k.startsWith('phanxa-') && k !== KHO_DEM).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(da =>
    da || fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
