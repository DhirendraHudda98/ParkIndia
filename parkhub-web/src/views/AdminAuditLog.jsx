import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClockCounterClockwise, DownloadSimple, FunnelSimple, MagnifyingGlass, FileCsv, FileDoc, FileJs, CircleNotch } from '@phosphor-icons/react';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const ACTION_TYPES = [
  'LoginSuccess', 'LoginFailed', 'Logout',
  'BookingCreated', 'BookingCancelled',
  'UserCreated', 'UserDeleted',
  'LotCreated', 'SettingsChanged', 'ConfigChanged',
  'PasswordChanged', 'TwoFactorEnabled',
  'ApiKeyCreated', 'PaymentCompleted',
];

function getActionCategory(eventType) {
  const lower = eventType.toLowerCase();
  if (lower.includes('login') || lower.includes('logout') || lower.includes('password') || lower.includes('twofactor') || lower.includes('apikey') || lower.includes('token')) return 'auth';
  if (lower.includes('created') || lower.includes('added') || lower.includes('enabled')) return 'create';
  if (lower.includes('updated') || lower.includes('changed') || lower.includes('settings') || lower.includes('config')) return 'update';
  if (lower.includes('deleted') || lower.includes('cancelled') || lower.includes('removed') || lower.includes('revoked') || lower.includes('disabled')) return 'delete';
  return 'other';
}

function formatEventType(eventType) {
  return eventType.replace(/([A-Z])/g, ' $1').trim();
}

