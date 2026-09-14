import { describe, it, expect } from 'vitest';
import { VIE, cittaCompetente, linkUfficio } from '../src/lib/procedure.js';
import { nuovoVerbale } from '../src/lib/verbale.js';

describe('cittaCompetente', () => {
  it('prende il comune dalla coda dell indirizzo', () => {
    expect(cittaCompetente(nuovoVerbale({ luogo: 'Via Palmanova 45, Milano' }))).toBe('Milano');
  });

  it('ripiega sull organo accertatore', () => {
    expect(cittaCompetente(nuovoVerbale({ luogo: '', organo: 'Polizia Locale di Bergamo' }))).toBe('Bergamo');
  });

  it('scarta una coda che è solo un numero civico', () => {
    expect(cittaCompetente(nuovoVerbale({ luogo: 'Via Roma, 12' }))).toBe('');
  });

  it('non inventa una città quando non ci sono dati', () => {
    expect(cittaCompetente(nuovoVerbale())).toBe('');
    expect(linkUfficio(VIE[0], nuovoVerbale())).toBeNull();
  });
});

describe('VIE', () => {
  it('usa i termini di legge, non numeri scritti a mano', () => {
    expect(VIE.find((v) => v.id === 'prefetto').giorni).toBe(60);
    expect(VIE.find((v) => v.id === 'giudice').giorni).toBe(30);
    expect(VIE.find((v) => v.id === 'paga').giorni).toBe(5);
  });

  it('costruisce un link di ricerca per l ufficio competente', () => {
    const l = linkUfficio(VIE[1], nuovoVerbale({ luogo: 'Corso Buenos Aires 10, Milano' }));
    expect(l).toContain('giudice%20di%20pace');
    expect(l).toContain('Milano');
  });
});
