import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend
} from 'recharts';
import { 
  BarChart3, ShieldCheck, AlertTriangle, FileText, CheckCircle2, 
  RefreshCw, Download, MapPin, AlertOctagon, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiUrl } from '../config/api';

// Count-up animated number component
function AnimatedNumber({ value, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 800; // ms
    const stepTime = Math.max(Math.floor(duration / end), 20);
    const increment = Math.max(Math.ceil(end / (duration / stepTime)), 1);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
}

export default function Dashboard({ onSelectManufacturer }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('All India');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchStats = async (region = selectedRegion) => {
    setLoading(true);
    try {
      const url = region && region !== 'All India' 
        ? `/api/dashboard/stats?region=${encodeURIComponent(region)}` 
        : '/api/dashboard/stats';
      const res = await fetch(apiUrl(url));
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedRegion);
  }, [selectedRegion]);

  if (loading || !stats) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-800 mb-2"></div>
        <p className="text-xs">Loading Legal Metrology Surveillance Analytics...</p>
      </div>
    );
  }

  const COLORS = ['#059669', '#DC2626'];

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Header with Region Filter & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            <span>National Surveillance Intelligence</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">National Packaging Compliance Dashboard</h2>
          <p className="text-xs text-slate-600 mt-1">
            Aggregated market surveillance metrics across audited retail packaging categories.
          </p>
        </div>

        {/* Region Filter & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Region Dropdown (Feature 10) */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
            >
              {stats.regions_available?.map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          <a
            href={apiUrl('/api/scans/export.csv')}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => fetchStats(selectedRegion)}
            className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh analytics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards with Animated Count-Up Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Scans */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Total Items Audited
          </div>
          <div className="text-2xl font-bold font-mono-audit text-slate-900">
            <AnimatedNumber value={stats.total_scans} />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {selectedRegion} market surveillance
          </div>
        </div>

        {/* Compliance Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Statutory Compliance Rate
          </div>
          <div className="text-2xl font-bold font-mono-audit text-emerald-700">
            {stats.compliance_rate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.compliant_scans} compliant of {stats.total_scans} items
          </div>
        </div>

        {/* Violations */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Non-Compliant Items
          </div>
          <div className="text-2xl font-bold font-mono-audit text-red-700">
            <AnimatedNumber value={stats.non_compliant_scans} />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Subject to Section 36(1) notices
          </div>
        </div>

        {/* Formal Notices */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Section 36 Notices Issued
          </div>
          <div className="text-2xl font-bold font-mono-audit text-slate-900">
            <AnimatedNumber value={stats.total_notices_sent} />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cryptographically signed with RSA-2048
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Violation Types Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            Top Contravention Categories in {selectedRegion}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.violation_breakdown}
                layout="vertical"
                margin={{ top: 5, right: isMobile ? 15 : 30, left: isMobile ? 10 : 40, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis 
                  type="category" 
                  dataKey="rule" 
                  tick={{ fontSize: isMobile ? 9 : 10, fill: '#334155' }} 
                  width={isMobile ? 105 : 140}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '6px', fontSize: '11px' }} 
                />
                <Bar dataKey="count" fill="#334155" radius={[0, 4, 4, 0]} isAnimationActive={true}>
                  {stats.violation_breakdown?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#DC2626' : '#1E293B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Ratio Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            Compliance Ratio
          </div>
          <div className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.compliance_ratio}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {stats.compliance_ratio?.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '6px', fontSize: '11px' }} 
                />
                <Legend 
                  verticalAlign="bottom" 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Repeat Offenders Ranking Table (Feature 6) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="bg-[#0F172A] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Repeat Offender Tracking (Recidivist Brands)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Sorted by aggregated contraventions count
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Manufacturer / Packer</th>
                <th className="py-2.5 px-4">Region</th>
                <th className="py-2.5 px-4">Audited Samples</th>
                <th className="py-2.5 px-4">Total Contraventions</th>
                <th className="py-2.5 px-4">Primary Observed Defect</th>
                <th className="py-2.5 px-4 text-right">Enforcement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {(!stats.repeat_offenders || stats.repeat_offenders.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No repeat offenders detected in this jurisdiction.
                  </td>
                </tr>
              ) : (
                stats.repeat_offenders.map((offender, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {offender.manufacturer}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {offender.region || 'National'}
                    </td>
                    <td className="py-3 px-4 font-mono-audit">
                      {offender.scans_count} pack(s)
                    </td>
                    <td className="py-3 px-4 font-mono-audit font-bold text-red-700">
                      {offender.violations_count} violation(s)
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      {offender.primary_defect}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                        Section 36(1) Escalation
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
