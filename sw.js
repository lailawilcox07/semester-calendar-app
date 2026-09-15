const CACHE = "semcal-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

// Cache-first for the app shell, falling back to network and updating the
// cache in the background. Anything (Google Fonts included) that's never
// been fetched successfully simply isn't available offline yet.
self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET") return;

  e.respondWith(
    caches.match(req).then(cached=>{
      const network = fetch(req).then(res=>{
        if(res && (res.status===200 || res.type==="opaque")){
          const copy = res.clone();
          caches.open(CACHE).then(c=>c.put(req, copy));
        }
        return res;
      }).catch(()=>cached);
      return cached || network;
    })
  );
});
