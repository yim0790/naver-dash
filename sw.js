// 네이버 실적 대시보드 서비스워커 — 화면·데이터는 네트워크 우선, 아이콘 등 정적 파일만 캐시 우선
const VERSION = 1;
const CACHE = 'naver-dash-v' + VERSION;
const STATIC = [
  './', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(STATIC.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate' || url.pathname.endsWith('/index.html');
  const isData = url.pathname.endsWith('/data/data.json');

  if (isHTML || isData) {
    // 화면과 데이터는 항상 네트워크 먼저 → 앱을 한 번만 열어도 최신이 된다.
    // 오프라인일 때만 캐시로 응답한다.
    const key = isData ? './data/data.json' : './index.html';
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(key, copy));
        return res;
      }).catch(() => caches.match(key))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
