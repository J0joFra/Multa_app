import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, FileText } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { Bottone, Campo, CampoGruppo, Input, Select, Sezione, TreStati, Avviso } from '../components/ui.jsx';
import { VIOLAZIONI } from '../lib/cds.js';
import { useVerbali } from '../lib/store.jsx';

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
export default function Scheda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trova, letti = [], salvato, aggiorna } = useVerbali();
  const v = trova(id);

  if (!v) {
    return (
      <>
        <PageHeader icon={FileText} title="Verbale" onIndietro={() => navigate('/')} />
        <div className="px-4 py-5">
          <div className="app-card p-6 text-center text-sm text-gray-600">
            Questo verbale non esiste più.
          </div>
        </div>
      </>
    );
  }

  const set = (campo) => (val) => aggiorna(id, { [campo]: val });
  const testo = (campo) => (e) => set(campo)(e.target.value);
  const num = (campo) => (e) => set(campo)(e.target.value === '' ? null : Number(e.target.value));
  const letto = (campo) => (letti.includes(campo) ? 'border-primary/60 bg-primary/5' : '');

  // Valore mostrato nell'elenco: la voce di catalogo se l'articolo è noto,
  // "altro" se l'utente lo scrive a mano, vuoto se non ha ancora scelto.
  const chiave = v.comma ? `${v.articolo}-${v.comma}` : v.articolo;
  const inCatalogo = VIOLAZIONI[chiave] ? chiave : (VIOLAZIONI[v.articolo] ? v.articolo : null);
  const sceltaArticolo = v.articoloManuale ? 'altro' : (inCatalogo || (v.articolo ? 'altro' : ''));

  function cambiaArticolo(e) {
    const k = e.target.value;
    if (k === '') return aggiorna(id, { articolo: '', comma: '', articoloManuale: false });
    if (k === 'altro') return aggiorna(id, { articoloManuale: true });
    const [art, comma = ''] = k.split('-');
    aggiorna(id, { articolo: art, comma, articoloManuale: false });
  }

  function analizza() {
    navigate(`/esito/${v.id}`);
  }

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Dati del verbale"
        sottotitolo={salvato(v.id) ? 'Modifica' : 'Nuovo verbale'}
        onIndietro={() => navigate(salvato(v.id) ? `/esito/${v.id}` : '/analizza')}
      />

      <div className="px-4 py-5 space-y-4">
        {letti.length > 0 && (
          <div className="app-card p-4 flex gap-2.5 items-start border-l-4 border-primary">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700 leading-relaxed">
              Ho letto {letti.length} {letti.length === 1 ? 'campo' : 'campi'} dalla foto (bordo blu).
              Controllali: l&apos;OCR sbaglia spesso su numeri e date.
            </p>
          </div>
        )}

        <Sezione titolo="Il verbale">
          <div className="app-card p-4">
            <Campo etichetta="Numero del verbale">
              <Input value={v.numeroVerbale} onChange={testo('numeroVerbale')} className={letto('numeroVerbale')} placeholder="es. 2026/0012345" />
            </Campo>
            <Campo etichetta="Chi l'ha fatto">
              <Input value={v.organo} onChange={testo('organo')} className={letto('organo')} placeholder="es. Polizia Locale di Milano" />
            </Campo>
            <Campo etichetta="Targa">
              <Input value={v.targa} onChange={(e) => set('targa')(e.target.value.toUpperCase())} className={letto('targa')} placeholder="AB123CD" />
            </Campo>
          </div>
        </Sezione>

        <Sezione titolo="La violazione">
          <div className="app-card p-4">
            <Campo etichetta="Come te l'hanno fatta">
              <Select value={v.tipoAccertamento} onChange={testo('tipoAccertamento')} opzioni={TIPI} className={letto('tipoAccertamento')} />
            </Campo>
            <Campo etichetta="Articolo del Codice della Strada">
              <Select value={sceltaArticolo} onChange={cambiaArticolo} opzioni={ARTICOLI} className={letto('articolo')} />
            </Campo>
            {sceltaArticolo === 'altro' && (
              <div className="grid grid-cols-2 gap-3">
                <Campo etichetta="Articolo"><Input value={v.articolo} onChange={testo('articolo')} placeholder="142" /></Campo>
                <Campo etichetta="Comma"><Input value={v.comma} onChange={testo('comma')} placeholder="8" /></Campo>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Campo etichetta="Data violazione">
                <Input type="date" value={v.dataViolazione} onChange={testo('dataViolazione')} className={letto('dataViolazione')} />
              </Campo>
              <Campo etichetta="Ora">
                <Input type="time" value={v.oraViolazione} onChange={testo('oraViolazione')} className={letto('oraViolazione')} />
              </Campo>
            </div>
            <Campo etichetta="Dove" suggerimento="Copia l'indirizzo esatto dal verbale: serve anche per andare a vedere il posto.">
              <Input value={v.luogo} onChange={testo('luogo')} className={letto('luogo')} placeholder="Via Palmanova 45, Milano" />
            </Campo>
          </div>
        </Sezione>

        <Sezione titolo="Come te l'hanno data">
          <div className="app-card p-4">
            <CampoGruppo etichetta="Te l'hanno contestata sul posto?">
              <div className="grid grid-cols-2 gap-2">
                {[['Sì, sul posto', true], ['No, è arrivata dopo', false]].map(([l, val]) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => set('contestazioneImmediata')(val)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      v.contestazioneImmediata === val
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </CampoGruppo>
            {!v.contestazioneImmediata && (
              <>
                <Campo etichetta="Data di notifica" suggerimento="La data sulla busta o sulla relata, non quella in cui l'hai aperta.">
                  <Input type="date" value={v.dataNotifica} onChange={testo('dataNotifica')} className={letto('dataNotifica')} />
                </Campo>
                <CampoGruppo etichetta="Il verbale dice perché non ti hanno fermato?">
                  <TreStati
                    valore={v.motivazioneMancataContestazione === true ? 'si' : v.motivazioneMancataContestazione === false ? 'no' : null}
                    onChange={(x) => set('motivazioneMancataContestazione')(x === 'si' ? true : x === 'no' ? false : null)}
                  />
                </CampoGruppo>
                <Spunta
                  checked={v.notificaAlProprietario}
                  onChange={set('notificaAlProprietario')}
                  testo="È intestata a me come proprietario, ma guidava un altro"
                />
                <Spunta
                  checked={v.residenteEstero}
                  onChange={set('residenteEstero')}
                  testo="Risiedo all'estero"
                />
              </>
            )}
            <CampoGruppo etichetta="Il verbale spiega come fare ricorso?">
              <TreStati valore={v.indicazioneRicorso} onChange={set('indicazioneRicorso')} />
            </CampoGruppo>
          </div>
        </Sezione>

        <Sezione titolo="Quanto">
          <div className="app-card p-4">
            <div className="grid grid-cols-2 gap-3">
              <Campo etichetta="Importo (€)">
                <Input type="number" inputMode="decimal" value={v.importo ?? ''} onChange={num('importo')} className={letto('importo')} />
              </Campo>
              <Campo etichetta="Spese notifica (€)">
                <Input type="number" inputMode="decimal" value={v.speseNotifica ?? ''} onChange={num('speseNotifica')} className={letto('speseNotifica')} />
              </Campo>
            </div>
            <Campo etichetta="Punti decurtati">
              <Input type="number" inputMode="numeric" value={v.puntiDecurtati ?? ''} onChange={num('puntiDecurtati')} className={letto('puntiDecurtati')} />
            </Campo>
          </div>
        </Sezione>

        {(v.tipoAccertamento === 'autovelox' || v.tipoAccertamento === 'semaforo') && (
          <Sezione titolo="Il dispositivo">
            <div className="app-card p-4">
              {v.tipoAccertamento === 'autovelox' && (
                <div className="grid grid-cols-3 gap-3">
                  <Campo etichetta="Rilevata"><Input type="number" inputMode="numeric" value={v.velocitaRilevata ?? ''} onChange={num('velocitaRilevata')} className={letto('velocitaRilevata')} /></Campo>
                  <Campo etichetta="Contestata"><Input type="number" inputMode="numeric" value={v.velocitaContestata ?? ''} onChange={num('velocitaContestata')} className={letto('velocitaContestata')} /></Campo>
                  <Campo etichetta="Limite"><Input type="number" inputMode="numeric" value={v.limiteVelocita ?? ''} onChange={num('limiteVelocita')} className={letto('limiteVelocita')} /></Campo>
                </div>
              )}
              <CampoGruppo etichetta={'Il verbale dice "omologato" (non solo "approvato")?'}>
                <TreStati valore={v.strumentoOmologato} onChange={set('strumentoOmologato')} />
              </CampoGruppo>
              <Campo etichetta="Data dell'ultima taratura indicata">
                <Input type="date" value={v.dataTaratura} onChange={testo('dataTaratura')} className={letto('dataTaratura')} />
              </Campo>
              {v.tipoAccertamento === 'autovelox' && (
                <>
                  <CampoGruppo etichetta="C'era il cartello di preavviso?">
                    <TreStati valore={v.segnaleticaPreventiva} onChange={set('segnaleticaPreventiva')} />
                  </CampoGruppo>
                  <CampoGruppo etichetta="Il verbale cita il decreto del Prefetto?">
                    <TreStati valore={v.decretoPrefettizio} onChange={set('decretoPrefettizio')} />
                  </CampoGruppo>
                </>
              )}
              {v.tipoAccertamento === 'semaforo' && (
                <CampoGruppo etichetta="Ci sono le foto del passaggio?">
                  <TreStati valore={v.fotogrammaAllegato} onChange={set('fotogrammaAllegato')} />
                </CampoGruppo>
              )}
            </div>
          </Sezione>
        )}

        <Bottone onClick={analizza}>Analizza la multa</Bottone>

        <Avviso>
          Quello che non sai lascialo su &quot;Non so&quot;: lo trasformo in un controllo da
          fare, invece di darlo per buono.
        </Avviso>
      </div>
    </>
  );
}

function Spunta({ checked, onChange, testo }) {
  return (
    <label className="flex items-center gap-3 mb-4 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded accent-[#0A66C2]"
      />
      {testo}
    </label>
  );
}
