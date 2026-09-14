import { formatIT, addGiorni } from './date.js';
import { analizzaVerbale, CRITICO, ATTENZIONE } from './regole.js';

/**
 * Bozza di ricorso costruita sui vizi trovati.
 * È una traccia da rileggere e completare, non un atto pronto da depositare.
 */
export function bozzaRicorso(v, destinatario = 'prefetto', oggi) {
  const { esiti } = analizzaVerbale(v, oggi);
  // Nel ricorso vanno solo i vizi accertati; quelli ancora da verificare
  // finiscono in coda come promemoria, non come motivi di impugnazione.
  const motivi = esiti.filter((e) => e.esito === CRITICO);
  const daVerificare = esiti.filter((e) => e.esito === ATTENZIONE);

  const autorita = destinatario === 'giudice'
    ? `Al Giudice di Pace competente per il territorio\n(tramite l'organo accertatore: ${v.organo || '________'})`
    : `Al Prefetto della Provincia di ________\n(tramite ${v.organo || 'l\'organo accertatore'})`;

  const riferimento = [
    v.numeroVerbale ? `verbale n. ${v.numeroVerbale}` : 'verbale n. ________',
    v.organo ? `elevato da ${v.organo}` : null,
    v.dataViolazione ? `per fatto del ${formatIT(v.dataViolazione)}${v.oraViolazione ? ` ore ${v.oraViolazione}` : ''}` : null,
    v.luogo ? `in ${v.luogo}` : null,
    v.targa ? `veicolo targa ${v.targa}` : null,
    v.dataNotifica ? `notificato il ${formatIT(v.dataNotifica)}` : null,
  ].filter(Boolean).join(', ');

  const corpo = motivi.length
    ? motivi.map((m, i) => `${romano(i + 1)}. ${m.titolo} (${m.riferimento})\n${formale(m, v)}`).join('\n\n')
    : 'I. ________\n(descrivi qui il motivo per cui ritieni la sanzione illegittima)';

  const scadenza = v.dataNotifica || v.dataViolazione
    ? addGiorni(v.dataNotifica || v.dataViolazione, destinatario === 'giudice' ? 30 : 60)
    : null;

  return `${autorita}

RICORSO AVVERSO VERBALE DI CONTESTAZIONE
${destinatario === 'giudice' ? 'ai sensi dell\'art. 204-bis del Codice della Strada' : 'ai sensi dell\'art. 203 del Codice della Strada'}

Il/La sottoscritto/a ________________________, nato/a a ____________ il ________,
residente in ______________________________, C.F. __________________,

PREMESSO CHE

gli è stato notificato il ${riferimento}.

RILEVA QUANTO SEGUE

${corpo}

TUTTO CIÒ PREMESSO

chiede l'annullamento del verbale in epigrafe e di ogni conseguente sanzione,
principale e accessoria.

Si allega: copia del verbale${v.fotoVerbale ? ', fotografia del verbale' : ''}, copia del documento d'identità.

Luogo e data ____________________

Firma ____________________

---
${scadenza ? `Da presentare entro il ${formatIT(scadenza)}.` : 'Attenzione: inserisci la data di notifica per calcolare il termine.'}
Questa è una bozza generata da MultaCheck: rileggila, completa i campi vuoti e
verifica i riferimenti prima di presentarla. Non è un parere legale.${
  daVerificare.length
    ? `\n\nPrima di presentarlo, verifica anche:\n${daVerificare.map((d) => `- ${d.titolo}: ${d.messaggio}`).join('\n')}`
    : ''
}`;
}

/**
 * Gli esiti sono scritti per essere letti dall'utente ("controlla se...").
 * In un ricorso serve la forma impersonale: qui la riscrivo dove ha senso.
 */
const FORMALE = {
  'notifica-termine': (v, e) =>
    `Il verbale risulta notificato il ${formatIT(v.dataNotifica)}, oltre il termine di ${v.residenteEstero ? 360 : 90} giorni dall'accertamento del ${formatIT(v.dataViolazione)} previsto dall'art. 201 comma 1 CdS. Decorso tale termine l'obbligazione di pagare la somma dovuta per la violazione si estingue.`,
  'motivazione-mancata-contestazione': () =>
    'Il verbale non indica i motivi che hanno reso impossibile la contestazione immediata, in violazione dell\'art. 201 comma 1 CdS: l\'omessa motivazione ne determina l\'illegittimità.',
  'indicazione-ricorso': () =>
    'Il verbale non riporta l\'indicazione dell\'autorità cui è possibile proporre ricorso, delle relative forme e dei termini, in violazione dell\'art. 201 comma 5 CdS.',
  'velocita-tolleranza': (v) =>
    `La velocità contestata non tiene conto della riduzione prevista dall'art. 142 comma 6 CdS, pari al 5% del valore rilevato con un minimo di 5 km/h. Sul valore rilevato di ${v.velocitaRilevata} km/h la velocità contestabile è inferiore a quella indicata nel verbale, con conseguente erronea individuazione della fascia sanzionatoria.`,
  'autovelox-omologazione': () =>
    'Il verbale dà atto che l\'apparecchiatura è stata "approvata" e non "omologata". Come chiarito dalla Corte di Cassazione (sent. n. 10505/2024), approvazione e omologazione non sono equivalenti e l\'accertamento fondato su un dispositivo privo di omologazione non può reggere la sanzione.',
  'autovelox-taratura': (v) =>
    `Non risulta la verifica periodica di funzionalità e taratura dell'apparecchiatura valida alla data dell'accertamento (ultima verifica indicata: ${formatIT(v.dataTaratura)}). La Corte costituzionale, con sentenza n. 113/2015, ha dichiarato l'illegittimità dell'art. 45 CdS nella parte in cui non prevede tale verifica periodica.`,
  'autovelox-segnaletica': () =>
    'La postazione di controllo non risultava preventivamente segnalata e ben visibile, in violazione dell\'art. 142 comma 6-bis CdS e del D.M. 15 agosto 2007.',
  'autovelox-decreto': () =>
    'Non risulta che il tratto stradale sia stato individuato con decreto del Prefetto fra quelli in cui è consentito il rilevamento della velocità senza contestazione immediata, ai sensi dell\'art. 4 del D.L. 121/2002.',
  'semaforo-documentazione': () =>
    'Al verbale non è allegata la documentazione fotografica dell\'infrazione, che costituisce l\'unica prova del passaggio con luce rossa: se ne chiede l\'esibizione e, in mancanza, l\'annullamento del verbale.',
  'prescrizione': (v) =>
    `Dalla data della violazione (${formatIT(v.dataViolazione)}) sono decorsi oltre cinque anni senza atti interruttivi ritualmente notificati: il diritto a riscuotere le somme dovute è prescritto ai sensi dell'art. 209 CdS.`,
};

function formale(esito, v) {
  const f = FORMALE[esito.id];
  try {
    return f ? f(v, esito) : esito.messaggio;
  } catch {
    return esito.messaggio;
  }
}

function romano(n) {
  const t = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return t[n] || String(n);
}
