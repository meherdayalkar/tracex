import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, History, Mail, ShieldCheck, BarChart3, Upload, FileText, 
  Send, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, KeyRound, Layers, LogOut, UserCheck
} from 'lucide-react';
import StatusPill from './StatusPill';
import NoticeModal from './NoticeModal';
import ScanHistory from './ScanHistory';
import NoticeHistory from './NoticeHistory';
import VerifyNotice from './VerifyNotice';
import Dashboard from './Dashboard';
import BatchScanModal from './BatchScanModal';
import { apiUrl } from '../config/api';

export default function InspectorView({ currentUser, authToken, onLogout }) {
  const [activeTab, setActiveTab] = useState('scan');
  const [currentScan, setCurrentScan] = useState(null);
  const [activePreset, setActivePreset] = useState('tata');
  const [loading, setLoading] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Load the initial seeded compliant scan on mount so inspector doesn't see a blank page
  useEffect(() => {
    handlePresetScan('tata');
  }, []);

  const handlePresetScan = async (preset) => {
    setActivePreset(preset);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('preset_name', preset);
      const res = await fetch(apiUrl('/api/scan'), {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setCurrentScan(data);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    setActivePreset(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(apiUrl('/api/scan'), {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setCurrentScan(data);
    } catch (err) {
      console.error('Upload scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadScanById = async (scanId) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/scans/${scanId}`));
      const data = await res.json();
      setCurrentScan({
        scan_id: data.id,
        created_at: data.created_at,
        product_name: data.product_name,
        manufacturer: data.manufacturer,
        is_compliant: data.is_compliant,
        hard_violations_count: data.hard_violations_count,
        advisories_count: data.advisories_count,
        extracted_data: data.extracted_data,
        evaluation_result: data.evaluation_result,
        pdf_url: data.pdf_url
      });
      setActiveTab('scan');
    } catch (err) {
      console.error('Failed to load scan:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-65px)] bg-[#F8F9FB]">
      {/* Sidebar Navigation: Horizontal tab strip on mobile, persistent left sidebar on desktop */}
      <aside className="w-full md:w-64 bg-[#0F172A] text-slate-300 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        <div className="hidden md:block p-4 border-b border-slate-800">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Inspectorate System
          </div>
          <div className="text-sm font-bold text-white tracking-tight mt-0.5">
            Legal Metrology Portal
          </div>
          <div className="text-[11px] font-mono-audit text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Enforcement Online</span>
          </div>

          {/* Officer Identity Card */}
          {currentUser && (
            <div className="mt-3 p-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-left">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">
                  Active Officer
                </span>
                <span className="px-1.5 py-0.5 text-[8px] font-mono-audit bg-amber-400/20 text-amber-300 rounded font-bold">
                  {currentUser.role === 'admin' ? 'CHIEF' : 'INSPECTOR'}
                </span>
              </div>
              <div className="text-xs font-semibold text-white truncate">
                {currentUser.full_name}
              </div>
              <div className="text-[10px] font-mono-audit text-slate-300 mt-0.5 truncate">
                Badge: <span className="text-amber-300">{currentUser.badge_number}</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {currentUser.jurisdiction} • {currentUser.designation}
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="mt-2 w-full py-1 px-2 text-[10px] text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3 h-3 text-red-400" />
                  <span>Sign Out to Consumer</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="p-1.5 sm:p-2 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-none">
          <button
            onClick={() => setActiveTab('scan')}
            className={`whitespace-nowrap shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'scan'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Scan className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Inspection & Scan</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Scan History Log</span>
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className={`whitespace-nowrap shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'notices'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Formal Notices (Sec 36)</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`whitespace-nowrap shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'verify'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Verify Notice Integrity</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>National Dashboard</span>
          </button>
        </nav>

        {/* Footer Authority Badge */}
        <div className="hidden md:block p-4 border-t border-slate-800 text-[10px] text-slate-500">
          <div>Department of Consumer Affairs</div>
          <div>Govt of India • SIH26034</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'history' && <ScanHistory onSelectScan={loadScanById} />}
        {activeTab === 'notices' && <NoticeHistory />}
        {activeTab === 'verify' && <VerifyNotice />}
        {activeTab === 'dashboard' && <Dashboard />}

        {activeTab === 'scan' && (
          <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6">
            {/* Action Bar & Presets */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs">
              <div>
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Surveillance Ingestion & Optical Audit
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Select sample test pack or upload physical label photo
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handlePresetScan('tata')}
                  disabled={loading}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    activePreset === 'tata'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Preset: Tata Salt (Pass)
                </button>
                <button
                  onClick={() => handlePresetScan('cookie')}
                  disabled={loading}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    activePreset === 'cookie'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Preset: Cookies (Violations)
                </button>
                <button
                  onClick={() => handlePresetScan('garam')}
                  disabled={loading}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    activePreset === 'garam'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Preset: Masala ('gms' unit)
                </button>
                <button
                  onClick={() => handlePresetScan('parle')}
                  disabled={loading}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    activePreset === 'parle'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Preset: Parle-G (Pass)
                </button>
                <button
                  onClick={() => handlePresetScan('varnish')}
                  disabled={loading}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    activePreset === 'varnish'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Preset: Varnish (No Tax Incl.)
                </button>

                <button
                  onClick={() => setIsBatchModalOpen(true)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold shadow-2xs transition-colors"
                  title="Conduct sequential bulk audit on multiple market samples"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bulk Raid Scan</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] text-white hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Label Photo</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            {/* Audit Trail Identifier Bar (Audit-Trail Feel) */}
            {currentScan && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100/90 border border-slate-300 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="font-semibold text-slate-600 uppercase tracking-wider text-[11px]">Audit Record:</span>
                  <span className="font-mono-audit font-bold text-slate-900">{currentScan.scan_id || currentScan.id}</span>
                  <span className="text-slate-400 hidden sm:inline">|</span>
                  <span className="text-slate-700">{currentScan.created_at}</span>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <StatusPill status={currentScan.is_compliant ? 'COMPLIANT' : 'NON-COMPLIANT'} />
                </div>
              </div>
            )}

            {/* Ingestion Overview & Technical Evaluation Grid */}
            {currentScan && (
              <div className="space-y-4 sm:space-y-6">
                {/* Product Metadata Summary Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{currentScan.product_name}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Manufacturer: {currentScan.manufacturer || 'Unspecified'}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <a
                        href={apiUrl(currentScan.pdf_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Download Audit Report (PDF)</span>
                      </a>

                      {!currentScan.is_compliant && (
                        <button
                          onClick={() => setIsNoticeModalOpen(true)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5 text-amber-300" />
                          <span>Send Notice to Company</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Key Extracted Entities */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">MRP Declared</span>
                      <span className="font-mono-audit font-bold text-slate-800">
                        {currentScan.extracted_data?.mrp?.value ? `₹${currentScan.extracted_data.mrp.value.toFixed(2)}` : 'MISSING'}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        {currentScan.extracted_data?.mrp?.is_tax_inclusive ? 'Tax Inclusive' : 'No Tax Clause'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Declared Net Qty</span>
                      <span className="font-mono-audit font-bold text-slate-800">
                        {currentScan.extracted_data?.net_quantity?.value ? `${currentScan.extracted_data.net_quantity.value} ${currentScan.extracted_data.net_quantity.unit}` : 'MISSING'}
                      </span>
                      <div className="text-[11px] text-slate-500">Standard SI Unit Check</div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Packing Date</span>
                      <span className="font-mono-audit font-bold text-slate-800">
                        {currentScan.extracted_data?.mfg_date?.raw_string || 'MISSING'}
                      </span>
                      <div className="text-[11px] text-slate-500">Explicit MM/YYYY</div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Postal PIN Code</span>
                      <span className="font-mono-audit font-bold text-slate-800">
                        {currentScan.extracted_data?.has_pin_code ? '6-Digit Verified' : 'MISSING PIN'}
                      </span>
                      <div className="text-[11px] text-slate-500">Rule 6(1)(a) Address</div>
                    </div>
                  </div>
                </div>

                {/* Dense Data Table: Rule ID | Status | Reason | Severity | Confidence */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Statutory Declarations Verification Matrix (PCR 2011)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {currentScan.evaluation_result?.checks?.length || 0} Statutory Rules Evaluated
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Rule Identifier</th>
                          <th className="py-2.5 px-4">Statutory Clause & Mandate</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4">Audit Reason & Legal Observation</th>
                          <th className="py-2.5 px-4">Severity</th>
                          <th className="py-2.5 px-4 text-right">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {currentScan.evaluation_result?.checks?.map((check) => {
                          const isPass = check.status === 'pass';
                          const confKey = check.rule_id?.replace('rule_6_1_', '')?.replace('rule_', '');
                          const confScore = currentScan.extracted_data?.confidence_scores?.[confKey] || 0.94;

                          return (
                            <tr key={check.rule_id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-mono-audit font-bold text-slate-900">
                                {check.rule_id}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900">{check.rule_description}</div>
                                <div className="text-[10px] text-slate-500 font-mono-audit">{check.citation}</div>
                              </td>
                              <td className="py-3 px-4">
                                <StatusPill status={check.status} size="small" />
                              </td>
                              <td className="py-3 px-4 text-slate-800 max-w-sm">
                                {check.reason}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`font-mono-audit uppercase text-[11px] font-semibold ${
                                  check.severity === 'violation' ? 'text-red-700' : 'text-amber-700'
                                }`}>
                                  {check.severity}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono-audit text-slate-600">
                                {(confScore * 100).toFixed(0)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Raw Extracted Text Inspection Drawer */}
                {currentScan.extracted_data?.raw_extracted_text && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Raw Extracted Typography (OCR Stream)
                    </div>
                    <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono-audit whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                      {currentScan.extracted_data.raw_extracted_text}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Notice Modal */}
      <NoticeModal
        key={currentScan?.scan_id || currentScan?.id || 'notice-modal'}
        scan={currentScan}
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        authToken={authToken}
        currentUser={currentUser}
        onNoticeSent={() => {
          // Keep active state
        }}
      />

      {/* Batch Scan Modal */}
      <BatchScanModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onCompleteBatch={(batchItems) => {
          if (batchItems && batchItems.length > 0) {
            // Load the last scanned item for viewing
            const last = batchItems[batchItems.length - 1];
            setCurrentScan(last);
          }
        }}
      />
    </div>
  );
}
