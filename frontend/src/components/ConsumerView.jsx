import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, Volume2, VolumeX, CheckCircle2, XCircle, 
  ChevronDown, ChevronUp, Tag, Calendar, Building, HelpCircle, Phone, Globe,
  Columns3, Package, Sparkles, AlertTriangle
} from 'lucide-react';
import StatusPill from './StatusPill';
import ComplaintHelper from './ComplaintHelper';
import ExpiryCalculator from './ExpiryCalculator';
import PriceComparator from './PriceComparator';
import MyPantry, { saveItemToPantry } from './MyPantry';
import QuickCompare from './QuickCompare';
import DuplicateCheck from './DuplicateCheck';
import ScanningAnimation from './ScanningAnimation';
import { apiUrl } from '../config/api';

export default function ConsumerView({ onScanComplete }) {
  const [activeSubTab, setActiveSubTab] = useState('scan'); // 'scan', 'compare', 'pantry'
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [openWhy, setOpenWhy] = useState(false);
  const [openAction, setOpenAction] = useState(false);
  const fileInputRef = useRef(null);

  const handlePresetSelect = async (preset) => {
    setLoading(true);
    setPreviewUrl(null);
    try {
      const formData = new FormData();
      formData.append('preset_name', preset);
      const res = await fetch(apiUrl('/api/scan'), {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setScanResult(data);
      if (onScanComplete) onScanComplete(data);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(apiUrl('/api/scan'), {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setScanResult(data);
      if (onScanComplete) onScanComplete(data);
    } catch (err) {
      console.error('Upload scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeech = () => {
    if (!scanResult) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const isPass = scanResult.is_compliant;
    const text = isPass
      ? `This product, ${scanResult.product_name || 'scanned package'}, complies with legal metrology packaging rules. The price is rupees ${scanResult.extracted_data?.mrp?.value || 'verified'}, inclusive of all taxes. Manufacturer address and consumer care details are verified.`
      : `Warning: This product, ${scanResult.product_name || 'scanned package'}, has ${scanResult.hard_violations_count} packaging deficiencies. Mandatory declarations such as tax inclusivity, manufacturing date, or complete postal address appear missing or non-compliant.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Top Consumer Sub-Navigation Bar */}
      <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-200/80 rounded-xl max-w-md mx-auto mb-6 border border-slate-300">
        <button
          onClick={() => setActiveSubTab('scan')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'scan'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-amber-500" />
          <span>Product Scanner</span>
        </button>

        <button
          onClick={() => setActiveSubTab('compare')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'compare'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Columns3 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Quick Compare</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pantry')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'pantry'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-emerald-600" />
          <span>My Pantry</span>
        </button>
      </div>

      {/* Sub-View: Quick Compare */}
      {activeSubTab === 'compare' && <QuickCompare />}

      {/* Sub-View: My Pantry */}
      {activeSubTab === 'pantry' && <MyPantry />}

      {/* Sub-View: Scanner (Primary Mode) */}
      {activeSubTab === 'scan' && (
        <div>
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Consumer Product Label Check
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Verify if packaged food, grocery, or commodities follow Indian consumer laws, pricing rules, and shelf-life norms.
            </p>
          </div>

          {/* Quick Demo Presets */}
          <div className="bg-slate-100/80 border border-slate-300/80 rounded-xl p-3.5 mb-6">
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>⚡ Instant Demo Presets:</span>
              <span className="text-[11px] text-slate-500 font-normal">Click to test without camera</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePresetSelect('tata')}
                disabled={loading}
                className="text-left px-3 py-2 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all shadow-xs text-xs"
              >
                <div className="font-semibold text-emerald-800">✅ Tata Salt</div>
                <div className="text-[11px] text-slate-500 truncate">1 kg • Compliant</div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePresetSelect('cookie')}
                disabled={loading}
                className="text-left px-3 py-2 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-300 rounded-lg transition-all shadow-xs text-xs"
              >
                <div className="font-semibold text-red-800">❌ Delight Cookies</div>
                <div className="text-[11px] text-slate-500 truncate">Missing tax & date</div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePresetSelect('garam')}
                disabled={loading}
                className="text-left px-3 py-2 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-300 rounded-lg transition-all shadow-xs text-xs"
              >
                <div className="font-semibold text-red-800">❌ King Masala</div>
                <div className="text-[11px] text-slate-500 truncate">Illegal 'gms' unit</div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePresetSelect('parle')}
                disabled={loading}
                className="text-left px-3 py-2 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all shadow-xs text-xs"
              >
                <div className="font-semibold text-emerald-800">✅ Parle-G</div>
                <div className="text-[11px] text-slate-500 truncate">65g • Compliant</div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePresetSelect('varnish')}
                disabled={loading}
                className="text-left px-3 py-2 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-300 rounded-lg transition-all shadow-xs text-xs"
              >
                <div className="font-semibold text-red-800">❌ Floor Varnish</div>
                <div className="text-[11px] text-slate-500 truncate">Missing tax clause</div>
              </motion.button>
            </div>
          </div>

          {/* Photo Upload Zone */}
          <motion.div 
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white rounded-2xl p-6 text-center cursor-pointer transition-all shadow-xs hover:shadow-sm"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-700 mb-3">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              {loading ? 'Scanning & Analyzing Packaging...' : 'Take a photo or upload product label'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports clear photos of the back panel containing MRP, Net Weight, and Manufacturer details.
            </p>
          </motion.div>

          {/* Scanning Animation (Laser sweep + rotating OCR messages) */}
          {loading && (
            <div className="mt-6">
              <ScanningAnimation previewUrl={previewUrl} />
            </div>
          )}

          {/* Results Reveal */}
          <AnimatePresence>
            {scanResult && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="mt-6 space-y-4"
              >
                {/* Duplicate / Recall Check Alert */}
                <DuplicateCheck currentScan={scanResult} />

                {/* Big Plain-Language Status Card with SVG Draw Animation */}
                <div className={`border rounded-2xl p-6 shadow-sm transition-all ${
                  scanResult.is_compliant 
                    ? 'bg-emerald-50/80 border-emerald-300' 
                    : 'bg-red-50/80 border-red-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      {scanResult.is_compliant ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          {/* Animated SVG Checkmark */}
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.5, ease: 'easeInOut' }}
                              d="M20 6L9 17l-5-5"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                          {/* Animated SVG X */}
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.4, ease: 'easeInOut' }}
                              d="M18 6L6 18M6 6l12 12"
                            />
                          </svg>
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          {scanResult.is_compliant 
                            ? '✅ This product label looks legal and complete' 
                            : '⚠️ Required legal packaging information is missing'}
                        </h2>
                        <p className="text-xs text-slate-700 mt-1">
                          {scanResult.is_compliant
                            ? 'All mandatory packaging declarations (MRP, tax clause, standard units, and customer care) were verified.'
                            : `Found ${scanResult.hard_violations_count} required declaration(s) missing or violating packaging laws.`}
                        </p>
                      </div>
                    </div>

                    {/* Text to Speech Button */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleSpeech}
                      title="Read label report out loud"
                      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0 shadow-xs"
                    >
                      {speaking ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4" />}
                    </motion.button>
                  </div>
                </div>

                {/* Expiry Calculator (Core Feature 1) */}
                <ExpiryCalculator 
                  extractedData={scanResult.extracted_data} 
                  productName={scanResult.product_name}
                  onSaveToPantry={(item) => saveItemToPantry(item)}
                />

                {/* Price-Per-Unit Comparator (Core Feature 2) */}
                <PriceComparator primaryScan={scanResult} />

                {/* Detail Information Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Price Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Price & Taxes</span>
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {scanResult.extracted_data?.mrp?.value 
                        ? `₹${scanResult.extracted_data.mrp.value.toFixed(2)}` 
                        : 'MRP Not Declared'}
                    </div>
                    <div className="text-xs mt-1">
                      {scanResult.extracted_data?.mrp?.is_tax_inclusive ? (
                        <span className="text-emerald-700 font-medium">✔ Inclusive of all taxes</span>
                      ) : (
                        <span className="text-red-700 font-medium">❌ Missing "inclusive of all taxes"</span>
                      )}
                    </div>
                  </div>

                  {/* Net Quantity Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Net Quantity</span>
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {scanResult.extracted_data?.net_quantity?.value 
                        ? `${scanResult.extracted_data.net_quantity.value} ${scanResult.extracted_data.net_quantity.unit || ''}`
                        : 'Not Declared'}
                    </div>
                    <div className="text-xs mt-1">
                      {['g', 'kg', 'ml', 'l'].includes(scanResult.extracted_data?.net_quantity?.unit?.toLowerCase() || '') ? (
                        <span className="text-emerald-700 font-medium">✔ Standard legal metric unit</span>
                      ) : (
                        <span className="text-red-700 font-medium">❌ Non-standard unit symbol ({scanResult.extracted_data?.net_quantity?.unit})</span>
                      )}
                    </div>
                  </div>

                  {/* Freshness & Date Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Packaging Date</span>
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {scanResult.extracted_data?.mfg_date?.raw_string || 
                       (scanResult.extracted_data?.mfg_date?.month ? `${scanResult.extracted_data.mfg_date.month}/${scanResult.extracted_data.mfg_date.year}` : 'Missing Date')}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      {scanResult.extracted_data?.best_before?.duration || 'No best before specified'}
                    </div>
                  </div>

                  {/* Customer Care Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Customer Care</span>
                    </div>
                    <div className="text-xs font-medium text-slate-900 truncate">
                      {scanResult.extracted_data?.consumer_care?.phone || 'No helpline phone'}
                    </div>
                    <div className="text-xs text-slate-600 truncate mt-0.5">
                      {scanResult.extracted_data?.consumer_care?.email || 'No email declared'}
                    </div>
                  </div>
                </div>

                {/* Expandable "Why does this matter?" Section */}
                <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs">
                  <button
                    onClick={() => setOpenWhy(!openWhy)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                      <span>Why does packaging compliance matter to me as a buyer?</span>
                    </span>
                    {openWhy ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {openWhy && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100 space-y-2">
                      <p>
                        • <b>Preventing Overcharging:</b> Under Indian law, charging above the MRP or adding taxes on top of an MRP that is supposed to be "inclusive of all taxes" is an offence.
                      </p>
                      <p>
                        • <b>Freshness Guarantees:</b> Products must state the month and year of packing. A vague "Best before 6 months" without a manufacturing date prevents consumers from knowing when it was made.
                      </p>
                      <p>
                        • <b>Grievance Redressal:</b> Under the 2022 Amendment, every company must provide both an email and a phone number so consumers can seek replacements or refunds.
                      </p>
                    </div>
                  )}
                </div>

                {/* Expandable "What should I do?" Section */}
                <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs">
                  <button
                    onClick={() => setOpenAction(!openAction)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span>What should I do if a product has violations?</span>
                    </span>
                    {openAction ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {openAction && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100 space-y-2">
                      <p>
                        1. You can decline purchasing items with illegible prices or missing manufacture dates.
                      </p>
                      <p>
                        2. Use the <b>Complaint Helper</b> below to register a formal report with the Department of Consumer Affairs or call <b>1912</b>.
                      </p>
                    </div>
                  )}
                </div>

                {/* Complaint Helper Button & Draft */}
                <ComplaintHelper scanResult={scanResult} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
