import React from 'react';
import { Plus, Trash2, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';
import { Schermata } from '../components/ui.jsx';
import { analizzaVerbale, CRITICO, ATTENZIONE } from '../lib/regole.js';
import { formatIT } from '../lib/date.js';
import { infoViolazione } from '../lib/cds.js';

const BADGE = {
  [CRITICO]: { icona: XCircle, cls: 'text-bad', testo: 'Contestabile' },
  [ATTENZIONE]: { icona: AlertTriangle, cls: 'text-warn', testo: 'Da verificare' },
  ok: { icona: ShieldCheck, cls: 'text-ok', testo: 'Regolare' },
};

export default function Elenco({ verbali, onNuovo, onApri, onElimina }) {
  return (
    <Schermata
      titolo="MultaCheck"
      azione={
        <button onClick={onNuovo} aria-label="Nuova multa" className="p-2 rounded-lg bg-blue-600 active:bg-blue-700">
          <Plus size={20} />
        </button>
      }
    >
      {verbali.length === 0 ? (
        <div className="text-center py-16">
          <ShieldCheck className="mx-auto text-slate-700 mb-5" size={56} />
          <h2 className="text-lg font-semibold mb-2">Hai preso una multa?</h2>
          <p className="text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
            Fotografa il verbale: ti dico dove l&apos;hai presa, entro quando puoi pagare o
            fare ricorso, e se ci sono vizi che la rendono contestabile.
          </p>
          <button onClick={onNuovo} className="bg-blue-600 active:bg-blue-700 text-white rounded-xl px-6 py-3 font-medium">
            Aggiungi la prima multa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {verbali.map((v) => {
            const { verdetto } = analizzaVerbale(v);
            const b = BADGE[verdetto.livello] || BADGE.ok;
            const info = infoViolazione(v.articolo, v.comma);
            return (
              <article key={v.id} className="rounded-xl border border-line bg-panel overflow-hidden">
                <button onClick={() => onApri(v)} className="w-full text-left p-4 active:bg-line">
                  <div className="flex items-center gap-2 mb-1.5">
                    <b.icona className={b.cls} size={16} />
                    <span className={`text-xs font-medium ${b.cls}`}>{b.testo}</span>
                    <span className="text-xs text-slate-500 ml-auto">{formatIT(v.dataViolazione)}</span>
                  </div>
                  <h3 className="font-medium text-slate-100 truncate">
                    {info ? info.titolo : v.descrizione || 'Violazione non specificata'}
                  </h3>
                  <p className="text-sm text-slate-400 truncate mt-0.5">{v.luogo || 'Luogo non indicato'}</p>
                  {Number.isFinite(Number(v.importo)) && Number(v.importo) > 0 && (
                    <p className="text-sm text-slate-300 mt-2">{Number(v.importo).toFixed(2)} €</p>
                  )}
                </button>
                <div className="border-t border-line px-4 py-2 flex justify-end">
                  <button
                    onClick={() => onElimina(v.id)}
                    aria-label="Elimina"
                    className="p-2 -mr-2 text-slate-500 active:text-bad"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Schermata>
  );
}
