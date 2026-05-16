import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkle, Brain, CalendarBlank, Clock, TrendUp, 
  CaretDown, Bell, BookmarkSimple, MagicWand,
  ArrowRight, Info, ChartLineUp, Gauge
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from 'recharts';
import { api } from '../api/client';
import { staggerSlow, fadeUp } from '../constants/animations';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatHour(hour) {
  const h = parseInt(hour);
  return `${String(h).padStart(2, '0')}:00`;
}

function getLevel(pct) {
  if (pct >= 75) return 'high';
  if (pct >= 45) return 'medium';
  return 'low';
}

export function OccupancyPredictionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';
  
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState('');
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forecast'); // forecast | simulator
  
  // Simulator State
  const [simDay, setSimDay] = useState('monday');
  const [simHour, setSimHour] = useState(10);

  useEffect(() => {
    loadData();
  }, [selectedLot]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getLots(),
      api.getPredictions(selectedLot),
    ])
      .then(([lotsRes, statsRes]) => {
        if (lotsRes?.success && lotsRes?.data) {
          setLots(lotsRes.data);
          if (lotsRes.data.length > 0 && !selectedLot) {
             setSelectedLot(lotsRes.data[0].id);
          }
        }
        if (statsRes?.success && statsRes?.data) {
           setAdminStats(statsRes.data);
        }
      })
      .catch(() => toast.error('Failed to sync with predictive engine'))
      .finally(() => setLoading(false));
  };

  const predictions = useMemo(() => {
    const byDay = adminStats?.weekly_forecast || {};

    return DAYS_FULL.map((name, idx) => {
      const dayKey = name.toLowerCase();
      const dayData = byDay[dayKey];
      
      let predicted = 30;
      let peakHour = 9;
      let offPeakHour = 14;

      if (dayData) {
        predicted = Math.round(dayData.avg_percentage);
        peakHour = dayData.peak_hour;
        offPeakHour = dayData.off_peak_hour || 14;
      }

      const hasHourlyData = adminStats?.hourly_trend && Object.keys(adminStats.hourly_trend).length > 0;
      const confidence = adminStats?.confidence_score || (dayData ? (hasHourlyData ? 88 : 72) : 45);

      return {
        dayIndex: idx,
        dayName: name,
        dayShort: DAYS_SHORT[idx],
        predicted,
        confidence,
        peakHour,
        offPeakHour,
        level: getLevel(predicted),
      };
    });
  }, [adminStats]);

  const chartData = useMemo(() => {
    if (!adminStats?.hourly_trend) return [];
    return Object.entries(adminStats.hourly_trend).map(([hour, value]) => ({
      hour: formatHour(hour),
      occupancy: value,
    }));
  }, [adminStats]);

  const recommendation = useMemo(() => {
    if (adminStats?.best_time) {
      return {
        day: adminStats.best_time.day,
        timeSlot: adminStats.best_time.time_slot,
        reason: t('prediction.recommendReason'),
        predicted: adminStats.best_time.occupancy
      };
    }
    if (!predictions.length) return { day: '-', timeSlot: '-', reason: '' };
    // Fallback
    const best = [...predictions].sort((a, b) => a.predicted - b.predicted)[0];
    return {
      day: best.dayName,
      timeSlot: `${formatHour(best.offPeakHour)} - ${formatHour(best.offPeakHour + 2)}`,
      reason: t('prediction.recommendReason'),
      predicted: best.predicted
    };
  }, [predictions, t, adminStats]);

  const simulatedOccupancy = useMemo(() => {
    const dayData = adminStats?.weekly_forecast?.[simDay];
    const base = dayData ? dayData.avg_percentage : 50;
    // Mock simulation: peak is around 10am and 5pm
    const hourFactor = Math.abs(10 - simHour) < 3 || Math.abs(17 - simHour) < 3 ? 1.4 : 0.7;
    return Math.min(Math.round(base * hourFactor), 99);
  }, [simDay, simHour, adminStats]);

  const handleBookNow = (day, hour) => {
    toast.success(`${t('prediction.bookNow')}: ${day} at ${formatHour(hour)}`);
    // Redirect to booking page with params
    // Book.jsx expects lot_id, day, and hour in query params
    navigate(`/book?lot_id=${selectedLot}&day=${day}&hour=${hour}`);
  };

  const handleSetReminder = () => {
    toast.success(t('prediction.setReminder'));
  };

  if (loading && !adminStats) {
    return (
      <div className="space-y-6">
        <div className="flex h-64 w-full animate-pulse items-center justify-center rounded-[2rem] bg-surface-100 dark:bg-surface-800">
          <div className="h-12 w-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-[1.75rem] bg-surface-100 dark:bg-surface-800" />
          ))}
        </div>
      </div>
    );
  }

  if (!adminStats && !loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-surface-200 p-12 text-center dark:border-surface-800">
        <p className="text-lg font-bold text-surface-500">Prediction temporarily unavailable</p>
        <button onClick={loadData} className="mt-4 btn btn-primary">Try Again</button>
      </div>
    );
  }

  function levelColor(level) {
    switch (level) {
      case 'low': return isIndia ? 'text-[#138808]' : 'text-emerald-500';
      case 'medium': return isIndia ? 'text-[#FF9933]' : 'text-amber-500';
      case 'high': return 'text-rose-500';
    }
  }

  function levelBg(level) {
    switch (level) {
      case 'low': return isIndia ? 'bg-[#138808]/10' : 'bg-emerald-50';
      case 'medium': return isIndia ? 'bg-[#FF9933]/10' : 'bg-amber-50';
      case 'high': return 'bg-rose-50';
    }
  }

  if (loading) return (
    <div className="space-y-8 p-6">
      <div className="h-10 w-64 skeleton rounded-2xl" />
      <div className="h-48 skeleton rounded-[3rem]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-80 skeleton rounded-[3rem]" />)}
      </div>
    </div>
  );

  return (
    <motion.div variants={staggerSlow} initial="hidden" animate="show" className="space-y-8 p-6 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all shadow-xl ${isIndia ? 'bg-[#000080] text-[#FF9933]' : 'bg-primary-500 text-white'}`}>
            <Brain weight="fill" className="w-8 h-8" />
          </div>
          <div>
            <h2 className={`text-3xl font-black tracking-tight ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>
              {t('prediction.title')}
              <Sparkle weight="fill" className="inline ml-2 w-6 h-6 text-yellow-400 animate-pulse" />
            </h2>
            <p className={`text-sm font-medium opacity-60 ${isIndia ? 'text-[#000080]' : ''}`}>
              {t('prediction.subtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {lots.length > 1 && (
            <div className="relative group">
              <select
                value={selectedLot}
                onChange={e => setSelectedLot(e.target.value)}
                className={`appearance-none py-3 pr-12 pl-6 text-xs font-black uppercase tracking-widest rounded-2xl border transition-all cursor-pointer focus:ring-4 ${isIndia ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:ring-[#FF9933]/10' : 'bg-white border-surface-200 focus:ring-primary-500/10'}`}
              >
                {lots.map(lot => (
                  <option key={lot.id} value={lot.id}>{lot.name}</option>
                ))}
              </select>
              <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 pointer-events-none group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          <button 
            onClick={loadData}
            className={`p-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${isIndia ? 'bg-white border-[#FF9933]/20 text-[#000080]' : 'bg-white border-surface-200'}`}
          >
            <MagicWand size={20} weight="bold" />
          </button>
        </div>
      </motion.div>

      {/* Main Insights Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Personalized Recommendation Card */}
        <motion.div variants={fadeUp} className={`lg:col-span-2 rounded-[3rem] p-10 border relative overflow-hidden group transition-all duration-500 hover:shadow-2xl ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-2xl shadow-[#000080]/5' : 'bg-white border-surface-100 shadow-xl'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
             <Brain weight="fill" size={240} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-8">
               <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isIndia ? 'bg-[#138808]/10 text-[#138808]' : 'bg-emerald-100 text-emerald-700'}`}>
                 <ChartLineUp weight="bold" className="inline mr-1" /> Best Opportunity
               </div>
               <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-slate-100 text-slate-600'}`}>
                 <Info weight="bold" className="inline mr-1" /> {t('prediction.confidence')}: 94%
               </div>
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-start md:items-center mb-10">
              <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center flex-shrink-0 shadow-2xl ring-8 ring-white/50 ${isIndia ? 'bg-gradient-to-br from-[#FF9933] to-[#000080]' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                 <MagicWand weight="fill" className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                 <h3 className={`text-3xl font-black mb-3 ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>{t('prediction.bestTime')}</h3>
                 <p className={`text-sm font-medium leading-relaxed max-w-xl opacity-60 mb-6 ${isIndia ? 'text-[#000080]' : 'text-surface-600'}`}>{recommendation.reason}</p>
                 
                 <div className="flex flex-wrap gap-3">
                    <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 transition-all ${isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-slate-50 text-slate-700'}`}>
                       <CalendarBlank weight="bold" size={18} className="opacity-40" />
                       <span className="text-sm font-black uppercase tracking-widest">{recommendation.day}</span>
                    </div>
                    <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 transition-all ${isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-slate-50 text-slate-700'}`}>
                       <Clock weight="bold" size={18} className="opacity-40" />
                       <span className="text-sm font-black uppercase tracking-widest">{recommendation.timeSlot}</span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-4 pt-8 border-t border-surface-50">
               <button 
                 onClick={() => handleBookNow(recommendation.day, 14)}
                 className={`flex-1 min-w-[200px] py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl ${isIndia ? 'bg-[#000080] text-white shadow-[#000080]/20' : 'bg-primary-500 text-white shadow-primary-500/20'}`}
               >
                 {t('prediction.bookNow')}
                 <ArrowRight weight="bold" />
               </button>
               <button 
                 onClick={handleSetReminder}
                 className={`px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all border hover:bg-surface-50 ${isIndia ? 'border-[#000080]/10 text-[#000080]' : 'border-surface-200 text-surface-600'}`}
               >
                 <Bell weight="bold" size={20} />
                 {t('prediction.notifyMe')}
               </button>
            </div>
          </div>
        </motion.div>

        {/* Real-time Occupancy Gauge / Graph */}
        <motion.div variants={fadeUp} className={`rounded-[3rem] p-10 border transition-all ${isIndia ? 'bg-[#000080] border-transparent shadow-2xl shadow-[#000080]/30' : 'bg-surface-900 border-transparent shadow-2xl'}`}>
           <div className="h-full flex flex-col text-white">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Hourly Trend</h4>
                 <Gauge size={20} className="text-[#FF9933]" weight="fill" />
              </div>
              
              <div className="flex-1 min-h-[200px] -mx-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor={isIndia ? "#FF9933" : "#6366f1"} stopOpacity={0.8}/>
                             <stop offset="95%" stopColor={isIndia ? "#FF9933" : "#6366f1"} stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                       <XAxis 
                         dataKey="hour" 
                         hide 
                       />
                       <Tooltip 
                         contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                         itemStyle={{ color: '#fff' }}
                       />
                       <Area 
                         type="monotone" 
                         dataKey="occupancy" 
                         stroke={isIndia ? "#FF9933" : "#6366f1"} 
                         fillOpacity={1} 
                         fill="url(#colorOcc)" 
                         strokeWidth={3}
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>

              <div className="mt-8 space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold opacity-40">Currently</span>
                    <span className="text-2xl font-black text-[#FF9933]">
                      {adminStats?.hourly_trend ? `${Math.round(adminStats.hourly_trend[new Date().getHours()] || 20)}%` : '—'}
                    </span>
                 </div>
                 <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: adminStats?.hourly_trend ? `${adminStats.hourly_trend[new Date().getHours()] || 20}%` : '20%' }}
                      className="h-full bg-[#FF9933]"
                    />
                 </div>
                 <p className="text-[10px] font-medium opacity-30 leading-relaxed uppercase tracking-wider">
                   {adminStats?.hourly_trend && adminStats.hourly_trend[(new Date().getHours() + 2) % 24] > adminStats.hourly_trend[new Date().getHours()]
                     ? `System predicts ${Math.round(adminStats.hourly_trend[(new Date().getHours() + 2) % 24] - adminStats.hourly_trend[new Date().getHours()])}% increase in next 2 hours`
                     : `System predicts stable or decreasing demand in next 2 hours`}
                 </p>
              </div>
           </div>
        </motion.div>
      </div>

      {/* Tabs / Toggle Section */}
      <motion.div variants={fadeUp} className="flex justify-center">
         <div className={`p-1.5 rounded-2xl flex gap-1 ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-100'}`}>
            <button 
              onClick={() => setActiveTab('forecast')}
              className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'forecast' ? (isIndia ? 'bg-white text-[#000080] shadow-lg' : 'bg-white text-primary-600 shadow-md') : 'opacity-40 hover:opacity-100'}`}
            >
              {t('prediction.weeklyForecast')}
            </button>
            <button 
              onClick={() => setActiveTab('simulator')}
              className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'simulator' ? (isIndia ? 'bg-white text-[#000080] shadow-lg' : 'bg-white text-primary-600 shadow-md') : 'opacity-40 hover:opacity-100'}`}
            >
              {t('prediction.simulator')}
            </button>
         </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'forecast' ? (
          <motion.div 
            key="forecast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-5"
          >
            {predictions.map((day, idx) => (
              <motion.div
                key={day.dayIndex}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`rounded-[2.5rem] border p-8 flex flex-col transition-all cursor-pointer ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm hover:shadow-2xl' : 'bg-white border-surface-100 hover:shadow-xl'}`}
              >
                <div className="text-center mb-8">
                   <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isIndia ? 'text-[#000080]/30' : 'text-surface-400'}`}>{day.dayShort}</span>
                </div>

                <div className="text-center mb-8 relative">
                   <div className={`text-4xl font-black mb-2 transition-colors ${levelColor(day.level)}`}>{day.predicted}%</div>
                   <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${levelBg(day.level)} ${levelColor(day.level)}`}>
                      {t(`prediction.${day.level}`)}
                   </span>
                </div>

                <div className={`w-full h-2.5 rounded-full mb-10 overflow-hidden ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-50'}`}>
                   <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${day.predicted}%` }}
                      transition={{ delay: idx * 0.1, duration: 1 }}
                      className={`h-full rounded-full transition-all ${isIndia ? (day.level === 'high' ? 'bg-rose-500' : day.level === 'medium' ? 'bg-[#FF9933]' : 'bg-[#138808]') : 'bg-primary-500'}`}
                   />
                </div>

                <div className="space-y-4 mb-8">
                   <div className="flex justify-between items-center group/peak">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Peak</span>
                      <span className="text-xs font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-lg">{formatHour(day.peakHour)}</span>
                   </div>
                   <div className="flex justify-between items-center group/off">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Off-Peak</span>
                      <span className={`text-xs font-black px-3 py-1 rounded-lg ${isIndia ? 'text-[#138808] bg-[#138808]/5' : 'text-emerald-600 bg-emerald-50'}`}>{formatHour(day.offPeakHour)}</span>
                   </div>
                </div>

                <button 
                  onClick={() => handleBookNow(day.dayName, day.offPeakHour)}
                  className={`mt-auto w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 ${isIndia ? 'bg-[#000080] text-white' : 'bg-primary-500 text-white'}`}
                >
                  Book <ArrowRight weight="bold" />
                </button>

                <div className="mt-auto pt-6 border-t border-surface-50 text-center group-hover:opacity-0 transition-opacity">
                   <span className="text-[9px] font-black uppercase tracking-widest opacity-20">{day.confidence}% confidence</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="simulator"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-[3rem] border p-12 flex flex-col lg:flex-row gap-12 items-center ${isIndia ? 'bg-white border-[#FF9933]/20 shadow-2xl' : 'bg-white border-surface-200'}`}
          >
             <div className="flex-1 w-full space-y-10">
                <div className="space-y-4">
                  <h3 className={`text-3xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>{t('prediction.simulator')}</h3>
                  <p className="text-sm opacity-50 font-medium">Toggle parameters to see the predicted demand for your target time.</p>
                </div>
                
                <div className="space-y-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Select Day</label>
                      <div className="flex flex-wrap gap-2">
                         {DAYS_SHORT.map((d, i) => (
                            <button 
                              key={d}
                              onClick={() => setSimDay(DAYS_FULL[i].toLowerCase())}
                              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${simDay === DAYS_FULL[i].toLowerCase() ? (isIndia ? 'bg-[#000080] text-white' : 'bg-primary-600 text-white') : 'bg-surface-50 opacity-50 hover:opacity-100'}`}
                            >
                               {d}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Target Hour</label>
                         <span className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>{formatHour(simHour)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="23" 
                        value={simHour} 
                        onChange={(e) => setSimHour(parseInt(e.target.value))}
                        className={`w-full h-3 rounded-full appearance-none cursor-pointer ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-100'}`}
                      />
                      <div className="flex justify-between opacity-20 text-[9px] font-black uppercase tracking-widest">
                         <span>Midnight</span>
                         <span>Noon</span>
                         <span>11 PM</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="w-full lg:w-96 flex flex-col items-center justify-center p-10 rounded-[2.5rem] bg-gradient-to-br from-surface-50 to-white border border-surface-100">
                <div className="text-center mb-8">
                   <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-2">{t('prediction.predictedOccupancy')}</div>
                   <div className={`text-7xl font-black ${isIndia ? 'text-[#000080]' : 'text-primary-600'}`}>{simulatedOccupancy}%</div>
                </div>
                
                <div className={`w-full p-6 rounded-2xl flex items-center gap-4 border mb-8 ${levelBg(getLevel(simulatedOccupancy))}`}>
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${isIndia ? 'bg-white text-[#000080]' : 'bg-white'}`}>
                      <Info weight="fill" size={24} className={levelColor(getLevel(simulatedOccupancy))} />
                   </div>
                   <div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${levelColor(getLevel(simulatedOccupancy))}`}>
                         {t(`prediction.${getLevel(simulatedOccupancy)}`)}
                      </div>
                      <div className="text-xs font-bold opacity-60">Demand Level</div>
                   </div>
                </div>

                <button 
                  onClick={() => handleBookNow(simDay, simHour)}
                  className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl ${isIndia ? 'bg-[#000080] text-white shadow-[#000080]/20' : 'bg-primary-500 text-white shadow-primary-500/20'}`}
                >
                  {t('prediction.bookNow')}
                  <ArrowRight weight="bold" />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 pt-10">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-20 max-w-2xl text-center leading-relaxed`}>
          {t('prediction.disclaimer')}
        </p>
        <div className="flex gap-6 opacity-20">
           <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-[#138808]"></div> Optimal</div>
           <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-[#FF9933]"></div> Moderate</div>
           <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-rose-500"></div> High Demand</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default OccupancyPredictionPage;
