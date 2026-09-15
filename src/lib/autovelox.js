/**
 * L'archivio delle postazioni fisse in formato GeoJSON.
 *
 * Interrogare Overpass a ogni spostamento della mappa funziona, ma dipende
 * dalla rete e da un servizio pubblico gratuito che va usato con misura. Le
 * postazioni fisse cambiano di rado: conviene estrarle una volta, tenerle nel
 * pacchetto dell'app e filtrarle in memoria. Overpass resta come rete di
 * sicurezza quando l'archivio non c'è.
 *
 * Il file si rigenera con `npm run autovelox` (vedi scripts/estrai-autovelox.mjs).
 */

export const PERCORSO_ARCHIVIO = 'dati/autovelox-it.geojson';

/** Postazioni -> FeatureCollection, con le coordinate arrotondate a ~1 m. */
export function aGeoJson(postazioni, meta = {}) {
  return {
    type: 'FeatureCollection',
    // Da dove vengono i dati e quando: senza, fra un anno nessuno lo sa più.
    fonte: 'OpenStreetMap contributors (ODbL)',
    estrattoIl: meta.estrattoIl || new Date().toISOString().slice(0, 10),
    ...meta,
    features: postazioni.map((p) => ({
      type: 'Feature',
      id: p.id,
      geometry: { type: 'Point', coordinates: [arrotonda(p.lon), arrotonda(p.lat)] },
      properties: ripulisci({ limite: p.limite, direzione: p.direzione, tipo: p.tipo, nome: p.nome }),
    })),
  };
}

/** FeatureCollection -> postazioni, nella stessa forma che usa la mappa. */
export function daGeoJson(collezione) {
  const features = collezione?.features;
  if (!Array.isArray(features)) return [];
  return features
    .map((f, i) => {
      const c = f?.geometry?.coordinates;
      if (!Array.isArray(c) || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return null;
      const p = f.properties || {};
      return {
        id: f.id != null ? String(f.id) : `f${i}`,
        lat: c[1],
        lon: c[0],
        limite: Number.isFinite(p.limite) ? p.limite : null,
        direzione: p.direzione ?? null,
        tipo: p.tipo ?? null,
        nome: p.nome ?? null,
      };
    })
    .filter(Boolean);
}

/** Le postazioni dentro il riquadro a schermo. */
export function inBbox(postazioni, bbox) {
  if (!bbox) return [];
  const { sud, ovest, nord, est } = bbox;
  return (postazioni || []).filter(
    (p) => p.lat >= sud && p.lat <= nord && p.lon >= ovest && p.lon <= est,
  );
}

function arrotonda(n) {
  return Math.round(n * 1e5) / 1e5;
}

function ripulisci(o) {
  const out = {};
  for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined) out[k] = v;
  return out;
}

/* ── Caricamento a runtime ────────────────────────────────────────────────── */

let archivio = null;   // promessa: l'archivio si scarica una volta sola

/**
 * Le postazioni incluse nell'app. Restituisce null se il file non è stato
 * generato: chi chiama ripiega su Overpass.
 */
export function caricaArchivio(percorso = PERCORSO_ARCHIVIO) {
  if (!archivio) {
    archivio = fetch(percorso)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => (c ? daGeoJson(c) : null))
      .catch(() => null);
  }
  return archivio;
}

/** Solo per i test: dimentica l'archivio già caricato. */
export function scordaArchivio() {
  archivio = null;
}
