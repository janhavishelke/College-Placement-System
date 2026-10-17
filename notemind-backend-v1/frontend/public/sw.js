const C='unera-v6'; self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['/','/index.html']))); self.skipWaiting();});
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(h=> h || fetch(e.request).then(r=>{ const cl=r.clone(); caches.open(C).then(c=>c.put(e.request,cl)); return r; }).catch(()=> h))); });
