import { createWorker } from 'tesseract.js';

let workerPromise = null;

/** Un solo worker per sessione: inizializzarlo costa qualche secondo. */
async function getWorker(onProgress) {
  if (!workerPromise) {
    workerPromise = createWorker('ita', 1, {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') onProgress(m.progress);
      },
    }).catch((e) => {
      workerPromise = null;
      throw e;
    });
  }
  return workerPromise;
}

/**
 * Riconosce il testo di una foto del verbale.
 * Richiede rete la prima volta: tesseract scarica il modello italiano.
 */
export async function leggiTesto(dataUrl, onProgress) {
  const worker = await getWorker(onProgress);
  const { data } = await worker.recognize(dataUrl);
  return data.text || '';
}

export async function chiudiOcr() {
  if (!workerPromise) return;
  try {
    const w = await workerPromise;
    await w.terminate();
  } catch {
    /* niente da chiudere */
  }
  workerPromise = null;
}
