const CACHE = "semcal-v3";
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

  // Network-first for everything same-origin, not just HTML navigations.
  // data.js/engine.js/index.html all ship together and change together —
  // serving a cache-first engine.js alongside an already-updated
  // network-first index.html is exactly how this broke once already: the
  // page expects functions a stale cached engine.js doesn't export yet,
  // throws on load, and every event listener below that point in the
  // script never attaches (tabs stop responding, nothing finishes
  // rendering). Falls back to cache only when the network is unreachable.
  e.respondWith(
    fetch(req).then(res=>{
      if(res && (res.status===200 || res.type==="opaque")){
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(req, copy));
      }
      return res;
    }).catch(()=> caches.match(req))
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
