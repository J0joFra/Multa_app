import React, { useRef, useState } from 'react';
import { Camera as CameraIcon, Image as ImageIcon, PencilLine, Loader2 } from 'lucide-react';
import { Schermata, Bottone, Avviso } from '../components/ui.jsx';
import { leggiTesto } from '../lib/ocr.js';
import { estraiDaTesto } from '../lib/parser.js';
import { comprimiImmagine } from '../lib/storage.js';
import { nuovoVerbale } from '../lib/verbale.js';

/** Passo 1: foto del verbale, OCR, campi precompilati. */
export default function Acquisisci({ onIndietro, onPronto }) {
  const [stato, setStato] = useState('idle'); // idle | ocr | errore
  const [avanzamento, setAvanzamento] = useState(0);
  const [errore, setErrore] = useState('');
  const fileRef = useRef(null);

  async function scatta() {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const foto = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        correctOrientation: true,
      });
      await elabora(foto.dataUrl);
    } catch (e) {
      // Fuori da Android (o permesso negato) si passa dal file picker.
      if (String(e?.message || '').toLowerCase().includes('cancel')) return;
      fileRef.current?.click();
    }
  }

  function daFile(ev) {
    const f = ev.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => elabora(String(r.result));
    r.readAsDataURL(f);
    ev.target.value = '';
  }

  async function elabora(dataUrl) {
    setStato('ocr');
    setErrore('');
    setAvanzamento(0);
    try {
      const foto = await comprimiImmagine(dataUrl);
      const testo = await leggiTesto(foto, setAvanzamento);
      const { campi, trovati } = estraiDaTesto(testo);
      onPronto(nuovoVerbale({ ...campi, fotoVerbale: foto, testoOcr: testo }), trovati);
    } catch (e) {
      setStato('errore');
      setErrore(
        String(e?.message || e).match(/network|fetch|load/i)
          ? 'Non sono riuscito a scaricare il modello di riconoscimento testo. Serve la rete la prima volta: riprova connesso, oppure inserisci i dati a mano.'
          : 'Non sono riuscito a leggere la foto. Riprova con una luce migliore, oppure inserisci i dati a mano.',
      );
    }
  }

  if (stato === 'ocr') {
    return (
      <Schermata titolo="Lettura in corso">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="animate-spin text-blue-500 mb-6" size={40} />
          <p className="text-slate-300">Sto leggendo il verbale…</p>
          <div className="w-full max-w-xs h-1.5 bg-panel rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.round(avanzamento * 100)}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-4">La prima volta scarico il modello italiano: può volerci qualche secondo.</p>
        </div>
      </Schermata>
    );
  }

  return (
    <Schermata titolo="Nuova multa" onIndietro={onIndietro}>
      <p className="text-slate-400 mb-6 leading-relaxed">
        Fotografa il verbale per intero, ben illuminato e senza pieghe. Leggo i dati e
        poi te li faccio correggere: quello che non riesco a leggere lo scrivi tu.
      </p>

      {errore && (
        <div className="bg-bad/10 border border-bad/40 rounded-xl p-3 mb-4 text-sm text-red-200">{errore}</div>
      )}

      <div className="space-y-3">
        <Bottone onClick={scatta}>
          <span className="flex items-center justify-center gap-2"><CameraIcon size={18} /> Scatta una foto</span>
        </Bottone>
        <Bottone variante="neutro" onClick={() => fileRef.current?.click()}>
          <span className="flex items-center justify-center gap-2"><ImageIcon size={18} /> Scegli dalla galleria</span>
        </Bottone>
        <Bottone variante="neutro" onClick={() => onPronto(nuovoVerbale(), [])}>
          <span className="flex items-center justify-center gap-2"><PencilLine size={18} /> Inserisci a mano</span>
        </Bottone>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={daFile} className="hidden" />

      <Avviso>
        La foto e i dati restano sul telefono: non li mando da nessuna parte. Il riconoscimento
        del testo gira in locale, ma la prima volta scarica il modello linguistico dalla rete.
      </Avviso>
    </Schermata>
  );
}
