import { Preferences } from '@capacitor/preferences';

const CHIAVE = 'multacheck.verbali.v1';

/** Preferences su device, localStorage nel browser: stessa API per entrambi. */
async function leggiGrezzo() {
  try {
    const { value } = await Preferences.get({ key: CHIAVE });
    if (value != null) return value;
  } catch {
    /* fuori da Capacitor */
  }
  try {
    return localStorage.getItem(CHIAVE);
  } catch {
    return null;
  }
}

async function scriviGrezzo(value) {
  try {
    await Preferences.set({ key: CHIAVE, value });
    return;
  } catch {
    /* fuori da Capacitor */
  }
  try {
    localStorage.setItem(CHIAVE, value);
  } catch {
    /* quota piena: meglio perdere il salvataggio che bloccare la UI */
  }
}

export async function caricaVerbali() {
  const grezzo = await leggiGrezzo();
  if (!grezzo) return [];
  try {
    const dati = JSON.parse(grezzo);
    return Array.isArray(dati) ? dati : [];
  } catch {
    return [];
  }
}

export async function salvaVerbali(verbali) {
  await scriviGrezzo(JSON.stringify(verbali));
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
