/**
 * Limiti di velocità e posizione, da OpenStreetMap.
 *
 * Non esiste in Italia una mappa ufficiale e completa dei limiti: OSM è la
 * fonte libera migliore, ma il tag `maxspeed` copre bene autostrade e strade
 * principali e molto meno le urbane. Quando manca, qui si ricade sui limiti
 * generali dell'art. 142 CdS per tipo di strada — che è una *presunzione*,
 * non un dato rilevato.
 *
 * In ogni caso il limite che conta davvero è quello dei cartelli sul posto:
 * quello che si legge qui è un indizio per sapere dove guardare, mai una prova.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const UA = 'MultaCheck/0.1 (app Android, verifica verbali)';

/** Limiti generali per tipo di strada, art. 142 commi 1-3 CdS. */
export const LIMITI_PRESUNTI = {
  motorway: 130,
  motorway_link: 130,
  trunk: 110,
  trunk_link: 110,
  primary: 90,
  primary_link: 90,
  secondary: 90,
  secondary_link: 90,
  tertiary: 90,
  unclassified: 90,
  residential: 50,
  living_street: 30,
  service: 30,
};

/** I tag italiani `maxspeed:type` dicono quale limite generale si applica. */
const TIPI_IT = {
  'IT:urban': 50,
  'IT:rural': 90,
  'IT:trunk': 110,
  'IT:motorway': 130,
  'IT:living_street': 30,
};

/**
 * Da valore OSM a km/h.
 * Gestisce "50", "50 km/h", "30 mph", i tag IT: e i valori non numerici.
 */
export function normalizzaMaxspeed(valore) {
  if (valore === null || valore === undefined) return null;
  const s = String(valore).trim().toLowerCase();
  if (!s || s === 'none' || s === 'signals' || s === 'variable' || s === 'walk') return null;
  if (TIPI_IT[String(valore).trim()]) return TIPI_IT[String(valore).trim()];

  const mph = s.match(/^(\d{1,3})\s*mph$/);
  if (mph) return Math.round(Number(mph[1]) * 1.609344);

  const kmh = s.match(/^(\d{1,3})(\s*km\/h)?$/);
  if (kmh) {
    const n = Number(kmh[1]);
    return n > 0 && n <= 200 ? n : null;
  }
  return null;
}

/**
 * Sceglie la strada più pertinente fra quelle restituite da Overpass e ne
 * ricava il limite. Se il verbale nomina una via, quella vince: intorno a un
 * punto ci sono quasi sempre più strade.
 */
export function interpretaStrade(elementi, nomeCercato = '') {
  const strade = (elementi || []).filter((e) => e?.tags?.highway);
  if (strade.length === 0) return null;

  const cercato = normalizzaNome(nomeCercato);
  const punteggio = (e) => {
    let p = 0;
    const nome = normalizzaNome(e.tags.name || e.tags.ref || '');
    if (cercato && nome && (nome.includes(cercato) || cercato.includes(nome))) p += 100;
    if (normalizzaMaxspeed(e.tags.maxspeed) !== null) p += 10;       // dato reale
    if (LIMITI_PRESUNTI[e.tags.highway] !== undefined) p += 1;       // almeno classificata
    return p;
  };

  const scelta = [...strade].sort((a, b) => punteggio(b) - punteggio(a))[0];
  const tags = scelta.tags;

  const rilevato = normalizzaMaxspeed(tags.maxspeed);
  if (rilevato !== null) {
    return { limite: rilevato, fonte: 'osm', strada: tags.name || tags.ref || null, tipo: tags.highway };
  }

  const daTipoIt = normalizzaMaxspeed(tags['maxspeed:type'] || tags['source:maxspeed']);
  if (daTipoIt !== null) {
    return { limite: daTipoIt, fonte: 'presunto', strada: tags.name || tags.ref || null, tipo: tags.highway };
  }

  const daHighway = LIMITI_PRESUNTI[tags.highway];
  if (daHighway !== undefined) {
    return { limite: daHighway, fonte: 'presunto', strada: tags.name || tags.ref || null, tipo: tags.highway };
  }

  return { limite: null, fonte: null, strada: tags.name || tags.ref || null, tipo: tags.highway };
}

function normalizzaNome(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\b(via|viale|corso|piazza|strada|v\.le|c\.so|p\.zza)\b/g, '')
    .replace(/[^a-zà-ù0-9]+/g, ' ')
    .trim();
}

/**
 * Gli autovelox fissi mappati su OSM in un riquadro della mappa.
 *
 * Sono postazioni fisse, che per legge devono essere segnalate: è
 * informazione pubblica, e qui serve a capire dove ti hanno multato e se la
 * postazione era segnalata. Non c'è nessun avviso in tempo reale mentre guidi,
 * e i controlli mobili non compaiono: quelli non si segnalano.
 *
 * Come per i limiti, la copertura è quella che è: una postazione assente dalla
 * mappa non vuol dire che non esista.
 */
