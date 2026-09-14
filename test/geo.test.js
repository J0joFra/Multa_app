import { describe, it, expect } from 'vitest';
import { normalizzaMaxspeed, interpretaStrade, interpretaAutovelox, distanzaMetri, LIMITI_PRESUNTI } from '../src/lib/geo.js';

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

describe('interpretaAutovelox', () => {
  it('legge posizione, limite e direzione', () => {
    const r = interpretaAutovelox([
      { type: 'node', id: 1, lat: 45.5, lon: 9.2, tags: { highway: 'speed_camera', maxspeed: '70', direction: 'forward' } },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ id: 'node/1', lat: 45.5, lon: 9.2, limite: 70, direzione: 'forward' });
  });

  it('non duplica la stessa postazione descritta due volte', () => {
    const r = interpretaAutovelox([
      { type: 'node', id: 1, lat: 45.5, lon: 9.2, tags: { highway: 'speed_camera' } },
      { type: 'node', id: 2, lat: 45.5, lon: 9.2, tags: { enforcement: 'maxspeed' } },
    ]);
    expect(r).toHaveLength(1);
  });

  it('scarta gli elementi senza coordinate', () => {
    expect(interpretaAutovelox([{ type: 'way', id: 9, tags: { highway: 'speed_camera' } }])).toHaveLength(0);
    expect(interpretaAutovelox([])).toHaveLength(0);
    expect(interpretaAutovelox(null)).toHaveLength(0);
  });

  it('usa il centro quando il nodo arriva come relazione', () => {
    const r = interpretaAutovelox([
      { type: 'relation', id: 7, center: { lat: 44.1, lon: 11.2 }, tags: { enforcement: 'maxspeed', maxspeed: '110' } },
    ]);
    expect(r[0]).toMatchObject({ lat: 44.1, lon: 11.2, limite: 110 });
  });
});

describe('distanzaMetri', () => {
  it('misura zero sullo stesso punto', () => {
    expect(distanzaMetri(45.5, 9.2, 45.5, 9.2)).toBe(0);
  });

  it('un centesimo di grado di latitudine fa circa 1,1 km', () => {
    const d = distanzaMetri(45.5, 9.2, 45.51, 9.2);
    expect(d).toBeGreaterThan(1050);
    expect(d).toBeLessThan(1170);
  });
});
