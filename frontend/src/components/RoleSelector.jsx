import React from 'react';
import { User, ShieldCheck, Lock } from 'lucide-react';

export default function RoleSelector({ currentRole, onSelectRole, currentUser }) {
  return (
    <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 sm:p-1 rounded-lg border border-slate-300 shrink-0">
      <button
        onClick={() => onSelectRole('consumer')}
        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
          currentRole === 'consumer'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="hidden sm:inline">Ordinary Consumer</span>
        <span className="sm:hidden">Consumer</span>
      </button>

      <button
        onClick={() => onSelectRole('inspector')}
        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
          currentRole === 'inspector'
            ? 'bg-[#0F172A] text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="hidden sm:inline">Inspector / Admin</span>
        <span className="sm:hidden">Inspector</span>
        {!currentUser && (
          <Lock className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
        )}
      </button>
    </div>
  );
}
