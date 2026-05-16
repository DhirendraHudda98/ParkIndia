import { Fragment, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChartBar, Clock, CalendarBlank, TrendUp } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { getInMemoryToken } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function authHeaders() {
  const token = getInMemoryToken();
  return {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function OccupancyHeatmapPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLot, setSelectedLot] = useState('');
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = selectedLot ? `?lot_id=${selectedLot}` : '';
    fetch(`/api/v1/admin/analytics/occupancy-heatmap${params}`, {
      headers: authHeaders(),
      credentials: 'include',
    })
      .then(r => r.json())
      .then(json => {
        if (json?.data) {
          setData(json.data);
        } else {
          setError(t('heatmap.loadError'));
        }
      })
      .catch(() => setError(t('heatmap.loadError')))
      .finally(() => setLoading(false));
  }, [selectedLot, t]);

  const stats = useMemo(() => {
    if (!data?.cells?.length) return { peakHour: '-', avgOccupancy: '0%', busiestDay: '-' };
    const cells = data.cells;
    
    const hourAvg = new Map();
    for (const c of cells) {
      if (!hourAvg.has(c.hour)) hourAvg.set(c.hour, []);
      hourAvg.get(c.hour).push(c.percentage);
    }
    let peakHour = 0;
    let peakVal = 0;
    for (const [hour, vals] of hourAvg) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (avg > peakVal) { peakVal = avg; peakHour = hour; }
    }

    const avgOcc = cells.reduce((sum, c) => sum + c.percentage, 0) / cells.length;

    const dayAvg = new Map();
    for (const c of cells) {
      if (!dayAvg.has(c.day)) dayAvg.set(c.day, []);
      dayAvg.get(c.day).push(c.percentage);
    }
    let busiestDay = 0;
    let busiestVal = 0;
    for (const [day, vals] of dayAvg) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (avg > busiestVal) { busiestVal = avg; busiestDay = day; }
    }

    return {
      peakHour: `${String(peakHour).padStart(2, '0')}:00`,
      avgOccupancy: `${Math.round(avgOcc)}%`,
      busiestDay: DAYS[busiestDay] || '-',
    };
  }, [data]);

  const cellMap = useMemo(() => {
    const map = new Map();
    if (data?.cells) {
      for (const c of data.cells) {
        map.set(`${c.day}-${c.hour}`, c);
      }
    }
    return map;
  }, [data]);

  function cellColor(pct) {
    if (pct >= 90) return isIndia ? 'bg-red-500' : 'bg-red-500';
    if (pct >= 75) return isIndia ? 'bg-[#FF9933]' : 'bg-amber-400';
    if (pct >= 50) return isIndia ? 'bg-[#FF9933]/60' : 'bg-primary-300';
    if (pct >= 20) return isIndia ? 'bg-[#000080]/10' : 'bg-primary-100';
    return isVoid ? 'bg-slate-800' : 'bg-surface-50';
  }

  function handleCellHover(day, hour, e) {
    const cell = cellMap.get(`${day}-${hour}`);
    const pct = cell?.percentage ?? 0;
    const avg = cell?.avg_bookings ?? 0;
    const rect = e.target.getBoundingClientRect();
    setTooltip({ day, hour, pct, avg, x: rect.left + rect.width / 2, y: rect.top - 8 });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 p-2 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 text-primary-500'}`}>
            <ChartBar weight="bold" className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Footfall Analytics' : t('heatmap.title')}
            </h2>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              {isIndia ? 'Historical occupancy patterns and peak demand cycles across regional hubs.' : t('heatmap.subtitle')}
            </p>
          </div>
        </div>
        {data?.lots && data.lots.length > 1 && (
          <select
            value={selectedLot}
            onChange={e => setSelectedLot(e.target.value)}
            className="input-field py-2 px-4 text-xs font-black uppercase tracking-widest min-w-[200px]"
          >
            <option value="">{t('heatmap.allLots')}</option>
            {data.lots.map(lot => (
              <option key={lot.id} value={lot.id}>{lot.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className={`rounded-[2rem] p-8 border transition-all ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm shadow-[#000080]/5' : 'bg-white border-surface-100'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-primary-50'}`}>
              <Clock weight="bold" size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">{t('heatmap.peakHour')}</span>
          </div>
          <div className={`text-3xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>{stats.peakHour}</div>
        </div>

        <div className={`rounded-[2rem] p-8 border transition-all ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm shadow-[#000080]/5' : 'bg-white border-surface-100'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIndia ? 'bg-[#138808]/10 text-[#138808]' : 'bg-emerald-50'}`}>
              <TrendUp weight="bold" size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">{t('heatmap.avgOccupancy')}</span>
          </div>
          <div className={`text-3xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>{stats.avgOccupancy}</div>
        </div>

        <div className={`rounded-[2rem] p-8 border transition-all ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm shadow-[#000080]/5' : 'bg-white border-surface-100'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-50'}`}>
              <CalendarBlank weight="bold" size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">{t('heatmap.busiestDay')}</span>
          </div>
          <div className={`text-3xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>{stats.busiestDay}</div>
        </div>
      </div>

      {/* Grid */}
      <div className={`rounded-[2.5rem] p-10 border overflow-x-auto transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-xl' : 'bg-white border-surface-100'}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-[#FF9933]/20 border-t-[#FF9933] rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-surface-400">Synthesizing Data</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 font-black uppercase tracking-widest">{error}</p>
          </div>
        ) : (
          <div className="min-w-[800px]">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: '80px repeat(24, 1fr)' }}>
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-center text-[9px] font-black text-surface-400 pb-4">
                  {h === 0 ? 'MID' : h === 12 ? 'NOON' : h}
                </div>
              ))}

              {DAY_SHORT.map((day, dIdx) => (
                <Fragment key={day}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-surface-400 flex items-center justify-end pr-6">
                    {day}
                  </div>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const cell = cellMap.get(`${dIdx}-${hour}`);
                    const pct = cell?.percentage ?? 0;
                    return (
                      <motion.div
                        key={hour}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (dIdx * 24 + hour) * 0.001 }}
                        className={`aspect-square rounded-lg cursor-pointer transition-all hover:scale-125 hover:z-10 hover:shadow-xl ${cellColor(pct)}`}
                        onMouseEnter={e => handleCellHover(dIdx, hour, e)}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-8 mt-12 pt-10 border-t border-surface-50">
               {[
                 { label: t('heatmap.empty'), color: isVoid ? 'bg-slate-800' : 'bg-surface-50' },
                 { label: t('heatmap.low'), color: isIndia ? 'bg-[#000080]/10' : 'bg-primary-100' },
                 { label: t('heatmap.medium'), color: isIndia ? 'bg-[#FF9933]/60' : 'bg-primary-300' },
                 { label: t('heatmap.high'), color: isIndia ? 'bg-[#FF9933]' : 'bg-amber-400' },
                 { label: t('heatmap.full'), color: 'bg-red-500' }
               ].map(item => (
                 <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-md ${item.color}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">{item.label}</span>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className={`fixed z-50 pointer-events-none shadow-2xl rounded-2xl p-4 min-w-[180px] border ${isIndia ? 'bg-[#000080] text-white border-white/10' : 'bg-surface-900 text-white border-surface-700'}`}
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">{DAYS[tooltip.day]} @ {String(tooltip.hour).padStart(2, '0')}:00</p>
            <div className="flex items-baseline gap-2">
               <span className="text-2xl font-black">{Math.round(tooltip.pct)}%</span>
               <span className="text-[10px] font-bold opacity-60">OCCUPANCY</span>
            </div>
            <div className={`mt-3 pt-3 border-t border-white/10 text-[9px] font-black uppercase tracking-widest ${isIndia ? 'text-[#FF9933]' : 'text-primary-400'}`}>
              Avg Bookings: {tooltip.avg.toFixed(1)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default OccupancyHeatmapPage;
