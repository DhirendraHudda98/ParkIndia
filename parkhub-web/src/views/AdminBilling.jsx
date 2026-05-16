import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CurrencyDollar, ChartBar, DownloadSimple, Question, Buildings } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export function AdminBillingPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [ccData, setCcData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('cost-center');
  const [showHelp, setShowHelp] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ccRes, deptRes] = await Promise.all([
        fetch('/api/v1/admin/billing/by-cost-center').then(r => r.json()),
        fetch('/api/v1/admin/billing/by-department').then(r => r.json()),
      ]);
      if (ccRes.success) setCcData(ccRes.data || []);
      if (deptRes.success) setDeptData(deptRes.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleExport() {
    try {
      const res = await fetch('/api/v1/admin/billing/export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('billing.exported', 'CSV exported'));
    } catch {
      toast.error(t('common.error'));
    }
  }

  const totalAmount = ccData.reduce((sum, r) => sum + r.total_amount, 0);
  const totalBookings = ccData.reduce((sum, r) => sum + r.total_bookings, 0);
  const totalUsers = ccData.reduce((sum, r) => sum + r.user_count, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
      </div>
    );
  }

  const heroBg = isVoid
    ? 'border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_32%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.95))] text-white'
    : isIndia 
      ? 'border-[#FF9933]/20 bg-gradient-to-br from-white via-[#FF9933]/5 to-white text-[#000080]'
      : 'border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_38%),linear-gradient(135deg,rgba(255,252,248,0.98),rgba(240,253,250,0.92))] text-surface-900 dark:border-surface-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_38%),linear-gradient(135deg,rgba(22,26,34,0.98),rgba(31,41,55,0.94))] dark:text-white';

  return (
    <div className="space-y-6">
      <section className={`overflow-hidden rounded-[28px] border px-6 py-6 shadow-xl transition-colors ${heroBg}`}>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ${
              isVoid
                ? 'bg-cyan-500/10 text-cyan-100'
                : isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-white/80 text-emerald-700 dark:bg-white/10 dark:text-emerald-300'
            }`}>
              <CurrencyDollar weight="fill" className="h-3.5 w-3.5" />
              {isVoid ? 'Void finance desk' : isIndia ? 'ParkIndia Revenue Audit' : 'Marble finance desk'}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
                  <CurrencyDollar weight="duotone" className={`h-7 w-7 ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`} />
                  {isIndia ? 'Billing & Settlements' : t('billing.title')}
                </h1>
                <p className={`mt-2 max-w-2xl text-sm leading-6 ${isVoid ? 'text-slate-300' : isIndia ? 'text-[#000080]/70' : 'text-surface-600 dark:text-surface-300'}`}>
                  {isIndia ? 'Breakdown of parking revenue and credit settlements by Indian city hubs and cost centers.' : t('billing.subtitle')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className={`rounded-2xl p-3 transition-colors ${
                    isVoid
                      ? 'bg-white/5 text-white/75 hover:bg-white/10'
                      : isIndia ? 'bg-[#000080]/10 text-[#000080] hover:bg-[#000080]/20' : 'bg-white/80 text-surface-500 hover:bg-white dark:bg-white/10 dark:text-white/75 dark:hover:bg-white/15'
                  }`}
                >
                  <Question weight="bold" className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleExport} 
                  className={`px-4 py-2 rounded-xl font-bold text-white transition flex items-center gap-2 ${
                    isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  <DownloadSimple weight="bold" className="w-4 h-4" /> 
                  {isIndia ? 'Ledger Export' : t('billing.export')}
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <HeroMetric
                label={isIndia ? 'Master Revenue' : t('billing.totalSpending')}
                value={`${isIndia || import.meta.env.VITE_APP_NAME === 'ParkIndia' ? '₹' : 'EUR '}${totalAmount.toLocaleString()}`}
                meta={t('billing.byCostCenter')}
                isVoid={isVoid}
                isIndia={isIndia}
                accent
              />
              <HeroMetric
                label={t('billing.totalBookings')}
                value={String(totalBookings)}
                meta={t('billing.byDepartment')}
                isVoid={isVoid}
                isIndia={isIndia}
              />
              <HeroMetric
                label={t('billing.totalUsers')}
                value={String(totalUsers)}
                meta={tab === 'cost-center' ? t('billing.costCenter') : t('billing.department')}
                isVoid={isVoid}
                isIndia={isIndia}
              />
            </div>
          </div>

          <div className={`rounded-[24px] border p-5 transition-colors ${
            isVoid
              ? 'border-white/10 bg-white/[0.04]'
              : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'border-white/80 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]'
          }`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isVoid ? 'text-white/45' : isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-white/45'}`}>
              Finance pulse
            </p>
            <div className="mt-4 space-y-3">
              <PanelMetric label="Primary view" value={tab === 'cost-center' ? t('billing.byCostCenter') : t('billing.byDepartment')} helper={`${ccData.length} cost centers · ${deptData.length} departments`} isVoid={isVoid} isIndia={isIndia} />
              <PanelMetric label="Average spend" value={`${isIndia || import.meta.env.VITE_APP_NAME === 'ParkIndia' ? '₹' : 'EUR '}${totalUsers > 0 ? (totalAmount / totalUsers).toFixed(2) : '0.00'}`} helper="Per active billing user" isVoid={isVoid} isIndia={isIndia} />
              <PanelMetric label="Export readiness" value={ccData.length + deptData.length > 0 ? 'Ready' : 'Waiting'} helper="CSV and finance handoff" isVoid={isVoid} isIndia={isIndia} />
            </div>
          </div>
        </div>
      </section>

      {/* Help */}
      {showHelp && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={`rounded-xl p-4 border transition-colors ${
          isIndia ? 'bg-[#138808]/5 border-[#138808]/10 text-[#000080]' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
        }`}>
          <p className="text-sm font-medium">
            {isIndia 
              ? 'This module provides localized billing audits for Indian operations. Track parking spending, credit settlements across cities, and generate GST-ready exports for regional finance teams.'
              : t('billing.help')}
          </p>
        </motion.div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label={t('billing.totalSpending')} value={`${isIndia || import.meta.env.VITE_APP_NAME === 'ParkIndia' ? '₹' : 'EUR '}${totalAmount.toLocaleString()}`} icon={<CurrencyDollar weight="bold" className="w-5 h-5 text-emerald-500" />} isIndia={isIndia} isVoid={isVoid} />
        <SummaryCard label={t('billing.totalBookings')} value={totalBookings} icon={<ChartBar weight="bold" className="w-5 h-5 text-blue-500" />} isIndia={isIndia} isVoid={isVoid} />
        <SummaryCard label={t('billing.totalUsers')} value={totalUsers} icon={<Buildings weight="bold" className="w-5 h-5 text-purple-500" />} isIndia={isIndia} isVoid={isVoid} />
      </div>

      {/* Tab switcher */}
      <div className={`flex gap-1 rounded-xl p-1 transition-colors ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-100 dark:bg-surface-800'}`}>
        <button
          onClick={() => setTab('cost-center')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'cost-center' 
              ? (isIndia ? 'bg-white text-[#000080] shadow-sm' : 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm') 
              : 'text-surface-500 dark:text-surface-400'
          }`}
        >
          {t('billing.byCostCenter')}
        </button>
        <button
          onClick={() => setTab('department')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'department' 
              ? (isIndia ? 'bg-white text-[#000080] shadow-sm' : 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm') 
              : 'text-surface-500 dark:text-surface-400'
          }`}
        >
          {t('billing.byDepartment')}
        </button>
      </div>

      {/* Table */}
      <div className={`rounded-[2rem] border overflow-hidden transition-colors ${
        isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
      }`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b transition-colors ${isIndia ? 'border-[#FF9933]/10 bg-[#000080]/5' : 'border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900'}`}>
              <th className={`text-left px-4 py-4 text-xs font-bold uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{tab === 'cost-center' ? t('billing.costCenter') : t('billing.department')}</th>
              {tab === 'cost-center' && <th className={`text-left px-4 py-4 text-xs font-bold uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('billing.department')}</th>}
              <th className={`text-right px-4 py-4 text-xs font-bold uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('billing.users')}</th>
              <th className={`text-right px-4 py-4 text-xs font-bold uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('billing.bookings')}</th>
              <th className={`text-right px-4 py-4 text-xs font-bold uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('billing.credits')}</th>
              <th className={`text-right px-4 py-4 text-xs font-bold uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('billing.amount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {tab === 'cost-center' ? (
              ccData.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-surface-500 font-medium">{t('billing.empty')}</td></tr>
              ) : ccData.map((r, i) => (
                <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className={`px-4 py-4 text-sm font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{r.cost_center || '-'}</td>
                  <td className={`px-4 py-4 text-sm font-medium ${isIndia ? 'text-[#000080]/70' : 'text-surface-600 dark:text-surface-400'}`}>{r.department || '-'}</td>
                  <td className={`px-4 py-4 text-sm text-right font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-600 dark:text-surface-400'}`}>{r.user_count}</td>
                  <td className={`px-4 py-4 text-sm text-right font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-600 dark:text-surface-400'}`}>{r.total_bookings}</td>
                  <td className={`px-4 py-4 text-sm text-right font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-600 dark:text-surface-400'}`}>{r.total_credits_used}</td>
                  <td className={`px-4 py-4 text-sm text-right font-bold ${isIndia ? 'text-[#138808]' : 'text-surface-900 dark:text-white'}`}>{isIndia ? '₹' : r.currency} {r.total_amount.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              deptData.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-surface-500 font-medium">{t('billing.empty')}</td></tr>
              ) : deptData.map((r, i) => (
                <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className={`px-4 py-4 text-sm font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{r.department || '-'}</td>
                  <td className={`px-4 py-4 text-sm text-right font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-600 dark:text-surface-400'}`}>{r.user_count}</td>
                  <td className={`px-4 py-4 text-sm text-right font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-600 dark:text-surface-400'}`}>{r.total_bookings}</td>
                  <td className={`px-4 py-4 text-sm text-right font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-600 dark:text-surface-400'}`}>{r.total_credits_used}</td>
                  <td className={`px-4 py-4 text-sm text-right font-bold ${isIndia ? 'text-[#138808]' : 'text-surface-900 dark:text-white'}`}>{isIndia ? '₹' : r.currency} {r.total_amount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, isIndia, isVoid }) {
  return (
    <div className={`rounded-xl border p-4 transition-colors ${
      isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-xs font-bold uppercase tracking-widest ${isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-surface-400'}`}>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</p>
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

export default AdminBillingPage;
