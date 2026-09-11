import React from 'react';
import { User, ShieldCheck } from 'lucide-react';

export default function RoleSelector({ currentRole, onSelectRole }) {
  return (
    <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg border border-slate-300">
      <button
        onClick={() => onSelectRole('consumer')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          currentRole === 'consumer'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <User className="w-3.5 h-3.5 text-slate-500" />
        <span>Ordinary Consumer</span>
      </button>

      <button
        onClick={() => onSelectRole('inspector')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          currentRole === 'inspector'
            ? 'bg-[#0F172A] text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
        <span>Inspector / Admin</span>
      </button>
    </div>
  );
}
