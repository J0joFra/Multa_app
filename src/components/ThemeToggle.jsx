import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

function iniziale() {
  if (typeof window === 'undefined') return false;
  try {
    const salvato = localStorage.getItem('theme');
    if (salvato) return salvato === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export default function ThemeToggle() {
  const [scuro, setScuro] = useState(iniziale);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', scuro);
    try { localStorage.setItem('theme', scuro ? 'dark' : 'light'); } catch { /* ignora */ }
  }, [scuro]);

  return (
    <button
      onClick={() => setScuro((s) => !s)}
      title={scuro ? 'Tema chiaro' : 'Tema scuro'}
      aria-label="Cambia tema"
      className="w-9 h-9 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white active:scale-95 transition-transform"
    >
      {scuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
