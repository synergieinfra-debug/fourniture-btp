// Fourniture BTP — service worker : installation de l'application et réception des partages
// (message, photo, PDF, Excel envoyés depuis WhatsApp ou une autre application).
const DB = "fbtp-partage", STORE = "partages";

function ouvrirDb() {
  return new Promise((ok, ko) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}
async function enregistrer(valeur) {
  const db = await ouvrirDb();
  await new Promise((ok, ko) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(valeur, "dernier");
    tx.oncomplete = ok;
    tx.onerror = () => ko(tx.error);
  });
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === "POST" && url.pathname.endsWith("/partage")) {
    e.respondWith((async () => {
      try {
        const fd = await e.request.formData();
        const texte = [fd.get("title"), fd.get("text"), fd.get("url")].filter((x) => x && String(x).trim()).join("\n");
        const fichiers = fd.getAll("fichiers").filter((f) => f && f.size)
          .map((f) => ({ nom: f.name || "fichier", type: f.type || "", blob: f }));
        await enregistrer({ texte, fichiers, le: Date.now() });
      } catch (err) {
        await enregistrer({ texte: "", fichiers: [], le: Date.now(), erreur: String(err) });
      }
      return Response.redirect(new URL("./?partage=1", self.registration.scope).href, 303);
    })());
  }
  // Toutes les autres requêtes passent normalement par le réseau (pas de cache :
  // l'application est toujours la dernière version publiée).
});
