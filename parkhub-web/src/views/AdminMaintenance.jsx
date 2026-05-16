import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Plus, Trash, PencilSimple, Question, CalendarBlank, Warning } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const emptyForm = {
  lot_id: '',
  start_time: '',
  end_time: '',
  reason: '',
  all_slots: true,
  slot_ids: '',
};

export function AdminMaintenancePage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [windows, setWindows] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mainRes, lotsRes, activeRes] = await Promise.all([
        fetch('/api/v1/admin/maintenance').then(r => r.json()),
        fetch('/api/v1/lots').then(r => r.json()),
        fetch('/api/v1/maintenance/active').then(r => r.json()),
      ]);
      if (mainRes.success) setWindows(mainRes.data || []);
      if (lotsRes.success) setLots(lotsRes.data || []);
      if (activeRes.success) setActiveCount((activeRes.data || []).length);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreate() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(w) {
    setForm({
      lot_id: w.lot_id,
      start_time: w.start_time.slice(0, 16),
      end_time: w.end_time.slice(0, 16),
      reason: w.reason,
      all_slots: w.affected_slots.type === 'all',
      slot_ids: w.affected_slots.type === 'specific' ? w.affected_slots.slot_ids.join(', ') : '',
    });
    setEditId(w.id);
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.lot_id || !form.start_time || !form.end_time || !form.reason.trim()) {
      toast.error(t('maintenance.requiredFields'));
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        lot_id: form.lot_id,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        reason: form.reason,
      };
      if (!form.all_slots && form.slot_ids.trim()) {
        body.affected_slots = form.slot_ids.split(',').map(s => s.trim()).filter(Boolean);
      }

      const url = editId ? `/api/v1/admin/maintenance/${editId}` : '/api/v1/admin/maintenance';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json());

      if (res.success) {
        toast.success(editId ? t('maintenance.updated') : t('maintenance.created'));
        setShowForm(false);
        loadData();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch { toast.error(t('common.error')); }
    setSubmitting(false);
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/v1/admin/maintenance/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        toast.success(t('maintenance.deleted'));
        loadData();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch { toast.error(t('common.error')); }
  }

  const now = new Date().toISOString();

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
            <Wrench weight="bold" className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Hub Maintenance Audit' : t('maintenance.title')}
            </h2>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500 dark:text-surface-400'}`}>
              {isIndia ? 'Schedule and monitor localized maintenance across Indian parking sites.' : t('maintenance.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHelp(!showHelp)} className={`p-2 rounded-xl transition-colors ${isIndia ? 'text-[#000080]/30 hover:bg-[#000080]/5' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
            <Question weight="bold" className="w-5 h-5" />
          </button>
          <button 
            onClick={openCreate} 
            className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg ${isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00] shadow-[#FF9933]/20' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'}`}
          >
            <Plus weight="bold" className="w-4 h-4" /> {isIndia ? 'Schedule Window' : t('maintenance.create')}
          </button>
        </div>
      </div>

      {/* Help */}
      {showHelp && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-4 border transition-colors ${isIndia ? 'bg-[#FF9933]/5 border-[#FF9933]/10 text-[#000080]' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'}`}>
          <p className="text-sm font-medium leading-relaxed">
            {isIndia 
              ? 'Schedule maintenance windows for Indian hubs. Affected slots will be blocked from public booking in the ParkIndia app. Existing reservations will be flagged for localized customer support.'
              : t('maintenance.help')}
          </p>
        </motion.div>
      )}

      {/* Active banner */}
      {activeCount > 0 && (
        <div className={`rounded-2xl px-5 py-4 flex items-center gap-3 border transition-colors ${isIndia ? 'bg-[#FF9933]/10 border-[#FF9933]/20' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
          <Warning weight="fill" className="w-6 h-6 text-[#FF9933]" />
          <p className={`text-sm font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]' : 'text-amber-800 dark:text-amber-300'}`}>
            {t('maintenance.activeBanner', '{{count}} maintenance window(s) currently active', { count: activeCount })}
          </p>
        </div>
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={`rounded-[2rem] border p-8 space-y-6 overflow-hidden ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-xl shadow-[#000080]/5' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'}`}>
            <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {editId ? (isIndia ? 'Update Schedule' : t('maintenance.editTitle')) : (isIndia ? 'Log New Schedule' : t('maintenance.createTitle'))}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormGroup label={isIndia ? 'Target Hub' : t('maintenance.lot')} isIndia={isIndia} isVoid={isVoid}>
                <select className="input-field w-full font-bold text-sm" value={form.lot_id} onChange={e => setForm({ ...form, lot_id: e.target.value })}>
                  <option value="">{t('maintenance.selectLot')}</option>
                  {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </FormGroup>
              <FormGroup label={t('maintenance.reason')} isIndia={isIndia} isVoid={isVoid}>
                <input className="input-field w-full font-bold text-sm" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
              </FormGroup>
              <FormGroup label={t('maintenance.start')} isIndia={isIndia} isVoid={isVoid}>
                <input type="datetime-local" className="input-field w-full font-bold text-sm" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
              </FormGroup>
              <FormGroup label={t('maintenance.end')} isIndia={isIndia} isVoid={isVoid}>
                <input type="datetime-local" className="input-field w-full font-bold text-sm" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
              </FormGroup>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${form.all_slots ? (isIndia ? 'bg-[#138808] border-[#138808]' : 'bg-primary-600 border-primary-600') : 'border-surface-300 group-hover:border-primary-400'}`}>
                  {form.all_slots && <Plus weight="bold" className="text-white w-4 h-4" />}
                </div>
                <input type="checkbox" className="hidden" checked={form.all_slots} onChange={e => setForm({ ...form, all_slots: e.target.checked })} />
                <span className={`text-sm font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`}>{isIndia ? 'Apply to full site' : t('maintenance.allSlots')}</span>
              </label>
            </div>
            {!form.all_slots && (
              <FormGroup label={isIndia ? 'Specific Slot ID Registry (comma-separated)' : t('maintenance.specificSlots')} isIndia={isIndia} isVoid={isVoid}>
                <input className="input-field w-full font-bold text-sm" value={form.slot_ids} onChange={e => setForm({ ...form, slot_ids: e.target.value })} placeholder="MH-BOM-01, MH-BOM-02" />
              </FormGroup>
            )}
            <div className="flex gap-3 pt-4">
              <button 
                onClick={handleSubmit} disabled={submitting} 
                className={`px-8 py-3 rounded-xl font-black text-white transition-all shadow-lg ${isIndia ? 'bg-[#000080] hover:bg-[#000060] shadow-[#000080]/20' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'}`}
              >
                {editId ? t('common.save') : t('maintenance.create')}
              </button>
              <button onClick={() => setShowForm(false)} className={`px-8 py-3 rounded-xl font-bold transition-all ${isIndia ? 'text-[#000080]/50 hover:bg-[#000080]/5' : 'bg-surface-100 text-surface-600'}`}>
                {t('common.cancel')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar / list view */}
      <div className={`rounded-[2rem] border overflow-hidden transition-colors ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'}`}>
        <div className="divide-y divide-surface-100 dark:divide-surface-800">
          {windows.length === 0 ? (
            <div className="p-16 text-center">
              <CalendarBlank weight="thin" className={`w-16 h-16 mx-auto mb-4 ${isIndia ? 'text-[#000080]/10' : 'text-surface-300 dark:text-surface-600'}`} />
              <p className={`text-sm font-bold ${isIndia ? 'text-[#000080]/30' : 'text-surface-500 dark:text-surface-400'}`}>{isIndia ? 'No scheduled maintenance for Indian hubs.' : t('maintenance.empty')}</p>
            </div>
          ) : (
            windows.map(w => {
              const isActive = w.start_time <= now && w.end_time > now;
              const isPast = w.end_time <= now;
              return (
                <div key={w.id} className={`px-6 py-5 flex items-center justify-between group transition-all hover:bg-surface-50/50 ${isPast ? 'opacity-40 grayscale' : ''}`}>
                  <div className="flex items-center gap-5 min-w-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm ${isActive ? 'bg-[#FF9933] animate-pulse' : isPast ? 'bg-surface-300' : 'bg-[#000080]'}`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-black truncate ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                        {w.lot_name || w.lot_id} <span className={`mx-2 font-normal opacity-30`}>|</span> {w.reason}
                      </p>
                      <p className={`text-[11px] font-bold mt-1 uppercase tracking-widest ${isIndia ? 'text-[#000080]/50' : 'text-surface-500 dark:text-surface-400'}`}>
                        {new Date(w.start_time).toLocaleString('en-IN')} — {new Date(w.end_time).toLocaleString('en-IN')}
                        <span className={`ml-3 px-2 py-0.5 rounded-md ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-100'}`}>
                          {w.affected_slots.type === 'all' ? (isIndia ? 'FULL HUB' : t('maintenance.allSlots')) : `${(w.affected_slots).slot_ids?.length || 0} SLOTS`}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(w)} className={`p-2.5 rounded-xl transition-all ${isIndia ? 'text-[#000080]/40 hover:bg-[#000080]/5 hover:text-[#000080]' : 'text-surface-400 hover:text-primary-600'}`}>
                      <PencilSimple weight="bold" className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(w.id)} className={`p-2.5 rounded-xl transition-all ${isIndia ? 'text-[#000080]/40 hover:bg-red-50 hover:text-red-600' : 'text-surface-400 hover:text-red-600'}`}>
                      <Trash weight="bold" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function FormGroup({ label, children, isIndia, isVoid }) {
  return (
    <div>
      <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isIndia ? 'text-[#000080]/60' : 'text-surface-700 dark:text-surface-300'}`}>{label}</label>
      {children}
    </div>
  );
}

export default AdminMaintenancePage;
