import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppLayout from './components/layout/AppLayout.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import { VerbaliProvider } from './lib/store.jsx';
import Multe from './pages/Multe.jsx';
import Analizza from './pages/Analizza.jsx';
import Scheda from './pages/Scheda.jsx';
import Esito from './pages/Esito.jsx';
import Scadenze from './pages/Scadenze.jsx';
import Guida from './pages/Guida.jsx';

// HashRouter e non BrowserRouter: dentro la WebView di Capacitor l'app è
// servita da file:// e i path puliti non si risolvono.
export default function App() {
  const [splashFatto, setSplashFatto] = useState(false);

  // Il tasto "indietro" di Android segue la history del router.
  useEffect(() => {
    let rimuovi = () => {};
    import('@capacitor/app')
      .then(({ App: CapApp }) => CapApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else CapApp.exitApp();
      }))
      .then((h) => { rimuovi = () => h.remove(); })
      .catch(() => {});
    return () => rimuovi();
  }, []);

  return (
    <VerbaliProvider>
      <AnimatePresence>
        {!splashFatto && <SplashScreen key="splash" onDone={() => setSplashFatto(true)} />}
      </AnimatePresence>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Multe />} />
            <Route path="/analizza" element={<Analizza />} />
            <Route path="/scheda/:id" element={<Scheda />} />
            <Route path="/esito/:id" element={<Esito />} />
            <Route path="/scadenze" element={<Scadenze />} />
            <Route path="/guida" element={<Guida />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </VerbaliProvider>
  );
}
