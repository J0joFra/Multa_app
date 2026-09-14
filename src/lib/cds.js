// Catalogo delle violazioni più frequenti del Codice della Strada.
//
// ATTENZIONE: gli importi delle sanzioni sono aggiornati ogni due anni con
// decreto ministeriale (adeguamento ISTAT). I valori qui sotto servono SOLO
// come ordine di grandezza per segnalare un importo palesemente fuori scala:
// l'app non dichiara mai "illegittimo" un importo, al massimo invita a
// verificarlo sul verbale.
export const AGGIORNATO_AL = '2025';

/**
 * min/max: sanzione edittale in euro (pagamento entro 60 gg = minimo).
 * punti: decurtazione patente per il conducente.
 * accessorie: 'sospensione' | 'confisca' | 'fermo' | null
 *   -> se sospensione o confisca, NON spetta lo sconto del 30% (art. 202 c. 1-bis).
 */
export const VIOLAZIONI = {
  '7': {
    titolo: 'Circolazione in area vietata / ZTL',
    min: 88, max: 338, punti: 0, accessorie: null, tipo: 'ztl',
  },
  '80': {
    titolo: 'Revisione omessa',
    min: 173, max: 694, punti: 0, accessorie: null, tipo: 'documentale',
  },
  '126-bis': {
    titolo: 'Omessa comunicazione dati del conducente',
    min: 291, max: 1166, punti: 0, accessorie: null, tipo: 'documentale',
  },
  '141': {
    titolo: 'Velocità non adeguata alle condizioni',
    min: 42, max: 173, punti: 5, accessorie: null, tipo: 'velocita',
  },
  '142-7': {
    titolo: 'Velocità oltre il limite di più di 10 e fino a 40 km/h',
    min: 173, max: 694, punti: 3, accessorie: null, tipo: 'velocita',
  },
  '142-8': {
    titolo: 'Velocità oltre il limite di più di 40 e fino a 60 km/h',
    min: 544, max: 2174, punti: 6, accessorie: 'sospensione', tipo: 'velocita',
  },
  '142-9': {
    titolo: 'Velocità oltre il limite di più di 60 km/h',
    min: 847, max: 3389, punti: 10, accessorie: 'sospensione', tipo: 'velocita',
  },
  '146': {
    titolo: 'Mancato rispetto del semaforo rosso',
    min: 167, max: 665, punti: 6, accessorie: null, tipo: 'semaforo',
  },
  '157': {
    titolo: 'Sosta o fermata in posizione vietata',
    min: 42, max: 173, punti: 0, accessorie: null, tipo: 'sosta',
  },
  '158': {
    titolo: 'Divieto di sosta',
    min: 42, max: 173, punti: 0, accessorie: null, tipo: 'sosta',
  },
  '172': {
    titolo: 'Cinture di sicurezza / sistemi di ritenuta',
    min: 83, max: 332, punti: 5, accessorie: null, tipo: 'condotta',
  },
  '173': {
    titolo: 'Uso del telefono alla guida',
    min: 165, max: 660, punti: 5, accessorie: 'sospensione', tipo: 'condotta',
  },
  '180': {
    titolo: 'Mancata esibizione di documenti',
    min: 42, max: 173, punti: 0, accessorie: null, tipo: 'documentale',
  },
  '186': {
    titolo: 'Guida in stato di ebbrezza',
    min: 543, max: 6000, punti: 10, accessorie: 'sospensione', tipo: 'condotta',
  },
  '193': {
    titolo: 'Circolazione senza assicurazione',
    min: 866, max: 3464, punti: 0, accessorie: 'sequestro', tipo: 'documentale',
  },
};

/** Chiave del catalogo a partire da articolo e comma ("142", "8" -> "142-8"). */
export function chiaveViolazione(articolo, comma) {
  if (!articolo) return null;
  const art = String(articolo).trim().toLowerCase().replace(/\s+/g, '');
  const cm = comma ? String(comma).trim().replace(/[^0-9a-z-]/gi, '') : '';
  if (cm && VIOLAZIONI[`${art}-${cm}`]) return `${art}-${cm}`;
  if (VIOLAZIONI[art]) return art;
  return null;
}

export function infoViolazione(articolo, comma) {
  const k = chiaveViolazione(articolo, comma);
  return k ? { chiave: k, ...VIOLAZIONI[k] } : null;
}

/** Tolleranza strumentale sulla velocità: 5% con un minimo di 5 km/h (art. 142 c. 6). */
export function velocitaContestabile(rilevata) {
  if (!Number.isFinite(rilevata) || rilevata <= 0) return null;
  const tolleranza = Math.max(5, rilevata * 0.05);
  return Math.round((rilevata - tolleranza) * 100) / 100;
}
