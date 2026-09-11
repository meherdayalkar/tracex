import React, { useEffect, useState } from 'react';
import { History, AlertCircle } from 'lucide-react';

const PAST_SCANS_KEY = 'tracex_scan_history_consumer';

export default function DuplicateCheck({ currentScan }) {
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  useEffect(() => {
    if (!currentScan || !currentScan.product_name) return;

    try {
      const historyStr = localStorage.getItem(PAST_SCANS_KEY);
      const history = historyStr ? JSON.parse(historyStr) : [];

      const normName = currentScan.product_name.trim().toLowerCase();
      const existing = history.find(h => 
        h.name.toLowerCase() === normName && h.scanId !== currentScan.scan_id
      );

      if (existing) {
        setDuplicateInfo(existing);
      } else {
        // Record this scan
        history.push({
          scanId: currentScan.scan_id,
          name: currentScan.product_name,
          brand: currentScan.manufacturer,
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        });
        localStorage.setItem(PAST_SCANS_KEY, JSON.stringify(history));
      }
    } catch (e) {
      console.error('Duplicate check error:', e);
    }
  }, [currentScan]);

  if (!duplicateInfo) return null;

  return (
    <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 flex items-start gap-2.5">
      <History className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
      <div>
        <span className="font-bold">Prior Purchase / Scan Alert:</span> You scanned this exact commodity{' '}
        (<b>{duplicateInfo.name}</b>) previously on <b>{duplicateInfo.date}</b>.
        Check your home pantry before purchasing to prevent duplicate food waste.
      </div>
    </div>
  );
}
