// Utility di date: tutto ragiona su stringhe ISO "YYYY-MM-DD" per evitare
// sorprese di fuso orario sul WebView Android.

export function parseISO(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (Number.isNaN(d.getTime())) return null;
  // Rifiuta date impossibili tipo 2026-02-31 normalizzate da Date.
  if (d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
  return d;
}

/** Giorni interi fra due date ISO (b - a). null se una delle due manca. */
export function giorniTra(a, b) {
  const da = parseISO(a);
  const db = parseISO(b);
  if (!da || !db) return null;
  return Math.round((db - da) / 86400000);
}

/** Somma giorni a una data ISO e restituisce una data ISO. */
export function addGiorni(iso, n) {
  const d = parseISO(iso);
  if (!d) return null;
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function oggiISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

/** "2026-05-02" -> "02/05/2026" */
export function formatIT(iso) {
  const d = parseISO(iso);
  if (!d) return '—';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/** "02/05/2026" | "02-05-26" | "2 maggio 2026" -> "2026-05-02" */
const MESI = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
  luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
};

export function normalizzaData(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();

  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return iso(+m[1], +m[2], +m[3]);

  m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/.exec(s);
  if (m) {
    let anno = +m[3];
    if (anno < 100) anno += anno < 70 ? 2000 : 1900;
    return iso(anno, +m[2], +m[1]);
  }

  m = /^(\d{1,2})\s+([a-zàèéìòù]+)\s+(\d{4})$/.exec(s);
  if (m && MESI[m[2]]) return iso(+m[3], MESI[m[2]], +m[1]);

  return null;
}

function iso(y, mo, d) {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const p = (n) => String(n).padStart(2, '0');
  const out = `${y}-${p(mo)}-${p(d)}`;
  return parseISO(out) ? out : null;
}
