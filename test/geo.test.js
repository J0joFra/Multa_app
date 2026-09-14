import { describe, it, expect } from 'vitest';
import { normalizzaMaxspeed, interpretaStrade, LIMITI_PRESUNTI } from '../src/lib/geo.js';

describe('normalizzaMaxspeed', () => {
  it('legge i valori numerici', () => {
    expect(normalizzaMaxspeed('50')).toBe(50);
    expect(normalizzaMaxspeed('130 km/h')).toBe(130);
  });

  it('converte le miglia orarie', () => {
    expect(normalizzaMaxspeed('30 mph')).toBe(48);
  });

  it('traduce i tag italiani', () => {
    expect(normalizzaMaxspeed('IT:urban')).toBe(50);
    expect(normalizzaMaxspeed('IT:motorway')).toBe(130);
  });

  it('scarta i valori che non sono un limite', () => {
    for (const v of [null, undefined, '', 'none', 'walk', 'signals', 'variable', '999']) {
      expect(normalizzaMaxspeed(v)).toBeNull();
    }
  });
});

describe('interpretaStrade', () => {
  const via = (tags) => ({ type: 'way', tags });

  it('preferisce la strada che porta il nome scritto sul verbale', () => {
    const r = interpretaStrade([
      via({ highway: 'residential', name: 'Via Bergamo', maxspeed: '30' }),
      via({ highway: 'primary', name: 'Via Palmanova', maxspeed: '50' }),
    ], 'Via Palmanova 45, Milano');
    expect(r.strada).toBe('Via Palmanova');
    expect(r.limite).toBe(50);
    expect(r.fonte).toBe('osm');
  });

  it('a parità di nome preferisce la strada con il limite mappato', () => {
    const r = interpretaStrade([
      via({ highway: 'residential', name: 'Via A' }),
      via({ highway: 'residential', name: 'Via B', maxspeed: '50' }),
    ]);
    expect(r.fonte).toBe('osm');
    expect(r.limite).toBe(50);
  });

  it('ricade sul tipo di strada quando il limite non è mappato', () => {
    const r = interpretaStrade([via({ highway: 'motorway', ref: 'A4' })], 'A4');
    expect(r.limite).toBe(LIMITI_PRESUNTI.motorway);
    expect(r.fonte).toBe('presunto');
    expect(r.strada).toBe('A4');
  });

  it('usa maxspeed:type prima del tipo di strada', () => {
    const r = interpretaStrade([via({ highway: 'tertiary', name: 'Via X', 'maxspeed:type': 'IT:urban' })]);
    expect(r.limite).toBe(50);      // urbana, non i 90 del tipo "tertiary"
    expect(r.fonte).toBe('presunto');
  });

  it('non inventa un limite per una strada non classificata', () => {
    const r = interpretaStrade([via({ highway: 'footway', name: 'Vicolo' })]);
    expect(r.limite).toBeNull();
    expect(r.fonte).toBeNull();
  });

  it('restituisce null quando non c è nessuna strada', () => {
    expect(interpretaStrade([])).toBeNull();
    expect(interpretaStrade([{ type: 'node', tags: { amenity: 'cafe' } }])).toBeNull();
  });
});
