import React, { useState, useEffect } from 'react';
import { Scale, ShieldCheck, LogOut, UserCheck, Lock } from 'lucide-react';
import RoleSelector from './components/RoleSelector';
import ConsumerView from './components/ConsumerView';
import InspectorView from './components/InspectorView';
import AdminAuthModal from './components/AdminAuthModal';
import { apiUrl } from './config/api';

export default function App() {
  const [currentRole, setCurrentRole] = useState('consumer');
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('tracex_auth_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tracex_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Validate stored authentication token with backend on initial load
  useEffect(() => {
    if (!authToken) return;

    fetch(apiUrl('/api/auth/me'), {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Token expired or invalid');
        return res.json();
      })
      .then((user) => {
        setCurrentUser(user);
        localStorage.setItem('tracex_auth_user', JSON.stringify(user));
      })
      .catch((err) => {
        console.warn('Session verification note:', err.message);
        // Clear invalid session
        localStorage.removeItem('tracex_auth_token');
        localStorage.removeItem('tracex_auth_user');
        setAuthToken(null);
        setCurrentUser(null);
        setCurrentRole('consumer');
      });
  }, [authToken]);

  const handleSelectRole = (role) => {
    setCurrentRole(role);
    if (role === 'inspector' && (!currentUser || !authToken)) {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = (token, user) => {
    setAuthToken(token);
    setCurrentUser(user);
    localStorage.setItem('tracex_auth_token', token);
    localStorage.setItem('tracex_auth_user', JSON.stringify(user));
    setCurrentRole('inspector');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem('tracex_auth_token');
    localStorage.removeItem('tracex_auth_user');
    setCurrentRole('consumer');
  };

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

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Authenticated Officer Badge & Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
                <div className="min-w-0 text-left hidden lg:block">
                  <div className="text-[11px] font-semibold text-white truncate max-w-[140px]">
                    {currentUser.full_name.replace(/\(.*?\)/g, '').trim()}
                  </div>
                  <div className="text-[9px] font-mono-audit text-amber-300 truncate">
                    {currentUser.badge_number}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded transition-colors cursor-pointer"
                  title="Sign Out to Consumer View"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Role Switcher */}
            <RoleSelector 
              currentRole={currentRole} 
              onSelectRole={handleSelectRole} 
              currentUser={currentUser}
            />
          </div>
        </div>
      </header>

      {/* Main View Container */}
      <div className="flex-1">
        {currentRole === 'consumer' ? (
          <ConsumerView />
        ) : (
          <InspectorView 
            currentUser={currentUser} 
            authToken={authToken} 
            onLogout={handleLogout} 
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
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

      {/* Authentication Modal */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
