import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, XCircle, CheckCircle2, Info, MapPin, Save, Pencil, ShieldCheck, Scale,
  Gauge, Loader2, Crosshair,
} from 'lucide-react';
import MappaLuogo from '../components/Mappa.jsx';
import { analizzaLuogo } from '../lib/geo.js';
import PageHeader from '../components/PageHeader.jsx';
import { Bottone, Sezione, Avviso } from '../components/ui.jsx';
import { analizzaVerbale, CRITICO, ATTENZIONE, OK, INFO } from '../lib/regole.js';
import { linkLuogo, COSA_GUARDARE } from '../lib/luogo.js';
import { useVerbali } from '../lib/store.jsx';

const STILE = {
  [CRITICO]: { icona: XCircle, colore: 'text-esito-critico', tag: 'bg-red-50 text-esito-critico', bordo: 'border-esito-critico', etichetta: 'Contestabile' },
  [ATTENZIONE]: { icona: AlertTriangle, colore: 'text-esito-attenzione', tag: 'bg-amber-50 text-esito-attenzione', bordo: 'border-esito-attenzione', etichetta: 'Da verificare' },
  [OK]: { icona: CheckCircle2, colore: 'text-esito-ok', tag: 'bg-emerald-50 text-esito-ok', bordo: 'border-esito-ok', etichetta: 'Regolare' },
  [INFO]: { icona: Info, colore: 'text-primary', tag: 'bg-blue-50 text-primary', bordo: 'border-primary', etichetta: 'Scadenza' },
};

const ORDINE = [CRITICO, ATTENZIONE, INFO, OK];

