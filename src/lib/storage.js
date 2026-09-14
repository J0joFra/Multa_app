import { Preferences } from '@capacitor/preferences';

const CHIAVE = 'multacheck.verbali.v1';
const CHIAVE_LIMITI = 'multacheck.limiti.v1';

/** Preferences su device, localStorage nel browser: stessa API per entrambi. */
async function leggiGrezzo(chiave) {
  try {
    const { value } = await Preferences.get({ key: chiave });
    if (value != null) return value;
  } catch {
    /* fuori da Capacitor */
  }
  try {
    return localStorage.getItem(chiave);
  } catch {
    return null;
  }
}

async function scriviGrezzo(chiave, value) {
  try {
    await Preferences.set({ key: chiave, value });
    return;
  } catch {
    /* fuori da Capacitor */
  }
  try {
    localStorage.setItem(chiave, value);
  } catch {
    /* quota piena: meglio perdere il salvataggio che bloccare la UI */
  }
}

async function caricaJson(chiave, vuoto) {
  const grezzo = await leggiGrezzo(chiave);
  if (!grezzo) return vuoto;
  try {
    const dati = JSON.parse(grezzo);
    return dati ?? vuoto;
  } catch {
    return vuoto;
  }
}

export async function caricaVerbali() {
  const dati = await caricaJson(CHIAVE, []);
  return Array.isArray(dati) ? dati : [];
}

export async function salvaVerbali(verbali) {
  await scriviGrezzo(CHIAVE, JSON.stringify(verbali));
}

/** Le ultime zone cercate: riaprendo la scheda si riparte da dove si era. */
export async function caricaRicercheLimiti() {
  const dati = await caricaJson(CHIAVE_LIMITI, []);
  return Array.isArray(dati) ? dati : [];
}

export async function salvaRicercheLimiti(ricerche) {
  await scriviGrezzo(CHIAVE_LIMITI, JSON.stringify(ricerche.slice(0, 6)));
}

/** Ridimensiona la foto prima di salvarla: i verbali sono leggibili anche a 1400px. */
export function comprimiImmagine(dataUrl, latoMax = 1400, qualita = 0.72) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scala = Math.min(1, latoMax / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scala);
      c.height = Math.round(img.height * scala);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', qualita));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
