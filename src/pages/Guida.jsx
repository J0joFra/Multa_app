import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { Sezione, Avviso } from '../components/ui.jsx';
import { REGOLE, TERMINI } from '../lib/regole.js';
import { AGGIORNATO_AL } from '../lib/cds.js';

const ORDINE = ['Notifica', 'Forma del verbale', 'Autovelox', 'ZTL', 'Semaforo', 'Importi', 'Scadenze', 'Adempimenti'];

/** La guida è generata dalle stesse regole che girano nell'analisi: non può divergere. */
export default function Guida() {
  const categorie = ORDINE
    .map((c) => [c, REGOLE.filter((r) => r.categoria === c)])
    .filter(([, r]) => r.length > 0);

  return (
    <>
      <PageHeader icon={BookOpen} title="Guida" sottotitolo={`${REGOLE.length} controlli sul verbale`} />

      <div className="px-4 py-5 space-y-4">
        <div className="dark-card p-5">
          <h2 className="font-heading font-black text-xl uppercase tracking-wide mb-2">Tre numeri da ricordare</h2>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              [TERMINI.notifica, 'giorni per notificarti il verbale'],
              [TERMINI.sconto, 'giorni per lo sconto del 30%'],
              [TERMINI.prefetto, 'giorni per il ricorso al Prefetto'],
            ].map(([n, testo]) => (
              <div key={testo} className="bg-white/10 rounded-xl px-3 py-3 text-center">
                <p className="font-heading font-black text-3xl leading-none">{n}</p>
                <p className="text-[10px] leading-tight mt-1.5 opacity-80">{testo}</p>
              </div>
            ))}
          </div>
        </div>

        {categorie.map(([categoria, regole]) => (
          <Sezione key={categoria} titolo={categoria}>
            <div className="space-y-3">
              {regole.map((r) => <Voce key={r.id} regola={r} />)}
            </div>
          </Sezione>
        ))}

        <Avviso>
          Importi delle sanzioni aggiornati al {AGGIORNATO_AL}: sono rivisti per decreto ogni
          due anni, quindi servono solo a segnalare una cifra fuori scala. MultaCheck applica
          controlli standard, non è un parere legale.
        </Avviso>
      </div>
    </>
  );
}

function Voce({ regola }) {
  const [aperta, setAperta] = useState(false);
  return (
    <div className="app-card overflow-hidden">
      <button
        onClick={() => setAperta((a) => !a)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left active:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 flex-1 leading-snug">{regola.titolo}</span>
        {aperta ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {aperta && (
        <div className="px-4 pb-4 -mt-1">
          <p className="text-sm text-gray-600 leading-relaxed">{regola.sintesi}</p>
          <p className="text-[11px] text-gray-400 mt-2 font-mono">{regola.riferimento}</p>
        </div>
      )}
    </div>
  );
}
