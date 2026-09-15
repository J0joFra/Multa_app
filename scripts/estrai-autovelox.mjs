#!/usr/bin/env node
/**
 * Estrae le postazioni autovelox fisse italiane da OpenStreetMap e le scrive
 * come GeoJSON dentro public/dati/, così l'app le ha già in pacchetto e non
 * deve interrogare Overpass a ogni spostamento della mappa.
 *
 *   npm run autovelox                      # interroga Overpass (serve rete)
 *   npm run autovelox -- --da dati.json    # converte un file già scaricato
 *
 * Il file passato a --da può essere una risposta Overpass (con `elements`)
 * oppure un GeoJSON già pronto, per esempio prodotto da un estratto Geofabrik:
 *
 *   wget https://download.geofabrik.de/europe/italy-latest.osm.pbf
 *   osmium tags-filter italy-latest.osm.pbf n/highway=speed_camera n/enforcement=maxspeed -o velox.pbf
 *   osmium export velox.pbf -f geojson -o velox.geojson
 *   npm run autovelox -- --da velox.geojson
 *
 * I dati sono OpenStreetMap, licenza ODbL: vanno attribuiti, e l'app lo fa
 * nella mappa e nell'avviso in fondo alla scheda Limiti.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { interpretaAutovelox } from '../src/lib/geo.js';
import { aGeoJson, daGeoJson } from '../src/lib/autovelox.js';

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const USCITA = resolve(RADICE, 'public/dati/autovelox-it.geojson');
const OVERPASS = 'https://overpass-api.de/api/interpreter';

// Tutta l'Italia in una query. È pesante: si lancia di rado, non da un'app.
const QUERY = `[out:json][timeout:600];
area["ISO3166-1"="IT"][admin_level=2]->.it;
(
  node["highway"="speed_camera"](area.it);
  node["enforcement"="maxspeed"](area.it);
);
out tags center;`;

const argomenti = process.argv.slice(2);
const da = valore('--da');

try {
  const postazioni = da ? await daFile(da) : await daOverpass();
  if (postazioni.length === 0) {
    errore('Nessuna postazione trovata: non sovrascrivo l\'archivio esistente con un file vuoto.');
  }

  const geojson = aGeoJson(postazioni);
  await mkdir(dirname(USCITA), { recursive: true });
  await writeFile(USCITA, JSON.stringify(geojson));

  const byte = JSON.stringify(geojson).length;
  console.log(`${postazioni.length} postazioni -> ${USCITA}`);
  console.log(`${(byte / 1024).toFixed(0)} KB, estratto il ${geojson.estrattoIl}`);
  console.log('Ricorda: npm run sync per portarlo dentro android/.');
} catch (e) {
  errore(e.message || String(e));
}

async function daOverpass() {
  console.log('Interrogo Overpass per tutta l\'Italia: può volerci qualche minuto…');
  const r = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(QUERY)}`,
  });
  if (!r.ok) throw new Error(`Overpass ha risposto ${r.status}. Riprova più tardi: è un servizio pubblico e a volte è sotto carico.`);
  const dati = await r.json();
  return interpretaAutovelox(dati.elements);
}

async function daFile(percorso) {
  const contenuto = JSON.parse(await readFile(resolve(percorso), 'utf8'));
  // Due forme accettate: risposta Overpass, oppure GeoJSON già pronto.
  if (Array.isArray(contenuto?.elements)) return interpretaAutovelox(contenuto.elements);
  if (Array.isArray(contenuto?.features)) return daGeoJson(contenuto);
  throw new Error('File non riconosciuto: serve una risposta Overpass (con "elements") o un GeoJSON (con "features").');
}

function valore(nome) {
  const i = argomenti.indexOf(nome);
  return i >= 0 ? argomenti[i + 1] : null;
}

function errore(messaggio) {
  console.error(`\n${messaggio}\n`);
  process.exit(1);
}
