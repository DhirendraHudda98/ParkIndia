import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Question, FileText, Table, Warning, CheckCircle, XCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export function AdminCompliancePage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/compliance/report');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to load compliance report');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const downloadPdf = () => {
    window.open('/api/v1/admin/compliance/report/pdf', '_blank');
  };

  const downloadDataMap = async () => {
    try {
      const res = await fetch('/api/v1/admin/compliance/data-map').then(r => r.json());
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'parkindia-data-map.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('common.error'));
    }
  };

  const downloadAudit = (format) => {
    window.open(`/api/v1/admin/compliance/audit-export?format=${format}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isIndia ? 'border-[#FF9933]' : 'border-primary-500'}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center bg-white dark:bg-surface-800 rounded-[2.5rem] border border-red-200 dark:border-red-900/30 shadow-xl shadow-[#000080]/5 space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
          <XCircle weight="bold" size={36} />
        </div>
        <div className="max-w-md">
          <h2 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {isIndia ? 'Governance Data Loading Failed' : 'Failed to Load Compliance Data'}
          </h2>
          <p className={`text-sm font-medium mt-2 leading-relaxed ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
            {error.includes('403') || error.includes('404')
              ? 'This governance module is either disabled or unauthorized in your environment. Please ensure MODULE_COMPLIANCE=true is configured in the environment settings.'
              : error}
          </p>
        </div>
        <button
          onClick={loadReport}
          className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-lg ${isIndia ? 'bg-[#000080] hover:bg-[#000060] shadow-[#000080]/20' : 'bg-primary-600 shadow-primary-500/20'}`}
        >
          {t('common.retry') || 'Retry Connection'}
        </button>
      </div>
    );
  }

  if (!report) return null;

  const compliantCount = report.checks.filter(c => c.status === 'compliant').length;
  const warningCount = report.checks.filter(c => c.status === 'warning').length;
  const nonCompliantCount = report.checks.filter(c => c.status === 'non_compliant').length;

  const statusConfig = {
    compliant: { color: isIndia ? 'bg-[#138808]/10 text-[#138808]' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Compliant' },
    warning: { color: isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Warning, label: 'Warning' },
    non_compliant: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Non-Compliant' },
  };

  const overallConfig = statusConfig[report.overall_status] || statusConfig.warning;
  const OverallIcon = overallConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {isIndia ? 'Governance & DPDP Compliance' : t('compliance.title')}
          </h1>
          <p className={`text-sm mt-1 font-medium ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
            {isIndia ? 'Ensuring data privacy and operational standards for ParkIndia services.' : t('compliance.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`p-2 rounded-lg transition-colors ${isIndia ? 'text-[#000080]/30 hover:bg-[#000080]/5' : 'hover:bg-surface-100 dark:hover:bg-surface-700'}`}
        >
          <Question size={20} weight="bold" />
        </button>
      </div>

      {/* Help tooltip */}
      {showHelp && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 border transition-colors ${
            isIndia ? 'bg-[#000080]/5 border-[#000080]/10 text-[#000080]' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
          }`}
        >
          <p className="text-sm">
            {isIndia 
              ? 'This module monitors system compliance with the Digital Personal Data Protection (DPDP) Act, 2023. It tracks data localization, user consent flows, and security measures across all Indian parking hubs.'
              : t('compliance.help')}
          </p>
        </motion.div>
      )}

      {/* Overall Status + Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className={`rounded-2xl p-5 shadow-sm border transition-colors flex items-center gap-3 ${overallConfig.color}`}>
          <OverallIcon size={24} weight="fill" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">{t('compliance.overallStatus')}</p>
            <p className="text-lg font-black">{overallConfig.label}</p>
          </div>
        </div>
        <StatCard label={t('compliance.passed')} value={compliantCount} icon={<CheckCircle size={20} weight="bold" className="text-[#138808]" />} isIndia={isIndia} isVoid={isVoid} />
        <StatCard label={t('compliance.warnings')} value={warningCount} icon={<Warning size={20} weight="bold" className="text-[#FF9933]" />} isIndia={isIndia} isVoid={isVoid} />
        <StatCard label={t('compliance.failures')} value={nonCompliantCount} icon={<XCircle size={20} weight="bold" className="text-red-500" />} isIndia={isIndia} isVoid={isVoid} />
      </div>

      {/* Download Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={downloadPdf}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white transition-colors ${
            isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-500 hover:bg-primary-600'
          }`}
        >
          <FileText size={18} weight="bold" />
          {t('compliance.downloadPdf')}
        </button>
        <ActionBtn onClick={downloadDataMap} icon={<Table size={18} weight="bold" />} label={t('compliance.downloadDataMap')} isIndia={isIndia} />
        <ActionBtn onClick={() => downloadAudit('json')} icon={<Download size={18} weight="bold" />} label={t('compliance.auditJson')} isIndia={isIndia} />
        <ActionBtn onClick={() => downloadAudit('csv')} icon={<Download size={18} weight="bold" />} label={t('compliance.auditCsv')} isIndia={isIndia} />
      </div>

      {/* Compliance Checks */}
      <div className="space-y-4">
        <h2 className={`text-lg font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
          {t('compliance.checksTitle')}
        </h2>
        <div className="grid gap-3">
          {report.checks.map((check, i) => {
            const config = statusConfig[check.status] || statusConfig.warning;
            const StatusIcon = config.icon;
            return (
              <motion.div
                key={check.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md ${
                  isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <StatusIcon size={24} weight="fill" className={check.status === 'compliant' ? 'text-[#138808]' : check.status === 'warning' ? 'text-[#FF9933]' : 'text-red-500'} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className={`font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{check.name}</h3>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${config.color}`}>
                        {check.category}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 font-medium ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>{check.details}</p>
                    {check.recommendation && (
                      <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 border ${isIndia ? 'bg-[#FF9933]/5 border-[#FF9933]/10' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}>
                        <Warning size={16} weight="bold" className="text-[#FF9933] mt-0.5" />
                        <p className={`text-xs font-bold ${isIndia ? 'text-[#000080]' : 'text-amber-800 dark:text-amber-300'}`}>
                          {t('compliance.recommendation')}: <span className="font-medium">{check.recommendation}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, isIndia, isVoid }) {
  return (
    <div className={`rounded-2xl border p-5 transition-colors ${
      isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-xs font-bold uppercase tracking-widest ${isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-surface-400'}`}>{label}</span>
      </div>
      <p className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

function ActionBtn({ onClick, icon, label, isIndia }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
        isIndia 
          ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10 hover:shadow-sm' 
          : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default AdminCompliancePage;
