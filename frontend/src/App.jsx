import React, { useState } from 'react';
import { Scale, ShieldCheck } from 'lucide-react';
import RoleSelector from './components/RoleSelector';
import ConsumerView from './components/ConsumerView';
import InspectorView from './components/InspectorView';

export default function App() {
  const [currentRole, setCurrentRole] = useState('consumer');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] text-slate-900">
      {/* Top Application Header */}
      <header className="bg-[#0F172A] text-white border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-slate-800 rounded-lg text-amber-400 border border-slate-700 shrink-0">
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight">TraceX</span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold font-mono-audit bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  SIH26034
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Legal Metrology Label Compliance Scanner • Ministry of Consumer Affairs (DoCA)
              </p>
            </div>
          </div>

          {/* User Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <RoleSelector 
              currentRole={currentRole} 
              onSelectRole={setCurrentRole} 
            />
          </div>
        </div>
      </header>

      {/* Main View Container */}
      <div className="flex-1">
        {currentRole === 'consumer' ? (
          <ConsumerView />
        ) : (
          <InspectorView />
        )}
      </div>

      {/* Footer Disclaimer */}
      <footer className="bg-slate-900 text-slate-400 text-center py-3 border-t border-slate-800 text-xs shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Legal Metrology Act, 2009 & Packaged Commodities Rules 2011 (PCR 2011)
          </div>
          <div className="font-mono-audit text-[11px] text-slate-500">
            TraceX Enforcement Node • Department of Consumer Affairs (DoCA)
          </div>
        </div>
      </footer>
    </div>
  );
}
