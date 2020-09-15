// service-worker.js

// Set this to true for production
var doCache = true;

// Name our cache
var CACHE_NAME = "my-pwa-cache-v1";

// Delete old caches that are not our current one!
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (!cacheWhitelist.includes(key)) {
            console.log("Deleting cache: " + key);
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// The first time the user starts up the PWA, 'install' is triggered.
self.addEventListener("install", function (event) {
  if (doCache) {
    event.waitUntil(
      caches.open("v1").then((cache) => {
        return cache.addAll([
          "./assets/cover.svg",
          "./assets/empty.svg",
          "./assets/logo.png",
          "./assets/gradient-left.png",
          "./assets/gradient-right.png",
          "./lib/epub.js/epub.js",
          "./lib/JSZip/jszip.js",
          "./lib/Rangy/rangy-classapplier.js",
          "./lib/Rangy/rangy-core.js",
          "./lib/Rangy/rangy-highlighter.js",
          "./lib/Rangy/rangy-serializer.js",
          "./lib/Rangy/rangy-textrange.js",
        ]);
      })
    );
  }
});

// When the webpage goes to fetch files, we intercept that request and serve up the matching files
// if we have them
self.addEventListener("fetch", function (event) {
  if (doCache) {
    event.respondWith(
      caches.match(event.request).then(function (response) {
        return response || fetch(event.request);
      })
    );
  }
});
