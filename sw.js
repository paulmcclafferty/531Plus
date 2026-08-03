/* 531+ service worker — network-first HTML so updates always load; offline fallback */
var CACHE = "531plus-v37";

self.addEventListener("install", function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url = req.url || "";
  var isHTML =
    req.mode === "navigate" ||
    (req.headers && req.headers.get("accept") && req.headers.get("accept").indexOf("text/html") >= 0) ||
    /index\.html(\?|$)/.test(url) ||
    /\/$/.test(url.split("?")[0]);

  // Network-first for app shell so a bad/old cache can never stick forever
  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          try {
            if (res && res.ok) {
              var copy = res.clone();
              caches.open(CACHE).then(function (cache) {
                cache.put(req, copy);
              });
            }
          } catch (e) {}
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (cached) {
            return cached || caches.match("./index.html");
          });
        })
    );
    return;
  }

  // Cache-first for other same-origin assets; network fallback
  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req)
        .then(function (res) {
          try {
            if (res && res.ok && url.indexOf(self.location.origin) === 0) {
              var copy = res.clone();
              caches.open(CACHE).then(function (cache) {
                cache.put(req, copy);
              });
            }
          } catch (e) {}
          return res;
        })
        .catch(function () {
          return cached;
        });
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var target =
    (event.notification.data && event.notification.data.url) ||
    self.registration.scope;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
    })
  );
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
