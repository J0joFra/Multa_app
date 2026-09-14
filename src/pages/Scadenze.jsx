import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ChevronRight, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { Sezione, Avviso } from '../components/ui.jsx';
import { useVerbali } from '../lib/store.jsx';
import { scadenzeVerbale } from '../lib/regole.js';
import { formatIT } from '../lib/date.js';
import { infoViolazione } from '../lib/cds.js';

/** Tutte le scadenze di tutti i verbali, in ordine: quella che scade prima in cima. */
export default function Scadenze() {
  const { verbali } = useVerbali();

  const tutte = verbali
    .flatMap((v) => scadenzeVerbale(v).map((s) => ({ ...s, verbale: v })))
    .sort((a, b) => String(a.data).localeCompare(String(b.data)));

  const attive = tutte.filter((s) => !s.scaduta);
  const scadute = tutte.filter((s) => s.scaduta);
  const urgenti = attive.filter((s) => s.restanti <= 7).length;

  return (
    <>
      <PageHeader
        icon={CalendarClock}
        title="Scadenze"
        sottotitolo={attive.length ? `${attive.length} in corso${urgenti ? `, ${urgenti} entro una settimana` : ''}` : 'Nessuna scadenza attiva'}
      />

      <div className="px-4 py-5 space-y-4">
        {tutte.length === 0 && (
          <div className="app-card p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 leading-relaxed">
              Nessuna scadenza da seguire. Le vedrai qui appena aggiungi una multa con la
              data di notifica.
            </p>
          </div>
        )}

        {attive.length > 0 && (
          <Sezione titolo="In corso">
            <div className="space-y-3">
              {attive.map((s) => <RigaScadenza key={`${s.verbaleId}-${s.id}`} s={s} />)}
            </div>
          </Sezione>
        )}

        {scadute.length > 0 && (
          <Sezione titolo="Scadute">
            <div className="space-y-3 opacity-60">
              {scadute.map((s) => <RigaScadenza key={`${s.verbaleId}-${s.id}`} s={s} />)}
            </div>
          </Sezione>
        )}

        {tutte.length > 0 && (
          <Avviso>
            I termini decorrono dalla contestazione sul posto o dalla notifica. Se una data
            è sbagliata nella scheda, qui sarà sbagliata anche la scadenza.
          </Avviso>
        )}
      </div>
    </>
  );
}

function colore(s) {
  if (s.scaduta) return 'bg-gray-100 text-gray-500';
  if (s.restanti <= 7) return 'bg-red-50 text-esito-critico';
  if (s.restanti <= 20) return 'bg-amber-50 text-esito-attenzione';
  return 'bg-emerald-50 text-esito-ok';
}

function RigaScadenza({ s }) {
  const info = infoViolazione(s.verbale.articolo, s.verbale.comma);
  return (
    <Link to={`/esito/${s.verbaleId}`} className="app-card p-4 flex items-center gap-3 active:bg-gray-50 transition-colors">
      <div className={`shrink-0 w-14 rounded-xl py-2 text-center ${colore(s)}`}>
        <p className="font-heading font-black text-lg leading-none">
          {s.scaduta ? '—' : s.restanti}
        </p>
        <p className="text-[9px] font-heading font-bold uppercase tracking-widest mt-0.5">
          {s.scaduta ? 'scaduta' : 'giorni'}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-gray-900 truncate">{s.titolo}</h3>
        <p className="text-sm text-gray-500 truncate">{s.nota}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
          {formatIT(s.data)} · {info ? info.titolo : s.verbale.luogo || 'verbale'}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
    </Link>
  );
}
