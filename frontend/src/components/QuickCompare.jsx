import React, { useState } from 'react';
import { Columns3, CheckCircle2, XCircle, Tag, Scale, Sparkles, ShieldCheck } from 'lucide-react';
import StatusPill from './StatusPill';

const COMPARISON_PRESETS = [
  {
    category: "Iodized Salt",
    itemA: {
      name: "Tata Salt Vacuum Evaporated (1 kg)",
      brand: "Tata Consumer Products Ltd",
      price: 28.0,
      taxInclusive: true,
      qty: 1.0,
      unit: "kg",
      per100g: 2.80,
      expiry: "August 2028",
      isCompliant: true,
      violations: 0
    },
    itemB: {
      name: "Catch Table Salt Shaker (500 g)",
      brand: "Dharampal Satyapal Foods Ltd",
      price: 22.0,
      taxInclusive: true,
      qty: 500,
      unit: "g",
      per100g: 4.40,
      expiry: "July 2028",
      isCompliant: true,
      violations: 0
    }
  },
  {
    category: "Almond Cookies",
    itemA: {
      name: "Delight Almond Cookies (250 g)",
      brand: "Delight Food Works",
      price: 99.0,
      taxInclusive: false,
      qty: 250,
      unit: "g",
      per100g: 39.60,
      expiry: "Ambiguous (No Mfg Date)",
      isCompliant: false,
      violations: 4
    },
    itemB: {
      name: "Britannia NutriChoice Almonds (200 g)",
      brand: "Britannia Industries Ltd",
      price: 85.0,
      taxInclusive: true,
      qty: 200,
      unit: "g",
      per100g: 42.50,
      expiry: "April 2027",
      isCompliant: true,
      violations: 0
    }
  }
];

export default function QuickCompare() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const pair = COMPARISON_PRESETS[selectedPresetIndex];

  const priceDiff = Math.abs(pair.itemA.per100g - pair.itemB.per100g);
  const cheaperItem = pair.itemA.per100g < pair.itemB.per100g ? 'A' : 'B';
  const percentDiff = Math.round((priceDiff / Math.max(pair.itemA.per100g, pair.itemB.per100g)) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Columns3 className="w-4 h-4 text-slate-400" />
            <span>Shopper Quick Compare Mode</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5">
            Side-by-Side Commodity Decision Matrix
          </h3>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sample Pair:</span>
          <select
            value={selectedPresetIndex}
            onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
            className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none"
          >
            {COMPARISON_PRESETS.map((p, idx) => (
              <option key={idx} value={idx}>{p.category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Cards Side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Product A */}
        <div className={`p-4 rounded-xl border transition-all ${
          cheaperItem === 'A' ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Option A</span>
            {cheaperItem === 'A' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                <span>Value Winner ({percentDiff}% cheaper)</span>
              </span>
            )}
          </div>

          <div className="text-sm font-bold text-slate-900 mt-1">{pair.itemA.name}</div>
          <div className="text-xs text-slate-500">{pair.itemA.brand}</div>

          <div className="mt-4 space-y-2 text-xs divide-y divide-slate-200/60">
            <div className="flex justify-between pt-1.5">
              <span className="text-slate-500">Retail Price (MRP):</span>
              <span className="font-mono-audit font-bold text-slate-900">
                ₹{pair.itemA.price.toFixed(2)} {pair.itemA.taxInclusive ? '(incl. taxes)' : '(NO TAX CLAUSE ❌)'}
              </span>
            </div>

            <div className="flex justify-between pt-1.5">
              <span className="text-slate-500">Net Quantity:</span>
              <span className="font-mono-audit font-bold text-slate-900">
                {pair.itemA.qty} {pair.itemA.unit}
              </span>
            </div>

            <div className="flex justify-between pt-1.5">
              <span className="text-slate-500">Normalized Unit Price:</span>
              <span className="font-mono-audit font-bold text-indigo-900">
                ₹{pair.itemA.per100g.toFixed(2)} / 100g
              </span>
            </div>

            <div className="flex justify-between pt-1.5">
              <span className="text-slate-500">Estimated Expiry:</span>
              <span className="text-slate-800">{pair.itemA.expiry}</span>
            </div>

            <div className="flex justify-between pt-1.5">
              <span className="text-slate-500">Statutory Compliance:</span>
              <StatusPill status={pair.itemA.isCompliant ? 'COMPLIANT' : 'VIOLATION'} size="small" />
            </div>
          </div>
        </div>

        {/* Product B */}
        <div className={`p-4 rounded-xl border transition-all ${
          cheaperItem === 'B' ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Option B</span>
            {cheaperItem === 'B' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                <span>Value Winner ({percentDiff}% cheaper)</span>
              </span>
            )}
          </div>

          <div className="text-sm font-bold text-slate-900 mt-1">{pair.itemB.name}</div>
          <div className="text-xs text-slate-500">{pair.itemB.brand}</div>

          <div className="mt-4 space-y-2 text-xs divide-y divide-slate-200/60">
            <div className="flex justify-between pt-1.5">
              <span className="text-slate-500">Retail Price (MRP):</span>
              <span className="font-mono-audit font-bold text-slate-900">
                ₹{pair.itemB.price.toFixed(2)} {pair.itemB.taxInclusive ? '(incl. taxes)' : '(NO TAX CLAUSE ❌)'}
              </span>
            </div>

            <div className="flex justify-between pt-1.5">
              <span className="text-slate-500">Net Quantity:</span>
              <span className="font-mono-audit font-bold text-slate-900">
                {pair.itemB.qty} {pair.itemB.unit}
              </span>
            </div>

            <div className="flex justify-between pt-1.5">
              <span className="text-slate-500">Normalized Unit Price:</span>
              <span className="font-mono-audit font-bold text-indigo-900">
                ₹{pair.itemB.per100g.toFixed(2)} / 100g
              </span>
            </div>

            <div className="flex justify-between pt-1.5">
              <span className="text-slate-500">Estimated Expiry:</span>
              <span className="text-slate-800">{pair.itemB.expiry}</span>
            </div>

            <div className="flex justify-between pt-1.5">
              <span className="text-slate-500">Statutory Compliance:</span>
              <StatusPill status={pair.itemB.isCompliant ? 'COMPLIANT' : 'VIOLATION'} size="small" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
