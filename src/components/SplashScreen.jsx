import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

/** Apertura breve: lo scudo si disegna, poi lascia il posto all'app. */
export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg,#0A66C2,#004182)' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.svg
        width="96" height="96" viewBox="0 0 64 64" fill="none"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.path
          d="M32 6 54 14v16c0 14-9 22-22 26C19 52 10 44 10 30V14z"
          stroke="#fff" strokeWidth="3.5" strokeLinejoin="round" fill="rgba(255,255,255,0.08)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        />
        <motion.path
          d="M22 32l7 8 14-16"
          stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.6, ease: 'easeOut' }}
        />
      </motion.svg>

      <motion.h1
        className="font-heading font-black text-4xl uppercase tracking-wider text-white mt-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.75 }}
      >
        MultaCheck
      </motion.h1>
      <motion.p
        className="text-white/70 text-sm mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.95 }}
      >
        La tua multa è legittima?
      </motion.p>
    </motion.div>
  );
}
