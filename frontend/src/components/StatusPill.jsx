import React from 'react';
import { motion } from 'framer-motion';

export default function StatusPill({ status, label, size = 'normal' }) {
  const normalized = (status || '').toLowerCase();
  
  let bg = 'bg-slate-100 text-slate-700 border-slate-300';
  let dot = 'bg-slate-500';
  const isViolation = ['fail', 'violation', 'non-compliant', 'tampered', 'altered', 'broken', 'escalated'].includes(normalized);

  if (['pass', 'compliant', 'verified', 'issued', 'resolved'].includes(normalized)) {
    bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    dot = 'bg-emerald-600';
  } else if (isViolation) {
    bg = 'bg-red-50 text-red-800 border-red-300';
    dot = 'bg-red-600';
  } else if (['advisory', 'warning', 'review', 'pending', 'acknowledged', 'responded'].includes(normalized)) {
    bg = 'bg-amber-50 text-amber-800 border-amber-300';
    dot = 'bg-amber-600';
  }

  const padding = size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${bg} ${padding}`}>
      <span className="relative flex h-2 w-2 items-center justify-center">
        {isViolation && (
          <motion.span
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inline-flex h-full w-full rounded-full bg-red-400"
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dot}`} />
      </span>
      <span className="font-mono-audit uppercase tracking-wider">{label || status}</span>
    </span>
  );
}