export default function Esito() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trova, salva, salvato, aggiorna } = useVerbali();
  const verbale = trova(id);

  const analisi = useMemo(() => (verbale ? analizzaVerbale(verbale) : null), [verbale]);

  if (!verbale) {
    return (
      <>
        <PageHeader icon={ShieldCheck} title="Esito" onIndietro={() => navigate('/')} />
        <div className="px-4 py-5">
          <div className="app-card p-6 text-center text-sm text-gray-600">
            Questo verbale non esiste più.
          </div>
        </div>
      </>
    );
  }

  const link = linkLuogo(verbale.luogo);
  const daGuardare = COSA_GUARDARE[verbale.tipoAccertamento] || COSA_GUARDARE.altro;
  const sv = STILE[analisi.verdetto.livello];
  const inArchivio = salvato(verbale.id);

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="Esito"
        sottotitolo={verbale.luogo || 'Verbale'}
        onIndietro={() => navigate('/')}
        right={
          <button onClick={() => navigate(`/scheda/${verbale.id}`)} aria-label="Modifica i dati" className="w-9 h-9 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white active:scale-95 transition-transform">
            <Pencil className="w-4 h-4" />
          </button>
        }
      />

      <div className="px-4 py-5 space-y-4">
        <div className={`app-card p-5 border-l-4 ${sv.bordo}`}>
          <div className="flex items-center gap-2 mb-2">
            <sv.icona className={`${sv.colore} w-6 h-6 shrink-0`} />
            <h2 className="font-heading font-black text-2xl uppercase tracking-wide leading-none">
              {analisi.verdetto.titolo}
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{analisi.verdetto.testo}</p>

          <div className="grid grid-cols-4 gap-2 mt-4">
            {ORDINE.map((liv) => {
              const n = analisi.conteggi[liv];
              const s = STILE[liv];
              return (
                <div key={liv} className={`rounded-xl py-2 text-center ${n ? s.tag : 'bg-gray-50 text-gray-400'}`}>
                  <p className="font-heading font-black text-xl leading-none">{n}</p>
                  <p className="text-[9px] font-heading font-bold uppercase tracking-wider mt-1">{s.etichetta}</p>
                </div>
              );
            })}
          </div>
        </div>

        {ORDINE.map((livello) => {
          const gruppo = analisi.esiti.filter((e) => e.esito === livello);
          if (!gruppo.length) return null;
          const s = STILE[livello];
          return (
            <Sezione key={livello} titolo={`${s.etichetta} · ${gruppo.length}`}>
              <div className="space-y-3">
                {gruppo.map((e) => (
                  <article key={e.id} className={`app-card p-4 border-l-4 ${s.bordo}`}>
                    <div className="flex items-start gap-2.5">
                      <s.icona className={`${s.colore} shrink-0 mt-0.5 w-[18px] h-[18px]`} />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 leading-snug">{e.titolo}</h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{e.messaggio}</p>
                        {e.dettaglio && <p className="text-sm text-gray-500 mt-1">{e.dettaglio}</p>}
                        {e.azione && (
                          <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 leading-relaxed">
                            {e.azione}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 font-semibold mt-2">{e.riferimento}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </Sezione>
          );
        })}

        <Sezione titolo="Dove l'hai presa">
          <div className="app-card p-4">
            <div className="flex items-start gap-2.5 mb-3">
              <MapPin className="text-primary shrink-0 mt-0.5 w-[18px] h-[18px]" />
              <p className="font-semibold text-gray-900 leading-snug">{verbale.luogo || 'Luogo non indicato'}</p>
            </div>

            <Luogo verbale={verbale} aggiorna={aggiorna} />

            {link && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <a href={link.streetView} target="_blank" rel="noreferrer" className="text-center text-sm font-medium py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-primary active:bg-gray-100">
                  Street View
                </a>
                <a href={link.mappa} target="_blank" rel="noreferrer" className="text-center text-sm font-medium py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-primary active:bg-gray-100">
                  Mappa
                </a>
              </div>
            )}
            <p className="text-[11px] font-heading font-bold uppercase tracking-widest text-muted-foreground mb-2">Cosa guardare</p>
            <ul className="space-y-1.5">
              {daGuardare.map((r) => (
                <li key={r} className="text-sm text-gray-600 flex gap-2 leading-relaxed">
                  <span className="text-primary font-bold">·</span>{r}
                </li>
              ))}
            </ul>
          </div>
        </Sezione>

        <div className="space-y-3">
          {!inArchivio && (
            <Bottone variante="neutro" onClick={() => salva(verbale)}>
              <span className="flex items-center justify-center gap-2"><Save className="w-[18px] h-[18px]" /> Salva questa multa</span>
            </Bottone>
          )}
          <Bottone onClick={() => navigate(`/ricorso/${verbale.id}`)}>
            <span className="flex items-center justify-center gap-2"><Scale className="w-[18px] h-[18px]" /> Prepara il ricorso</span>
          </Bottone>
        </div>

        <Avviso>
          MultaCheck applica controlli standard sui dati che hai inserito: non è un parere
          legale e non conosce il tuo verbale meglio di te. Prima di rinunciare allo sconto
          del 30% o di pagare, leggi il verbale per intero e, se la cifra è alta, senti un
          avvocato.
        </Avviso>
      </div>
    </>
  );
}

/**
 * Il blocco mappa: risolve l'indirizzo su OpenStreetMap, mostra il punto e
 * confronta il limite del tratto con quello contestato nel verbale.
 */
function Luogo({ verbale, aggiorna }) {
  const [stato, setStato] = React.useState('idle'); // idle | carico | vuoto | errore
  const geo = verbale.geo;

  async function cerca() {
    setStato('carico');
    try {
      const trovato = await analizzaLuogo(verbale.luogo);
      if (!trovato) return setStato('vuoto');
      aggiorna(verbale.id, { geo: trovato });
      setStato('idle');
    } catch {
      setStato('errore');
    }
  }

  if (!verbale.luogo) {
    return (
      <p className="text-sm text-gray-500 leading-relaxed mb-4">
        Scrivi l&apos;indirizzo nella scheda del verbale e te lo mostro sulla mappa, con il
        limite di velocità di quel tratto.
      </p>
    );
  }

  if (!geo) {
    return (
      <div className="mb-4">
        <button
          onClick={cerca}
          disabled={stato === 'carico'}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-primary active:bg-gray-100 disabled:opacity-50"
        >
          {stato === 'carico'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Cerco il punto…</>
            : <><Crosshair className="w-4 h-4" /> Mostra sulla mappa e trova il limite</>}
        </button>
        {stato === 'vuoto' && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Non ho trovato questo indirizzo. Prova a scriverlo per esteso nella scheda, con
            il comune: &quot;Via Palmanova 45, Milano&quot;.
          </p>
        )}
        {stato === 'errore' && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Non sono riuscito a raggiungere la mappa. Serve la rete: riprova quando sei
            connesso.
          </p>
        )}
      </div>
    );
  }

  const contestato = Number(verbale.limiteVelocita);
  const mappa = Number(geo.limiteOsm);
  const discorde = Number.isFinite(contestato) && Number.isFinite(mappa) && contestato !== mappa;

  return (
    <div className="mb-4 space-y-3">
      <MappaLuogo geo={geo} />

      {Number.isFinite(mappa) ? (
        <div className={`rounded-xl px-4 py-3 border ${discorde ? 'bg-amber-50 border-esito-attenzione/40' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <Gauge className={`w-4 h-4 shrink-0 ${discorde ? 'text-esito-attenzione' : 'text-primary'}`} />
            <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-muted-foreground">
              Limite del tratto
            </p>
          </div>
          <p className="font-heading font-black text-3xl mt-1">
            {mappa} <span className="text-base font-body font-semibold text-gray-500">km/h</span>
            {Number.isFinite(contestato) && contestato !== mappa && (
              <span className="text-base font-body font-semibold text-gray-500"> · sul verbale {contestato}</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            {geo.fonteLimite === 'osm'
              ? `Limite mappato su OpenStreetMap per ${geo.stradaOsm || 'questo tratto'}.`
              : 'Nessun limite mappato qui: questo è il limite generale previsto per questo tipo di strada.'}
            {' '}Fa fede il cartello sul posto, non la mappa.
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-500 leading-relaxed">
          Per questo tratto OpenStreetMap non riporta un limite e la strada non è
          classificata abbastanza da dedurlo. Guarda i cartelli sul posto.
        </p>
      )}
    </div>
  );
}
