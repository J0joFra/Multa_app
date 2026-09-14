import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { caricaVerbali, salvaVerbali } from './storage.js';

const Ctx = createContext(null);

/** Stato condiviso fra le pagine: i verbali salvati e la bozza in lavorazione. */
export function VerbaliProvider({ children }) {
  const [verbali, setVerbali] = useState([]);
  const [pronto, setPronto] = useState(false);
  const [bozza, setBozza] = useState(null);   // verbale in corso di compilazione
  const [letti, setLetti] = useState([]);     // campi riconosciuti dall'OCR

  useEffect(() => {
    caricaVerbali().then((v) => {
      setVerbali(v);
      setPronto(true);
    });
  }, []);

  // Solo dopo il primo caricamento: altrimenti il primo render
  // sovrascriverebbe i dati su disco con l'array vuoto.
  useEffect(() => {
    if (pronto) salvaVerbali(verbali);
  }, [verbali, pronto]);

  const valore = useMemo(() => ({
    verbali,
    pronto,
    bozza,
    letti,
    apriBozza: (v, campiLetti = []) => { setBozza(v); setLetti(campiLetti); },
    // La scheda scrive qui, non in uno stato locale: la transizione di pagina
    // rimonta il componente e uno useState andrebbe perso a metà compilazione.
    aggiorna: (id, patch) => {
      setBozza((b) => (b && b.id === id ? { ...b, ...patch } : b));
      setVerbali((p) => (p.some((x) => x.id === id) ? p.map((x) => (x.id === id ? { ...x, ...patch } : x)) : p));
    },
    salva: (v) => setVerbali((p) => {
      const i = p.findIndex((x) => x.id === v.id);
      if (i === -1) return [v, ...p];
      const copia = [...p];
      copia[i] = v;
      return copia;
    }),
    elimina: (id) => setVerbali((p) => p.filter((x) => x.id !== id)),
    trova: (id) => verbali.find((x) => x.id === id) || (bozza?.id === id ? bozza : null),
    salvato: (id) => verbali.some((x) => x.id === id),
  }), [verbali, pronto, bozza, letti]);

  return <Ctx.Provider value={valore}>{children}</Ctx.Provider>;
}

export function useVerbali() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useVerbali fuori dal provider');
  return v;
}
