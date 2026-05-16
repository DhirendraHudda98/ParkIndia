import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartBar, TrendUp, Users, Clock, CurrencyDollar, Export, CalendarBlank } from '@phosphor-icons/react';
import { getInMemoryToken } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

function StatCard({ icon: Icon, label, value, sub, isIndia, isVoid }) {
  return (
    <div className={`rounded-xl p-5 border shadow-sm transition-colors ${
      isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isIndia ? 'bg-[#FF9933]/10' : 'bg-primary-50 dark:bg-primary-950/30'}`}>
          <Icon weight="fill" className={`w-5 h-5 ${isIndia ? 'text-[#FF9933]' : 'text-primary-600 dark:text-primary-400'}`} />
        </div>
        <span className={`text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</div>
      {sub && <div className={`text-xs mt-1 ${isIndia ? 'text-[#000080]/30' : 'text-surface-400'}`}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label, currency = '₹', isIndia }) {
  if (active && payload && payload.length) {
    return (
      <div className={`rounded-xl border p-3 shadow-xl ${
        isIndia ? 'border-[#FF9933]/20 bg-white' : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950'
      }`}>
        <p className={`mb-1 text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>{label}</p>
        <p className={`text-sm font-black ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`}>
          {payload[0].name === 'Revenue' ? `${currency}${payload[0].value.toLocaleString()}` : `${payload[0].value} Bookings`}
        </p>
      </div>
    );
  }
  return null;
}

