import React from 'react';
import { ChevronLeft } from 'lucide-react';

export function Schermata({ titolo, onIndietro, azione, children }) {
  return (
    <div className="min-h-full flex flex-col bg-ink">
      <header className="safe-top sticky top-0 z-10 bg-ink/95 backdrop-blur border-b border-line">
        <div className="flex items-center gap-2 px-3 h-14">
          {onIndietro && (
            <button onClick={onIndietro} aria-label="Indietro" className="-ml-2 p-2 rounded-lg active:bg-panel">
              <ChevronLeft size={22} />
            </button>
          )}
          <h1 className="text-lg font-semibold truncate flex-1">{titolo}</h1>
          {azione}
        </div>
      </header>
      <main className="flex-1 px-4 py-4 safe-bottom">{children}</main>
    </div>
  );
}

export function Bottone({ variante = 'primario', className = '', ...props }) {
  const stili = {
    primario: 'bg-blue-600 active:bg-blue-700 text-white',
    neutro: 'bg-panel border border-line active:bg-line text-slate-100',
    pericolo: 'bg-transparent border border-bad/50 text-bad active:bg-bad/10',
  };
  return (
    <button
      {...props}
      className={`w-full rounded-xl px-4 py-3 font-medium disabled:opacity-40 transition-colors ${stili[variante]} ${className}`}
    />
  );
}

export function Campo({ etichetta, suggerimento, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm text-slate-400 mb-1.5">{etichetta}</span>
      {children}
      {suggerimento && <span className="block text-xs text-slate-500 mt-1">{suggerimento}</span>}
    </label>
  );
}

const inputCls = 'w-full bg-panel border border-line rounded-xl px-3 py-2.5 text-slate-100 outline-none focus:border-blue-500';

export function Input(props) {
  return <input {...props} className={inputCls} />;
}

export function Select({ opzioni, ...props }) {
  return (
    <select {...props} className={inputCls}>
      {opzioni.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/** Tris sì / no / non so: il "non so" è un'informazione, non un buco. */
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
          className={`py-2.5 rounded-xl border text-sm ${
            valore === o.v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-panel border-line text-slate-300'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function Sezione({ titolo, children }) {
  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">{titolo}</h2>
      {children}
    </section>
  );
}

export function Avviso({ children }) {
  return (
    <p className="text-xs text-slate-500 leading-relaxed border-t border-line pt-4 mt-6">{children}</p>
  );
}
