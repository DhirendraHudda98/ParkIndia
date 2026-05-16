import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const COLOR_MAP = {
  green: { bar: 'bg-[#138808]', text: 'text-[#138808]', glow: 'shadow-[#138808]/30' },
  yellow: { bar: 'bg-[#FF9933]', text: 'text-[#FF9933]', glow: 'shadow-[#FF9933]/30' },
  red: { bar: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/30' },
};

export function LobbyDisplayPage() {
  const { lotId } = useParams();
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDisplay = useCallback(async () => {
    if (!lotId) return;
    try {
      const res = await fetch(`/api/v1/lots/${lotId}/display`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(json.error?.message || t('lobby.error'));
      }
    } catch {
      setError(t('lobby.networkError'));
    }
  }, [lotId, t]);

  useEffect(() => {
    fetchDisplay();
    const interval = setInterval(fetchDisplay, 10_000);
    return () => clearInterval(interval);
  }, [fetchDisplay]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (error) {
    return (
      <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center p-12">
        <h1 className="text-[10rem] font-black text-red-500/20 leading-none mb-8">ERROR</h1>
        <p className="text-red-400 text-4xl font-black uppercase tracking-widest">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center">
        <div className="w-24 h-24 border-8 border-[#FF9933]/20 border-t-[#FF9933] rounded-full animate-spin" />
      </div>
    );
  }

  const colors = COLOR_MAP[data.color_status] || COLOR_MAP.green;
  const occupancyWidth = Math.min(data.occupancy_percent, 100);

  return (
    <div
      className={`min-h-dvh flex flex-col p-12 select-none overflow-hidden transition-colors duration-1000 ${isIndia ? 'bg-white text-[#000080]' : 'bg-slate-950 text-white'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-20">
        <div>
          <div className={`mb-4 inline-flex items-center px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-[0.3em] ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-primary-500/10 text-primary-400'}`}>
            Live Occupancy Status
          </div>
          <h1 className="text-[6rem] leading-[0.9] font-black tracking-tighter truncate max-w-4xl">
            {data.lot_name}
          </h1>
        </div>
        <div className="text-right">
          <time className={`text-[4rem] leading-none font-mono font-black tabular-nums ${isIndia ? 'text-[#000080]/20' : 'text-slate-800'}`}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </time>
          <p className={`text-sm font-black uppercase tracking-[0.4em] mt-4 ${isIndia ? 'text-[#000080]/30' : 'text-slate-600'}`}>
            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Main Counter */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <h2 className="text-[30rem] font-black tracking-tighter">PARK</h2>
        </div>
        
        <div className="text-center relative z-10">
          <p className={`text-2xl font-black uppercase tracking-[0.8em] mb-12 ${isIndia ? 'text-[#000080]/30' : 'text-slate-500'}`}>
            Available Slots
          </p>
          <div className="flex items-center justify-center">
            <span className={`text-[22rem] leading-none font-black tabular-nums tracking-tighter transition-all duration-500 ${colors.text}`}>
              {data.available_slots}
            </span>
            <span className={`text-[12rem] font-light mx-12 opacity-20 ${isIndia ? 'text-[#000080]' : 'text-white'}`}>/</span>
            <span className={`text-[12rem] font-black tabular-nums tracking-tighter opacity-20 ${isIndia ? 'text-[#000080]' : 'text-white'}`}>
              {data.total_slots}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-5xl mt-20 relative z-10">
          <div className={`w-full h-12 rounded-full overflow-hidden ${isIndia ? 'bg-[#000080]/5' : 'bg-slate-900'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${occupancyWidth}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${colors.bar} rounded-full shadow-2xl ${colors.glow}`}
            />
          </div>
          <div className="flex justify-between mt-6 px-4">
            <p className={`text-xl font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/30' : 'text-slate-600'}`}>
              {t('lobby.occupancy')}
            </p>
            <p className={`text-2xl font-black tabular-nums ${colors.text}`}>
              {Math.round(data.occupancy_percent)}%
            </p>
          </div>
        </div>
      </div>

      {/* Floor Breakdown */}
      {data.floors.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mt-20 relative z-10">
          {data.floors.map((floor) => {
            const floorOcc = Math.min(floor.occupancy_percent, 100);
            const floorColor = floor.occupancy_percent > 85 ? 'red' : floor.occupancy_percent >= 60 ? 'yellow' : 'green';
            const fc = COLOR_MAP[floorColor];
            return (
              <div
                key={floor.floor_number}
                className={`rounded-[2.5rem] p-8 border transition-all ${isIndia ? 'bg-white border-[#000080]/5 shadow-xl shadow-[#000080]/5' : 'bg-slate-900/50 border-white/5'}`}
              >
                <p className={`text-xs font-black uppercase tracking-widest mb-4 ${isIndia ? 'text-[#000080]/40' : 'text-slate-500'}`}>
                  {t('lobby.floor')} {floor.floor_name || floor.floor_number}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-5xl font-black tabular-nums ${fc.text}`}>
                    {floor.available_slots}
                  </p>
                  <p className="text-lg font-bold opacity-20">/ {floor.total_slots}</p>
                </div>
                <div className={`w-full h-3 rounded-full mt-6 overflow-hidden ${isIndia ? 'bg-[#000080]/5' : 'bg-slate-800'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${floorOcc}%` }}
                    className={`h-full ${fc.bar} rounded-full`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className={`flex justify-center mt-20 pt-10 border-t text-sm font-black uppercase tracking-[0.4em] ${isIndia ? 'border-[#000080]/5 text-[#000080]/20' : 'border-white/5 text-slate-700'}`}>
        <p>
          {t('lobby.lastUpdated')}: {lastUpdated?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || '—'}
        </p>
      </div>
    </div>
  );
}

export default LobbyDisplayPage;
