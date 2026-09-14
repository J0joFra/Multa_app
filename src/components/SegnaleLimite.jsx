import React from 'react';

/** Il limite come lo vedi per strada: cerchio bianco, bordo rosso, numero nero. */
export default function SegnaleLimite({ valore, dimensione = 86, spento = false }) {
  const bordo = Math.max(6, Math.round(dimensione * 0.11));
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center bg-white"
      style={{
        width: dimensione,
        height: dimensione,
        border: `${bordo}px solid ${spento ? '#c9ced6' : '#d8232a'}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <span
        className="font-heading font-black leading-none"
        style={{ fontSize: Math.round(dimensione * 0.42), color: spento ? '#9aa3ad' : '#12161c' }}
      >
        {valore ?? '?'}
      </span>
    </div>
  );
}
