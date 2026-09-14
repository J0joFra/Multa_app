import React, { useEffect, useState } from 'react';
import Elenco from './screens/Elenco.jsx';
import Acquisisci from './screens/Acquisisci.jsx';
import Scheda from './screens/Scheda.jsx';
import Analisi from './screens/Analisi.jsx';
import { caricaVerbali, salvaVerbali } from './lib/storage.js';

export default function App() {
  const [verbali, setVerbali] = useState([]);
  const [pronto, setPronto] = useState(false);
  const [vista, setVista] = useState('elenco');
  const [corrente, setCorrente] = useState(null);
  const [letti, setLetti] = useState([]);

  useEffect(() => {
    caricaVerbali().then((v) => {
      setVerbali(v);
      setPronto(true);
    });
  }, []);

  // Salva solo dopo il primo caricamento, altrimenti il primo render
  // sovrascriverebbe i dati su disco con l'array vuoto.
  useEffect(() => {
    if (pronto) salvaVerbali(verbali);
  }, [verbali, pronto]);

  // Il tasto "indietro" di Android deve tornare indietro, non chiudere l'app.
  useEffect(() => {
    let rimuovi = () => {};
    import('@capacitor/app')
      .then(({ App: CapApp }) => CapApp.addListener('backButton', () => {
        if (vista === 'elenco') CapApp.exitApp();
        else setVista(vista === 'analisi' ? 'scheda' : 'elenco');
      }))
      .then((h) => { rimuovi = () => h.remove(); })
      .catch(() => {});
    return () => rimuovi();
  }, [vista]);

  const salvato = corrente ? verbali.some((v) => v.id === corrente.id) : false;

  function salvaCorrente(v = corrente) {
    setVerbali((p) => {
      const i = p.findIndex((x) => x.id === v.id);
      if (i === -1) return [v, ...p];
      const copia = [...p];
      copia[i] = v;
      return copia;
    });
  }

  if (!pronto) return <div className="min-h-full bg-ink" />;

  if (vista === 'acquisisci') {
    return (
      <Acquisisci
        onIndietro={() => setVista('elenco')}
        onPronto={(v, campiLetti) => {
          setCorrente(v);
          setLetti(campiLetti);
          setVista('scheda');
        }}
      />
    );
  }

  if (vista === 'scheda' && corrente) {
    return (
      <Scheda
        verbale={corrente}
        letti={letti}
        onIndietro={() => setVista(salvato ? 'elenco' : 'acquisisci')}
        onAnalizza={(v) => {
          setCorrente(v);
          if (salvato) salvaCorrente(v);
          setVista('analisi');
        }}
      />
    );
  }

  if (vista === 'analisi' && corrente) {
    return (
      <Analisi
        verbale={corrente}
        salvato={salvato}
        onIndietro={() => setVista('elenco')}
        onModifica={() => setVista('scheda')}
        onSalva={() => salvaCorrente()}
      />
    );
  }

  return (
    <Elenco
      verbali={verbali}
      onNuovo={() => { setCorrente(null); setLetti([]); setVista('acquisisci'); }}
      onApri={(v) => { setCorrente(v); setLetti([]); setVista('analisi'); }}
      onElimina={(id) => setVerbali((p) => p.filter((x) => x.id !== id))}
    />
  );
}
