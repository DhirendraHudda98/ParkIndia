import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, PencilSimple, Trash, SpinnerGap, Check, X,
  MagnifyingGlass, CurrencyInr, TrendUp, Clock,
  SquaresFour, Wheelchair, Lightning, Star,
} from '@phosphor-icons/react';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useTheme } from '../context/ThemeContext';
import { SlotManagementDrawer } from './SlotManagementDrawer';

const emptyForm = {
  name: '',
  address: '',
  total_slots: 10,
  hourly_rate: '',
  daily_max: '',
  monthly_pass: '',
  currency: 'INR',
  status: 'open',
};

export function AdminLotsPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmState, setConfirmState] = useState({open: false, action: () => {}});
  const [selectedLotForSlots, setSelectedLotForSlots] = useState(null);
  const [dynamicPricing, setDynamicPricing] = useState({
    enabled: false, base_price: 20, surge_multiplier: 1.5,
    discount_multiplier: 0.8, surge_threshold: 80, discount_threshold: 20,
  });
  
  const defaultDayHours = { open: '07:00', close: '22:00', closed: false };
  const [opHours, setOpHours] = useState({
    is_24h: true,
    monday: { ...defaultDayHours }, tuesday: { ...defaultDayHours },
    wednesday: { ...defaultDayHours }, thursday: { ...defaultDayHours },
    friday: { ...defaultDayHours },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: true },
  });

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const statusConfig = useMemo(() => ({
    open:        { label: t('admin.statusOpen'),        color: isIndia ? 'text-[#000080]' : 'text-green-600 dark:text-green-400',  bg: isIndia ? 'bg-[#000080]/10' : 'bg-green-100 dark:bg-green-900/30' },
    closed:      { label: t('admin.statusClosed'),      color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-100 dark:bg-red-900/30' },
    full:        { label: t('admin.statusFull'),        color: isIndia ? 'text-[#FF9933]' : 'text-orange-600 dark:text-orange-400', bg: isIndia ? 'bg-[#FF9933]/10' : 'bg-orange-100 dark:bg-orange-900/30' },
    maintenance: { label: t('admin.statusMaintenance'), color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-900/30' },
  }), [t, isIndia]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLots();
      if (res.success && res.data) {
        setLots(res.data);
      } else {
        setError(res.error?.message || t('admin.errorLots', 'Failed to load parking lots.'));
      }
    } catch (err) {
      setError(err?.message || t('admin.errorLots', 'Failed to load parking lots.'));
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => lots.filter(lot =>
    lot.name.toLowerCase().includes(search.toLowerCase()) ||
    (lot.address || '').toLowerCase().includes(search.toLowerCase())
  ), [lots, search]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  async function openEdit(lot) {
    setEditingId(lot.id);
    setForm({
      name: lot.name,
      address: lot.address || '',
      total_slots: lot.total_slots,
      hourly_rate: lot.hourly_rate != null ? String(lot.hourly_rate) : '',
      daily_max: lot.daily_max != null ? String(lot.daily_max) : '',
      monthly_pass: lot.monthly_pass != null ? String(lot.monthly_pass) : '',
      currency: lot.currency || (isIndia ? 'INR' : 'EUR'),
      status: lot.status || 'open',
    });
    setShowForm(true);
    const [dpRes, ohRes] = await Promise.all([
      api.getAdminDynamicPricing(lot.id),
      api.getLotHours(lot.id),
    ]);
    if (dpRes.success && dpRes.data) {
      setDynamicPricing(dpRes.data);
    } else {
      setDynamicPricing({
        enabled: false, base_price: isIndia ? 20 : 2.50, surge_multiplier: 1.5,
        discount_multiplier: 0.8, surge_threshold: 80, discount_threshold: 20,
      });
    }
    if (ohRes.success && ohRes.data) {
      setOpHours(ohRes.data);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function formatPrice(value, currency) {
    if (value == null) return '-';
    return new Intl.NumberFormat(isIndia ? 'en-IN' : 'en-US', { 
      style: 'currency', 
      currency: currency || (isIndia ? 'INR' : 'EUR'),
      maximumFractionDigits: 0
    }).format(value);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error(t('admin.lotNameRequired'));
      return;
    }
    if (form.total_slots < 1) {
      toast.error(t('admin.lotSlotsMin'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        total_slots: form.total_slots,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : undefined,
        daily_max: form.daily_max ? Number(form.daily_max) : undefined,
        monthly_pass: form.monthly_pass ? Number(form.monthly_pass) : undefined,
        currency: form.currency,
        status: form.status,
      };

      const res = editingId
        ? await api.updateLot(editingId, payload)
        : await api.createLot(payload);

      if (res.success) {
        if (editingId) {
          const [dpRes, ohRes] = await Promise.all([
            api.updateAdminDynamicPricing(editingId, dynamicPricing),
            api.updateAdminLotHours(editingId, opHours),
          ]);
          if (!dpRes.success) toast.error(t('admin.dynamicPricingSaveFailed'));
          if (!ohRes.success) toast.error(t('admin.operatingHoursSaveFailed'));
        }
        toast.success(editingId ? t('admin.lotUpdated') : t('admin.lotCreated'));
        closeForm();
        await load();
      } else {
        toast.error(res.error?.message || t('admin.lotSaveFailed'));
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id) {
    setConfirmState({
      open: true,
      action: async () => {
        setConfirmState({open: false, action: () => {}});
        setDeletingId(id);
        try {
          const res = await api.deleteLot(id);
          if (res.success) {
            setLots(prev => prev.filter(l => l.id !== id));
            toast.success(t('admin.lotDeleted'));
            if (editingId === id) closeForm();
          } else {
            toast.error(res.error?.message || t('admin.lotDeleteFailed'));
          }
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label={t('common.loading')}>
        <SpinnerGap weight="bold" className={`w-8 h-8 animate-spin ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`} aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-[2rem] border p-8 text-center transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/15 shadow-sm shadow-[#FF9933]/5' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'}`}>
        <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-red-50 dark:bg-red-950/20 text-red-500'}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className={`text-lg font-black mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
          {isIndia ? 'Parking Lot Hub Offline' : t('admin.errorTitle', 'Error Occurred')}
        </h3>
        <p className={`text-sm max-w-md mx-auto mb-6 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
          {error}
        </p>
        <button
          onClick={load}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all ${isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00] text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
        >
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm transition-colors ${
    isVoid 
      ? 'bg-slate-950 border-slate-700 text-white' 
      : isIndia 
      ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933]' 
      : 'bg-white dark:bg-surface-950 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white'
  }`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className={`text-xl font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {t('admin.lots')}
          </h2>
          <span className={`text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
            ({lots.length})
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <MagnifyingGlass weight="bold" className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isIndia ? 'text-[#000080]/40' : 'text-surface-400'}`} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('admin.searchLots')}
              className={inputClass + ' pl-9 w-full sm:w-56'}
            />
          </div>
          <button
            onClick={openCreate}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition ${
              isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            <Plus weight="bold" className="w-4 h-4" />
            {t('admin.newLot')}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-6 space-y-5 rounded-2xl border ${
              isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-lg' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                  {editingId ? t('admin.editLot') : t('admin.newLot')}
                </h3>
                <button onClick={closeForm} className={`p-1.5 rounded-lg transition-colors ${isIndia ? 'text-[#FF9933] hover:bg-[#FF9933]/10' : 'hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
                  <X weight="bold" className="w-5 h-5 text-surface-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`}>{t('admin.lotName')} *</label>
                  <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`}>{t('admin.lotAddress')}</label>
                  <input type="text" value={form.address} onChange={e => updateField('address', e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`}>{t('admin.totalSlots')} *</label>
                  <input type="number" value={form.total_slots} onChange={e => updateField('total_slots', Math.max(1, Number(e.target.value)))} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`}>{t('admin.status')}</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(statusConfig).map(s => {
                      const cfg = statusConfig[s];
                      const isSelected = form.status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateField('status', s)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                            isSelected
                              ? `${cfg.bg} ${cfg.color} border-current`
                              : isVoid ? 'border-slate-700 text-slate-500 hover:border-slate-600' : 'border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`}>{t('admin.currency')}</label>
                  <select value={form.currency} onChange={e => updateField('currency', e.target.value)} className={inputClass}>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { id: 'hourly-rate', label: t('admin.hourlyRate'), field: 'hourly_rate' },
                  { id: 'daily-max', label: t('admin.dailyMax'), field: 'daily_max' },
                  { id: 'monthly-pass', label: t('admin.monthlyPass'), field: 'monthly_pass' },
                ].map(p => (
                  <div key={p.id}>
                    <label htmlFor={p.id} className={`block text-sm font-medium mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`}>{p.label}</label>
                    <div className="relative">
                      <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isIndia ? 'text-[#000080]/40' : 'text-surface-400'}`}>
                        {form.currency === 'INR' ? '₹' : form.currency === 'USD' ? '$' : (import.meta.env.VITE_CURRENCY_SYMBOL || '€')}
                      </div>
                      <input
                        id={p.id}
                        type="number"
                        min={0}
                        step="0.01"
                        value={form[p.field]}
                        onChange={e => updateField(p.field, e.target.value)}
                        className={inputClass + ' pl-9'}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {editingId && (
                <div className={`border-t pt-5 space-y-4 ${isVoid ? 'border-slate-800' : 'border-surface-200 dark:border-surface-700'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-sm font-semibold flex items-center gap-2 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                        <TrendUp weight="bold" className={`w-4 h-4 ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`} />
                        {t('admin.dynamicPricing')}
                      </h4>
                      <p className={`text-xs mt-0.5 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>{t('admin.dynamicPricingDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={dynamicPricing.enabled} onChange={e => setDynamicPricing(prev => ({ ...prev, enabled: e.target.checked }))} className="sr-only peer" />
                      <div className={`w-10 h-5 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5 ${
                        isIndia ? 'bg-[#000080]/20 peer-checked:bg-[#FF9933]' : 'bg-surface-300 dark:bg-surface-600 peer-checked:bg-primary-600'
                      }`} />
                    </label>
                  </div>
                  {dynamicPricing.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {['base_price', 'surge_multiplier', 'discount_multiplier', 'surge_threshold', 'discount_threshold'].map(df => (
                        <div key={df}>
                          <label className={`block text-xs font-medium mb-1 ${isIndia ? 'text-[#000080]' : 'text-surface-700'}`}>{t(`admin.${df}`)}</label>
                          <input type="number" value={dynamicPricing[df]} onChange={e => setDynamicPricing(prev => ({ ...prev, [df]: Number(e.target.value) }))} className={inputClass} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white transition ${
                    isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {saving ? <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" /> : <Check weight="bold" className="w-4 h-4" />}
                  {editingId ? t('common.save') : t('admin.create')}
                </button>
                <button
                  onClick={closeForm}
                  className={`px-6 py-2 rounded-xl text-sm font-semibold transition ${
                    isIndia ? 'bg-[#000080]/10 text-[#000080] hover:bg-[#000080]/20' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200'
                  }`}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`rounded-2xl border overflow-hidden ${
        isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isVoid ? 'border-slate-800' : 'border-surface-200 dark:border-surface-700'}`}>
                <th className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>{t('admin.lots')}</th>
                <th className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>{t('admin.totalSlots')}</th>
                <th className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>{t('admin.status')}</th>
                <th className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>{t('admin.pricing')}</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isVoid ? 'divide-slate-800' : 'divide-surface-100 dark:divide-surface-800'}`}>
              {filtered.map((lot, i) => (
                <motion.tr key={lot.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`transition-colors ${isVoid ? 'hover:bg-slate-950' : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'}`}>
                  <td className="px-5 py-4">
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{lot.name}</p>
                      {lot.address && <p className={`text-xs truncate ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>{lot.address}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{lot.available_slots}</span>
                      <span className={`text-xs ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>/ {lot.total_slots}</span>
                    </div>
                    <div className={`w-20 h-1.5 rounded-full mt-1.5 overflow-hidden ${isVoid ? 'bg-slate-800' : 'bg-surface-200 dark:bg-surface-700'}`}>
                      <div className={`h-full rounded-full transition-all ${isIndia ? 'bg-[#FF9933]' : 'bg-primary-500'}`}
                        style={{ width: `${lot.total_slots > 0 ? Math.round((lot.available_slots / lot.total_slots) * 100) : 0}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {(() => {
                      const cfg = statusConfig[lot.status] || statusConfig.open;
                      return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>;
                    })()}
                  </td>
                  <td className="px-5 py-4">
                    <div className={`space-y-0.5 text-xs ${isIndia ? 'text-[#000080]/70' : 'text-surface-600 dark:text-surface-400'}`}>
                      <p>{t('admin.hourlyRate')}: {formatPrice(lot.hourly_rate, lot.currency)}</p>
                      <p>{t('admin.dailyMax')}: {formatPrice(lot.daily_max, lot.currency)}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedLotForSlots(lot)}
                        title={t('admin.slotsTitle')}
                        className={`p-2 rounded-lg transition-colors ${isIndia ? 'text-[#000080]/40 hover:text-[#FF9933]' : 'text-surface-400 hover:text-primary-600'}`}
                      >
                        <SquaresFour weight="bold" className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(lot)} className={`p-2 rounded-lg transition-colors ${isIndia ? 'text-[#000080]/40 hover:text-[#FF9933]' : 'text-surface-400 hover:text-primary-600'}`}>
                        <PencilSimple weight="bold" className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(lot.id)} disabled={deletingId === lot.id} className={`p-2 rounded-lg transition-colors ${isIndia ? 'text-[#000080]/40 hover:text-red-600' : 'text-surface-400 hover:text-red-600 disabled:opacity-50'}`}>
                        {deletingId === lot.id ? <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" /> : <Trash weight="bold" className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog open={confirmState.open} title={t('common.delete')} message={t('admin.lotDeleteConfirm')} variant="danger" onConfirm={confirmState.action} onCancel={() => setConfirmState({open: false, action: () => {}})} />

      <AnimatePresence>
        {selectedLotForSlots && (
          <SlotManagementDrawer
            lot={selectedLotForSlots}
            onClose={() => {
              setSelectedLotForSlots(null);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