export function AdminAuditLogPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLog({
        page,
        per_page: 25,
        action: actionFilter || undefined,
        user: userFilter || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      });
      if (res.success && res.data) {
        setEntries(res.data.entries);
        setTotalPages(res.data.total_pages);
        setTotal(res.data.total);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, userFilter, dateFrom, dateTo, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    const url = api.exportAuditLog({
      action: actionFilter || undefined,
      user: userFilter || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    });
    window.open(url, '_blank');
  }

  async function handleEnhancedExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('format', exportFormat);
      if (actionFilter) params.set('action', actionFilter);
      if (userFilter) params.set('user_id', userFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const res = await fetch(`/api/v1/admin/audit-log/export/enhanced?${params}`).then(r => r.json());
      if (res.success && res.data?.download_url) {
        window.open(res.data.download_url, '_blank');
        toast.success(t('auditLog.exportStarted', 'Export started'));
        setShowExportDialog(false);
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setExporting(false);
    }
  }

  function handleFilterApply() {
    setPage(1);
    loadData();
  }

  if (loading && entries.length === 0) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton rounded-lg" />
      <div className="h-12 skeleton rounded-xl" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
      </div>
    </div>
  );

  const categoryColors = {
    create: isIndia ? 'bg-[#138808]/10 text-[#138808]' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    update: isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    auth: isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    other: isIndia ? 'bg-[#000080]/5 text-[#000080]/60' : 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300',
  };

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1 ${
    isVoid 
      ? 'bg-slate-950 border-slate-700 text-white focus:ring-cyan-500' 
      : isIndia 
      ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:ring-[#FF9933] focus:border-[#FF9933]' 
      : 'bg-white dark:bg-surface-950 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white focus:ring-primary-500'
  }`;

  const tableHeaderClass = `px-4 py-3 font-bold text-xs uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClockCounterClockwise weight="duotone" className={`w-6 h-6 ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`} />
          <div>
            <h2 className={`text-xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'System Audit Ledger' : t('auditLog.title')}
            </h2>
            <p className={`text-sm ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              {t('auditLog.totalEntries', '{{count}} entries', { count: total })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
            }`}
          >
            <FileCsv weight="bold" className="w-4 h-4" />
            {t('auditLog.exportCsv')}
          </button>
          <button
            onClick={() => setShowExportDialog(d => !d)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors ${
              isIndia ? 'bg-[#000080] hover:bg-[#000060]' : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            <DownloadSimple weight="bold" className="w-4 h-4" />
            {isIndia ? 'Master Export' : t('auditLog.advancedExport')}
          </button>
        </div>
      </div>

      {/* Enhanced Export Dialog */}
      {showExportDialog && (
        <div className={`rounded-3xl border p-5 space-y-4 transition-colors ${
          isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
        }`}>
          <h3 className={`font-bold flex items-center gap-2 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            <DownloadSimple className={`w-5 h-5 ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`} />
            {t('auditLog.advancedExport')}
          </h3>
          <p className={`text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
            {t('auditLog.exportHelp')}
          </p>
          <div className="flex gap-3">
            {['csv', 'json', 'pdf'].map(fmt => (
              <button
                key={fmt}
                onClick={() => setExportFormat(fmt)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border font-bold transition-all ${
                  exportFormat === fmt
                    ? isIndia ? 'bg-[#FF9933]/10 border-[#FF9933] text-[#FF9933]' : 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                    : isIndia ? 'bg-[#000080]/5 border-transparent text-[#000080]/40' : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400'
                }`}
              >
                {fmt === 'csv' && <FileCsv className="w-5 h-5" />}
                {fmt === 'json' && <FileJs className="w-5 h-5" />}
                {fmt === 'pdf' && <FileDoc className="w-5 h-5" />}
                <span className="uppercase">{fmt}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleEnhancedExport}
              disabled={exporting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 ${
                isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {exporting ? <CircleNotch className="w-4 h-4 animate-spin" /> : <DownloadSimple className="w-4 h-4" />}
              {exporting ? t('auditLog.exporting') : t('auditLog.download')}
            </button>
            <button
              onClick={() => setShowExportDialog(false)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`p-4 rounded-2xl space-y-3 border transition-colors ${
        isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
      }`}>
        <div className={`flex items-center gap-2 text-sm font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-600 dark:text-surface-300'}`}>
          <FunnelSimple weight="bold" className={`w-4 h-4 ${isIndia ? 'text-[#FF9933]' : ''}`} />
          {t('auditLog.filters')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            className={inputClass}
          >
            <option value="">{t('auditLog.allActions')}</option>
            {ACTION_TYPES.map(a => (
              <option key={a} value={a}>{formatEventType(a)}</option>
            ))}
          </select>

          <div className="relative">
            <MagnifyingGlass className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isIndia ? 'text-[#000080]/30' : 'text-surface-400'}`} />
            <input
              type="text"
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFilterApply()}
              placeholder={isIndia ? 'Search Indian Hub Users...' : t('auditLog.searchUser')}
              className={inputClass + ' pl-9'}
            />
          </div>

          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className={inputClass}
          />

          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className={inputClass}
          />
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden transition-colors ${
        isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b text-left ${isIndia ? 'border-[#FF9933]/10 bg-[#000080]/5' : 'border-surface-200 dark:border-surface-700'}`}>
                <th className={tableHeaderClass}>{t('auditLog.colTime')}</th>
                <th className={tableHeaderClass}>{t('auditLog.colAction')}</th>
                <th className={tableHeaderClass}>{t('auditLog.colUser')}</th>
                <th className={tableHeaderClass}>{t('auditLog.colTarget')}</th>
                <th className={tableHeaderClass}>{t('auditLog.colIp')}</th>
                <th className={tableHeaderClass}>{t('auditLog.colDetails')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-surface-400 font-medium">
                    {t('auditLog.empty')}
                  </td>
                </tr>
              ) : entries.map(entry => {
                const cat = getActionCategory(entry.event_type);
                return (
                  <tr key={entry.id} className={`border-b transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/50 ${isIndia ? 'border-[#FF9933]/5' : 'border-surface-100 dark:border-surface-800'}`}>
                    <td className={`px-4 py-4 whitespace-nowrap font-medium ${isIndia ? 'text-[#000080]/70' : 'text-surface-600 dark:text-surface-300'}`}>
                      {new Date(entry.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${categoryColors[cat]}`}>
                        {formatEventType(entry.event_type)}
                      </span>
                    </td>
                    <td className={`px-4 py-4 font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-200'}`}>
                      {entry.username || '-'}
                    </td>
                    <td className={`px-4 py-4 ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>
                      {entry.target_type ? `${entry.target_type}${entry.target_id ? `:${entry.target_id}` : ''}` : '-'}
                    </td>
                    <td className={`px-4 py-4 font-mono text-xs ${isIndia ? 'text-[#000080]/30' : 'text-surface-500'}`}>
                      {entry.ip_address || '-'}
                    </td>
                    <td className={`px-4 py-4 max-w-xs truncate font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`} title={entry.details || ''}>
                      {entry.details || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>
            {t('auditLog.pageInfo', 'Page {{page}} of {{total}}', { page, total: totalPages })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30 ${
                isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200'
              }`}
            >
              {t('common.back')}
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30 ${
                isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200'
              }`}
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default AdminAuditLogPage;
