import React, { useState } from 'react';
import { Calculator, ArrowRight, CheckCircle2, TrendingDown, Percent, Sparkles } from 'lucide-react';

export default function PriceComparator({ primaryScan }) {
  // Primary Product (Scanned)
  const p1Price = primaryScan?.extracted_data?.mrp?.value || 0;
  const p1Qty = primaryScan?.extracted_data?.net_quantity?.value || 0;
  const p1Unit = (primaryScan?.extracted_data?.net_quantity?.unit || 'g').toLowerCase();
  const p1Name = primaryScan?.product_name || 'Primary Pack';

  // Comparison Product (Manual Entry or Secondary Pack)
  const [p2Price, setP2Price] = useState(p1Price > 0 ? (p1Price * 1.8).toFixed(2) : '50');
  const [p2Qty, setP2Qty] = useState(p1Qty > 0 ? (p1Qty * 2).toString() : '500');
  const [p2Unit, setP2Unit] = useState(p1Unit || 'g');
  const [p2Name, setP2Name] = useState('Alternative Pack / Size');

  // Convert to base grams or ml
  const normalizeToBase = (qty, unit) => {
    const u = (unit || '').toLowerCase();
    if (u === 'kg' || u === 'l' || u === 'litre' || u === 'liter' || u === 'kilos') {
      return qty * 1000;
    }
    return qty;
  };

  const p1Base = normalizeToBase(p1Qty, p1Unit);
  const p2Base = normalizeToBase(parseFloat(p2Qty) || 0, p2Unit);

  // Price per 100g / 100ml
  const p1Per100 = p1Base > 0 && p1Price > 0 ? (p1Price / p1Base) * 100 : 0;
  const p2Per100 = p2Base > 0 && parseFloat(p2Price) > 0 ? (parseFloat(p2Price) / p2Base) * 100 : 0;

  // Determine better deal
  let winner = null;
  let percentSavings = 0;

  if (p1Per100 > 0 && p2Per100 > 0) {
    if (p1Per100 < p2Per100) {
      winner = 'p1';
      percentSavings = Math.round(((p2Per100 - p1Per100) / p2Per100) * 100);
    } else if (p2Per100 < p1Per100) {
      winner = 'p2';
      percentSavings = Math.round(((p1Per100 - p2Per100) / p1Per100) * 100);
    }
  }

  const isVolume = p1Unit.includes('l') || p1Unit.includes('ml') || p2Unit.includes('l');
  const standardUnitLabel = isVolume ? '₹ / 100 ml' : '₹ / 100 g';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Calculator className="w-4 h-4 text-slate-400" />
          <span>Price-Per-Unit Value Comparator</span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">Standardized to {standardUnitLabel}</span>
      </div>

      {/* Side-by-side comparison grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pack 1 (Scanned Item) */}
        <div className={`p-4 rounded-xl border transition-all ${
          winner === 'p1' 
            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pack A (Scanned)</span>
            {winner === 'p1' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                <span>Better Deal ({percentSavings}% Cheaper)</span>
              </span>
            )}
          </div>

          <div className="text-sm font-semibold text-slate-900 mt-1 truncate">{p1Name}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Declared: ₹{p1Price.toFixed(2)} for {p1Qty} {p1Unit}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/70">
            <div className="text-[10px] uppercase font-bold text-slate-400">Unit Price:</div>
            <div className="text-xl font-bold font-mono-audit text-slate-900">
              ₹{p1Per100.toFixed(2)} <span className="text-xs font-normal text-slate-500">/ 100 {isVolume ? 'ml' : 'g'}</span>
            </div>
          </div>
        </div>

        {/* Pack 2 (Alternative Size or Competing Brand) */}
        <div className={`p-4 rounded-xl border transition-all ${
          winner === 'p2' 
            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pack B (Comparison)</span>
            {winner === 'p2' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                <span>Better Deal ({percentSavings}% Cheaper)</span>
              </span>
            )}
          </div>

          {/* Inline inputs to test any second product size */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="text-[10px] text-slate-500 block">Price (₹):</label>
              <input
                type="number"
                step="0.5"
                value={p2Price}
                onChange={(e) => setP2Price(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono-audit outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block">Net Qty ({p2Unit}):</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={p2Qty}
                  onChange={(e) => setP2Qty(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono-audit outline-none focus:ring-1 focus:ring-slate-800"
                />
                <select
                  value={p2Unit}
                  onChange={(e) => setP2Unit(e.target.value)}
                  className="px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 outline-none"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">L</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/70">
            <div className="text-[10px] uppercase font-bold text-slate-400">Unit Price:</div>
            <div className="text-xl font-bold font-mono-audit text-slate-900">
              ₹{p2Per100.toFixed(2)} <span className="text-xs font-normal text-slate-500">/ 100 {isVolume ? 'ml' : 'g'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shopper Value Verdict Footer */}
      {winner && (
        <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <span>
              <b>Shopper Verdict:</b> {winner === 'p1' ? 'Pack A (Scanned)' : 'Pack B'} offers a{' '}
              <b>{percentSavings}% price advantage</b> per unit weight.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
