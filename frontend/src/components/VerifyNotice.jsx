import React, { useState, useRef } from 'react';
import { ShieldCheck, Upload, AlertTriangle, CheckCircle2, XCircle, FileText, KeyRound, Cpu, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusPill from './StatusPill';
import { apiUrl } from '../config/api';

export default function VerifyNotice() {
  const [loading, setLoading] = useState(false);
  const [verifyPhase, setVerifyPhase] = useState(''); // 'hash' | 'crypto' | 'done'
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [verifyResult, setVerifyResult] = useState(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleVerifyUpload = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setVerifyResult(null);
    setVerifyPhase('hash');
    setVerifyProgress(25);

    const startTime = Date.now();

    // Start network fetch and cryptographic simulation steps
    try {
      const formData = new FormData();
      formData.append('file', file);

      const fetchPromise = fetch(apiUrl('/api/notices/verify'), {
        method: 'POST',
        body: formData
      }).then(r => r.json());

      // Progress animation steps: ~400ms for hashing, ~400ms for RSA validation
      await new Promise(r => setTimeout(r, 400));
      setVerifyPhase('crypto');
      setVerifyProgress(70);

      const [data] = await Promise.all([
        fetchPromise,
        new Promise(r => setTimeout(r, 450))
      ]);

      setVerifyProgress(100);
      setVerifyPhase('done');
      await new Promise(r => setTimeout(r, 150));
      setVerifyResult(data);
    } catch (err) {
      console.error('Verification request failed:', err);
      setVerifyResult({
        is_valid: false,
        message: 'Network error or unable to communicate with verification server.'
      });
    } finally {
      setLoading(false);
      setVerifyPhase('');
    }
  };

  const handleTestTampered = async () => {
    // Generates a mock tampered PDF byte stream
    const tamperedBlob = new Blob(
      ["%PDF-1.4 Mock Legal Notice with Altered Penalty Amount: Fine modified from Rs. 25,000 to Rs. 0"],
      { type: 'application/pdf' }
    );
    const tamperedFile = new File([tamperedBlob], "altered_notice_sample.pdf", { type: 'application/pdf' });
    handleVerifyUpload(tamperedFile);
  };

  const handleTestGenuine = async () => {
    try {
      // Fetch the seeded genuine notice PDF
      const listRes = await fetch(apiUrl('/api/notices'));
      const list = await listRes.json();
      if (list.length > 0) {
        const noticeId = list[0].id;
        const pdfRes = await fetch(apiUrl(`/api/notices/${noticeId}/pdf`));
        const pdfBlob = await pdfRes.blob();
        const genuineFile = new File([pdfBlob], `${noticeId}_Show_Cause_Notice.pdf`, { type: 'application/pdf' });
        handleVerifyUpload(genuineFile);
      }
    } catch (err) {
      console.error('Failed to load genuine notice:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
          <span>Statutory Document Integrity Service</span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Verify Formal Notice Integrity</h2>
        <p className="text-xs text-slate-600 mt-1 max-w-2xl">
          Recipients and magistrates can verify that an issued Show-Cause Notice is genuine, originated from the
          Department of Consumer Affairs (DoCA), and has not been altered in transit.
        </p>
      </div>

      {/* Quick Test Bar */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 sm:p-3.5 mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="text-xs font-semibold text-slate-700">
          🧪 Quick Demo Simulation:
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={handleTestGenuine}
            disabled={loading}
            className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-800 transition-colors shadow-2xs text-center"
          >
            Test Genuine Notice (Pass)
          </button>
          <button
            onClick={handleTestTampered}
            disabled={loading}
            className="px-3 py-1.5 bg-white border border-red-300 hover:bg-red-50 rounded-lg text-xs font-semibold text-red-800 transition-colors shadow-2xs text-center"
          >
            Test Tampered Notice (Fail)
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white rounded-2xl p-8 text-center cursor-pointer transition-all shadow-xs"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleVerifyUpload(e.target.files?.[0])}
          accept="application/pdf"
          className="hidden"
        />
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-700 mb-3">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">
          {loading ? 'Re-hashing PDF & Verifying RSA Signature...' : 'Upload Notice PDF to verify authenticity'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {fileName ? `Selected file: ${fileName}` : 'Drag and drop or browse the received notice PDF'}
        </p>
      </div>

      {/* Active Cryptographic Progress Indicator */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-6 bg-[#0F172A] text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Lock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    {verifyPhase === 'hash' ? 'Computing SHA-256 Byte Digest...' : 'Validating RSA-2048 Digital Signature...'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {verifyPhase === 'hash' 
                      ? 'Hashing raw document byte stream for cryptographic integrity...'
                      : 'Verifying asymmetric signature against DoCA root public certificate...'}
                  </p>
                </div>
              </div>
              <span className="font-mono-audit text-xs font-bold text-amber-400">
                {verifyProgress}%
              </span>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-indigo-500 h-full rounded-full"
                initial={{ width: '10%' }}
                animate={{ width: `${verifyProgress}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-mono-audit">
              <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                verifyProgress >= 30 ? 'bg-slate-800/80 border-indigo-500/40 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span>1. SHA-256 Digest {verifyProgress >= 70 ? '✓' : '...'}</span>
              </div>
              <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                verifyProgress >= 70 ? 'bg-slate-800/80 border-indigo-500/40 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>2. RSA-2048 Verification {verifyProgress >= 100 ? '✓' : '...'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Result Card */}
      {verifyResult && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`mt-6 border rounded-2xl p-6 shadow-sm ${
            verifyResult.is_valid
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : 'bg-red-50/70 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-start gap-4">
            {verifyResult.is_valid ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 space-y-3">
              <div>
                <h4 className="text-base font-bold">
                  {verifyResult.is_valid
                    ? '✔ Document Authenticity Verified: Issued by Legal Metrology Inspectorate'
                    : '⚠️ This document may have been altered — signature invalid'}
                </h4>
                <p className="text-xs mt-1 text-slate-700">
                  {verifyResult.message}
                </p>
              </div>

              <div className="bg-white/90 border border-slate-200/80 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Integrity Status:</span>
                  <StatusPill status={verifyResult.is_valid ? 'VERIFIED' : 'ALTERED'} />
                </div>

                {verifyResult.notice_id && (
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Notice Identifier:</span>
                    <span className="font-mono-audit font-bold text-slate-900">{verifyResult.notice_id}</span>
                  </div>
                )}

                {verifyResult.company_name && (
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Addressee:</span>
                    <span className="text-slate-800">{verifyResult.company_name}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 block mb-1">Computed SHA-256 Byte Digest:</span>
                  <div className="font-mono-audit text-[11px] bg-slate-900 text-sky-400 p-2.5 rounded-lg break-all select-all">
                    {verifyResult.sha256_hash}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1">
                  Cryptographic verification executed against the Department of Consumer Affairs RSA-2048 public key.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
