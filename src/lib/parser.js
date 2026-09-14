import { normalizzaData } from './date.js';

/**
 * Estrae i campi di un verbale dal testo grezzo prodotto dall'OCR.
 * È volutamente conservativo: meglio lasciare un campo vuoto che riempirlo
 * male, perché poi l'analisi ci ragiona sopra. Ogni campo trovato finisce
 * anche in `trovati`, così la UI può evidenziare cosa ha letto la macchina.
 */
export function estraiDaTesto(testoGrezzo) {
  const testo = String(testoGrezzo || '')
    .replace(/[|¦]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r/g, '');
  const piatto = testo.replace(/\n/g, ' ');
  const campi = {};
  const trovati = [];

  const set = (campo, valore) => {
    if (valore === null || valore === undefined || valore === '') return;
    if (campi[campo] !== undefined) return; // primo match vince
    campi[campo] = valore;
    trovati.push(campo);
  };

  // --- Numero del verbale -------------------------------------------------
  const nVerbale = piatto.match(/verbale\s*(?:nr?|n°|numero)?\.?\s*[:\s]\s*([A-Z0-9][A-Z0-9./\-]{3,})/i)
    || piatto.match(/(?:nr?|n°)\.?\s*verbale\s*[:\s]\s*([A-Z0-9][A-Z0-9./\-]{3,})/i);
  if (nVerbale) set('numeroVerbale', nVerbale[1].replace(/[.,]$/, ''));

  // --- Targa --------------------------------------------------------------
  const targa = piatto.match(/\b([A-Z]{2})\s?(\d{3})\s?([A-Z]{2})\b/);
  if (targa) set('targa', `${targa[1]}${targa[2]}${targa[3]}`);

  // --- Organo accertatore -------------------------------------------------
  const organo = testo.split('\n')
    .map((r) => r.trim())
    .find((r) => /polizia|carabinier|guardia di finanza|comando|corpo di polizia|prefettura|municipal/i.test(r) && r.length < 90);
  if (organo) set('organo', organo);

  // --- Articolo e comma ---------------------------------------------------
  const art = piatto.match(/art\.?\s*(\d{1,3}(?:[-\s]?(?:bis|ter|quater))?)/i);
  if (art) set('articolo', art[1].toLowerCase().replace(/\s+/g, '-'));
  const comma = piatto.match(/comma\s*(\d{1,2}(?:[-\s]?bis)?)/i) || piatto.match(/\bc\.\s*(\d{1,2})\b/i);
  if (comma) set('comma', comma[1].toLowerCase().replace(/\s+/g, '-'));

  // --- Date ---------------------------------------------------------------
  const D = '(\\d{1,2}[/.\\-]\\d{1,2}[/.\\-]\\d{2,4}|\\d{1,2}\\s+[a-zàèéìòù]{4,9}\\s+\\d{4})';
  const violazione = piatto.match(new RegExp(`(?:in data|il giorno|data (?:della )?violazione|accertat[ao] (?:in data |il )?)\\s*${D}`, 'i'));
  if (violazione) set('dataViolazione', normalizzaData(violazione[1]));
  const notifica = piatto.match(new RegExp(`notific\\w*\\s*(?:in data|del|il)?\\s*${D}`, 'i'));
  if (notifica) set('dataNotifica', normalizzaData(notifica[1]));
  const taratura = piatto.match(new RegExp(`taratur\\w*[^.\\n]{0,40}?${D}`, 'i'));
  if (taratura) set('dataTaratura', normalizzaData(taratura[1]));

  // Se non c'è nessuna data etichettata, prendi la prima che compare.
  if (!campi.dataViolazione) {
    const qualsiasi = piatto.match(new RegExp(D, 'i'));
    if (qualsiasi) set('dataViolazione', normalizzaData(qualsiasi[1]));
  }

  const ora = piatto.match(/(?:ore|alle)\s*(\d{1,2})[:.](\d{2})/i);
  if (ora) set('oraViolazione', `${ora[1].padStart(2, '0')}:${ora[2]}`);

  // --- Importi ------------------------------------------------------------
  const spese = piatto.match(/spese\s*(?:di\s*)?(?:notific\w*|procedimento|accertamento)[^\d]{0,15}(\d{1,3}(?:[.,]\d{2})?)/i);
  if (spese) set('speseNotifica', numero(spese[1]));
  const importo = piatto.match(/(?:sanzione|importo|somma)\s*(?:amministrativa|da pagare|dovut\w)?[^\d]{0,20}(?:€|eur)?\s*(\d{1,4}(?:[.\s]\d{3})*[.,]\d{2})/i)
    || piatto.match(/(?:€|eur)\s*(\d{1,4}(?:[.\s]\d{3})*[.,]\d{2})/i);
  if (importo) set('importo', numero(importo[1]));

  const punti = piatto.match(/(?:decurtazione|punti)[^\d]{0,20}(\d{1,2})\s*punt/i)
    || piatto.match(/punti\s*[:\s]\s*(\d{1,2})\b/i);
  if (punti) set('puntiDecurtati', parseInt(punti[1], 10));

  // --- Velocità -----------------------------------------------------------
  const vRil = piatto.match(/velocit[àa]?['\u2019]?\s*(?:rilevata|accertata|misurata)[^\d]{0,15}(\d{2,3})/i);
  if (vRil) set('velocitaRilevata', parseInt(vRil[1], 10));
  const vCon = piatto.match(/velocit[àa]?['\u2019]?\s*(?:contestata|ridotta|effettiva)[^\d]{0,15}(\d{2,3})/i);
  if (vCon) set('velocitaContestata', parseInt(vCon[1], 10));
  const lim = piatto.match(/limite[^\d]{0,25}(\d{2,3})\s*km/i);
  if (lim) set('limiteVelocita', parseInt(lim[1], 10));

  // --- Luogo --------------------------------------------------------------
  const luogo = piatto.match(/\b((?:via|viale|v\.le|corso|c\.so|piazza|p\.zza|strada statale|s\.s\.|strada provinciale|s\.p\.|autostrada|a\d{1,2})\s+[A-Za-zÀ-ù'.\d\s]{3,45}?)(?:\s{2,}|,|;|\n|\s+(?:km|nei pressi|altezza|direzione))/i);
  if (luogo) set('luogo', pulisci(luogo[1]));

  // --- Tipo di accertamento ----------------------------------------------
  if (/autovelox|telelaser|velomatic|misurator\w+ di velocit|photored|scout speed/i.test(piatto)) set('tipoAccertamento', 'autovelox');
  else if (/z\.?t\.?l\.?|zona a traffico limitato|varco elettronico/i.test(piatto)) set('tipoAccertamento', 'ztl');
  else if (/semafor|lanterna|rosso semaforico|vista red/i.test(piatto)) set('tipoAccertamento', 'semaforo');
  else if (/sosta|divieto di fermata|parcheggi/i.test(piatto)) set('tipoAccertamento', 'sosta');
  // Nessuna parola chiave, ma c'è una velocità rilevata o l'art. 142: è un velox.
  else if (campi.velocitaRilevata || campi.articolo === '142') set('tipoAccertamento', 'autovelox');

  // --- Indizi sì/no -------------------------------------------------------
  if (/omologat/i.test(piatto)) set('strumentoOmologato', 'si');
  else if (/approvat\w+ con decreto|decreto di approvazione/i.test(piatto)) set('strumentoOmologato', 'no');

  if (/non (?:è|e') stat[oa] possibile (?:la )?(?:immediata )?contestazion|mancata contestazione immediata|impossibilit[àa] di (?:procedere alla )?contestazion|rilevamento automatico/i.test(piatto)) {
    set('motivazioneMancataContestazione', true);
    set('contestazioneImmediata', false);
  } else if (/contestazione immediata|contestato immediatamente|notificato nelle mani/i.test(piatto)) {
    set('contestazioneImmediata', true);
  }

  if (/ricorso al prefetto|giudice di pace/i.test(piatto)) set('indicazioneRicorso', 'si');

  // La descrizione: la riga più lunga che nomina l'articolo, ripulita.
  const riga = testo.split('\n').map((r) => r.trim())
    .filter((r) => /art\.?\s*\d/i.test(r) && r.length > 20)
    .sort((a, b) => b.length - a.length)[0];
  if (riga) set('descrizione', riga.slice(0, 200));

  return { campi, trovati };
}

function numero(s) {
  const n = parseFloat(String(s).replace(/[.\s](?=\d{3}\b)/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function pulisci(s) {
  return s.trim().replace(/\s+/g, ' ').replace(/[,;.]$/, '');
}
