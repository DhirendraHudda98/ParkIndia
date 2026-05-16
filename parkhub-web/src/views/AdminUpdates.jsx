import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowsClockwise, CheckCircle, Warning, CloudArrowDown, Info,
  Clock, Spinner, ArrowRight,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getInMemoryToken } from '../api/client';
import { useTheme } from '../context/ThemeContext';

function authHeaders() {
  const token = getInMemoryToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatusBadge({ status, isIndia }) {
  const styles = {
    success: isIndia ? 'bg-[#138808]/10 text-[#138808]' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    in_progress: isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || styles.failed}`}>
      {status === 'success' ? 'Success' : status === 'failed' ? 'Failed' : 'In Progress'}
    </span>
  );
}

export function AdminUpdatesPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [versionInfo, setVersionInfo] = useState(null);
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [channel, setChannel] = useState('stable');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateStep, setUpdateStep] = useState('idle');

  const fetchVersion = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/system/version', {
        headers: authHeaders(),
        credentials: 'include',
      }).then(r => r.json());
      const data = res?.data ?? res;
      if (data?.version) setVersionInfo(data);
    } catch { /* ignore */ }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/updates/history', {
        headers: authHeaders(),
        credentials: 'include',
      }).then(r => r.json());
      if (res.success || res.data) setHistory(res.data || []);
    } catch { /* ignore */ }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/settings', {
        headers: authHeaders(),
        credentials: 'include',
      }).then(r => r.json());
      if (res.data) {
        setAutoUpdate(res.data.auto_update ?? false);
        setChannel(res.data.update_channel ?? 'stable');
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchVersion(), fetchHistory(), fetchSettings()])
      .finally(() => setLoading(false));
  }, [fetchVersion, fetchHistory, fetchSettings]);

  async function handleCheckUpdate() {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch(`/api/v1/admin/updates/check?channel=${channel}`, {
        headers: authHeaders(),
        credentials: 'include',
      }).then(r => r.json());
      if (res.success || res.data) {
        setCheckResult(res.data);
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setChecking(false);
  }

  async function handleApplyUpdate() {
    setUpdateStep('downloading');
    try {
      const res = await fetch('/api/v1/admin/updates/apply', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ version: checkResult?.latest_version }),
      });

      setUpdateStep('installing');
      const json = await res.json();

      if (json.success || json.data) {
        setUpdateStep('restarting');
        setTimeout(() => {
          setUpdateStep('done');
          toast.success(t('updates.applySuccess'));
          fetchVersion();
          fetchHistory();
        }, 2000);
      } else {
        setUpdateStep('error');
        toast.error(json.error?.message || t('updates.applyFailed'));
      }
    } catch {
      setUpdateStep('error');
      toast.error(t('updates.applyFailed'));
    }
  }

  async function handleToggleAutoUpdate() {
    const newValue = !autoUpdate;
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ auto_update: newValue }),
      }).then(r => r.json());
      if (res.success) {
        setAutoUpdate(newValue);
        toast.success(newValue ? t('updates.autoEnabled') : t('updates.autoDisabled'));
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  }

  async function handleChannelChange(newChannel) {
    setChannel(newChannel);
    try {
      await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ update_channel: newChannel }),
      });
    } catch { /* ignore */ }
  }

  const isUpdating = updateStep !== 'idle' && updateStep !== 'done' && updateStep !== 'error';

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 skeleton rounded-[2rem]" />)}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 p-2">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-primary-50 text-primary-500'}`}>
          <ArrowsClockwise weight="bold" className="w-7 h-7" />
        </div>
        <div>
          <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {isIndia ? 'Platform Patch Registry' : t('updates.title')}
          </h2>
          <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
            {isIndia ? 'Monitor and apply regional OTA updates for the ParkIndia network.' : t('updates.subtitle')}
          </p>
        </div>
      </div>

      {/* Current Version Card */}
      <div className={`rounded-[2.5rem] border p-8 transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-2xl shadow-[#000080]/10' : 'bg-white border-surface-200'}`}>
        <div className="flex items-center justify-between mb-8">
          <h3 className={`text-sm font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/40' : 'text-surface-700'}`}>
            {t('updates.currentVersion')}
          </h3>
          <Info weight="fill" className={`w-5 h-5 ${isIndia ? 'text-[#FF9933]' : 'text-surface-400'}`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">{t('updates.version')}</p>
            <p className={`text-4xl font-black tracking-tighter ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {versionInfo?.version || '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">{t('updates.buildInfo')}</p>
            <p className={`text-sm font-mono font-bold ${isIndia ? 'text-[#000080]/70' : 'text-surface-600 dark:text-surface-300'}`}>
              {versionInfo?.build_hash?.slice(0, 12) || '—'}
              {versionInfo?.build_date ? <span className="block opacity-40 font-sans mt-1">{new Date(versionInfo.build_date).toLocaleDateString()}</span> : ''}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">{t('updates.uptime')}</p>
            <p className={`text-xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {versionInfo?.uptime_seconds != null ? formatUptime(versionInfo.uptime_seconds) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Check for Updates */}
      <div className={`rounded-[2.5rem] border p-8 space-y-6 ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-white border-surface-200 shadow-sm'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/40' : 'text-surface-700'}`}>
            {t('updates.checkTitle')}
          </h3>
          <button
            onClick={handleCheckUpdate}
            disabled={checking || isUpdating}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isIndia ? 'bg-[#FF9933] text-white shadow-xl shadow-[#FF9933]/20' : 'bg-primary-600 text-white'}`}
          >
            {checking ? <Spinner weight="bold" className="w-4 h-4 animate-spin" /> : <ArrowsClockwise weight="bold" className="w-4 h-4" />}
            {t('updates.checkButton')}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {checkResult && !checkResult.available && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex items-center gap-4 p-6 rounded-[2rem] ${isIndia ? 'bg-[#138808]/5 border border-[#138808]/10' : 'bg-emerald-50'}`}>
              <CheckCircle weight="fill" className="w-8 h-8 text-[#138808]" />
              <div>
                <p className={`text-lg font-black ${isIndia ? 'text-[#000080]' : 'text-emerald-800'}`}>{t('updates.upToDate')}</p>
                <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-emerald-600'}`}>{t('updates.running', { version: checkResult.current_version })}</p>
              </div>
            </motion.div>
          )}

          {checkResult?.available && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-8 rounded-[2rem] space-y-6 ${isIndia ? 'bg-[#FF9933]/5 border border-[#FF9933]/10' : 'bg-emerald-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CloudArrowDown weight="fill" className={`w-8 h-8 ${isIndia ? 'text-[#FF9933]' : 'text-emerald-600'}`} />
                  <span className={`text-xl font-black ${isIndia ? 'text-[#000080]' : 'text-emerald-800'}`}>{t('updates.newVersion')}</span>
                </div>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl font-mono font-black text-sm ${isIndia ? 'bg-white' : 'bg-emerald-100'}`}>
                  <span className="opacity-40">{checkResult.current_version}</span>
                  <ArrowRight weight="bold" className="w-4 h-4" />
                  <span className={isIndia ? 'text-[#FF9933]' : 'text-emerald-700'}>{checkResult.latest_version}</span>
                </div>
              </div>

              {checkResult.release_notes && (
                <div className={`rounded-2xl p-6 ${isIndia ? 'bg-white' : 'bg-white/60'}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">{t('updates.releaseNotes')}</p>
                  <p className={`text-sm leading-relaxed ${isIndia ? 'text-[#000080]/70' : ''}`}>{checkResult.release_notes}</p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={handleApplyUpdate}
                  disabled={isUpdating}
                  className={`px-8 py-4 rounded-2xl font-black text-white transition-all shadow-xl ${isIndia ? 'bg-[#138808] shadow-[#138808]/20' : 'bg-primary-600'}`}
                >
                  {t('updates.applyButton')}
                </button>
                {checkResult.release_url && (
                  <a href={checkResult.release_url} target="_blank" rel="noopener noreferrer" className={`text-xs font-black uppercase tracking-widest ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`}>
                    {t('updates.viewRelease')}
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isUpdating && (
          <div className="p-8 rounded-[2rem] bg-surface-50 space-y-6">
            <div className="flex items-center gap-4">
              <Spinner weight="bold" className={`w-8 h-8 animate-spin ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`} />
              <p className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>
                {updateStep === 'downloading' && t('updates.stepDownloading')}
                {updateStep === 'installing' && t('updates.stepInstalling')}
                {updateStep === 'restarting' && t('updates.stepRestarting')}
              </p>
            </div>
            <div className="flex gap-2">
              {['downloading', 'installing', 'restarting'].map((step, i) => {
                const currentIdx = ['downloading', 'installing', 'restarting'].indexOf(updateStep);
                return (
                  <div key={step} className={`h-2 flex-1 rounded-full transition-all ${i <= currentIdx ? (isIndia ? 'bg-[#FF9933]' : 'bg-primary-500') : 'bg-surface-200'}`} />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className={`rounded-[2.5rem] border p-8 flex items-center justify-between ${isIndia ? 'bg-white border-[#FF9933]/20' : 'bg-white border-surface-200'}`}>
          <div className="flex-1 mr-8">
            <h3 className={`text-lg font-black ${isIndia ? 'text-[#000080]' : ''}`}>{t('updates.autoUpdateLabel')}</h3>
            <p className={`text-xs font-medium mt-1 ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('updates.autoUpdateDesc')}</p>
          </div>
          <button onClick={handleToggleAutoUpdate} className="relative flex-shrink-0">
            <div className={`w-14 h-8 rounded-full transition-all ${autoUpdate ? (isIndia ? 'bg-[#138808]' : 'bg-primary-500') : 'bg-surface-200'}`}>
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-xl transition-all ${autoUpdate ? 'translate-x-[22px]' : 'translate-x-1'}`} />
            </div>
          </button>
        </div>

        <div className={`rounded-[2.5rem] border p-8 ${isIndia ? 'bg-white border-[#FF9933]/20' : 'bg-white border-surface-200'}`}>
          <h3 className={`text-lg font-black mb-6 ${isIndia ? 'text-[#000080]' : ''}`}>{t('updates.channelTitle')}</h3>
          <div className="flex gap-4">
            {['stable', 'beta'].map(ch => (
              <button
                key={ch}
                onClick={() => handleChannelChange(ch)}
                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  channel === ch
                    ? (isIndia ? 'bg-[#000080] text-white shadow-xl shadow-[#000080]/20' : 'bg-primary-600 text-white')
                    : 'bg-surface-50 text-surface-400 hover:bg-surface-100'
                }`}
              >
                {ch === 'stable' ? t('updates.channelStable') : t('updates.channelBeta')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className={`rounded-[2.5rem] border overflow-hidden ${isIndia ? 'bg-white border-[#FF9933]/20' : 'bg-white border-surface-200'}`}>
        <div className="px-8 py-6 border-b border-surface-50">
          <h3 className={`text-sm font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/40' : 'text-surface-700'}`}>{t('updates.historyTitle')}</h3>
        </div>
        <div className="divide-y divide-surface-50">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-surface-400">{t('updates.noHistory')}</p>
            </div>
          ) : (
            history.map(entry => (
              <div key={entry.id} className="px-8 py-6 flex items-center justify-between hover:bg-surface-50 transition-colors">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-black ${isIndia ? 'text-[#000080]' : ''}`}>{entry.from_version}</span>
                    <ArrowRight weight="bold" className="text-surface-300 w-4 h-4" />
                    <span className={`text-lg font-black ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`}>{entry.to_version}</span>
                  </div>
                  <p className="text-xs font-medium text-surface-400 mt-1">{new Date(entry.applied_at).toLocaleString()}</p>
                </div>
                <StatusBadge status={entry.status} isIndia={isIndia} />
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default AdminUpdatesPage;
