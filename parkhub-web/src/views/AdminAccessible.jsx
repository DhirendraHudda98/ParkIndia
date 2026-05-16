import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wheelchair, Question, ToggleLeft, ToggleRight, ChartBar, Users } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export function AdminAccessiblePage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [stats, setStats] = useState(null);
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [statsRes, lotsRes] = await Promise.all([
        fetch('/api/v1/bookings/accessible-stats').then(r => r.json()),
        fetch('/api/v1/lots').then(r => r.json()),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (lotsRes.success) setLots(lotsRes.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const loadSlots = useCallback(async (lotId) => {
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/v1/lots/${lotId}/slots`).then(r => r.json());
      if (res.success) setSlots(res.data || []);
    } catch { /* ignore */ }
    setSlotsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedLot) loadSlots(selectedLot);
    else setSlots([]);
  }, [selectedLot, loadSlots]);

  async function toggleAccessible(lotId, slotId, current) {
    try {
      const res = await fetch(`/api/v1/admin/lots/${lotId}/slots/${slotId}/accessible`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_accessible: !current }),
      }).then(r => r.json());
      if (res.success) {
        setSlots(prev => prev.map(s => s.id === slotId ? { ...s, is_accessible: !current } : s));
        toast.success(t('accessible.toggleSuccess', 'Slot accessibility updated'));
        loadStats();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch { toast.error(t('common.error')); }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
      </div>
    );
  }

  const cardClass = `rounded-2xl border p-5 transition-colors ${
    isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
  }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isIndia ? 'bg-[#000080]/10' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
            <Wheelchair weight="bold" className={`w-5 h-5 ${isIndia ? 'text-[#000080]' : 'text-blue-600 dark:text-blue-400'}`} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Inclusive Parking (Divyangjan)' : t('accessible.title')}
            </h2>
            <p className={`text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
              {isIndia ? 'Manage dedicated accessibility slots across India hubs.' : t('accessible.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`p-2 rounded-lg transition-colors ${isIndia ? 'text-[#000080]/30 hover:bg-[#000080]/5' : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400'}`}
        >
          <Question weight="bold" className="w-5 h-5" />
        </button>
      </div>

      {/* Help / About this module */}
      {showHelp && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`rounded-xl p-4 border transition-colors ${
          isIndia ? 'bg-[#000080]/5 border-[#000080]/10 text-[#000080]' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
        }`}>
          <p className="text-sm">
            {isIndia 
              ? 'This module manages dedicated parking for Divyangjan (accessible users). Following National Building Code (NBC) guidelines, these slots provide priority access. Accessible users receive a 30-minute advance booking window.' 
              : t('accessible.help')}
          </p>
        </motion.div>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t('accessible.totalSlots')} value={stats.total_accessible_slots} icon={<Wheelchair weight="bold" className="w-5 h-5 text-blue-500" />} isIndia={isIndia} isVoid={isVoid} />
          <StatCard label={t('accessible.utilization')} value={`${stats.utilization_percent.toFixed(0)}%`} icon={<ChartBar weight="bold" className="w-5 h-5 text-emerald-500" />} isIndia={isIndia} isVoid={isVoid} />
          <StatCard label={t('accessible.totalBookings')} value={stats.total_accessible_bookings} icon={<Wheelchair weight="bold" className="w-5 h-5 text-purple-500" />} isIndia={isIndia} isVoid={isVoid} />
          <StatCard label={t('accessible.usersWithNeeds')} value={stats.users_with_accessibility_needs} icon={<Users weight="bold" className="w-5 h-5 text-amber-500" />} isIndia={isIndia} isVoid={isVoid} />
        </div>
      )}

      {/* Priority info */}
      {stats?.priority_booking_active && (
        <div className={`rounded-xl px-4 py-3 border transition-colors ${
          isIndia ? 'bg-[#FF9933]/10 border-[#FF9933]/20 text-[#000080]' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
        }`}>
          <p className="text-sm font-medium">
            {t('accessible.priority', 'Priority booking active: accessible users get a {{minutes}}-minute head start on accessible slots.', { minutes: stats.priority_minutes })}
          </p>
        </div>
      )}

      {/* Lot selector + slot toggle */}
      <div className={cardClass}>
        <h3 className={`text-base font-bold mb-3 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
          {t('accessible.manageSlots', 'Manage Accessible Slots')}
        </h3>
        <select
          className={`w-full mb-4 rounded-xl border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1 ${
            isVoid 
              ? 'bg-slate-950 border-slate-700 text-white focus:ring-cyan-500' 
              : isIndia 
              ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:ring-[#FF9933]' 
              : 'bg-white dark:bg-surface-950 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white focus:ring-primary-500'
          }`}
          value={selectedLot}
          onChange={e => setSelectedLot(e.target.value)}
        >
          <option value="">{t('accessible.selectLot', 'Select a parking lot...')}</option>
          {lots.map(lot => (
            <option key={lot.id} value={lot.id}>{lot.name}</option>
          ))}
        </select>

        {slotsLoading && (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {Array.from({ length: 12 }, (_, i) => <div key={i} className="h-12 skeleton rounded-lg" />)}
          </div>
        )}

        {!slotsLoading && selectedLot && slots.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {slots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => toggleAccessible(selectedLot, slot.id, !!slot.is_accessible)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                    slot.is_accessible
                      ? isIndia ? 'border-[#000080]/40 bg-[#000080]/5' : 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                      {t('accessible.slotLabel')} {slot.slot_number}
                    </span>
                    {slot.slot_type && slot.slot_type !== 'standard' && (
                      <span className={`text-xs ${isIndia ? 'text-[#000080]/50' : 'text-surface-500 dark:text-surface-400'}`}>({slot.slot_type})</span>
                    )}
                  </div>
                  {slot.is_accessible
                    ? <ToggleRight weight="fill" className={`w-6 h-6 ${isIndia ? 'text-[#000080]' : 'text-blue-500'}`} />
                    : <ToggleLeft weight="regular" className={`w-6 h-6 ${isIndia ? 'text-[#000080]/30' : 'text-surface-400'}`} />
                  }
                </button>
              ))}
            </div>
          </div>
        )}

        {!slotsLoading && selectedLot && slots.length === 0 && (
          <p className={`text-sm ${isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-surface-400'}`}>{t('accessible.noSlots')}</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, isIndia, isVoid }) {
  return (
    <div className={`rounded-xl border p-4 transition-colors ${
      isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-xs font-semibold uppercase tracking-wide ${isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-surface-400'}`}>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

export default AdminAccessiblePage;
