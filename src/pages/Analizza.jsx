import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Camera as CameraIcon, Image as ImageIcon, PencilLine, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { Bottone, Avviso } from '../components/ui.jsx';
import { leggiTesto } from '../lib/ocr.js';
import { estraiDaTesto } from '../lib/parser.js';
import { comprimiImmagine } from '../lib/storage.js';
import { nuovoVerbale } from '../lib/verbale.js';
import { useVerbali } from '../lib/store.jsx';

/** Passo 1: foto del verbale, OCR, campi precompilati. */
export default function Analizza() {
  const [stato, setStato] = useState('idle'); // idle | ocr
  const [avanzamento, setAvanzamento] = useState(0);
  const [errore, setErrore] = useState('');
  const fileRef = useRef(null);
  const { apriBozza } = useVerbali();
  const navigate = useNavigate();

  function vaiAllaScheda(verbale, letti) {
    apriBozza(verbale, letti);
    navigate(`/scheda/${verbale.id}`);
  }

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
      vaiAllaScheda(nuovoVerbale({ ...campi, fotoVerbale: foto, testoOcr: testo }), trovati);
    } catch (e) {
      setStato('idle');
      setErrore(
        String(e?.message || e).match(/network|fetch|load/i)
          ? 'Non sono riuscito a scaricare il modello di riconoscimento testo. Serve la rete la prima volta: riprova connesso, oppure inserisci i dati a mano.'
          : 'Non sono riuscito a leggere la foto. Riprova con una luce migliore, oppure inserisci i dati a mano.',
      );
    }
  }

  return (
    <>
      <PageHeader icon={ScanLine} title="Analizza" sottotitolo="Fotografa il verbale" />

      <div className="px-4 py-5 space-y-4">
        {stato === 'ocr' ? (
          <div className="app-card p-8 text-center">
            <Loader2 className="animate-spin text-primary mx-auto mb-5" size={38} />
            <h2 className="font-heading font-black text-xl uppercase tracking-wide mb-1">Lettura in corso</h2>
            <p className="text-sm text-gray-600">Sto leggendo il verbale…</p>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(avanzamento * 100)}%` }} />
            </div>
            <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
              La prima volta scarico il modello italiano: può volerci qualche secondo.
            </p>
          </div>
        ) : (
          <>
            <div className="app-card p-5">
              <h2 className="font-heading font-black text-xl uppercase tracking-wide mb-2">Come fare la foto</h2>
              <ul className="space-y-1.5">
                {[
                  'Verbale intero nell\'inquadratura, senza tagliare i bordi.',
                  'Luce diffusa, niente ombra della mano sul testo.',
                  'Foglio steso: le pieghe mandano in confusione l\'OCR.',
                ].map((r) => (
                  <li key={r} className="text-sm text-gray-600 flex gap-2 leading-relaxed">
                    <span className="text-primary font-bold">·</span>{r}
                  </li>
                ))}
              </ul>
            </div>

            {errore && (
              <div className="app-card p-4 border-l-4 border-destructive">
                <p className="text-sm text-gray-700 leading-relaxed">{errore}</p>
              </div>
            )}

            <div className="space-y-3">
              <Bottone onClick={scatta}>
                <span className="flex items-center justify-center gap-2"><CameraIcon className="w-[18px] h-[18px]" /> Scatta una foto</span>
              </Bottone>
              <Bottone variante="neutro" onClick={() => fileRef.current?.click()}>
                <span className="flex items-center justify-center gap-2"><ImageIcon className="w-[18px] h-[18px]" /> Scegli dalla galleria</span>
              </Bottone>
              <Bottone variante="neutro" onClick={() => vaiAllaScheda(nuovoVerbale(), [])}>
                <span className="flex items-center justify-center gap-2"><PencilLine className="w-[18px] h-[18px]" /> Inserisci a mano</span>
              </Bottone>
            </div>

            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={daFile} className="hidden" />

            <Avviso>
              La foto e i dati restano sul telefono: non li mando da nessuna parte. Il
              riconoscimento del testo gira in locale, ma la prima volta scarica il modello
              linguistico dalla rete.
            </Avviso>
          </>
        )}
      </div>
    </>
  );
}
