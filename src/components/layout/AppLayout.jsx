import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ScrollText, ScanLine, Scale, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = [
  { path: '/', label: 'Multe', icon: ScrollText },
  { path: '/analizza', label: 'Analizza', icon: ScanLine },
  { path: '/ricorso', label: 'Ricorso', icon: Scale },
  { path: '/guida', label: 'Guida', icon: BookOpen },
];

export default function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[430px] mx-auto overflow-x-hidden">
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-nav">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50
                   bg-white border-t border-border safe-bottom"
        style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.06), 0 -4px 16px rgba(0,0,0,0.06)' }}
      >
        <div className="grid grid-cols-4 h-16">
          {tabs.map(({ path, label, icon: Icon }) => {
            const attivo = path === '/' ? pathname === '/' : pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors
                  ${attivo ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {attivo && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
                <Icon style={{ width: 20, height: 20 }} strokeWidth={attivo ? 2.2 : 1.8} />
                <span className={`text-[10px] font-semibold mt-0.5 ${attivo ? 'text-primary' : 'text-muted-foreground/70'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
