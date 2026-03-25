// Service Worker - 운동 칼로리 추정기
const CACHE_NAME = 'workout-calorie-v1';
const ASSETS = [
  '/workout-calorie-estimator/',
  '/workout-calorie-estimator/index.html',
  '/workout-calorie-estimator/style.css',
  '/workout-calorie-estimator/js/app.js',
  '/workout-calorie-estimator/js/ui.js',
  '/workout-calorie-estimator/js/calculator.js',
  '/workout-calorie-estimator/js/data.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', e => {
  // API 호출은 캐시하지 않음
  if (e.request.url.includes('apis.data.go.kr')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).catch(() => {
        // 오프라인 시 index.html 반환
        if (e.request.mode === 'navigate') {
          return caches.match('/workout-calorie-estimator/index.html');
        }
      });
    })
  );
});
