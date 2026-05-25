import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ChartBar, GearSix, Users, Megaphone, ChartLine, MapPin, Translate, PresentationChart, Gauge,
  Buildings, ClockCounterClockwise, Database, Car, Wheelchair, Wrench, CurrencyDollar, UserPlus, Lightning,
  PuzzlePiece, GraphicsCard, ShieldCheck, ArrowsClockwise,
} from '@phosphor-icons/react';
import { useTheme } from '../context/ThemeContext';

function AdminNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';

  const sections = [
    {
      title: 'Core',
      items: [
        { name: t('admin.overview'), path: '/admin', icon: ChartBar },
        { name: t('admin.users'), path: '/admin/users', icon: Users },
        { name: t('admin.lots'), path: '/admin/lots', icon: MapPin },
        { name: t('admin.announcements', 'Announcements'), path: '/admin/announcements', icon: Megaphone },
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: t('admin.maintenance', 'Maintenance'), path: '/admin/maintenance', icon: Wrench },
        { name: t('admin.rateLimits', 'Rate Limits'), path: '/admin/rate-limits', icon: Gauge },
        { name: t('admin.billing', 'Billing'), path: '/admin/billing', icon: CurrencyDollar },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { name: t('admin.reports'), path: '/admin/reports', icon: ChartLine },
        { name: 'Analytics', path: '/admin/analytics', icon: PresentationChart },
      ]
    }
  ];

  function isActive(path) {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  }

  return (
    <nav aria-label="Admin navigation" className="space-y-5">
      {sections.map(section => (
        <div key={section.title}>
          <p className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-surface-400'}`}>
            {section.title}
          </p>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide -webkit-overflow-scrolling-touch">
            {section.items.map(tab => {
              const active = isActive(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? isIndia 
                        ? 'border-[#FF9933] text-[#000080] bg-[#FF9933]/10' 
                        : 'border-primary-300 text-primary-700 dark:border-primary-700 dark:text-primary-300 bg-primary-50/90 dark:bg-primary-900/20'
                      : isIndia 
                        ? 'border-[#000080]/10 text-[#000080]/60 hover:text-[#000080] hover:bg-[#000080]/5' 
                        : 'border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  <tab.icon weight={active ? 'fill' : 'regular'} className="w-4.5 h-4.5" />
                  {tab.name}
                  {active && (
                    <motion.div
                      layoutId="admin-tab-indicator"
                      className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full ${isIndia ? 'bg-[#FF9933]' : 'bg-primary-500'}`}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { designTheme } = useTheme();
  const isVoid = designTheme === 'void';
  const isIndia = designTheme === 'india';

  let heroBg = 'border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_42%),linear-gradient(135deg,rgba(255,251,245,0.98),rgba(236,253,245,0.9))] text-surface-900 dark:border-surface-700 dark:bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_42%),linear-gradient(135deg,rgba(22,26,34,0.98),rgba(31,41,55,0.94))] dark:text-white';
  
  if (isVoid) {
    heroBg = 'border-surface-200 bg-gradient-to-br from-surface-900 via-surface-800 to-surface-950 text-white dark:border-surface-700';
  } else if (isIndia) {
    heroBg = 'border-[#FF9933]/20 bg-gradient-to-br from-white via-[#FF9933]/5 to-white text-[#000080] shadow-sm';
  }

  const isDashboard = location.pathname === '/admin';

  return (
    <div className="space-y-6">
      {isDashboard && (
        <section className={`overflow-hidden rounded-[28px] border px-6 py-6 transition-colors ${heroBg}`}>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
              isVoid
                ? 'bg-white/10 text-white/75'
                : isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-white/85 text-emerald-700 dark:bg-white/10 dark:text-white/75'
            }`}>
              <span className={`inline-block h-2 w-2 rounded-full ${isVoid ? 'bg-emerald-400' : isIndia ? 'bg-[#FF9933]' : 'bg-emerald-500'}`} />
              {isVoid ? 'Admin control plane' : isIndia ? 'ParkIndia Command Center' : 'Marble governance studio'}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('admin.title')}</h1>
            <p className={`mt-2 max-w-2xl text-sm leading-6 ${isVoid ? 'text-white/70' : isIndia ? 'text-[#000080]/70' : 'text-surface-600 dark:text-white/70'}`}>{t('admin.subtitle')}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <AdminHeroStat label={t('admin.users')} value="24" isVoid={isVoid} isIndia={isIndia} />
              <AdminHeroStat label={t('admin.lots')} value="6" isVoid={isVoid} isIndia={isIndia} />
              <AdminHeroStat label={t('admin.rateLimits', 'Rate Limits')} value="stable" isVoid={isVoid} isIndia={isIndia} />
            </div>
          </div>
          <div className={`rounded-3xl border p-4 transition-colors ${
            isVoid
              ? 'border-white/10 bg-white/4'
              : isIndia ? 'border-[#FF9933]/10 bg-white/50 shadow-sm' : 'border-white/80 bg-white/80 dark:border-white/10 dark:bg-white/4'
          }`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isVoid ? 'text-white/45' : isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-white/45'}`}>Operational focus</p>
            <div className="mt-4 space-y-3">
              {[
                { label: t('admin.lots'), meta: 'Interactive slot layouts, utilization meters and creation' },
                { label: t('admin.users'), meta: 'Quota, role permissions, billing lifecycle and user states' },
                { label: 'Analytics', meta: 'Real-time booking demands, reservation metrics and lot stats' },
              ].map(item => (
                <div key={item.label} className={`rounded-2xl border px-4 py-3 transition-colors ${
                  isVoid
                    ? 'border-white/10 bg-white/3'
                    : isIndia ? 'border-[#FF9933]/10 bg-white shadow-sm' : 'border-white/80 bg-white/85 dark:border-white/10 dark:bg-white/3'
                }`}>
                  <p className={`text-sm font-semibold ${isVoid ? 'text-white' : isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{item.label}</p>
                  <p className={`mt-1 text-xs ${isVoid ? 'text-white/55' : isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-white/55'}`}>{item.meta}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </section>
      )}

      <div className={`grid gap-4 ${isDashboard ? 'lg:grid-cols-[1.1fr_0.9fr]' : 'grid-cols-1'}`}>
        <section className={`rounded-3xl border p-5 transition-colors ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900'}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className={`text-lg font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>Admin navigation</h2>
              {isDashboard && <p className={`mt-1 text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>Core, operations and governance routes grouped by functional area.</p>}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-primary-500/10 text-primary-700 dark:text-primary-300'}`}>
              {location.pathname === '/admin' ? 'Overview live' : 'Section active'}
            </span>
          </div>
          <AdminNav />
        </section>

        {isDashboard && (
          <section className={`rounded-3xl border p-5 transition-colors ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900'}`}>
            <h2 className={`text-lg font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>Live priorities</h2>
            <div className="mt-4 space-y-3">
              {[
                { title: 'Slot Capacity', body: 'Review real-time lot occupancies, peaks and dynamic assignments.' },
                { title: 'Rates & Pricing Configuration', body: 'Configure booking credits, limits and hourly rates.' },
                { title: 'Security & Access Control', body: 'Assign operators and define robust role permissions.' },
              ].map(item => (
                <div key={item.title} className={`rounded-2xl px-4 py-3 transition-colors ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-100 dark:bg-surface-800/80'}`}>
                  <p className={`text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{item.title}</p>
                  <p className={`mt-1 text-xs leading-5 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className={`rounded-3xl border p-5 shadow-sm transition-colors ${isIndia ? 'bg-white border-[#FF9933]/10' : 'border-surface-200 bg-white/90 dark:border-surface-800 dark:bg-surface-900/80'}`}>
        <Outlet />
      </div>
    </div>
  );
}

function AdminHeroStat({ label, value, isVoid, isIndia }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 transition-colors ${
      isVoid
        ? 'border-white/10 bg-white/5'
        : isIndia ? 'border-[#FF9933]/10 bg-white shadow-sm' : 'border-white/80 bg-white/85 dark:border-white/10 dark:bg-white/5'
    }`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isVoid ? 'text-white/45' : isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-white/45'}`}>{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${isVoid ? 'text-white' : isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

export default AdminPage;
