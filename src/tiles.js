import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Harita karoları: kullanıcının GÖRDÜĞÜ karolar cihaza kaydedilir, internet yokken oradan gösterilir.
// Önceden toplu indirme YOK (OpenStreetMap kuralları buna izin vermiyor).
const CACHE = 'trackg-tiles-v1';
const MAX_TILES = 2000; // yaklaşık 40 MB; aşılınca en eskiler silinir
const MAX_AGE = 30 * 24 * 3600 * 1000; // 30 gün sonra internet varsa yenilenir
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
let puts = 0;

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_TILES) return;
  for (const k of keys.slice(0, keys.length - MAX_TILES + 100)) await cache.delete(k);
}

// Karoyu önce önbellekten, yoksa internetten alır. Blob adresi döndürür (olmazsa null).
async function getTile(url) {
  try {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(url);
    const savedAt = hit ? Number(hit.headers.get('x-cached-at')) : 0;
    if (hit && Date.now() - savedAt < MAX_AGE) return URL.createObjectURL(await hit.blob());
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      await cache.put(url, new Response(blob, { headers: { 'x-cached-at': String(Date.now()), 'content-type': blob.type } }));
      if (++puts % 50 === 0) trim(cache);
      return URL.createObjectURL(blob);
    } catch {
      // İnternet yok: eski de olsa kayıtlı karoyu göster
      return hit ? URL.createObjectURL(await hit.blob()) : null;
    }
  } catch {
    return null; // Cache API yoksa normal yükleme
  }
}

export function CachedTiles() {
  const map = useMap();
  useEffect(() => {
    const layer = L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    layer.createTile = function (coords, done) {
      const tile = document.createElement('img');
      tile.alt = '';
      tile.setAttribute('role', 'presentation');
      tile.addEventListener('load', () => done(null, tile));
      tile.addEventListener('error', () => done(null, tile));
      const url = this.getTileUrl(coords);
      getTile(url).then((blobUrl) => {
        if (blobUrl) tile.addEventListener('load', () => URL.revokeObjectURL(blobUrl), { once: true });
        tile.src = blobUrl || url;
      });
      return tile;
    };
    map.attributionControl?.setPrefix(false); // Leaflet logosu gizlenir, OpenStreetMap atfı kalır
    layer.addTo(map);
    return () => { layer.remove(); };
  }, [map]);
  return null;
}

export async function cacheCount() {
  try { return (await (await caches.open(CACHE)).keys()).length; } catch { return 0; }
}

export async function clearTiles() {
  try { await caches.delete(CACHE); } catch { /* sorun değil */ }
}
