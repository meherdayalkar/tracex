import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, BookmarkPlus, SlidersHorizontal } from 'lucide-react';

export default function ExpiryCalculator({ extractedData, productName, onSaveToPantry }) {
  // Allow user to toggle between real system date and a custom testing date
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [testDateStr, setTestDateStr] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!extractedData) return null;

  const mfg = extractedData.mfg_date || {};
  const bestBefore = extractedData.best_before || {};

  // Check if manufacturing/packing date exists
  const hasMfg = Boolean(mfg.month && mfg.year) || Boolean(mfg.raw_string);
  const rawDuration = bestBefore.duration || '';

  // Calculate Expiry Date
  const calculateExpiry = () => {
    if (!hasMfg) {
      return {
        canCalculate: false,
        reason: "No manufacturing / packing date found on label."
      };
    }

    let mfgMonth = mfg.month || 1;
    let mfgYear = mfg.year || 2026;

    // If mfg has raw string like "08/2026" or "07-2026"
    if (mfg.raw_string) {
      const match = mfg.raw_string.match(/(0[1-9]|1[0-2])[\/\-](20\d{2}|\d{2})/);
      if (match) {
        mfgMonth = parseInt(match[1], 10);
        let y = parseInt(match[2], 10);
        if (y < 100) y += 2000;
        mfgYear = y;
      }
    }

    const startDate = new Date(mfgYear, mfgMonth - 1, 1);
    let expiryDate = new Date(startDate);

    // Parse duration string: "6 months", "24 Months", "180 days", "12 weeks", "1 year"
    const durLower = rawDuration.toLowerCase();
    const numMatch = durLower.match(/(\d+)/);
    const num = numMatch ? parseInt(numMatch[1], 10) : 6; // default 6 if unspecified duration

    if (durLower.includes('day')) {
      expiryDate.setDate(expiryDate.getDate() + num);
    } else if (durLower.includes('week')) {
      expiryDate.setDate(expiryDate.getDate() + (num * 7));
    } else if (durLower.includes('year')) {
      expiryDate.setFullYear(expiryDate.getFullYear() + num);
    } else {
      // Default to months
      expiryDate.setMonth(expiryDate.getMonth() + num);
    }

    // Reference Date: system date or custom testing date
    const refDate = useCustomDate && testDateStr ? new Date(testDateStr) : new Date();

    const diffTime = expiryDate.getTime() - refDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.round(diffDays / 30.4);

    let status = 'fresh';
    let statusText = '';
    let badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    let dotColor = 'bg-emerald-500';

    if (diffDays < 0) {
      status = 'expired';
      const daysPast = Math.abs(diffDays);
      statusText = `Likely expired — ${daysPast} day${daysPast === 1 ? '' : 's'} past estimated shelf life`;
      badgeColor = 'bg-red-50 text-red-800 border-red-300';
      dotColor = 'bg-red-500';
    } else if (diffDays <= 30) {
      status = 'expiring_soon';
      statusText = `Expiring soon — only ${diffDays} day${diffDays === 1 ? '' : 's'} remaining`;
      badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
      dotColor = 'bg-amber-500';
    } else {
      status = 'fresh';
      statusText = `Fresh — ~${diffMonths} month${diffMonths === 1 ? '' : 's'} remaining`;
      badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      dotColor = 'bg-emerald-500';
    }

    const options = { month: 'long', year: 'numeric' };
    const formattedExpiry = expiryDate.toLocaleDateString('en-IN', options);

    return {
      canCalculate: true,
      expiryDate,
      formattedExpiry,
      status,
      statusText,
      badgeColor,
      dotColor,
      diffDays,
      mfgFormatted: startDate.toLocaleDateString('en-IN', options)
    };
  };

  const result = calculateExpiry();

  const handleSave = () => {
    if (!result.canCalculate || !onSaveToPantry) return;

    onSaveToPantry({
      id: `item_${Date.now()}`,
      name: productName || extractedData.product_name || 'Packaged Commodity',
      brand: extractedData.manufacturer_name || 'Generic',
      mfgDate: result.mfgFormatted,
      expiryDate: result.formattedExpiry,
      expiryTimestamp: result.expiryDate.getTime(),
      addedAt: new Date().toISOString()
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Intelligent Expiry & Shelf-Life Calculator</span>
        </div>

        {/* Date Testing Override Button */}
        <button
          onClick={() => setUseCustomDate(!useCustomDate)}
          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
          title="Simulate a future date to test expiry badges"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>{useCustomDate ? 'Using Test Date' : 'Simulate Test Date'}</span>
        </button>
      </div>

      {/* Date Testing Slider/Input Bar */}
      {useCustomDate && (
        <div className="mb-4 p-2.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-600 font-medium">Test As If Today Were:</span>
          <input
            type="date"
            value={testDateStr}
            onChange={(e) => setTestDateStr(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>
      )}

      {/* Main Calculation Content */}
      {result.canCalculate ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="text-[11px] text-slate-500">Estimated Expiry Timeline:</div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">
                This product expires around: <span className="text-indigo-950">{result.formattedExpiry}</span>
              </div>
            </div>

            {/* Freshness Status Pill */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${result.badgeColor}`}>
              <span className={`w-2 h-2 rounded-full ${result.dotColor}`}></span>
              <span>{result.statusText}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Anchor Packing Date:</span>
              <span className="font-semibold text-slate-800">{result.mfgFormatted}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Declared Shelf Life:</span>
              <span className="font-semibold text-slate-800">{rawDuration || 'Standard 6 Months'}</span>
            </div>
          </div>

          {/* Save to My Pantry CTA */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors shadow-2xs"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>{savedSuccess ? 'Saved to My Pantry ✔' : 'Save to My Pantry'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Missing Mfg Date Warning */
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">⚠️ Can't calculate expiry date</div>
            <p className="mt-0.5 text-amber-800">
              No manufacturing or packing date was detected on this packaging label. A vague "Best before" 
              phrase without an anchor date makes it impossible to determine when the product goes stale. 
              Check with the retailer before purchasing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
