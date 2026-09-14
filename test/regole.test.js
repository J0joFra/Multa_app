import { describe, it, expect } from 'vitest';
import { analizzaVerbale, CRITICO, OK, ATTENZIONE } from '../src/lib/regole.js';
import { nuovoVerbale } from '../src/lib/verbale.js';

const esito = (r, id) => r.esiti.find((e) => e.id === id);

const base = (patch) => nuovoVerbale({
  numeroVerbale: '1', organo: 'Polizia Locale', luogo: 'Via Roma 1',
  articolo: '158', importo: 42, dataViolazione: '2026-01-10',
  dataNotifica: '2026-02-10', motivazioneMancataContestazione: true,
  ...patch,
});

describe('termine di notifica', () => {
  it('boccia la notifica oltre i 90 giorni', () => {
    const r = analizzaVerbale(base({ dataNotifica: '2026-05-02' }), '2026-05-10');
    expect(esito(r, 'notifica-termine').esito).toBe(CRITICO);
    expect(r.verdetto.livello).toBe(CRITICO);
  });

  it('accetta la notifica entro i 90 giorni', () => {
    const r = analizzaVerbale(base(), '2026-02-15');
    expect(esito(r, 'notifica-termine').esito).toBe(OK);
  });

  it('concede 360 giorni a chi risiede all estero', () => {
    const r = analizzaVerbale(base({ dataNotifica: '2026-05-02', residenteEstero: true }), '2026-05-10');
    expect(esito(r, 'notifica-termine').esito).toBe(OK);
  });

  it('non applica il termine alla contestazione immediata', () => {
    const r = analizzaVerbale(base({ contestazioneImmediata: true, dataNotifica: '' }), '2026-01-12');
    expect(esito(r, 'notifica-termine').esito).toBe(OK);
  });
});

describe('tolleranza velocita', () => {
  const velox = (patch) => base({
    articolo: '142', comma: '7', importo: 173, tipoAccertamento: 'autovelox', ...patch,
  });

  it('segnala la tolleranza non applicata', () => {
    const r = analizzaVerbale(velox({ velocitaRilevata: 100, velocitaContestata: 100, limiteVelocita: 70 }), '2026-02-15');
    expect(esito(r, 'velocita-tolleranza').esito).toBe(CRITICO);
  });

  it('accetta la velocita gia ridotta', () => {
    const r = analizzaVerbale(velox({ velocitaRilevata: 100, velocitaContestata: 95, limiteVelocita: 70 }), '2026-02-15');
    expect(esito(r, 'velocita-tolleranza').esito).toBe(OK);
  });

  it('usa il minimo di 5 km/h sotto i 100 km/h', () => {
    // 80 km/h -> 5% = 4, ma il minimo di legge e 5 -> contestabili 75.
    const r = analizzaVerbale(velox({ velocitaRilevata: 80, velocitaContestata: 76, limiteVelocita: 50 }), '2026-02-15');
    expect(esito(r, 'velocita-tolleranza').esito).toBe(CRITICO);
  });

  it('rileva che sotto tolleranza la violazione non sussiste', () => {
    const r = analizzaVerbale(velox({ velocitaRilevata: 73, velocitaContestata: 68, limiteVelocita: 70 }), '2026-02-15');
    expect(esito(r, 'velocita-tolleranza').esito).toBe(CRITICO);
  });
});

describe('taratura e omologazione', () => {
  it('boccia la taratura piu vecchia di un anno', () => {
    const r = analizzaVerbale(base({ tipoAccertamento: 'autovelox', dataTaratura: '2024-01-01' }), '2026-02-15');
    expect(esito(r, 'autovelox-taratura').esito).toBe(CRITICO);
  });

  it('accetta la taratura nell anno', () => {
    const r = analizzaVerbale(base({ tipoAccertamento: 'autovelox', dataTaratura: '2025-06-01' }), '2026-02-15');
    expect(esito(r, 'autovelox-taratura').esito).toBe(OK);
  });

  it('boccia lo strumento solo approvato', () => {
    const r = analizzaVerbale(base({ tipoAccertamento: 'autovelox', strumentoOmologato: 'no' }), '2026-02-15');
    expect(esito(r, 'autovelox-omologazione').esito).toBe(CRITICO);
  });

  it('non applica le regole autovelox a una sosta', () => {
    const r = analizzaVerbale(base({ tipoAccertamento: 'sosta' }), '2026-02-15');
    expect(esito(r, 'autovelox-taratura')).toBeUndefined();
    expect(esito(r, 'autovelox-omologazione')).toBeUndefined();
  });
});

describe('scadenze', () => {
  it('nega lo sconto del 30% quando c e una sanzione accessoria', () => {
    const r = analizzaVerbale(base({ articolo: '142', comma: '8', importo: 544 }), '2026-02-11');
    expect(esito(r, 'sconto-30').messaggio).toMatch(/non spetta/);
  });

  it('calcola lo sconto sui verbali ordinari', () => {
    const r = analizzaVerbale(base({ importo: 100 }), '2026-02-11');
    expect(esito(r, 'sconto-30').messaggio).toMatch(/70\.00 €/);
  });

  it('indica i termini di ricorso dalla notifica', () => {
    const r = analizzaVerbale(base(), '2026-02-11');
    expect(esito(r, 'ricorso-prefetto').messaggio).toMatch(/11\/04\/2026/);
    expect(esito(r, 'ricorso-giudice-di-pace').messaggio).toMatch(/12\/03\/2026/);
  });

  it('segnala la prescrizione oltre i 5 anni', () => {
    const r = analizzaVerbale(base(), '2032-01-01');
    expect(esito(r, 'prescrizione').esito).toBe(CRITICO);
  });
});

describe('forma del verbale', () => {
  it('elenca i campi essenziali mancanti', () => {
    const r = analizzaVerbale(base({ numeroVerbale: '', luogo: '' }), '2026-02-15');
    const e = esito(r, 'dati-essenziali');
    expect(e.esito).toBe(ATTENZIONE);
    expect(e.messaggio).toMatch(/numero del verbale/);
    expect(e.messaggio).toMatch(/luogo della violazione/);
  });

  it('da verdetto pulito su un verbale regolare', () => {
    const r = analizzaVerbale(base({ indicazioneRicorso: 'si' }), '2026-02-15');
    expect(r.verdetto.livello).toBe(OK);
    expect(r.conteggi.critico).toBe(0);
  });
});
