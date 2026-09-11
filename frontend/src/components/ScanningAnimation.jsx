import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, ShieldAlert, CheckCircle2, FileSearch } from 'lucide-react';

const STAGES = [
  "Optical ingestion & noise normalization...",
  "Localizing Principal Display Panel (PDP)...",
  "Reading packaging typography via Vision-LLM...",
  "Evaluating Rule 6(1)(a) manufacturer address & PIN...",
  "Validating MRP & mandatory tax inclusivity...",
  "Checking Rule 12 standard metric units...",
  "Calculating shelf-life and expiry timeline...",
  "Synthesizing statutory compliance verdict..."
];

export default function ScanningAnimation({ previewUrl }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 550);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-6 text-white border border-slate-700 shadow-xl max-w-md mx-auto">
      {/* Scanner Visual Container */}
      <div className="relative w-full h-48 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* Background Image or Grid */}
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Packaging being scanned"
            className="w-full h-full object-cover opacity-40 blur-xs"
          />
        ) : (
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]" />
        )}

        {/* Center Scanner Reticle */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="p-3 bg-slate-800/80 rounded-full border border-amber-400/40 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
            <Scan className="w-8 h-8 animate-pulse" />
          </div>
          <span className="text-[11px] font-mono-audit text-slate-400 mt-2 tracking-wider uppercase">
            Surveillance OCR Active
          </span>
        </div>

        {/* Animated Laser Scanline sweeping down */}
        <motion.div
          initial={{ top: '0%' }}
          animate={{ top: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: 'linear'
          }}
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#F59E0B] z-20"
        />

        {/* Subtle glowing overlay behind scanline */}
        <motion.div
          initial={{ top: '-20%' }}
          animate={{ top: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: 'linear'
          }}
          className="absolute left-0 right-0 h-12 bg-gradient-to-b from-amber-400/15 to-transparent z-10 pointer-events-none"
        />
      </div>

      {/* Rotating Status Stage Text */}
      <div className="mt-4 text-center min-h-[3rem] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={stageIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center gap-2 text-xs text-amber-300 font-mono-audit font-medium"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>{STAGES[stageIndex]}</span>
          </motion.div>
        </AnimatePresence>
        <p className="text-[11px] text-slate-400 mt-1">
          Validating against 8 codified rules under Legal Metrology Act, 2009
        </p>
      </div>
    </div>
  );
}