export function AdminAnalyticsPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30');

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  useEffect(() => {
    setLoading(true);
    const base = import.meta.env?.VITE_API_URL || '';
    const token = getInMemoryToken();
    const headers = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    fetch(`${base}/api/v1/admin/analytics/overview?days=${range}`, { headers, credentials: 'include' })
      .then(r => r.json())
      .then(json => { if (json?.data) setData(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Bookings', 'Revenue'],
      ...data.daily_bookings.map((d, i) => [
        d.date,
        String(d.value),
        String(data.daily_revenue[i]?.value ?? 0),
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${range}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const heroBg = isVoid
    ? 'border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_32%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.95))] text-white'
    : isIndia 
      ? 'border-[#FF9933]/20 bg-gradient-to-br from-white via-[#FF9933]/5 to-white text-[#000080]'
      : 'border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_38%),linear-gradient(135deg,rgba(255,252,248,0.98),rgba(240,253,250,0.92))] text-surface-900 dark:border-surface-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_38%),linear-gradient(135deg,rgba(22,26,34,0.98),rgba(31,41,55,0.94))] dark:text-white';

  return (
    <div className="space-y-6">
      <section className={`overflow-hidden rounded-[28px] border px-6 py-6 transition-colors ${heroBg}`}>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ${
              isVoid
                ? 'bg-cyan-500/10 text-cyan-100'
                : isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-white/80 text-emerald-700 dark:bg-white/10 dark:text-emerald-300'
            }`}>
              <ChartBar weight="fill" className="h-3.5 w-3.5" />
              {isVoid ? 'Void analytics deck' : isIndia ? 'ParkIndia Insight Engine' : 'Marble analytics deck'}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
                  <ChartBar weight="duotone" className={`h-7 w-7 ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`} />
                  Analytics
                </h1>
                <p className={`mt-2 max-w-2xl text-sm leading-6 ${isVoid ? 'text-slate-300' : isIndia ? 'text-[#000080]/70' : 'text-surface-600 dark:text-surface-300'}`}>
                  {isIndia ? 'Comprehensive regional growth and operational trends across Indian cities.' : 'Comprehensive parking analytics and trends'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportCsv}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors ${
                    isVoid
                      ? 'bg-white/5 text-white/75 hover:bg-white/10'
                      : isIndia ? 'bg-[#000080]/10 text-[#000080] hover:bg-[#000080]/20' : 'bg-white/80 text-surface-600 hover:bg-white dark:bg-white/10 dark:text-white/75 dark:hover:bg-white/15'
                  }`}
                >
                  <Export weight="bold" className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <HeroMetric label="Range" value={range === '365' ? '1 year' : `${range} days`} meta="Explorable window" isVoid={isVoid} isIndia={isIndia} accent />
              <HeroMetric label="Daily points" value={String(data?.daily_bookings.length ?? 0)} meta="Trend line data" isVoid={isVoid} isIndia={isIndia} />
              <HeroMetric label="Top lots" value={String(data?.top_lots.length ?? 0)} meta="Utilization stats" isVoid={isVoid} isIndia={isIndia} />
            </div>
          </div>

          <div className={`rounded-[24px] border p-5 transition-colors ${
            isVoid
              ? 'border-white/10 bg-white/[0.04]'
              : isIndia ? 'bg-white shadow-sm border-[#FF9933]/10' : 'border-white/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]'
          }`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isVoid ? 'text-white/45' : isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-white/45'}`}>
              Observatory
            </p>
            <div className="mt-4 space-y-3">
              <PanelMetric label="Fetch state" value={loading ? 'Loading' : data ? 'Live' : 'Fallback'} helper="Overview endpoint status" isVoid={isVoid} isIndia={isIndia} />
              <PanelMetric label="Revenue points" value={String(data?.daily_revenue.length ?? 0)} helper="Trend chart coverage" isVoid={isVoid} isIndia={isIndia} />
              <PanelMetric label="User growth" value={String(data?.user_growth.length ?? 0)} helper="Twelve-month pulse" isVoid={isVoid} isIndia={isIndia} />
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end flex-wrap gap-2">
          {['7', '30', '90', '365'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                range === r
                  ? isIndia ? 'bg-[#FF9933] text-white' : 'bg-primary-600 text-white'
                  : isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              }`}
            >
              {r === '365' ? '1y' : `${r}d`}
            </button>
          ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={CalendarBlank} label="Total Bookings" value={String(data.total_bookings)} sub={`Last ${range} days`} isIndia={isIndia} isVoid={isVoid} />
            <StatCard icon={CurrencyDollar} label="Total Revenue" value={`₹${data.total_revenue.toLocaleString()}`} sub={`Last ${range} days`} isIndia={isIndia} isVoid={isVoid} />
            <StatCard icon={Clock} label="Avg Duration" value={`${Math.round(data.avg_booking_duration_minutes)} min`} isIndia={isIndia} isVoid={isVoid} />
            <StatCard icon={Users} label="Active Users" value={String(data.active_users)} sub="Unique users" isIndia={isIndia} isVoid={isVoid} />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-[2rem] p-6 border shadow-xl transition-colors ${
              isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-[#000080]/5' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
            }`}>
              <h3 className={`text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-widest ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                <TrendUp weight="bold" className={`w-4 h-4 ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`} />
                Daily Bookings Trend
              </h3>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily_bookings}>
                    <defs>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isIndia ? "#FF9933" : "#000080"} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={isIndia ? "#FF9933" : "#000080"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip isIndia={isIndia} />} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      name="Bookings"
                      stroke={isIndia ? "#FF9933" : "#000080"} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorBookings)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`rounded-[2rem] p-6 border shadow-xl transition-colors ${
              isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-[#138808]/5' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
            }`}>
              <h3 className={`text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-widest ${isIndia ? 'text-[#138808]' : 'text-surface-900 dark:text-white'}`}>
                <CurrencyDollar weight="bold" className={`w-4 h-4 ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`} />
                Revenue Flow (INR)
              </h3>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.daily_revenue}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip isIndia={isIndia} />} />
                    <Bar dataKey="value" name="Revenue" fill={isIndia ? "#138808" : "#primary-600"} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* New Analytics Widget: Peak Demand Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className={`rounded-[2rem] p-6 border shadow-xl transition-colors ${
              isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-sm font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                  Demand Distribution
                </h3>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-primary-50 text-primary-600'}`}>
                  Day of Week
                </span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'Mon', A: 120, fullMark: 150 },
                    { subject: 'Tue', A: 98, fullMark: 150 },
                    { subject: 'Wed', A: 86, fullMark: 150 },
                    { subject: 'Thu', A: 99, fullMark: 150 },
                    { subject: 'Fri', A: 85, fullMark: 150 },
                    { subject: 'Sat', A: 65, fullMark: 150 },
                    { subject: 'Sun', A: 130, fullMark: 150 },
                  ]}>
                    <PolarGrid stroke={isIndia ? "#FF993333" : "#00008033"} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: isIndia ? '#000080' : '#888', fontSize: 12 }} />
                    <Radar
                      name="Demand"
                      dataKey="A"
                      stroke={isIndia ? "#FF9933" : "#000080"}
                      fill={isIndia ? "#FF9933" : "#000080"}
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`rounded-[2rem] p-6 border shadow-xl transition-colors ${
              isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
            }`}>
              <h3 className={`text-sm font-black mb-6 uppercase tracking-widest ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>Premium Lot Performance</h3>
              <div className="space-y-4">
                {data.top_lots.length === 0 && <p className="text-sm text-surface-400">No lot data available</p>}
                {data.top_lots.map((lot, idx) => (
                  <div key={lot.lot_id} className="group flex items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-colors ${
                      isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-surface-50 dark:bg-white/5 text-surface-900 dark:text-white'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-black truncate ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{lot.lot_name}</div>
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`}>{lot.booking_count} bookings</div>
                    </div>
                    <div className="w-24 shrink-0">
                       <div className={`h-1.5 w-full rounded-full ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-100 dark:bg-white/5'}`}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, lot.utilization_percent || (lot.booking_count / 100) * 100)}%` }}
                            className={`h-full rounded-full ${isIndia ? 'bg-[#FF9933]' : 'bg-[#000080]'}`}
                          />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User adoption */}
          <div className={`rounded-[2rem] p-8 shadow-2xl relative overflow-hidden transition-colors ${
            isIndia ? 'bg-[#000080] text-white shadow-[#000080]/20' : 'bg-primary-600 text-white shadow-primary-600/20'
          }`}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Users size={120} weight="fill" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-2">User Adoption Pulse</h3>
              <p className="text-white/60 text-sm mb-8">Growth trends across the last 12 months</p>
              
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.user_growth}>
                    <Bar dataKey="new_users" fill={isIndia ? "#FF9933" : "#white"} radius={[4, 4, 4, 4]} />
                    <XAxis dataKey="month" hide />
                    <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip isIndia={isIndia} />} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-surface-500">Failed to load analytics data</div>
      )}
    </div>
  );
}

function HeroMetric({ label, value, meta, isVoid, isIndia, accent = false }) {
  let containerStyles = `rounded-[22px] border px-4 py-4 transition-colors ${
    isVoid
      ? 'border-white/10 bg-white/[0.04]'
      : isIndia ? 'bg-white shadow-sm border-[#FF9933]/10' : 'border-white/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.04]'
  }`;

  if (accent) {
    containerStyles = `rounded-[22px] border px-4 py-4 transition-colors ${
      isVoid
        ? 'border-cyan-500/30 bg-cyan-500/10'
        : isIndia ? 'bg-[#FF9933]/10 border-[#FF9933]/20' : 'border-emerald-200 bg-emerald-500/10 dark:border-emerald-900/60'
    }`;
  }

  return (
    <div className={containerStyles}>
      <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${
        accent
          ? isIndia ? 'text-[#FF9933]' : (isVoid ? 'text-cyan-100' : 'text-emerald-700 dark:text-emerald-300')
          : isIndia ? 'text-[#000080]/40' : (isVoid ? 'text-white/45' : 'text-surface-500 dark:text-white/45')
      }`}>
        {label}
      </p>
      <p className={`mt-3 text-2xl font-bold tracking-tight ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</p>
      <p className={`mt-2 text-xs ${isIndia ? 'text-[#000080]/50' : 'text-surface-500 dark:text-surface-400'}`}>{meta}</p>
    </div>
  );
}

function PanelMetric({ label, value, helper, isVoid, isIndia }) {
  return (
    <div className={`rounded-[20px] border px-4 py-4 transition-colors ${
      isVoid
        ? 'border-white/10 bg-white/[0.03]'
        : isIndia ? 'bg-white border-[#000080]/5 shadow-sm' : 'border-white/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]'
    }`}>
      <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isIndia ? 'text-[#000080]/30' : (isVoid ? 'text-white/45' : 'text-surface-500 dark:text-white/45')}`}>{label}</p>
      <p className={`mt-2 text-lg font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</p>
      <p className={`mt-1 text-xs ${isIndia ? 'text-[#000080]/50' : 'text-surface-500 dark:text-surface-400'}`}>{helper}</p>
    </div>
  );
}

export default AdminAnalyticsPage;
