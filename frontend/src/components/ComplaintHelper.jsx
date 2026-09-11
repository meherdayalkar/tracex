import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink, PhoneCall } from 'lucide-react';

export default function ComplaintHelper({ scanResult }) {
  const [copied, setCopied] = useState(false);

  if (!scanResult || scanResult.is_compliant) return null;

  const violations = (scanResult.evaluation_result?.checks || [])
    .filter(c => c.status === 'fail')
    .map(c => `- ${c.rule_description}: ${c.reason}`)
    .join('\n');

  const complaintDraft = `To: National Consumer Helpline (NCH) / Department of Consumer Affairs
Subject: Complaint regarding Packaging Violations under Legal Metrology (Packaged Commodities) Rules 2011

Product Name: ${scanResult.product_name || 'Packaged Commodity'}
Manufacturer: ${scanResult.manufacturer || 'Unspecified / Missing'}
TraceX Audit ID: ${scanResult.scan_id || 'N/A'}
Date of Inspection: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}

Statutory Contraventions Observed:
${violations}

I request the Enforcement Directorate to examine this packaging discrepancy under Section 36(1) of the Legal Metrology Act, 2009.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(complaintDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="mt-5 sm:mt-6 border border-amber-300 bg-amber-50/70 rounded-xl p-3.5 sm:p-5 text-slate-800">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900">
            Report this to National Consumer Helpline (NCH)
          </h4>
          <p className="text-xs text-slate-600 mt-1">
            As a consumer in India, you are entitled to clear packaging declarations under the Legal Metrology Act.
            We have prepared a pre-filled grievance draft you can copy and submit directly to the Government portal.
          </p>

          <div className="mt-3 bg-white border border-amber-200 rounded-lg p-3 text-xs font-mono-audit text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
            {complaintDraft}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Complaint Draft'}</span>
            </button>

            <a
              href="https://consumerhelpline.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors text-center"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Open consumerhelpline.gov.in</span>
            </a>

            <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 text-center">
              <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
              <span>Toll-Free Helpline: 1912</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
