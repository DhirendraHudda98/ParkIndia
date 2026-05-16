import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Warning } from '@phosphor-icons/react';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const groupColors = {
  auth: 'bg-red-500',
  api: 'bg-[#000080]',
  public: 'bg-[#138808]',
  webhook: 'bg-[#FF9933]',
};

export function AdminRateLimitsPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [groups, setGroups] = useState([]);
  const [totalBlocked, setTotalBlocked] = useState(0);
  const [historyBins, setHistoryBins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        api.getRateLimitStats(),
        api.getRateLimitHistory(),
      ]);
      if (statsRes.success && statsRes.data) {
        setGroups(statsRes.data.groups);
        setTotalBlocked(statsRes.data.total_blocked_last_hour);
      }
      if (historyRes.success && historyRes.data) {
        setHistoryBins(historyRes.data.bins);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  const maxBinCount = Math.max(1, ...historyBins.map(b => b.count));

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 skeleton rounded-2xl" />)}
      </div>
      <div className="h-48 skeleton rounded-2xl" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 dark:bg-primary-950/30 text-primary-500'}`}>
            <ShieldCheck weight="bold" className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'API Security Shield' : t('rateLimits.title')}
            </h2>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              {isIndia ? 'Real-time traffic orchestration and localized rate limiting.' : t('rateLimits.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalBlocked > 0 ? (
            <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100`}>
              <Warning weight="bold" className="w-4 h-4" />
              {t('rateLimits.blockedTotal', '{{count}} blocked (last hour)', { count: totalBlocked })}
            </span>
          ) : (
            <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${isIndia ? 'bg-[#138808]/10 text-[#138808]' : 'bg-emerald-50 text-emerald-600'}`}>
              <ShieldCheck weight="bold" className="w-4 h-4" />
              {t('rateLimits.allClear')}
            </span>
          )}
        </div>
      </div>

      {/* Rate limit group cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {groups.map(group => {
          const pct = group.limit_per_minute > 0
            ? Math.min(100, Math.round((group.current_count / group.limit_per_minute) * 100))
            : 0;
          const barColor = groupColors[group.group] || 'bg-surface-500';
          return (
            <div key={group.group} className={`rounded-[2rem] border p-6 transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-xl shadow-[#000080]/5' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-black uppercase tracking-tight ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{group.group}</h3>
                <span className={`text-[10px] font-black uppercase tracking-widest opacity-40`}>
                  {group.limit_per_minute} REQ / MIN
                </span>
              </div>
              <p className={`text-xs font-medium mb-5 ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{group.description}</p>
              
              <div className="w-full h-3 rounded-full bg-surface-100 dark:bg-surface-800 mb-3 overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full rounded-full ${barColor} shadow-sm`} />
              </div>

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className={isIndia ? 'text-[#000080]/40' : 'text-surface-400'}>{group.current_count} / {group.limit_per_minute} CONSUMED</span>
                {group.blocked_last_hour > 0 && (
                  <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded">
                    {group.blocked_last_hour} BLOCKED
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Blocked requests chart (24h) */}
      <div className={`rounded-[2rem] border p-8 transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'}`}>
        <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-8 ${isIndia ? 'text-[#000080]/40' : 'text-surface-600'}`}>
          {isIndia ? 'INCIDENT HISTORY (24H)' : t('rateLimits.blockedHistory')}
        </h3>
        <div className="flex items-end gap-1.5 h-40">
          {historyBins.map((bin, idx) => {
            const heightPct = maxBinCount > 0 ? (bin.count / maxBinCount) * 100 : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative" title={`${bin.hour}: ${bin.count}`}>
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${Math.max(heightPct, 4)}%` }}
                  className={`w-full rounded-t-lg transition-all ${bin.count > 0 ? (isIndia ? 'bg-[#FF9933]' : 'bg-amber-500') : 'bg-surface-100 dark:bg-surface-800 opacity-30'}`}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#000080] text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {bin.count} blocked
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-4 text-[10px] font-black uppercase tracking-widest text-surface-400">
          <span>{historyBins[0]?.hour.slice(11, 16) || ''}</span>
          <span className={isIndia ? 'text-[#000080]/30' : ''}>{t('rateLimits.now')}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default AdminRateLimitsPage;
