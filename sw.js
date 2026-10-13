const CACHE='running-comeback-v7-9-0';
const ASSETS=['./','./index.html','./style.css','./app.js','./nutrition.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./exercise-seated-calf.webp','./exercise-standing-calf.webp','./exercise-tandem.webp','./exercise-single-balance.webp','./exercise-bridge.webp','./exercise-hip-abduction.webp','./exercise-ankle-mobility.webp','./exercise-calf-stretch.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return r}).catch(()=>caches.match(e.request)))});
