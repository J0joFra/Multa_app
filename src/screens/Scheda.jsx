import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Schermata, Bottone, Campo, Input, Select, Sezione, TreStati, Avviso } from '../components/ui.jsx';
import { VIOLAZIONI } from '../lib/cds.js';

const TIPI = [
  { value: 'agente', label: 'Contestata da un agente' },
  { value: 'autovelox', label: 'Autovelox / telelaser' },
  { value: 'ztl', label: 'ZTL / varco elettronico' },
  { value: 'semaforo', label: 'Semaforo rosso' },
  { value: 'sosta', label: 'Sosta o divieto' },
  { value: 'altro', label: 'Altro' },
];

const ARTICOLI = [
  { value: '', label: '— seleziona —' },
  ...Object.entries(VIOLAZIONI).map(([k, v]) => ({
    value: k,
    label: `art. ${k.replace('-', ' c. ')} — ${v.titolo}`,
  })),
  { value: 'altro', label: 'Altro articolo' },
];

/** Passo 2: i dati del verbale, con evidenziato quello che ha letto l'OCR. */
export default function Scheda({ verbale, letti = [], onIndietro, onAnalizza }) {
  const [v, setV] = useState(verbale);
  const set = (campo) => (val) => setV((p) => ({ ...p, [campo]: val }));
  const testo = (campo) => (e) => set(campo)(e.target.value);
  const num = (campo) => (e) => set(campo)(e.target.value === '' ? null : Number(e.target.value));
  const letto = (campo) => (letti.includes(campo) ? 'border-blue-500/60' : '');

  const chiaveArticolo = v.comma ? `${v.articolo}-${v.comma}` : v.articolo;
  const articoloNoto = VIOLAZIONI[chiaveArticolo] ? chiaveArticolo : (VIOLAZIONI[v.articolo] ? v.articolo : 'altro');

  function cambiaArticolo(e) {
    const k = e.target.value;
    if (k === 'altro' || k === '') return setV((p) => ({ ...p, articolo: k === '' ? '' : p.articolo }));
    const [art, comma = ''] = k.split('-');
    setV((p) => ({ ...p, articolo: art, comma }));
  }

  return (
    <Schermata titolo="Dati del verbale" onIndietro={onIndietro}>
      {letti.length > 0 && (
        <div className="flex gap-2 items-start bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-5 text-sm text-blue-100">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <span>Ho letto {letti.length} {letti.length === 1 ? 'campo' : 'campi'} dalla foto (bordo blu). Controllali: l&apos;OCR sbaglia spesso su numeri e date.</span>
        </div>
      )}

      <Sezione titolo="Il verbale">
        <Campo etichetta="Numero del verbale">
          <Input value={v.numeroVerbale} onChange={testo('numeroVerbale')} className={letto('numeroVerbale')} placeholder="es. 2026/0012345" />
        </Campo>
        <Campo etichetta="Chi l'ha fatto">
          <Input value={v.organo} onChange={testo('organo')} placeholder="es. Polizia Locale di Milano" />
        </Campo>
        <Campo etichetta="Targa">
          <Input value={v.targa} onChange={(e) => set('targa')(e.target.value.toUpperCase())} placeholder="AB123CD" />
        </Campo>
      </Sezione>

      <Sezione titolo="La violazione">
        <Campo etichetta="Come te l'hanno fatta">
          <Select value={v.tipoAccertamento} onChange={testo('tipoAccertamento')} opzioni={TIPI} />
        </Campo>
        <Campo etichetta="Articolo del Codice della Strada">
          <Select value={articoloNoto} onChange={cambiaArticolo} opzioni={ARTICOLI} />
        </Campo>
        {articoloNoto === 'altro' && (
          <div className="grid grid-cols-2 gap-3">
            <Campo etichetta="Articolo"><Input value={v.articolo} onChange={testo('articolo')} placeholder="142" /></Campo>
            <Campo etichetta="Comma"><Input value={v.comma} onChange={testo('comma')} placeholder="8" /></Campo>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Campo etichetta="Data della violazione">
            <Input type="date" value={v.dataViolazione} onChange={testo('dataViolazione')} className={letto('dataViolazione')} />
          </Campo>
          <Campo etichetta="Ora">
            <Input type="time" value={v.oraViolazione} onChange={testo('oraViolazione')} />
          </Campo>
        </div>
        <Campo etichetta="Dove" suggerimento="Copia l'indirizzo esatto dal verbale: serve anche per andare a vedere il posto.">
          <Input value={v.luogo} onChange={testo('luogo')} className={letto('luogo')} placeholder="Via Palmanova 45, Milano" />
        </Campo>
      </Sezione>

      <Sezione titolo="Come te l'hanno data">
        <Campo etichetta="Te l'hanno contestata sul posto?">
          <div className="grid grid-cols-2 gap-2">
            {[['Sì, sul posto', true], ['No, è arrivata dopo', false]].map(([l, val]) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => set('contestazioneImmediata')(val)}
                className={`py-2.5 rounded-xl border text-sm ${
                  v.contestazioneImmediata === val ? 'bg-blue-600 border-blue-600 text-white' : 'bg-panel border-line text-slate-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </Campo>
        {!v.contestazioneImmediata && (
          <>
            <Campo etichetta="Data di notifica" suggerimento="La data sulla busta o sulla relata, non quella in cui l'hai aperta.">
              <Input type="date" value={v.dataNotifica} onChange={testo('dataNotifica')} className={letto('dataNotifica')} />
            </Campo>
            <Campo etichetta="Il verbale dice perché non ti hanno fermato?">
              <TreStati
                valore={v.motivazioneMancataContestazione === true ? 'si' : v.motivazioneMancataContestazione === false ? 'no' : null}
                onChange={(x) => set('motivazioneMancataContestazione')(x === 'si' ? true : x === 'no' ? false : null)}
              />
            </Campo>
            <label className="flex items-center gap-3 mb-4 text-sm text-slate-300">
              <input type="checkbox" checked={v.notificaAlProprietario} onChange={(e) => set('notificaAlProprietario')(e.target.checked)} className="w-5 h-5 accent-blue-600" />
              È intestata a me come proprietario, ma guidava un altro
            </label>
            <label className="flex items-center gap-3 mb-4 text-sm text-slate-300">
              <input type="checkbox" checked={v.residenteEstero} onChange={(e) => set('residenteEstero')(e.target.checked)} className="w-5 h-5 accent-blue-600" />
              Risiedo all&apos;estero
            </label>
          </>
        )}
        <Campo etichetta="Il verbale spiega come fare ricorso?">
          <TreStati valore={v.indicazioneRicorso} onChange={set('indicazioneRicorso')} />
        </Campo>
      </Sezione>

      <Sezione titolo="Quanto">
        <div className="grid grid-cols-2 gap-3">
          <Campo etichetta="Importo (€)">
            <Input type="number" inputMode="decimal" value={v.importo ?? ''} onChange={num('importo')} className={letto('importo')} />
          </Campo>
          <Campo etichetta="Spese di notifica (€)">
            <Input type="number" inputMode="decimal" value={v.speseNotifica ?? ''} onChange={num('speseNotifica')} />
          </Campo>
        </div>
        <Campo etichetta="Punti decurtati">
          <Input type="number" inputMode="numeric" value={v.puntiDecurtati ?? ''} onChange={num('puntiDecurtati')} />
        </Campo>
      </Sezione>

      {(v.tipoAccertamento === 'autovelox' || v.tipoAccertamento === 'semaforo') && (
        <Sezione titolo="Il dispositivo">
          {v.tipoAccertamento === 'autovelox' && (
            <div className="grid grid-cols-3 gap-3">
              <Campo etichetta="Rilevata"><Input type="number" inputMode="numeric" value={v.velocitaRilevata ?? ''} onChange={num('velocitaRilevata')} className={letto('velocitaRilevata')} /></Campo>
              <Campo etichetta="Contestata"><Input type="number" inputMode="numeric" value={v.velocitaContestata ?? ''} onChange={num('velocitaContestata')} /></Campo>
              <Campo etichetta="Limite"><Input type="number" inputMode="numeric" value={v.limiteVelocita ?? ''} onChange={num('limiteVelocita')} /></Campo>
            </div>
          )}
          <Campo etichetta="Il verbale dice &quot;omologato&quot; (non solo &quot;approvato&quot;)?">
            <TreStati valore={v.strumentoOmologato} onChange={set('strumentoOmologato')} />
          </Campo>
          <Campo etichetta="Data dell'ultima taratura indicata">
            <Input type="date" value={v.dataTaratura} onChange={testo('dataTaratura')} className={letto('dataTaratura')} />
          </Campo>
          {v.tipoAccertamento === 'autovelox' && (
            <>
              <Campo etichetta="C'era il cartello di preavviso?">
                <TreStati valore={v.segnaleticaPreventiva} onChange={set('segnaleticaPreventiva')} />
              </Campo>
              <Campo etichetta="Il verbale cita il decreto del Prefetto?">
                <TreStati valore={v.decretoPrefettizio} onChange={set('decretoPrefettizio')} />
              </Campo>
            </>
          )}
          {v.tipoAccertamento === 'semaforo' && (
            <Campo etichetta="Ci sono le foto del passaggio?">
              <TreStati valore={v.fotogrammaAllegato} onChange={set('fotogrammaAllegato')} />
            </Campo>
          )}
        </Sezione>
      )}

      <Bottone onClick={() => onAnalizza(v)}>Analizza la multa</Bottone>

      <Avviso>
        Quello che non sai lascialo su &quot;Non so&quot;: lo trasformo in un controllo da fare,
        invece di darlo per buono.
      </Avviso>
    </Schermata>
  );
}
