import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, CheckCircle2, AlertCircle, RefreshCw, Eye, Download, MapPin } from 'lucide-react';
import StatusPill from './StatusPill';
import { apiUrl } from '../config/api';

export default function ScanHistory({ onSelectScan }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchScans = async () => {
    setLoading(true);
    try {
      let url = '/api/scans?';
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      if (statusFilter !== 'all') url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await fetch(apiUrl(url));
      const data = await res.json();
      setScans(data);
    } catch (err) {
      console.error('Failed to load scan history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchScans();
  };

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Inspection Surveillance Log</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Scan & Audit History</h2>
          <p className="text-xs text-slate-600 mt-1">
            Centralized repository of packaging scans evaluated under Legal Metrology Rules, 2011.
          </p>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search product or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-full sm:w-56 focus:ring-1 focus:ring-slate-800 outline-none shadow-2xs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 outline-none shadow-2xs"
            >
              <option value="all">All Statuses</option>
              <option value="compliant">Compliant Only</option>
              <option value="non-compliant">Violations Only</option>
            </select>

            <button
              type="submit"
              className="px-3 py-1.5 bg-[#0F172A] text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-2xs"
            >
              Search
            </button>
          </form>

          <a
            href={apiUrl('/api/scans/export.csv')}
            download="tracex_inspection_log.csv"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            title="Download CSV database dump of all audits"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Scans Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F172A] text-white uppercase text-[11px] tracking-wider font-medium">
              <tr>
                <th className="py-3 px-4">Audit Scan ID</th>
                <th className="py-3 px-4">Product Name & Brand</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4">Defects</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {scans.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No scans matching the current search criteria.
                  </td>
                </tr>
              )}
              {scans.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono-audit font-bold text-slate-900">
                    {s.id}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[180px] truncate">
                    {s.product_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-[160px] truncate">
                    {s.manufacturer || 'Unspecified'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                      <MapPin className="w-2.5 h-2.5 text-slate-400" />
                      <span>{s.region || 'National'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {s.created_at}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusPill status={s.is_compliant ? 'COMPLIANT' : 'VIOLATION'} size="small" />
                  </td>
                  <td className="py-3.5 px-4">
                    {s.hard_violations_count > 0 ? (
                      <span className="font-semibold text-red-700">{s.hard_violations_count} violation(s)</span>
                    ) : (
                      <span className="text-emerald-700">0 defects</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => onSelectScan(s.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
                      title="Inspect technical evaluation"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Audit View</span>
                    </button>

                    <a
                      href={apiUrl(s.pdf_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
                      title="Download PDF report"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>PDF</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
