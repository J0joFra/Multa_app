import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, XCircle, CheckCircle2, Info, MapPin, FileText, Copy, Save, Pencil,
} from 'lucide-react';
import { Schermata, Bottone, Avviso } from '../components/ui.jsx';
import { analizzaVerbale, CRITICO, ATTENZIONE, OK, INFO } from '../lib/regole.js';
import { bozzaRicorso } from '../lib/ricorso.js';
import { linkLuogo, COSA_GUARDARE } from '../lib/luogo.js';

const STILE = {
  [CRITICO]: { icona: XCircle, colore: 'text-bad', bordo: 'border-bad/40', sfondo: 'bg-bad/10', etichetta: 'Contestabile' },
  [ATTENZIONE]: { icona: AlertTriangle, colore: 'text-warn', bordo: 'border-warn/40', sfondo: 'bg-warn/10', etichetta: 'Da verificare' },
  [OK]: { icona: CheckCircle2, colore: 'text-ok', bordo: 'border-line', sfondo: 'bg-panel', etichetta: 'Regolare' },
  [INFO]: { icona: Info, colore: 'text-blue-400', bordo: 'border-line', sfondo: 'bg-panel', etichetta: 'Scadenza' },
};

const ORDINE = [CRITICO, ATTENZIONE, INFO, OK];

export default function Analisi({ verbale, onIndietro, onModifica, onSalva, salvato }) {
  const [ricorso, setRicorso] = useState(null);
  const [copiato, setCopiato] = useState(false);
  const analisi = useMemo(() => analizzaVerbale(verbale), [verbale]);
  const link = linkLuogo(verbale.luogo);
  const daGuardare = COSA_GUARDARE[verbale.tipoAccertamento] || COSA_GUARDARE.altro;
  const stileVerdetto = STILE[analisi.verdetto.livello];

  async function condividi(testo) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: 'Bozza di ricorso', text: testo });
    } catch {
      try {
        await navigator.clipboard.writeText(testo);
        setCopiato(true);
        setTimeout(() => setCopiato(false), 2000);
      } catch {
        /* niente clipboard: il testo resta comunque selezionabile a schermo */
      }
    }
  }

  if (ricorso) {
    return (
      <Schermata titolo="Bozza di ricorso" onIndietro={() => setRicorso(null)}>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-panel border border-line rounded-xl p-4 mb-4 font-sans text-slate-200">
          {ricorso.testo}
        </pre>
        <Bottone onClick={() => condividi(ricorso.testo)}>
          <span className="flex items-center justify-center gap-2"><Copy size={18} /> {copiato ? 'Copiato' : 'Condividi o copia'}</span>
        </Bottone>
      </Schermata>
    );
  }

  return (
    <Schermata
      titolo="Esito dell'analisi"
      onIndietro={onIndietro}
      azione={
        <button onClick={onModifica} aria-label="Modifica i dati" className="p-2 rounded-lg active:bg-panel">
          <Pencil size={18} />
        </button>
      }
    >
      <div className={`rounded-2xl border p-4 mb-6 ${stileVerdetto.bordo} ${stileVerdetto.sfondo}`}>
        <div className="flex items-center gap-2 mb-2">
          <stileVerdetto.icona className={stileVerdetto.colore} size={22} />
          <h2 className="text-lg font-semibold">{analisi.verdetto.titolo}</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{analisi.verdetto.testo}</p>
      </div>

      {ORDINE.map((livello) => {
        const gruppo = analisi.esiti.filter((e) => e.esito === livello);
        if (!gruppo.length) return null;
        const s = STILE[livello];
        return (
          <section key={livello} className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              {s.etichetta} · {gruppo.length}
            </h3>
            <div className="space-y-3">
              {gruppo.map((e) => (
                <article key={e.id} className={`rounded-xl border p-3.5 ${s.bordo} ${s.sfondo}`}>
                  <div className="flex items-start gap-2.5">
                    <s.icona className={`${s.colore} shrink-0 mt-0.5`} size={18} />
                    <div className="min-w-0">
                      <h4 className="font-medium text-slate-100">{e.titolo}</h4>
                      <p className="text-sm text-slate-300 mt-1 leading-relaxed">{e.messaggio}</p>
                      {e.dettaglio && <p className="text-sm text-slate-400 mt-1">{e.dettaglio}</p>}
                      {e.azione && (
                        <p className="text-sm text-slate-200 mt-2 border-l-2 border-slate-600 pl-2.5">{e.azione}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">{e.riferimento}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Dove l&apos;hai presa</h3>
        <div className="rounded-xl border border-line bg-panel p-3.5">
          <div className="flex items-start gap-2.5 mb-3">
            <MapPin className="text-slate-400 shrink-0 mt-0.5" size={18} />
            <p className="text-slate-100">{verbale.luogo || 'Luogo non indicato'}</p>
          </div>
          {link && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <a href={link.streetView} target="_blank" rel="noreferrer" className="text-center text-sm py-2 rounded-lg bg-ink border border-line text-blue-300">
                Street View
              </a>
              <a href={link.mappa} target="_blank" rel="noreferrer" className="text-center text-sm py-2 rounded-lg bg-ink border border-line text-blue-300">
                Mappa
              </a>
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Cosa guardare</p>
          <ul className="space-y-1.5">
            {daGuardare.map((r) => (
              <li key={r} className="text-sm text-slate-300 flex gap-2">
                <span className="text-slate-600">—</span>{r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="space-y-3">
        {!salvato && (
          <Bottone variante="neutro" onClick={onSalva}>
            <span className="flex items-center justify-center gap-2"><Save size={18} /> Salva questa multa</span>
          </Bottone>
        )}
        <Bottone onClick={() => setRicorso({ testo: bozzaRicorso(verbale, 'prefetto') })}>
          <span className="flex items-center justify-center gap-2"><FileText size={18} /> Bozza di ricorso al Prefetto</span>
        </Bottone>
        <Bottone variante="neutro" onClick={() => setRicorso({ testo: bozzaRicorso(verbale, 'giudice') })}>
          <span className="flex items-center justify-center gap-2"><FileText size={18} /> Bozza per il Giudice di Pace</span>
        </Bottone>
      </div>

      <Avviso>
        MultaCheck applica controlli standard sui dati che hai inserito: non è un parere
        legale e non conosce il tuo verbale meglio di te. Prima di rinunciare allo sconto
        del 30% o di pagare, leggi il verbale per intero e, se la cifra è alta, senti un avvocato.
      </Avviso>
    </Schermata>
  );
}
