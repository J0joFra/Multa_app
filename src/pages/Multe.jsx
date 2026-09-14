import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScrollText, Plus, Trash2, ShieldCheck, AlertTriangle, XCircle, ChevronRight, Camera } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { Bottone, Sezione, Avviso } from '../components/ui.jsx';
import { useVerbali } from '../lib/store.jsx';
import { analizzaVerbale, scadenzeVerbale, CRITICO, ATTENZIONE } from '../lib/regole.js';
import { formatIT } from '../lib/date.js';
import { infoViolazione } from '../lib/cds.js';
import { nuovoVerbale } from '../lib/verbale.js';

const BADGE = {
  [CRITICO]: { icona: XCircle, cls: 'text-esito-critico', sfondo: 'bg-red-50 text-esito-critico', testo: 'Contestabile' },
  [ATTENZIONE]: { icona: AlertTriangle, cls: 'text-esito-attenzione', sfondo: 'bg-amber-50 text-esito-attenzione', testo: 'Da verificare' },
  ok: { icona: ShieldCheck, cls: 'text-esito-ok', sfondo: 'bg-emerald-50 text-esito-ok', testo: 'Regolare' },
};

export default function Multe() {
  const { verbali, elimina, apriBozza } = useVerbali();
  const navigate = useNavigate();

  const totale = verbali.reduce((s, v) => s + (Number(v.importo) || 0), 0);
  const contestabili = verbali.filter((v) => analizzaVerbale(v).verdetto.livello === CRITICO).length;

  function nuova() {
    apriBozza(nuovoVerbale(), []);
    navigate('/analizza');
  }

  return (
    <>
      <PageHeader
        icon={ScrollText}
        title="Le mie multe"
        sottotitolo={verbali.length ? `${verbali.length} ${verbali.length === 1 ? 'verbale' : 'verbali'}` : 'Nessun verbale'}
        right={
          <button onClick={nuova} aria-label="Nuova multa" className="w-9 h-9 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white active:scale-95 transition-transform">
            <Plus className="w-4 h-4" />
          </button>
        }
      />

      <div className="px-4 py-5 space-y-4">
        {verbali.length === 0 ? (
          <>
            <div className="app-card p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-black text-2xl uppercase tracking-wide mb-2">Hai preso una multa?</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Fotografa il verbale: ti dico dove l&apos;hai presa, entro quando puoi pagare o
                fare ricorso, e se ci sono vizi che la rendono contestabile.
              </p>
              <Bottone onClick={nuova}>
                <span className="flex items-center justify-center gap-2"><Camera className="w-[18px] h-[18px]" /> Analizza la prima multa</span>
              </Bottone>
            </div>
            <Avviso>
              Foto e dati restano sul telefono: non vengono inviati da nessuna parte.
            </Avviso>
          </>
        ) : (
          <>
            <div className="app-card p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-muted-foreground">In gioco</p>
                  <p className="font-heading font-black text-2xl">{totale.toFixed(0)} €</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-muted-foreground">Contestabili</p>
                  <p className={`font-heading font-black text-2xl ${contestabili ? 'text-esito-critico' : ''}`}>{contestabili}</p>
                </div>
              </div>
            </div>

            <Sezione titolo="I tuoi verbali">
              <div className="space-y-3">
                {verbali.map((v) => <RigaVerbale key={v.id} v={v} onElimina={elimina} />)}
              </div>
            </Sezione>

            <Bottone variante="neutro" onClick={nuova}>
              <span className="flex items-center justify-center gap-2"><Plus className="w-[18px] h-[18px]" /> Aggiungi un&apos;altra multa</span>
            </Bottone>
          </>
        )}
      </div>
    </>
  );
}

function RigaVerbale({ v, onElimina }) {
  const { verdetto } = analizzaVerbale(v);
  const b = BADGE[verdetto.livello] || BADGE.ok;
  const info = infoViolazione(v.articolo, v.comma);
  const prossima = scadenzeVerbale(v).find((s) => !s.scaduta);

  return (
    <div className="app-card overflow-hidden">
      <Link to={`/esito/${v.id}`} className="block px-4 pt-4 pb-3 active:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <span className={`tag ${b.sfondo}`}>{b.testo}</span>
          <span className="text-[11px] text-gray-500 ml-auto">{formatIT(v.dataViolazione)}</span>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </div>
        <h3 className="font-semibold text-gray-900 leading-snug">
          {info ? info.titolo : v.descrizione || 'Violazione non specificata'}
        </h3>
        <p className="text-sm text-gray-500 truncate mt-0.5">{v.luogo || 'Luogo non indicato'}</p>
      </Link>

      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 bg-gray-50">
        {Number(v.importo) > 0 && (
          <span className="font-mono text-sm font-semibold text-gray-800">{Number(v.importo).toFixed(2)} €</span>
        )}
        {prossima && (
          <span className="text-[11px] text-gray-500 truncate">
            {prossima.titolo.toLowerCase()}: {prossima.restanti} gg
          </span>
        )}
        <button
          onClick={() => onElimina(v.id)}
          aria-label="Elimina"
          className="ml-auto p-1.5 -mr-1.5 text-gray-400 active:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
