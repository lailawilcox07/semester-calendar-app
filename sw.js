const CACHE = "semcal-v2";
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

self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET") return;

  // Navigations (the HTML shell) go network-first: a stale cached page would
  // otherwise keep showing up-to-date-looking but actually-stale UI/code for
  // as long as this service worker instance keeps winning cache races.
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req).then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(req, copy));
        return res;
      }).catch(()=> caches.match(req))
    );
    return;
  }

  // Everything else (icons, manifest, fonts): cache-first, updating the
  // cache in the background. Anything never fetched successfully simply
  // isn't available offline yet.
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

self.addEventListener("push", e=>{
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || "Semester Calendar", { body: data.body || "", tag: data.tag }));
});

self.addEventListener("notificationclick", e=>{
  e.notification.close();
  e.waitUntil(clients.openWindow("/"));
});
