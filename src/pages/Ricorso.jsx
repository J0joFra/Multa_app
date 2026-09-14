import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Scale, ChevronDown, ChevronUp, ExternalLink, FileText, Copy, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { Bottone, Sezione, Avviso } from '../components/ui.jsx';
import { useVerbali } from '../lib/store.jsx';
import { VIE, linkUfficio, cittaCompetente } from '../lib/procedure.js';
import { dataDecorrenza, analizzaVerbale } from '../lib/regole.js';
import { addGiorni, giorniTra, formatIT, oggiISO } from '../lib/date.js';
import { bozzaRicorso } from '../lib/ricorso.js';
import { infoViolazione } from '../lib/cds.js';

export default function Ricorso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { verbali, trova } = useVerbali();

  // Con un solo verbale non ha senso far scegliere: è quello.
  const verbale = id ? trova(id) : (verbali.length === 1 ? verbali[0] : null);

  if (!verbale) return <Scelta verbali={verbali} onScegli={(v) => navigate(`/ricorso/${v.id}`)} />;
  return <Procedura verbale={verbale} />;
}

/* ── Nessun verbale, o più di uno: prima si sceglie ────────────────────────── */

function Scelta({ verbali, onScegli }) {
  return (
    <>
      <PageHeader icon={Scale} title="Ricorso" sottotitolo="Come contestare una multa" />
      <div className="px-4 py-5 space-y-4">
        <div className="dark-card p-5">
          <h2 className="font-heading font-black text-xl uppercase tracking-wide mb-3">Due strade, più una</h2>
          <div className="space-y-2.5">
            {VIE.map((via) => (
              <div key={via.id} className="bg-white/10 rounded-xl px-4 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading font-black text-2xl leading-none">{via.giorni}</span>
                  <span className="text-[10px] uppercase tracking-widest opacity-70">giorni</span>
                  <span className="font-semibold ml-auto text-sm">{via.titolo}</span>
                </div>
                <p className="text-xs opacity-80 mt-1.5 leading-relaxed">{via.sommario}</p>
              </div>
            ))}
          </div>
        </div>

        {verbali.length === 0 ? (
          <Avviso>
            Aggiungi una multa e qui trovi la procedura per quel verbale, con i giorni che
            restano, l&apos;ufficio competente e la bozza da presentare.
          </Avviso>
        ) : (
          <Sezione titolo="Per quale verbale?">
            <div className="space-y-3">
              {verbali.map((v) => {
                const info = infoViolazione(v.articolo, v.comma);
                return (
                  <button
                    key={v.id}
                    onClick={() => onScegli(v)}
                    className="app-card p-4 w-full text-left flex items-center gap-3 active:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {info ? info.titolo : v.descrizione || 'Violazione non specificata'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {v.luogo || 'Luogo non indicato'} · {formatIT(v.dataViolazione)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </Sezione>
        )}
      </div>
    </>
  );
}

/* ── La procedura per un verbale preciso ───────────────────────────────────── */

function Procedura({ verbale }) {
  const navigate = useNavigate();
  const [bozza, setBozza] = useState(null);
  const [copiato, setCopiato] = useState(false);
  const citta = cittaCompetente(verbale);
  const { conteggi } = analizzaVerbale(verbale);

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
        /* niente clipboard: il testo resta selezionabile a schermo */
      }
    }
  }

  if (bozza) {
    return (
      <>
        <PageHeader icon={FileText} title="Bozza di ricorso" sottotitolo={bozza.destinatario} onIndietro={() => setBozza(null)} />
        <div className="px-4 py-5 space-y-4">
          <div className="app-card p-4">
            <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-body text-gray-700">{bozza.testo}</pre>
          </div>
          <Bottone onClick={() => condividi(bozza.testo)}>
            <span className="flex items-center justify-center gap-2">
              <Copy className="w-[18px] h-[18px]" /> {copiato ? 'Copiato' : 'Condividi o copia'}
            </span>
          </Bottone>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        icon={Scale}
        title="Ricorso"
        sottotitolo={verbale.luogo || formatIT(verbale.dataViolazione)}
        onIndietro={() => navigate(`/esito/${verbale.id}`)}
      />

      <div className="px-4 py-5 space-y-4">
        <div className="app-card p-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            {conteggi.critico > 0
              ? `Sul tuo verbale ho trovato ${conteggi.critico === 1 ? 'un motivo' : `${conteggi.critico} motivi`} da far valere: sono già nella bozza qui sotto.`
              : conteggi.attenzione > 0
                ? `Nessun vizio certo, ma ${conteggi.attenzione === 1 ? 'resta un punto da verificare' : `restano ${conteggi.attenzione} punti da verificare`}: controllali nell'esito prima di decidere, perché possono diventare motivi di ricorso.`
                : 'Con i dati inseriti non ho trovato vizi. Puoi comunque fare ricorso, ma la bozza andrà completata con i tuoi motivi.'}
            {citta && ` Gli uffici competenti sono quelli di ${citta}, il luogo della violazione.`}
          </p>
        </div>

        {VIE.map((via) => (
          <SchedaVia key={via.id} via={via} verbale={verbale} onBozza={setBozza} />
        ))}

        <Avviso>
          La procedura è la stessa in tutta Italia, perché sta nel Codice della Strada:
          cambia solo l&apos;ufficio a cui ti rivolgi, che è quello del luogo della violazione.
          Alcuni comuni accettano il ricorso anche dal proprio portale online. Prefetto e
          Giudice di Pace sono alternativi: scelta una strada, l&apos;altra si chiude.
        </Avviso>
      </div>
    </>
  );
}

function SchedaVia({ via, verbale, onBozza }) {
  const [aperta, setAperta] = useState(false);
  const base = dataDecorrenza(verbale);
  const scadenza = base ? addGiorni(base, via.giorni) : null;
  const restanti = scadenza ? giorniTra(oggiISO(), scadenza) : null;
  const scaduta = restanti !== null && restanti < 0;
  const link = linkUfficio(via, verbale);

  const colore = scaduta
    ? 'bg-gray-100 text-gray-500'
    : restanti !== null && restanti <= 7
      ? 'bg-red-50 text-esito-critico'
      : restanti !== null && restanti <= 20
        ? 'bg-amber-50 text-esito-attenzione'
        : 'bg-emerald-50 text-esito-ok';

  return (
    <div className={`app-card overflow-hidden ${scaduta ? 'opacity-60' : ''}`}>
      <button onClick={() => setAperta((a) => !a)} className="w-full px-4 pt-4 pb-3 text-left active:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`shrink-0 w-14 rounded-xl py-2 text-center ${colore}`}>
            <p className="font-heading font-black text-lg leading-none">{scaduta ? '—' : (restanti ?? via.giorni)}</p>
            <p className="text-[9px] font-heading font-bold uppercase tracking-widest mt-0.5">
              {scaduta ? 'scaduto' : 'giorni'}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900">{via.titolo}</h3>
            <p className="text-sm text-gray-500 leading-snug">{via.sommario}</p>
          </div>
          {aperta ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
        </div>
        {scadenza && (
          <p className="text-[11px] text-gray-400 mt-2">
            {scaduta ? 'Termine scaduto il' : 'Entro il'} {formatIT(scadenza)} · <span className="font-mono">{via.riferimento}</span>
          </p>
        )}
      </button>

      {aperta && (
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
            <Riga etichetta="Costo" valore={via.costo} />
            <Riga etichetta="Decide" valore={via.decide} />
          </div>

          <div>
            <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-muted-foreground mb-2">Come si fa</p>
            <ol className="space-y-1.5">
              {via.passi.map((passo, i) => (
                <li key={passo} className="text-sm text-gray-600 flex gap-2.5 leading-relaxed">
                  <span className="font-heading font-black text-primary shrink-0">{i + 1}</span>{passo}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-muted-foreground mb-2">Da sapere</p>
            <ul className="space-y-1.5">
              {via.note.map((n) => (
                <li key={n} className="text-sm text-gray-600 flex gap-2 leading-relaxed">
                  <span className="text-primary font-bold">·</span>{n}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 pt-1">
            {via.id !== 'paga' && (
              <Bottone
                onClick={() => onBozza({
                  testo: bozzaRicorso(verbale, via.id),
                  destinatario: via.titolo,
                })}
              >
                <span className="flex items-center justify-center gap-2">
                  <FileText className="w-[18px] h-[18px]" /> Genera la bozza
                </span>
              </Bottone>
            )}
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-primary active:bg-gray-100"
              >
                <ExternalLink className="w-4 h-4" />
                {via.id === 'paga' ? 'Come pagare' : 'Trova l\'ufficio competente'}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Riga({ etichetta, valore }) {
  return (
    <div className="flex gap-3 py-0.5">
      <span className="text-[11px] font-heading font-bold uppercase tracking-widest text-muted-foreground shrink-0 w-14 pt-0.5">{etichetta}</span>
      <span className="text-sm text-gray-700 leading-snug">{valore}</span>
    </div>
  );
}
