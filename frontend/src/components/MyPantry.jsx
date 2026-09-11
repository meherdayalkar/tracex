import React, { useState, useEffect } from 'react';
import { Package, Bell, BellRing, Trash2, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const PANTRY_STORAGE_KEY = 'tracex_pantry_v1';

export default function MyPantry({ onSelectItem }) {
  const [pantryItems, setPantryItems] = useState([]);
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    loadPantry();
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const loadPantry = () => {
    try {
      const stored = localStorage.getItem(PANTRY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort by expiring soonest
        parsed.sort((a, b) => (a.expiryTimestamp || 0) - (b.expiryTimestamp || 0));
        setPantryItems(parsed);
      } else {
        // Seed an initial demo item so the pantry isn't empty on first opening
        const initialSeed = [
          {
            id: 'demo_salt_1',
            name: 'Tata Salt Vacuum Evaporated',
            brand: 'Tata Consumer Products Ltd',
            mfgDate: 'August 2026',
            expiryDate: 'August 2028',
            expiryTimestamp: new Date(2028, 7, 1).getTime(),
            addedAt: new Date().toISOString()
          },
          {
            id: 'demo_milk_2',
            name: 'Pasteurized Homogenized Milk (1L)',
            brand: 'Amul Dairy Cooperative',
            mfgDate: 'September 2026',
            expiryDate: 'September 2026',
            expiryTimestamp: new Date().getTime() + (5 * 24 * 60 * 60 * 1000), // 5 days from now
            addedAt: new Date().toISOString()
          }
        ];
        initialSeed.sort((a, b) => (a.expiryTimestamp || 0) - (b.expiryTimestamp || 0));
        localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(initialSeed));
        setPantryItems(initialSeed);
      }
    } catch (e) {
      console.error('Failed to load pantry:', e);
    }
  };

  const handleRequestNotif = async () => {
    if (!('Notification' in window)) {
      alert('Browser does not support notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        new Notification('TraceX Expiry Reminders Active', {
          body: 'We will alert you when pantry items are within 30 days of expiring!',
          icon: '/favicon.ico'
        });
      }
    } catch (e) {
      console.error('Notification request error:', e);
    }
  };

  const handleDeleteItem = (id) => {
    const updated = pantryItems.filter(item => item.id !== id);
    setPantryItems(updated);
    localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(updated));
  };

  const getDaysRemaining = (timestamp) => {
    if (!timestamp) return 0;
    const diff = timestamp - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Package className="w-4 h-4 text-slate-400" />
            <span>My Household Pantry</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5">
            Saved Scans & Expiry Tracker ({pantryItems.length} items)
          </h3>
        </div>

        {/* Notifications API Trigger */}
        <div>
          {notifPermission !== 'granted' ? (
            <button
              onClick={handleRequestNotif}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Bell className="w-3.5 h-3.5 text-slate-500" />
              <span>Enable Expiry Alerts</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
              <BellRing className="w-3.5 h-3.5 text-emerald-600" />
              <span>Expiry Reminders Active</span>
            </span>
          )}
        </div>
      </div>

      {/* Pantry List sorted by soonest expiry */}
      {pantryItems.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          Your pantry is empty. Scan any product and click "Save to My Pantry" to track its shelf life.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {pantryItems.map((item) => {
            const daysLeft = getDaysRemaining(item.expiryTimestamp);
            const isExpired = daysLeft < 0;
            const isSoon = daysLeft >= 0 && daysLeft <= 30;

            return (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{item.brand}</span>
                    <span>•</span>
                    <span>Expires: {item.expiryDate}</span>
                  </div>
                </div>

                {/* Expiry Countdown Badge */}
                <div className="shrink-0 flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    isExpired
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : isSoon
                      ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>
                      {isExpired
                        ? `Expired (${Math.abs(daysLeft)}d ago)`
                        : isSoon
                        ? `${daysLeft} days left`
                        : `${Math.round(daysLeft / 30)} mos left`}
                    </span>
                  </span>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Remove from pantry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function saveItemToPantry(item) {
  try {
    const existing = localStorage.getItem(PANTRY_STORAGE_KEY);
    const parsed = existing ? JSON.parse(existing) : [];
    parsed.push(item);
    parsed.sort((a, b) => (a.expiryTimestamp || 0) - (b.expiryTimestamp || 0));
    localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error('Error saving to pantry:', e);
  }
}
