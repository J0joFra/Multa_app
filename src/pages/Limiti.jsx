import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, Search, LocateFixed, Loader2, Clock, Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import MappaLuogo from '../components/Mappa.jsx';
import SegnaleLimite from '../components/SegnaleLimite.jsx';
import { Avviso } from '../components/ui.jsx';
import { analizzaLuogo, analizzaPunto } from '../lib/geo.js';
import { caricaRicercheLimiti, salvaRicercheLimiti } from '../lib/storage.js';
import { useVerbali } from '../lib/store.jsx';
import { nuovoVerbale } from '../lib/verbale.js';

/**
 * Il limite di una zona senza passare da un verbale: scrivi la via (o usi la
 * posizione) e lo leggi subito. Toccando la mappa il punto si sposta.
 */
export default function Limiti() {
  const [query, setQuery] = useState('');
  const [zona, setZona] = useState(null);
  const [stato, setStato] = useState('pronto'); // pronto | cerco | vuoto | errore
  const [recenti, setRecenti] = useState([]);
  const richiesta = useRef(0);
  const navigate = useNavigate();
  const { apriBozza } = useVerbali();

  // Si riparte dall'ultima zona guardata: riaprire la scheda su una mappa
  // vuota è la cosa meno utile possibile.
  useEffect(() => {
    caricaRicercheLimiti().then((r) => {
      setRecenti(r);
      if (r.length > 0) setZona(r[0]);
    });
  }, []);

  function ricorda(z) {
    setRecenti((p) => {
      const senzaDoppioni = p.filter((x) => x.nome !== z.nome);
      const nuove = [z, ...senzaDoppioni].slice(0, 6);
      salvaRicercheLimiti(nuove);
      return nuove;
    });
  }

  /** Ogni ricerca ha un numero: quelle sorpassate non scrivono più nulla. */
  async function esegui(promessa) {
    const mia = ++richiesta.current;
    setStato('cerco');
    try {
      const trovata = await promessa;
      if (mia !== richiesta.current) return;
      if (!trovata) return setStato('vuoto');
      setZona(trovata);
      ricorda(trovata);
      setStato('pronto');
    } catch {
      if (mia === richiesta.current) setStato('errore');
    }
  }

  function cerca(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    esegui(analizzaLuogo(query.trim()));
  }

  async function posizione() {
    setStato('cerco');
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      esegui(analizzaPunto(p.coords.latitude, p.coords.longitude));
    } catch {
      // Fuori da Capacitor (o permesso negato) resta l'API del browser.
      if (!navigator.geolocation) return setStato('errore');
      navigator.geolocation.getCurrentPosition(
        (p) => esegui(analizzaPunto(p.coords.latitude, p.coords.longitude)),
        () => setStato('errore'),
        { enableHighAccuracy: true, timeout: 15000 },
      );
    }
  }

  function usaPerMulta() {
    apriBozza(nuovoVerbale({
      luogo: zona.nome,
      geo: zona,
      tipoAccertamento: 'autovelox',
      limiteVelocita: zona.limiteOsm ?? null,
    }), []);
    navigate('/analizza');
  }

  return (
    <>
      <PageHeader icon={Gauge} title="Limiti" sottotitolo="Che limite c'è qui" />

      <div className="px-4 py-4 space-y-3">
        <form onSubmit={cerca} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Via Palmanova 45, Milano"
            className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            enterKeyHint="search"
          />
          <button
            type="submit"
            aria-label="Cerca"
            disabled={stato === 'cerco' || !query.trim()}
            className="shrink-0 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:brightness-95"
          >
            {stato === 'cerco' ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Search className="w-[18px] h-[18px]" />}
          </button>
          <button
            type="button"
            onClick={posizione}
            aria-label="Usa la mia posizione"
            className="shrink-0 w-11 rounded-xl bg-white border border-gray-200 text-primary flex items-center justify-center active:bg-gray-50"
          >
            <LocateFixed className="w-[18px] h-[18px]" />
          </button>
        </form>

        {zona ? (
          <>
            <MappaLuogo
              geo={zona}
              interattiva
              altezza="min(46vh, 340px)"
              onPunto={(lat, lon) => esegui(analizzaPunto(lat, lon))}
            />
            <Risultato zona={zona} cercando={stato === 'cerco'} />
            <button
              onClick={usaPerMulta}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-white border border-gray-200 text-primary active:bg-gray-50"
            >
              <Plus className="w-4 h-4" /> Ho preso una multa qui
            </button>
          </>
        ) : (
          <div className="app-card p-6 text-center">
            <Gauge className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h2 className="font-heading font-black text-xl uppercase tracking-wide mb-2">Che limite c&apos;era?</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Scrivi la via e il comune, oppure usa la tua posizione. Poi tocca un punto
              sulla mappa per spostare la misura.
            </p>
          </div>
        )}

        {stato === 'vuoto' && (
          <p className="text-xs text-gray-500 leading-relaxed px-1">
            Non ho trovato questo indirizzo. Scrivilo per esteso con il comune: &quot;Via
            Palmanova 45, Milano&quot;.
          </p>
        )}
        {stato === 'errore' && (
          <p className="text-xs text-gray-500 leading-relaxed px-1">
            Non sono riuscito a raggiungere la mappa, o la posizione non è disponibile.
            Serve la rete: riprova quando sei connesso.
          </p>
        )}

        {recenti.length > 1 && (
          <div>
            <p className="text-[11px] font-heading font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
              Cercate di recente
            </p>
            <div className="space-y-2">
              {recenti.slice(1).map((r) => (
                <button
                  key={`${r.lat},${r.lon}`}
                  onClick={() => setZona(r)}
                  className="app-card w-full px-3 py-2.5 flex items-center gap-3 text-left active:bg-gray-50"
                >
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">{r.nome}</span>
                  <span className="font-heading font-black text-lg text-gray-500 shrink-0">
                    {r.limiteOsm ?? '—'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Avviso>
          I limiti vengono da OpenStreetMap: dove non sono mappati mostro quello generale
          previsto per quel tipo di strada. Fa fede il cartello sul posto, non la mappa.
        </Avviso>
      </div>
    </>
  );
}

function Risultato({ zona, cercando }) {
  const mappato = zona.fonteLimite === 'osm';
  return (
    <div className={`app-card p-4 flex items-center gap-4 ${cercando ? 'opacity-50' : ''}`}>
      <SegnaleLimite valore={zona.limiteOsm} spento={zona.limiteOsm == null} />
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-900 leading-snug truncate">
          {zona.stradaOsm || zona.nome}
        </h3>
        <p className="text-sm text-gray-500 leading-snug mt-0.5">
          {zona.limiteOsm == null
            ? 'Nessun limite ricavabile per questo punto'
            : mappato
              ? 'Limite mappato per questa strada'
              : 'Limite generale per questo tipo di strada'}
        </p>
        {zona.stradaOsm && <p className="text-[11px] text-gray-400 truncate mt-1">{zona.nome}</p>}
      </div>
    </div>
  );
}
