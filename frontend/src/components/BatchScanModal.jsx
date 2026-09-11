import React, { useState, useRef } from 'react';
import { Layers, Upload, CheckCircle2, XCircle, FileText, X, Play } from 'lucide-react';
import StatusPill from './StatusPill';
import { apiUrl } from '../config/api';

export default function BatchScanModal({ isOpen, onClose, onCompleteBatch }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setResults([]);
  };

  const handleSimulateBatch = () => {
    // 3 simulated sample photos for instant hackathon demonstration
    const mockFiles = [
      { name: "market_sample_1_tata_salt.jpg", preset: "tata" },
      { name: "market_sample_2_delight_cookies.jpg", preset: "cookie" },
      { name: "market_sample_3_kitchen_king_masala.jpg", preset: "garam" }
    ];
    runBatchProcessing(mockFiles);
  };

  const runBatchProcessing = async (items) => {
    setProcessing(true);
    const batchResults = [];

    for (let i = 0; i < items.length; i++) {
      setCurrentIndex(i + 1);
      const item = items[i];

      try {
        const formData = new FormData();
        if (item.preset) {
          formData.append('preset_name', item.preset);
        } else {
          formData.append('file', item);
        }

        const res = await fetch(apiUrl('/api/scan'), {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        batchResults.push({
          fileName: item.name,
          ...data
        });
      } catch (err) {
        console.error('Batch item failed:', err);
      }
      // Small visual pause between scans
      await new Promise(r => setTimeout(r, 400));
    }

    setResults(batchResults);
    setProcessing(false);
    if (onCompleteBatch) onCompleteBatch(batchResults);
  };

  const handleStartRealBatch = () => {
    if (selectedFiles.length === 0) return;
    runBatchProcessing(selectedFiles);
  };

  const compliantCount = results.filter(r => r.is_compliant).length;
  const violationCount = results.filter(r => !r.is_compliant).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Market Raid Bulk / Batch Audit Mode</h3>
              <p className="text-[11px] text-slate-400">Sequential optical verification of multi-product market visits</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* File Selector & Demo Trigger */}
          {results.length === 0 && !processing && (
            <div className="space-y-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 rounded-xl p-6 text-center cursor-pointer transition-all"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelection} 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-800">
                  {selectedFiles.length > 0 ? `${selectedFiles.length} photos selected` : 'Select Multiple Packaging Photos'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Hold Ctrl/Cmd to select up to 10 label photos from a field raid
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleSimulateBatch}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  ⚡ Simulate 3 Market Raid Samples
                </button>

                {selectedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleStartRealBatch}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    <span>Run Batch ({selectedFiles.length})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Processing Progress Bar */}
          {processing && (
            <div className="p-6 bg-slate-50 rounded-xl text-center space-y-3 border border-slate-200">
              <div className="text-xs font-bold text-slate-900">
                Processing Item {currentIndex} of {selectedFiles.length || 3}...
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${(currentIndex / (selectedFiles.length || 3)) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 font-mono-audit">
                Auditing against Rule 6(1), Rule 12, and 2022 Amendment...
              </div>
            </div>
          )}

          {/* Batch Summary Results Table */}
          {results.length > 0 && !processing && (
            <div className="space-y-4">
              {/* Batch KPI Cards */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Audited</div>
                  <div className="text-lg font-bold font-mono-audit text-slate-900">{results.length}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Compliant</div>
                  <div className="text-lg font-bold font-mono-audit text-emerald-800">{compliantCount}</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-[10px] uppercase font-bold text-red-700">Violations</div>
                  <div className="text-lg font-bold font-mono-audit text-red-800">{violationCount}</div>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F172A] text-white text-[10px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Commodity</th>
                      <th className="py-2.5 px-3">Manufacturer</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Defects</th>
                      <th className="py-2.5 px-3 text-right">Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {results.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900 truncate max-w-[140px]">{r.product_name}</td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-[130px]">{r.manufacturer}</td>
                        <td className="py-2 px-3">
                          <StatusPill status={r.is_compliant ? 'COMPLIANT' : 'VIOLATION'} size="small" />
                        </td>
                        <td className="py-2 px-3">
                          {r.hard_violations_count > 0 ? (
                            <span className="text-red-700 font-medium">{r.hard_violations_count} violation(s)</span>
                          ) : (
                            <span className="text-emerald-700">None</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <a
                            href={apiUrl(r.pdf_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-900 font-medium underline"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>PDF</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setResults([]);
                    setSelectedFiles([]);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Start New Batch
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-lg bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
