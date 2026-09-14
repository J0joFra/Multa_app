import { describe, it, expect } from 'vitest';
import { estraiDaTesto } from '../src/lib/parser.js';

const VERBALE_AUTOVELOX = `
COMANDO POLIZIA LOCALE DI MILANO
VERBALE N. 2026/0012345
Il giorno 10/01/2026 alle ore 14:30 in Via Palmanova 45, Milano
veicolo targa AB 123 CD
violazione art. 142 comma 8 C.d.S. - eccesso di velocita'
velocita' rilevata 118 km/h, velocita' contestata 112 km/h, limite 70 km/h
rilevata con apparecchiatura approvata con decreto ministeriale n. 1234
verifica di taratura eseguita in data 05/02/2025
Non e' stato possibile procedere alla immediata contestazione in quanto rilevamento automatico
SANZIONE AMMINISTRATIVA € 544,00 - spese di notifica 16,50
decurtazione di 6 punti
notificato il 02/05/2026
E' ammesso ricorso al Prefetto entro 60 giorni
`;

describe('estraiDaTesto', () => {
  const { campi } = estraiDaTesto(VERBALE_AUTOVELOX);

  it('legge numero verbale, organo e targa', () => {
    expect(campi.numeroVerbale).toBe('2026/0012345');
    expect(campi.organo).toMatch(/POLIZIA LOCALE DI MILANO/);
    expect(campi.targa).toBe('AB123CD');
  });

  it('legge articolo e comma', () => {
    expect(campi.articolo).toBe('142');
    expect(campi.comma).toBe('8');
  });

  it('legge le date e le normalizza in ISO', () => {
    expect(campi.dataViolazione).toBe('2026-01-10');
    expect(campi.dataNotifica).toBe('2026-05-02');
    expect(campi.dataTaratura).toBe('2025-02-05');
    expect(campi.oraViolazione).toBe('14:30');
  });

  it('legge importi e punti', () => {
    expect(campi.importo).toBe(544);
    expect(campi.speseNotifica).toBe(16.5);
    expect(campi.puntiDecurtati).toBe(6);
  });

  it('legge le velocita', () => {
    expect(campi.velocitaRilevata).toBe(118);
    expect(campi.velocitaContestata).toBe(112);
    expect(campi.limiteVelocita).toBe(70);
  });

  it('riconosce autovelox, mancata contestazione e strumento solo approvato', () => {
    expect(campi.tipoAccertamento).toBe('autovelox');
    expect(campi.contestazioneImmediata).toBe(false);
    expect(campi.motivazioneMancataContestazione).toBe(true);
    expect(campi.strumentoOmologato).toBe('no');
  });

  it('legge il luogo', () => {
    expect(campi.luogo).toMatch(/Via Palmanova 45/i);
  });

  it('non inventa campi su un testo vuoto', () => {
    const { campi: vuoti, trovati } = estraiDaTesto('');
    expect(trovati).toHaveLength(0);
    expect(Object.keys(vuoti)).toHaveLength(0);
  });
});

describe('varianti di formato', () => {
  it('riconosce la ZTL e la data scritta a parole', () => {
    const { campi } = estraiDaTesto(
      'Accesso non autorizzato in zona a traffico limitato varco elettronico. In data 3 marzo 2026 art. 7 C.d.S. importo € 88,00',
    );
    expect(campi.tipoAccertamento).toBe('ztl');
    expect(campi.dataViolazione).toBe('2026-03-03');
    expect(campi.articolo).toBe('7');
    expect(campi.importo).toBe(88);
  });

  it('riconosce lo strumento omologato', () => {
    const { campi } = estraiDaTesto('apparecchio autovelox omologato con D.M. 1122');
    expect(campi.strumentoOmologato).toBe('si');
  });
});
