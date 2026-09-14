import React from 'react';
import { ChevronLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';

/** Testata a gradiente blu, sticky: stessa impaginazione su tutte le pagine. */
export default function PageHeader({ icon: Icon, title, sottotitolo, onIndietro, right }) {
  return (
    <div
      className="bg-gradient-to-r from-[#0A66C2] to-[#004182] sticky top-0 z-30 shadow-md text-white"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onIndietro ? (
            <button
              onClick={onIndietro}
              aria-label="Indietro"
              className="shrink-0 p-1.5 -ml-1.5 rounded-xl active:bg-white/15"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            Icon && (
              <div className="shrink-0 p-1.5 rounded-xl bg-white/15 border border-white/25 shadow-sm">
                <Icon className="w-5 h-5 text-white" />
              </div>
            )
          )}
          <div className="min-w-0">
            <h1 className="font-heading font-black text-xl uppercase tracking-wide truncate text-white">{title}</h1>
            {sottotitolo && <p className="text-[11px] text-white/75 truncate -mt-0.5">{sottotitolo}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
