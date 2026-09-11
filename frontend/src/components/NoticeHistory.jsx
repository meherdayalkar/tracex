import React, { useState, useEffect } from 'react';
import { Mail, FileText, CheckCircle2, ShieldCheck, ExternalLink, RefreshCw, Check } from 'lucide-react';
import StatusPill from './StatusPill';
import { apiUrl } from '../config/api';

const STATUS_OPTIONS = [
  { value: 'ISSUED', label: 'Issued', color: 'bg-slate-100 text-slate-800' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged', color: 'bg-sky-50 text-sky-800' },
  { value: 'RESPONDED', label: 'Responded', color: 'bg-amber-50 text-amber-800' },
  { value: 'RESOLVED', label: 'Resolved / Paid', color: 'bg-emerald-50 text-emerald-800' },
  { value: 'ESCALATED', label: 'Escalated to Court', color: 'bg-red-50 text-red-800' }
];

export default function NoticeHistory() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/notices'));
      const data = await res.json();
      setNotices(data);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleStatusChange = async (noticeId, newStatus) => {
    setUpdatingId(noticeId);
    try {
      const res = await fetch(apiUrl(`/api/notices/${noticeId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      setNotices(prev => prev.map(n => 
        n.id === noticeId ? { ...n, status: data.status } : n
      ));
    } catch (err) {
      console.error('Failed to update notice status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Statutory Enforcement Notices</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Formal Notices & Enforcement Case Tracking</h2>
          <p className="text-xs text-slate-600 mt-1">
            Track notice delivery lifecycle from issuance to acknowledgement, company response, and compounding settlement.
          </p>
        </div>

        <button
          onClick={fetchNotices}
          className="inline-flex items-center self-start sm:self-auto gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notices Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F172A] text-white uppercase text-[11px] tracking-wider font-medium">
              <tr>
                <th className="py-3 px-4">Notice ID</th>
                <th className="py-3 px-4">Target Company & Email</th>
                <th className="py-3 px-4">Scan Ref</th>
                <th className="py-3 px-4">Issued Date</th>
                <th className="py-3 px-4">SHA-256 Digest</th>
                <th className="py-3 px-4">Enforcement Lifecycle</th>
                <th className="py-3 px-4 text-right">PDF Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {notices.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No formal notices issued yet. Non-compliant scans can issue notices directly from the audit screen.
                  </td>
                </tr>
              )}
              {notices.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono-audit font-bold text-slate-900">
                    {n.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{n.company_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono-audit">{n.recipient_email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono-audit text-slate-600">
                    {n.scan_id}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {n.issued_at}
                  </td>
                  <td className="py-3.5 px-4 font-mono-audit text-[11px] text-slate-500">
                    <span title={n.sha256_hash}>
                      {n.sha256_hash ? `${n.sha256_hash.slice(0, 10)}...` : 'N/A'}
                    </span>
                  </td>

                  {/* Interactive Lifecycle Status Dropdown (Feature 7) */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={n.status || 'ISSUED'}
                        onChange={(e) => handleStatusChange(n.id, e.target.value)}
                        disabled={updatingId === n.id}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-slate-800 cursor-pointer shadow-2xs"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {updatingId === n.id && (
                        <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={apiUrl(n.pdf_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>View PDF</span>
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
