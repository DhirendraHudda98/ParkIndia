import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Lightning, Star, Brain } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { getInMemoryToken } from '../api/client';
import { staggerSlow, fadeUp } from '../constants/animations';
import { useTheme } from '../context/ThemeContext';

function authHeaders() {
  const token = getInMemoryToken();
  return {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function computeEcoScore(stats) {
  const bookingScore = Math.min(stats.this_month * 5, 40);
  const evScore = stats.total > 0 ? (stats.ev_count / stats.total) * 30 : 0;
  const durationScore = Math.min(stats.avg_duration_hours * 3, 20);
  const reliabilityScore = stats.no_shows === 0 ? 10 : Math.max(0, 10 - stats.no_shows * 3);
  return Math.round(bookingScore + evScore + durationScore + reliabilityScore);
}

function computeBadges(stats, t, isIndia) {
  const badges = [];
  if (stats.ev_count > 0) {
    badges.push({ key: 'ev', label: t('leaderboard.badgeEv'), color: isIndia ? 'bg-[#138808]/10 text-[#138808]' : 'bg-green-100 text-green-700' });
  }
  if (stats.morning_count > 0) {
    badges.push({ key: 'early', label: t('leaderboard.badgeEarly'), color: isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-100 text-amber-700' });
  }
  if (stats.swaps_accepted > 0) {
    badges.push({ key: 'team', label: t('leaderboard.badgeTeam'), color: isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-blue-100 text-blue-700' });
  }
  return badges;
}

const MEDAL_COLORS = ['text-[#FF9933]', 'text-[#000080]', 'text-[#138808]'];

export function TeamLeaderboardPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';
  
  const [members, setMembers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/team', { headers: authHeaders(), credentials: 'include' }).then(r => r.json()),
      fetch('/api/v1/admin/stats', { headers: authHeaders(), credentials: 'include' }).then(r => r.json()),
    ])
      .then(([teamRes, statsRes]) => {
        if (teamRes?.data) setMembers(teamRes.data);
        if (statsRes?.data) setAdminStats(statsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const leaderboard = useMemo(() => {
    if (!members.length) return [];
    const byUser = adminStats?.bookings_by_user || {};

    return members
      .map(m => {
        const stats = byUser[m.id] || {
          total: 0, this_month: 0, ev_count: 0, morning_count: 0,
          swaps_accepted: 0, no_shows: 0, avg_duration_hours: 0,
        };
        return {
          id: m.id,
          name: m.name || m.username,
          username: m.username,
          ecoScore: computeEcoScore(stats),
          bookingsThisMonth: stats.this_month,
          evPercentage: stats.total > 0 ? Math.round((stats.ev_count / stats.total) * 100) : 0,
          badges: computeBadges(stats, t, isIndia),
          noShows: stats.no_shows,
        };
      })
      .sort((a, b) => b.ecoScore - a.ecoScore);
  }, [members, adminStats, t, isIndia]);

  if (loading) return (
    <div className="space-y-10 p-2">
      <div className="h-10 w-64 skeleton rounded-2xl" />
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 skeleton rounded-[2.5rem]" />)}
      </div>
      {[1, 2, 3, 4].map(i => <div key={i} className="h-24 skeleton rounded-[2rem]" />)}
    </div>
  );

  return (
    <motion.div variants={staggerSlow} initial="hidden" animate="show" className="space-y-10 p-2 max-w-7xl">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-6 flex-wrap">
         <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 text-primary-500'}`}>
               <Trophy weight="bold" className="w-7 h-7" />
            </div>
            <div>
               <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>
                  {isIndia ? 'Regional Hub Champions' : t('leaderboard.title')}
               </h2>
               <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
                  Recognizing the top performing logistical operators in your network.
               </p>
            </div>
         </div>
      </motion.div>

      {/* Highlights */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <HighlightCard 
           icon={<Star weight="fill" />} 
           label="Most Efficient" 
           value={leaderboard[0]?.name || '—'} 
           meta={`${leaderboard[0]?.bookingsThisMonth || 0} Transfers`} 
           isIndia={isIndia} 
           accentColor="text-[#FF9933]"
           bgColor="bg-[#FF9933]/5"
         />
         <HighlightCard 
           icon={<Lightning weight="fill" />} 
           label="Eco Warrior" 
           value={leaderboard.find(e => e.evPercentage > 0)?.name || '—'} 
           meta="Highest EV Usage" 
           isIndia={isIndia} 
           accentColor="text-[#138808]"
           bgColor="bg-[#138808]/5"
         />
         <HighlightCard 
           icon={<Brain weight="fill" />} 
           label="Reliability Master" 
           value={leaderboard.find(e => e.noShows === 0)?.name || '—'} 
           meta="Perfect Attendance" 
           isIndia={isIndia} 
           accentColor="text-[#000080]"
           bgColor="bg-[#000080]/5"
         />
      </motion.div>

      {/* Leaderboard Table */}
      <motion.div variants={fadeUp} className={`rounded-[3rem] p-10 border transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-2xl shadow-[#000080]/5' : 'bg-white border-surface-100 shadow-xl'}`}>
         <div className="space-y-4">
            {leaderboard.map((entry, idx) => (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-6 p-6 rounded-[2rem] border transition-all hover:bg-surface-50/50 ${idx < 3 ? (isIndia ? 'border-[#FF9933]/20 bg-gradient-to-r from-[#FF9933]/5 to-transparent' : 'border-primary-100 bg-primary-50/10') : 'border-transparent'}`}
              >
                 <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    {idx < 3 ? (
                      <Medal weight="fill" size={32} className={MEDAL_COLORS[idx]} />
                    ) : (
                      <span className="text-sm font-black opacity-20">{idx + 1}</span>
                    )}
                 </div>

                 <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${isIndia ? 'bg-[#000080] text-white' : 'bg-surface-100 text-surface-600'}`}>
                       {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                       <div className={`font-black text-sm ${isIndia ? 'text-[#000080]' : ''}`}>{entry.name}</div>
                       <div className="flex flex-wrap gap-2 mt-2">
                          {entry.badges.map(b => (
                            <span key={b.key} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${b.color}`}>
                               {b.label}
                            </span>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="hidden md:block w-48">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Efficiency</span>
                       <span className="text-[9px] font-black">{entry.bookingsThisMonth}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                       <div className={`h-full rounded-full transition-all ${isIndia ? 'bg-[#FF9933]' : 'bg-primary-500'}`} style={{ width: `${Math.min(100, (entry.bookingsThisMonth / 20) * 100)}%` }} />
                    </div>
                 </div>

                 <div className="text-right flex-shrink-0">
                    <div className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>{entry.ecoScore}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-30">Heritage Score</div>
                 </div>
              </motion.div>
            ))}
         </div>
      </motion.div>
    </motion.div>
  );
}

function HighlightCard({ icon, label, value, meta, isIndia, accentColor, bgColor }) {
  return (
    <div className={`rounded-[2.5rem] p-8 border transition-all ${isIndia ? `bg-white border-[#FF9933]/10 shadow-sm` : 'bg-white border-surface-100'}`}>
       <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accentColor} ${bgColor}`}>
             {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{label}</span>
       </div>
       <div className={`text-xl font-black mb-1 truncate ${isIndia ? 'text-[#000080]' : ''}`}>{value}</div>
       <div className={`text-[10px] font-black uppercase tracking-widest ${accentColor} opacity-70`}>{meta}</div>
    </div>
  );
}

export default TeamLeaderboardPage;