export async function autoveloxInBbox(bbox, segnale) {
  const { sud, ovest, nord, est } = bbox;
  const area = `${sud},${ovest},${nord},${est}`;
  const query = `[out:json][timeout:25];(node["highway"="speed_camera"](${area});node["enforcement"="maxspeed"](${area}););out tags center 300;`;
  const r = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal: segnale,
  });
  if (!r.ok) throw new Error(`Overpass ${r.status}`);
  const dati = await r.json();
  return interpretaAutovelox(dati.elements);
}

/** Dai nodi grezzi di Overpass alle postazioni che la mappa sa disegnare. */
export function interpretaAutovelox(elementi) {
  const visti = new Set();
  return (elementi || [])
    .map((e) => {
      const lat = e.lat ?? e.center?.lat;
      const lon = e.lon ?? e.center?.lon;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const chiave = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      if (visti.has(chiave)) return null;    // nodo e relazione descrivono la stessa postazione
      visti.add(chiave);
      const t = e.tags || {};
      return {
        id: e.id ? `${e.type || 'node'}/${e.id}` : chiave,
        lat,
        lon,
        limite: normalizzaMaxspeed(t.maxspeed),
        direzione: t.direction || t['camera:direction'] || null,
        tipo: t['speed_camera'] || t.enforcement || t.highway || null,
        nome: t.name || t.operator || null,
      };
    })
    .filter(Boolean);
}

/** Distanza in metri fra due punti (formula dell'emisenoverso). */
export function distanzaMetri(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

/** Indirizzo -> coordinate. Restituisce null se non trova nulla. */
export async function geocodifica(indirizzo, segnale) {
  const q = String(indirizzo || '').trim();
  if (!q) return null;
  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=jsonv2&limit=1&countrycodes=it&addressdetails=0`;
  const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: segnale });
  if (!r.ok) throw new Error(`Nominatim ${r.status}`);
  const dati = await r.json();
  if (!Array.isArray(dati) || dati.length === 0) return null;
  return {
    lat: Number(dati[0].lat),
    lon: Number(dati[0].lon),
    nome: dati[0].display_name || q,
  };
}

/** Coordinate -> indirizzo leggibile. Serve quando il punto lo scegli sulla mappa. */
export async function indirizzoDaPunto(lat, lon, segnale) {
  const url = `${NOMINATIM.replace('/search', '/reverse')}?lat=${lat}&lon=${lon}&format=jsonv2&zoom=18&addressdetails=1`;
  const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: segnale });
  if (!r.ok) throw new Error(`Nominatim ${r.status}`);
  const d = await r.json();
  if (!d || d.error) return null;
  const a = d.address || {};
  const via = [a.road, a.house_number].filter(Boolean).join(' ');
  const comune = a.city || a.town || a.village || a.municipality || '';
  return [via, comune].filter(Boolean).join(', ') || d.display_name || null;
}

/** Coordinate -> limite di velocità delle strade lì intorno. */
export async function limiteInZona(lat, lon, nomeStrada = '', raggio = 60, segnale) {
  const query = `[out:json][timeout:25];way(around:${raggio},${lat},${lon})["highway"];out tags center 40;`;
  const r = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal: segnale,
  });
  if (!r.ok) throw new Error(`Overpass ${r.status}`);
  const dati = await r.json();
  return interpretaStrade(dati.elements, nomeStrada);
}

/** Il giro a partire da un punto sulla mappa, invece che da un indirizzo scritto. */
export async function analizzaPunto(lat, lon, segnale) {
  let nome = null;
  try {
    nome = await indirizzoDaPunto(lat, lon, segnale);
  } catch {
    // senza indirizzo il limite vale lo stesso
  }
  let limite = null;
  try {
    limite = await limiteInZona(lat, lon, nome || '', 60, segnale);
  } catch {
    limite = null;
  }
  return {
    lat,
    lon,
    nome: nome || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    limiteOsm: limite?.limite ?? null,
    fonteLimite: limite?.fonte ?? null,
    stradaOsm: limite?.strada ?? null,
    tipoStrada: limite?.tipo ?? null,
    aggiornatoIl: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Il giro completo: dall'indirizzo del verbale alla scheda da salvare.
 * Restituisce null se l'indirizzo non è geolocalizzabile.
 */
export async function analizzaLuogo(indirizzo, segnale) {
  const punto = await geocodifica(indirizzo, segnale);
  if (!punto) return null;
  let limite = null;
  try {
    limite = await limiteInZona(punto.lat, punto.lon, indirizzo, 60, segnale);
  } catch {
    // La posizione da sola vale già: la mappa si vede anche senza limite.
  }
  return {
    lat: punto.lat,
    lon: punto.lon,
    nome: punto.nome,
    limiteOsm: limite?.limite ?? null,
    fonteLimite: limite?.fonte ?? null,     // 'osm' = rilevato, 'presunto' = per tipo di strada
    stradaOsm: limite?.strada ?? null,
    tipoStrada: limite?.tipo ?? null,
    aggiornatoIl: new Date().toISOString().slice(0, 10),
  };
}
