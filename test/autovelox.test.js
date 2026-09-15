import { describe, it, expect } from 'vitest';
import { aGeoJson, daGeoJson, inBbox } from '../src/lib/autovelox.js';

const postazioni = [
  { id: 'node/1', lat: 45.123456789, lon: 9.987654321, limite: 70, direzione: 'forward', tipo: 'speed_camera', nome: null },
  { id: 'node/2', lat: 41.9, lon: 12.5, limite: null, direzione: null, tipo: null, nome: 'Tutor A1' },
];

describe('aGeoJson', () => {
  const g = aGeoJson(postazioni, { estrattoIl: '2026-09-15' });

  it('scrive una FeatureCollection con fonte e data', () => {
    expect(g.type).toBe('FeatureCollection');
    expect(g.fonte).toMatch(/OpenStreetMap/);
    expect(g.estrattoIl).toBe('2026-09-15');
    expect(g.features).toHaveLength(2);
  });

  it('mette le coordinate in ordine GeoJSON e le arrotonda', () => {
    expect(g.features[0].geometry.coordinates).toEqual([9.98765, 45.12346]);
  });

  it('non scrive le proprietà vuote', () => {
    expect(g.features[0].properties).toEqual({ limite: 70, direzione: 'forward', tipo: 'speed_camera' });
    expect(g.features[1].properties).toEqual({ nome: 'Tutor A1' });
  });
});

describe('daGeoJson', () => {
  it('torna alla forma usata dalla mappa', () => {
    const r = daGeoJson(aGeoJson(postazioni));
    expect(r[0]).toMatchObject({ id: 'node/1', lat: 45.12346, lon: 9.98765, limite: 70 });
    expect(r[1]).toMatchObject({ id: 'node/2', limite: null, nome: 'Tutor A1' });
  });

  it('regge un file rotto o vuoto senza esplodere', () => {
    expect(daGeoJson(null)).toEqual([]);
    expect(daGeoJson({})).toEqual([]);
    expect(daGeoJson({ features: [{ type: 'Feature' }, { geometry: { coordinates: ['x', 'y'] } }] })).toEqual([]);
  });

  it('il giro completo non perde postazioni', () => {
    expect(daGeoJson(aGeoJson(postazioni))).toHaveLength(postazioni.length);
  });
});

describe('inBbox', () => {
  const p = daGeoJson(aGeoJson(postazioni));

  it('tiene solo le postazioni dentro il riquadro', () => {
    const milano = { sud: 45, ovest: 9, nord: 46, est: 10 };
    expect(inBbox(p, milano).map((x) => x.id)).toEqual(['node/1']);
  });

  it('restituisce tutto quando il riquadro copre l Italia', () => {
    expect(inBbox(p, { sud: 35, ovest: 6, nord: 48, est: 19 })).toHaveLength(2);
  });

  it('non esplode su riquadro o elenco mancanti', () => {
    expect(inBbox(p, null)).toEqual([]);
    expect(inBbox(null, { sud: 0, ovest: 0, nord: 1, est: 1 })).toEqual([]);
  });
});
