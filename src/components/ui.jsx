import React from 'react';

export function Bottone({ variante = 'primario', className = '', ...props }) {
  const stili = {
    primario: 'bg-primary text-primary-foreground active:brightness-95 shadow-sm',
    neutro: 'bg-white text-foreground border border-gray-200 active:bg-gray-50',
    pericolo: 'bg-white text-destructive border border-destructive/40 active:bg-gray-50',
  };
  return (
    <button
      {...props}
      className={`w-full rounded-2xl px-4 py-3.5 font-semibold text-[15px] disabled:opacity-40 transition-all active:scale-[0.99] ${stili[variante]} ${className}`}
    />
  );
}

export function Campo({ etichetta, suggerimento, children }) {
  return (
    <label className="block mb-4">
      <Etichetta>{etichetta}</Etichetta>
      {children}
      {suggerimento && <span className="block text-xs text-gray-500 mt-1.5 leading-snug">{suggerimento}</span>}
    </label>
  );
}

/**
 * Come Campo, ma per i gruppi di bottoni: un <button> dentro un <label>
 * riceve anche il click inoltrato dalla label al primo controllo del gruppo,
 * e la risposta finisce sul bottone sbagliato.
 */
export function CampoGruppo({ etichetta, suggerimento, children }) {
  return (
    <div role="group" aria-label={etichetta} className="block mb-4">
      <Etichetta>{etichetta}</Etichetta>
      {children}
      {suggerimento && <span className="block text-xs text-gray-500 mt-1.5 leading-snug">{suggerimento}</span>}
    </div>
  );
}

function Etichetta({ children }) {
  return (
    <span className="block text-[11px] font-heading font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
      {children}
    </span>
  );
}

const campoCls =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors';

export function Input({ className = '', ...props }) {
  return <input {...props} className={`${campoCls} ${className}`} />;
}

export function Select({ opzioni, className = '', ...props }) {
  return (
    <select {...props} className={`${campoCls} ${className}`}>
      {opzioni.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/** Sì / No / Non so: il "non so" è un'informazione, non un buco. */
export function TreStati({ valore, onChange }) {
  const opzioni = [
    { v: 'si', l: 'Sì' },
    { v: 'no', l: 'No' },
    { v: null, l: 'Non so' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {opzioni.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            valore === o.v
              ? 'bg-primary border-primary text-primary-foreground'
              : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function Sezione({ titolo, children, className = '' }) {
  return (
    <section className={className}>
      <h2 className="font-heading font-bold uppercase tracking-widest text-[11px] text-muted-foreground mb-2 px-1">
        {titolo}
      </h2>
      {children}
    </section>
  );
}

export function Avviso({ children }) {
  return (
    <p className="text-[11px] text-gray-500 leading-relaxed px-1">{children}</p>
  );
}
