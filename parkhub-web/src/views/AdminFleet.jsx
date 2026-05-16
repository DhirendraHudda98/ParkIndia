import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Car, MagnifyingGlass, Flag, Lightning, Scooter, Truck, Bus } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const typeColors = {
  car: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  electric: 'bg-[#138808]/10 text-[#138808]',
  motorcycle: 'bg-[#FF9933]/10 text-[#FF9933]',
  bicycle: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  van: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  truck: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  suv: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  rickshaw: 'bg-amber-100 text-amber-700',
};

export function AdminFleetPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      const qs = params.toString();

      const [fleetRes, statsRes] = await Promise.all([
        fetch(`/api/v1/admin/fleet${qs ? `?${qs}` : ''}`).then(r => r.json()),
        fetch('/api/v1/admin/fleet/stats').then(r => r.json()),
      ]);

      if (fleetRes.success) setVehicles(fleetRes.data || []);
      if (statsRes.success) setStats(statsRes.data);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleFlag(vehicleId, flagged, reason) {
    try {
      const res = await fetch(`/api/v1/admin/fleet/${vehicleId}/flag`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged, reason }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(flagged ? t('fleet.flagged') : t('fleet.unflagged'));
        loadData();
      }
    } catch {
      toast.error(t('common.error'));
    }
  }

  const vehicleTypes = ['car', 'electric', 'motorcycle', 'bicycle', 'van', 'truck', 'suv', 'rickshaw'];

  if (loading && vehicles.length === 0) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
      </div>
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 dark:bg-primary-950/30 text-primary-500'}`}>
          <Car weight="duotone" className="w-8 h-8" />
        </div>
        <div>
          <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {isIndia ? 'National Fleet Audit' : t('fleet.title')}
          </h2>
          <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
            {isIndia ? 'Unified vehicle registry across all ParkIndia city hubs.' : t('fleet.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label={t('fleet.totalVehicles')} value={stats.total_vehicles} isIndia={isIndia} isVoid={isVoid} />
          <StatCard label={t('fleet.electricCount')} value={stats.electric_count} icon={<Lightning weight="fill" className="text-[#138808]" />} isIndia={isIndia} isVoid={isVoid} />
          <StatCard label={t('fleet.electricRatio')} value={`${(stats.electric_ratio * 100).toFixed(0)}%`} isIndia={isIndia} isVoid={isVoid} />
          <StatCard label={t('fleet.flaggedCount')} value={stats.flagged_count} color="text-red-500" isIndia={isIndia} isVoid={isVoid} />
        </div>
      )}

      {/* Type distribution */}
      {stats && Object.keys(stats.types_distribution).length > 0 && (
        <div className={`rounded-[2rem] border p-6 transition-colors ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'}`}>
          <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isIndia ? 'text-[#000080]/40' : 'text-surface-600 dark:text-surface-300'}`}>
            {isIndia ? 'VEHICLE CLASS MIX' : t('fleet.byType')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.types_distribution).map(([type, count]) => (
              <span key={type} className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${typeColors[type] || (isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-surface-100 text-surface-600')}`}>
                <TypeIcon type={type} />
                {type.toUpperCase()} <span className="opacity-60">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <MagnifyingGlass className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isIndia ? 'text-[#000080]/30' : 'text-surface-400'}`} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadData()}
            placeholder={isIndia ? 'Search vehicle registration, make, model...' : t('fleet.search')}
            className={`w-full rounded-2xl border pl-12 pr-4 py-3 text-sm font-bold transition-all outline-none focus:ring-1 ${
              isVoid ? 'bg-slate-950 border-slate-700 text-white focus:ring-cyan-500' : isIndia ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:ring-[#FF9933] shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
            }`}
          />
        </div>
        <select
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className={`rounded-2xl border px-4 py-3 text-sm font-bold transition-all outline-none focus:ring-1 ${
            isVoid ? 'bg-slate-950 border-slate-700 text-white' : isIndia ? 'bg-white border-[#FF9933]/20 text-[#000080]' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
          }`}
        >
          <option value="">{t('fleet.allTypes')}</option>
          {vehicleTypes.map(vt => (
            <option key={vt} value={vt}>{vt.charAt(0).toUpperCase() + vt.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={`rounded-[2rem] border overflow-hidden transition-colors ${
        isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-xl shadow-[#000080]/5' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b text-left transition-colors ${isIndia ? 'bg-[#000080]/5 border-[#FF9933]/10' : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900'}`}>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('fleet.colPlate')}</th>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('fleet.colType')}</th>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('fleet.colOwner')}</th>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('fleet.colMakeModel')}</th>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('fleet.colBookings')}</th>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('fleet.colLastUsed')}</th>
                <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('fleet.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {vehicles.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm font-medium text-surface-400 italic">{t('fleet.empty')}</td></tr>
              ) : vehicles.map(v => (
                <tr key={v.id} className={`transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/50 ${v.flagged ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                  <td className={`px-6 py-4 font-mono font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                    {v.license_plate}
                    {v.flagged && <Flag weight="fill" className="inline w-4 h-4 text-red-500 ml-1.5" />}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${typeColors[v.vehicle_type] || 'bg-surface-100 text-surface-600'}`}>
                      {v.vehicle_type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-bold ${isIndia ? 'text-[#000080]/70' : 'text-surface-600 dark:text-surface-300'}`}>{v.username || '-'}</td>
                  <td className={`px-6 py-4 font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
                    {[v.make, v.model].filter(Boolean).join(' ') || '-'}
                  </td>
                  <td className={`px-6 py-4 font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-600'}`}>{v.bookings_count}</td>
                  <td className={`px-6 py-4 text-xs font-medium ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>
                    {v.last_used ? new Date(v.last_used).toLocaleDateString('en-IN') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleFlag(v.id, !v.flagged, v.flagged ? undefined : 'admin flag')}
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${
                        v.flagged
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      {v.flagged ? t('fleet.unflag') : t('fleet.flag')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, isIndia, isVoid, color }) {
  return (
    <div className={`rounded-2xl border p-5 transition-all ${
      isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>{label}</span>
      </div>
      <p className={`text-2xl font-black ${color || (isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white')}`}>{value}</p>
    </div>
  );
}

function TypeIcon({ type }) {
  switch (type) {
    case 'motorcycle': return <Scooter weight="bold" className="w-3.5 h-3.5" />;
    case 'electric': return <Lightning weight="fill" className="w-3.5 h-3.5" />;
    case 'truck': return <Truck weight="bold" className="w-3.5 h-3.5" />;
    case 'van': return <Bus weight="bold" className="w-3.5 h-3.5" />;
    default: return <Car weight="bold" className="w-3.5 h-3.5" />;
  }
}

export default AdminFleetPage;
