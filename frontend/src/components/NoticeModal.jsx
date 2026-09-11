import React, { useState, useEffect } from 'react';
import { X, Send, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Mail, Info } from 'lucide-react';
import { apiUrl } from '../config/api';

export default function NoticeModal({ scan, isOpen, onClose, onNoticeSent }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [responseDeadline, setResponseDeadline] = useState('15 Calendar Days');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [noticeResult, setNoticeResult] = useState(null);

  // Whenever scan changes or modal opens, re-synchronize form fields specifically for THIS label
  useEffect(() => {
    if (isOpen && scan) {
      setNoticeResult(null);
      setSubmitting(false);

      const extractedEmail = scan.extracted_data?.consumer_care?.email || '';
      setRecipientEmail(extractedEmail);

      const compName = scan.manufacturer || scan.extracted_data?.manufacturer_name || scan.product_name || 'Packaged Commodity Manufacturer';
      setCompanyName(compName);

      setResponseDeadline('15 Calendar Days');
      setNotes(`Notice issued under Section 36(1) for packaging contraventions observed in ${scan.product_name || 'commodity'}.`);
    }
  }, [isOpen, scan?.scan_id, scan?.id]);

  if (!isOpen || !scan) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.trim()) {
      alert("Please enter a valid recipient company email address.");
      return;
    }
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('scan_id', scan.scan_id || scan.id);
      formData.append('recipient_email', recipientEmail.trim());
      formData.append('company_name', companyName.trim());
      formData.append('response_deadline', responseDeadline);
      formData.append('notes', notes);

      const res = await fetch(apiUrl('/api/notices/generate'), {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setNoticeResult(data);
      if (onNoticeSent) onNoticeSent(data);
    } catch (err) {
      console.error('Failed to dispatch notice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#0F172A] text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold tracking-tight">Issue Formal Statutory Notice (Section 36)</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400">Tamper-evident RSA-2048 Signed Legal Notice</p>
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
        {!noticeResult ? (
          <form onSubmit={handleSend} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Scan Audit Reference
              </label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono-audit text-slate-800 flex items-center justify-between">
                <span>{scan.scan_id || scan.id} — {scan.product_name}</span>
                <span className="text-[10px] text-slate-500 font-sans font-normal">
                  {scan.manufacturer || 'Unknown Manufacturer'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter manufacturer/company name"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-800 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Company Notice Email <span className="text-red-500">*</span>
                  </label>
                  {recipientEmail && (
                    <button
                      type="button"
                      onClick={() => setRecipientEmail('')}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. compliance@brand.in or your test email"
                  required
                  autoFocus={!recipientEmail}
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:ring-1 focus:ring-slate-800 outline-none transition-colors ${
                    !recipientEmail ? 'border-amber-400 bg-amber-50/20' : 'border-slate-300'
                  }`}
                />
                {scan.extracted_data?.consumer_care?.email ? (
                  <p className="text-[10px] text-emerald-600 mt-1">
                    ✓ Auto-detected from packaging label: <span className="font-mono">{scan.extracted_data.consumer_care.email}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-700 mt-1">
                    ⚠️ No email found on packaging. Enter recipient company email above.
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                  <span>Demo shortcut:</span>
                  <button
                    type="button"
                    onClick={() => setRecipientEmail('meherdayalkar55@gmail.com')}
                    className="text-slate-700 hover:text-slate-900 font-mono bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                  >
                    meherdayalkar55@gmail.com
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statutory Response Window
              </label>
              <input
                type="text"
                value={responseDeadline}
                onChange={(e) => setResponseDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspector Audit Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-800 outline-none resize-none"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
              <span>
                <b>Tamper-Evident Workflow:</b> A formal A4 PDF notice will be compiled, hashed using SHA-256, 
                and digitally signed using the Inspectorate's RSA-2048 private key before dispatch over encrypted SMTP.
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F172A] text-white hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-60"
              >
                {submitting ? (
                  <span>Signing & Dispatching Notice...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Cryptographically Sign & Dispatch Notice</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Notice Generated Success State */
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center gap-3 text-emerald-800 bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">Formal Notice Issued & Signed Successfully</h4>
                <p className="text-xs text-emerald-700">Cryptographic RSA-2048 signature generated & registered in audit database.</p>
              </div>
            </div>

            {/* Email Dispatch Mode Feedback */}
            {noticeResult.email_status?.success && noticeResult.email_status?.mode !== 'SIMULATED_AUDIT_LOG' ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Live Email Transmitted:</span> Sent to <b>{noticeResult.recipient_email}</b> via {noticeResult.email_status?.mode?.includes('HTTPS') ? 'Secure HTTPS Email API (Port 443)' : 'Authenticated SMTP / TLS'}.
                  <div className="text-[11px] text-emerald-700 mt-0.5">{noticeResult.email_status?.message}</div>
                </div>
              </div>
            ) : noticeResult.email_status?.mode === 'LIVE_SMTP_ERROR' ? (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    <span className="font-bold text-amber-900">Document Signed & Logged (Cloud Host Outbound Notice):</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {noticeResult.email_status?.message || 'Could not connect to external mail server.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold text-amber-900">Prototype Sandbox Mode:</span> Notice was recorded in the database and the court-admissible PDF was signed.
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Live delivery uses authenticated SMTP or Resend API (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">RESEND_API_KEY</code>).
                  </p>
                </div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Notice Identifier:</span>
                <span className="font-mono-audit font-bold text-slate-900">{noticeResult.notice_id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Recipient Entity:</span>
                <span className="text-slate-800">{noticeResult.company_name} ({noticeResult.recipient_email})</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Document SHA-256 Hash Digest:</span>
                <div className="p-2 bg-[#0F172A] text-sky-400 rounded-md font-mono-audit text-[11px] break-all select-all">
                  {noticeResult.sha256_hash}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">RSA-2048 Digital Signature (Hex):</span>
                <div className="p-2 bg-[#0F172A] text-emerald-400 rounded-md font-mono-audit text-[10px] break-all max-h-16 overflow-y-auto select-all">
                  {noticeResult.signature_hex}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
              <a
                href={apiUrl(noticeResult.pdf_url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>View Signed Notice PDF</span>
              </a>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F172A] text-white hover:bg-slate-800 transition-colors text-center"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
