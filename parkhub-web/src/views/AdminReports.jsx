import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SpinnerGap, Users, Buildings, CalendarCheck, Lightning } from '@phosphor-icons/react';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import { BarChart, DonutChart } from '../components/SimpleChart';
import { OccupancyHeatmap } from '../components/OccupancyHeatmap';
import { ExportButton } from '../components/ExportButton';
import { useTheme } from '../context/ThemeContext';

function StatCard({ icon: Icon, label, value, isIndia, color }) {
  return (
    <div className={`rounded-[1.5rem] border p-5 transition-all ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm shadow-[#000080]/5' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-surface-50 text-surface-400'}`}>
          <Icon weight="bold" className="w-5 h-5" />
        </div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>{label}</p>
      </div>
      <p className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

function lotOccupancyFromData(lots) {
  if (!lots || lots.length === 0) return [];
  return lots.map(lot => {
    const occupied = lot.total_slots - lot.available_slots;
    const pct = lot.total_slots > 0 ? Math.min(Math.round((occupied / lot.total_slots) * 100), 100) : 0;
    return { label: lot.name, capacity: Math.max(lot.total_slots, 1), occupancy: pct };
  });
}

function weeklyBookingData(totalBookings, t) {
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const weights = [0.18, 0.20, 0.22, 0.19, 0.15, 0.04, 0.02];
  return dayKeys.map((key, i) => ({
    label: t(`reports.weekdays.${key}`),
    value: Math.round(totalBookings * weights[i]),
  }));
}

export function AdminReportsPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.adminStats(),
      api.getBookings(),
      api.getLots(),
    ]).then(([statsRes, bookingsRes, lotsRes]) => {
      const failedRes = [statsRes, bookingsRes, lotsRes].find(r => !r.success);
      if (failedRes) {
        setError(failedRes.error?.message || t('admin.errorOccurred', 'An error occurred while fetching reports.'));
        return;
      }
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (bookingsRes.success && bookingsRes.data) setBookings(bookingsRes.data);
      if (lotsRes.success && lotsRes.data) setLots(lotsRes.data);
    }).catch(err => {
      setError(err?.message || t('admin.errorOccurred', 'An error occurred while fetching reports.'));
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const weeklyData = useMemo(() => weeklyBookingData(stats?.total_bookings ?? 0, t), [stats?.total_bookings, t]);
  const lotOccupancy = useMemo(() => lotOccupancyFromData(lots), [lots]);
  const totalSlots = useMemo(() => lots.reduce((sum, l) => sum + l.total_slots, 0) || 20, [lots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <SpinnerGap weight="bold" className={`w-10 h-10 animate-spin ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-[2rem] border p-8 text-center transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/15 shadow-sm shadow-[#FF9933]/5' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'}`}>
        <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-red-50 dark:bg-red-950/20 text-red-500'}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className={`text-lg font-black mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
          {isIndia ? 'Regional Analytics Hub Offline' : t('admin.errorTitle', 'Error Occurred')}
        </h3>
        <p className={`text-sm max-w-md mx-auto mb-6 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
          {error}
        </p>
        <button
          onClick={loadData}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all ${isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00] text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
        >
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  const sectionClass = `rounded-[2rem] border p-8 transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 dark:bg-primary-950/30 text-primary-500'}`}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Regional Analytics Hub' : t('admin.reports')}
            </h2>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              {isIndia ? 'National utilization metrics and city-level performance audits.' : t('reports.subtitle')}
            </p>
          </div>
        </div>
        <ExportButton />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label={t('admin.totalUsers')} value={stats?.total_users ?? 0} isIndia={isIndia} />
        <StatCard icon={Buildings} label={t('admin.totalLots')} value={stats?.total_lots ?? 0} isIndia={isIndia} />
        <StatCard icon={CalendarCheck} label={t('admin.totalBookings')} value={stats?.total_bookings ?? 0} isIndia={isIndia} />
        <StatCard icon={Lightning} label={t('admin.activeBookings')} value={stats?.active_bookings ?? 0} isIndia={isIndia} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Summary Card */}
        <div className={sectionClass}>
          <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-8 ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>
            {isIndia ? 'HUB PERFORMANCE KPI' : t('admin.overview')}
          </h3>
          <div className="space-y-6">
            <SummaryItem label={t('admin.utilizationRate')} value={stats && stats.total_lots > 0 ? `${Math.round((stats.active_bookings / Math.max(stats.total_lots, 1)) * 100)}%` : '0%'} isIndia={isIndia} />
            <SummaryItem label={t('admin.avgBookingsPerUser')} value={stats && stats.total_users > 0 ? (stats.total_bookings / stats.total_users).toFixed(1) : '0'} isIndia={isIndia} />
            <SummaryItem label={t('admin.activeBookingRate')} value={stats && stats.total_bookings > 0 ? `${Math.round((stats.active_bookings / stats.total_bookings) * 100)}%` : '0%'} isIndia={isIndia} />
          </div>
        </div>

        {/* Bookings This Week Chart */}
        <div className={sectionClass}>
          <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-8 ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>
            {t('admin.bookingsThisWeek')}
          </h3>
          <BarChart data={weeklyData} color={isIndia ? '#FF9933' : undefined} />
        </div>
      </div>

      {/* Lot Occupancy Donut Chart */}
      {lotOccupancy.length > 0 && (
        <div className={sectionClass}>
          <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-8 ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>
            {isIndia ? 'INDIVIDUAL CITY HUB LOAD' : t('admin.lotOccupancy')}
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-shrink-0 relative">
              <DonutChart slices={lotOccupancy} size={240} strokeWidth={32} colors={isIndia ? ['#FF9933', '#000080', '#138808'] : undefined} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>{lotOccupancy.length}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-30">HUBS</span>
              </div>
            </div>
            <ul className="flex-1 space-y-4 w-full">
              {lotOccupancy.map(lot => (
                <li key={lot.label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-50 dark:bg-surface-800/50'}`}>
                  <span className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${lot.occupancy >= 80 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : lot.occupancy >= 60 ? 'bg-[#FF9933] shadow-[0_0_8px_rgba(255,153,51,0.4)]' : 'bg-[#138808] shadow-[0_0_8px_rgba(19,136,8,0.4)]'}`} />
                    <span className={`text-sm font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`}>{lot.label}</span>
                  </span>
                  <span className={`text-sm font-black tabular-nums ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{lot.occupancy}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Occupancy Heatmap */}
      <div className={sectionClass}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-2 ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>
              {t('heatmap.title')}
            </h3>
            <p className={`text-xs font-medium ${isIndia ? 'text-[#000080]/30' : 'text-surface-400'}`}>
              {isIndia ? 'Demand patterns across a typical 24-hour cycle.' : t('heatmap.subtitle')}
            </p>
          </div>
        </div>
        <OccupancyHeatmap bookings={bookings} totalSlots={totalSlots} colorScale={isIndia ? ['#fdf2f2', '#FF9933', '#000080'] : undefined} />
      </div>
    </motion.div>
  );
}

function SummaryItem({ label, value, isIndia }) {
  return (
    <div className={`flex items-center justify-between py-4 border-b ${isIndia ? 'border-[#000080]/5' : 'border-surface-100 dark:border-surface-800'}`}>
      <span className={`text-sm font-bold ${isIndia ? 'text-[#000080]/60' : 'text-surface-600 dark:text-surface-400'}`}>{label}</span>
      <span className={`text-sm font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}

export default AdminReportsPage;
