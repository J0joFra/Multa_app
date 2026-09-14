import { oggiISO } from './date.js';

/** Struttura dati di un verbale. Un solo posto da toccare quando si aggiunge un campo. */
export function nuovoVerbale(patch = {}) {
  return {
    id: patch.id || `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    creatoIl: patch.creatoIl || oggiISO(),

    // Identificazione
    numeroVerbale: '',
    organo: '',              // es. "Polizia Locale di Milano"
    targa: '',

    // Violazione
    articolo: '',            // "142"
    comma: '',               // "8"
    articoloManuale: false,  // l'utente ha scelto "Altro articolo" nell'elenco
    descrizione: '',
    dataViolazione: '',      // ISO
    oraViolazione: '',
    luogo: '',
    tipoAccertamento: 'agente', // agente | autovelox | ztl | semaforo | sosta | altro

    // Notifica / contestazione
    contestazioneImmediata: false,
    motivazioneMancataContestazione: null, // true | false | null (= non so)
    dataNotifica: '',
    residenteEstero: false,
    notificaAlProprietario: false,         // notificata all'intestatario, non al conducente

    // Importi
    importo: null,
    speseNotifica: null,
    puntiDecurtati: null,

    // Autovelox
    velocitaRilevata: null,
    velocitaContestata: null,
    limiteVelocita: null,
    strumentoOmologato: null,   // 'si' | 'no' | null
    dataTaratura: '',
    segnaleticaPreventiva: null, // 'si' | 'no' | null
    decretoPrefettizio: null,    // 'si' | 'no' | null

    // Formalità del verbale
    indicazioneRicorso: null,   // 'si' | 'no' | null
    fotogrammaAllegato: null,   // 'si' | 'no' | null

    // Luogo risolto su OpenStreetMap: { lat, lon, limiteOsm, fonteLimite, stradaOsm, ... }
    geo: null,

    // Allegati
    fotoVerbale: null,          // data URL
    testoOcr: '',

    ...patch,
  };
}

/** Campi che devono comparire nel verbale (art. 383 Reg. esec. CdS). */
export const CAMPI_OBBLIGATORI = [
  ['numeroVerbale', 'numero del verbale'],
  ['organo', 'organo accertatore'],
  ['dataViolazione', 'data della violazione'],
  ['luogo', 'luogo della violazione'],
  ['articolo', 'norma violata'],
  ['importo', 'importo della sanzione'],
];
