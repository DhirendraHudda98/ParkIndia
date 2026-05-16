import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzlePiece, ToggleLeft, ToggleRight, Gear, Question, Lightning } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export function AdminPluginsPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [plugins, setPlugins] = useState([]);
  const [total, setTotal] = useState(0);
  const [enabled, setEnabled] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [configDialog, setConfigDialog] = useState(null);
  const [configValues, setConfigValues] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);

  const loadPlugins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/plugins').then(r => r.json());
      if (res.success) {
        const data = res.data;
        setPlugins(data.plugins);
        setTotal(data.total);
        setEnabled(data.enabled);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadPlugins(); }, [loadPlugins]);

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`/api/v1/admin/plugins/${id}/toggle`, { method: 'PUT' }).then(r => r.json());
      if (res.success) {
        toast.success(t('plugins.toggled'));
        loadPlugins();
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const openConfig = async (id) => {
    try {
      const res = await fetch(`/api/v1/admin/plugins/${id}/config`).then(r => r.json());
      if (res.success) {
        setConfigValues(res.data);
        setConfigDialog(id);
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const saveConfig = async () => {
    if (!configDialog) return;
    setSavingConfig(true);
    try {
      const res = await fetch(`/api/v1/admin/plugins/${configDialog}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configValues }),
      }).then(r => r.json());
      if (res.success) {
        toast.success(t('plugins.configSaved'));
        setConfigDialog(null);
        loadPlugins();
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSavingConfig(false);
    }
  };

  const eventColors = {
    booking_created: 'bg-[#138808]/10 text-[#138808]',
    booking_cancelled: 'bg-red-100 text-red-700',
    user_registered: 'bg-[#000080]/10 text-[#000080]',
    lot_full: 'bg-[#FF9933]/10 text-[#FF9933]',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-4 ${isIndia ? 'border-[#FF9933]' : 'border-primary-500'}`} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-primary-50 dark:bg-primary-950/30 text-primary-500'}`}>
            <PuzzlePiece weight="bold" className="w-7 h-7" />
          </div>
          <div>
            <h1 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Integrations & Add-ons' : t('plugins.title')}
            </h1>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500 dark:text-surface-400'}`}>
              {isIndia ? 'Configure localized third-party services and Indian payment gateways.' : t('plugins.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/30 hover:bg-[#000080]/5' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'}`}
        >
          <Question weight="bold" size={24} />
        </button>
      </div>

      {/* Help tooltip */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`rounded-2xl p-5 border overflow-hidden ${isIndia ? 'bg-[#000080]/5 border-[#000080]/10 text-[#000080]' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'}`}
          >
            <p className="text-sm font-medium leading-relaxed italic">
              {isIndia ? 'Third-party extensions allow ParkIndia to hook into national registries, UPI payment providers, and local SMS gateways. Use these controls to toggle features at the system level.' : t('plugins.help')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatItem icon={<PuzzlePiece size={22} />} label={t('plugins.totalPlugins')} value={total} isIndia={isIndia} isVoid={isVoid} color="text-[#000080]" />
        <StatItem icon={<Lightning size={22} weight="fill" />} label={t('plugins.enabledPlugins')} value={enabled} isIndia={isIndia} isVoid={isVoid} color="text-[#138808]" />
        <StatItem icon={<Gear size={22} />} label={t('plugins.disabledPlugins')} value={total - enabled} isIndia={isIndia} isVoid={isVoid} color="text-[#FF9933]" />
      </div>

      {/* Plugin grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plugins.map(plugin => (
          <motion.div
            key={plugin.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className={`rounded-[2rem] p-6 border transition-all ${isVoid ? 'bg-slate-900 border-slate-800 shadow-xl shadow-cyan-500/5' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-xl shadow-[#000080]/5' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 shadow-sm'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-lg font-black truncate ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                    {plugin.name}
                  </h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest opacity-30`}>V{plugin.version}</span>
                </div>
                <p className={`text-xs font-medium leading-relaxed ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
                  {plugin.description}
                </p>
              </div>
              <button
                onClick={() => handleToggle(plugin.id)}
                className={`ml-4 transition-transform hover:scale-110 active:scale-95`}
              >
                {plugin.status === 'enabled' ? (
                  <ToggleRight size={42} weight="fill" className={isIndia ? 'text-[#138808]' : 'text-green-500'} />
                ) : (
                  <ToggleLeft size={42} className="text-surface-300 dark:text-surface-600 opacity-40" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {plugin.subscribed_events.map(event => (
                <span key={event} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${eventColors[event] || 'bg-surface-100 text-surface-600'}`}>
                  {event.replace(/_/g, ' ')}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-surface-100 dark:border-surface-800">
              <button
                onClick={() => openConfig(plugin.id)}
                className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-xl transition-all ${isIndia ? 'bg-[#000080] text-white hover:bg-[#000060]' : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200'}`}
              >
                {t('plugins.configure')}
              </button>
              {plugin.routes.length > 0 && (
                <span className={`text-[10px] font-black uppercase tracking-widest opacity-40`}>
                  {plugin.routes.length} ROUTES ACTIVE
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {plugins.length === 0 && (
        <div className="text-center py-24">
          <PuzzlePiece weight="thin" size={64} className="mx-auto text-surface-200 mb-4" />
          <p className="text-sm font-bold text-surface-400 italic uppercase tracking-widest">{t('plugins.empty')}</p>
        </div>
      )}

      {/* Config dialog */}
      <AnimatePresence>
        {configDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000080]/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl ${isVoid ? 'bg-slate-900' : 'bg-white'}`}
            >
              <h2 className={`text-2xl font-black mb-6 ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>
                {isIndia ? 'Integration Parameters' : t('plugins.configTitle')}
              </h2>
              <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(configValues).map(([key, value]) => (
                  <div key={key}>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isIndia ? 'text-[#000080]/50' : 'text-surface-700'}`}>
                      {key.replace(/_/g, ' ')}
                    </label>
                    {typeof value === 'boolean' ? (
                      <button onClick={() => setConfigValues({ ...configValues, [key]: !value })}>
                        {value ? (
                          <ToggleRight size={36} weight="fill" className={isIndia ? 'text-[#138808]' : 'text-green-500'} />
                        ) : (
                          <ToggleLeft size={36} className="text-surface-300" />
                        )}
                      </button>
                    ) : (
                      <input
                        type="text" value={String(value)}
                        onChange={(e) => setConfigValues({ ...configValues, [key]: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border font-bold text-sm outline-none transition-all ${isIndia ? 'bg-[#000080]/5 border-[#000080]/10 text-[#000080] focus:ring-1 focus:ring-[#FF9933]' : 'bg-surface-50 border-surface-200'}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={saveConfig} disabled={savingConfig}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-white transition-all shadow-lg ${isIndia ? 'bg-[#000080] hover:bg-[#000060] shadow-[#000080]/20' : 'bg-primary-500 hover:bg-primary-600'}`}
                >
                  {savingConfig ? t('common.saving') : t('common.save')}
                </button>
                <button onClick={() => setConfigDialog(null)} className={`px-8 py-3.5 rounded-2xl font-bold transition-all ${isIndia ? 'text-[#000080]/50 hover:bg-[#000080]/5' : 'bg-surface-100 text-surface-600'}`}>
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatItem({ icon, label, value, isIndia, isVoid, color }) {
  return (
    <div className={`rounded-2xl border p-5 transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-50'}`}>
          <div className={color}>{icon}</div>
        </div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>{label}</p>
      </div>
      <p className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

export default AdminPluginsPage;
