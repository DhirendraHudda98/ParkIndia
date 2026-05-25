import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Plus, PencilSimple, Trash, SpinnerGap, Check, X,
  Info, Warning, WarningCircle, CheckCircle, Clock, CalendarBlank, Flag
} from '@phosphor-icons/react';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useTheme } from '../context/ThemeContext';

const emptyForm = {
  title: '',
  message: '',
  severity: 'info',
  active: true,
  starts_at: '',
  priority: 'medium',
  expires_at: '',
};

function SeverityBadge({ severity, t, isIndia }) {
  const severityIcons = {
    info:    { color: isIndia ? 'text-[#000080]' : 'text-blue-600 dark:text-blue-400',   bg: isIndia ? 'bg-[#000080]/10' : 'bg-blue-100 dark:bg-blue-900/30',   icon: Info },
    warning: { color: isIndia ? 'text-[#FF9933]' : 'text-amber-600 dark:text-amber-400', bg: isIndia ? 'bg-[#FF9933]/10' : 'bg-amber-100 dark:bg-amber-900/30', icon: Warning },
    error:   { color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-100 dark:bg-red-900/30',     icon: WarningCircle },
    success: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
  };

  const severityLabelKeys = {
    info: 'admin.severityInfo',
    warning: 'admin.severityWarning',
    error: 'admin.severityError',
    success: 'admin.severitySuccess',
  };

  const cfg = severityIcons[severity] || severityIcons.info;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon weight="fill" className="w-3.5 h-3.5" />
      {t(severityLabelKeys[severity])}
    </span>
  );
}

function PriorityBadge({ priority, t, isIndia }) {
  const priorityStyles = {
    high:   { color: 'text-red-700 dark:text-red-400',     bg: 'bg-red-100 dark:bg-red-950/30' },
    medium: { color: isIndia ? 'text-[#FF9933]' : 'text-orange-700 dark:text-orange-400', bg: isIndia ? 'bg-[#FF9933]/10' : 'bg-orange-100 dark:bg-orange-950/30' },
    low:    { color: isIndia ? 'text-[#000080]' : 'text-blue-700 dark:text-blue-400', bg: isIndia ? 'bg-[#000080]/10' : 'bg-blue-100 dark:bg-blue-950/30' },
  };

  const priorityLabelKeys = {
    high: 'admin.priorityHigh',
    medium: 'admin.priorityMedium',
    low: 'admin.priorityLow',
  };

  const cfg = priorityStyles[priority] || priorityStyles.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Flag weight="fill" className="w-3 h-3" />
      {t(priorityLabelKeys[priority] || `admin.priority_${priority}`)}
    </span>
  );
}

function StatusBadge({ active, startsAt, expiresAt, t, isIndia }) {
  const now = new Date();
  const isExpired = expiresAt && new Date(expiresAt) < now;
  const isNotStarted = startsAt && new Date(startsAt) > now;

  if (!active) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400`}>
        <Clock weight="fill" className="w-3.5 h-3.5" />
        {t('admin.inactive')}
      </span>
    );
  }
  if (isExpired) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400`}>
        <Clock weight="fill" className="w-3.5 h-3.5" />
        {t('admin.expired')}
      </span>
    );
  }
  if (isNotStarted) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400`}>
        <CalendarBlank weight="fill" className="w-3.5 h-3.5" />
        {t('admin.scheduled')}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
      isIndia ? 'bg-[#138808]/10 text-[#138808]' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    }`}>
      <CheckCircle weight="fill" className="w-3.5 h-3.5" />
      {t('admin.active')}
    </span>
  );
}

export function AdminAnnouncementsPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmState, setConfirmState] = useState({open: false, action: () => {}});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminListAnnouncements();
      if (res.success && res.data) {
        setAnnouncements(res.data);
      } else {
        setError(res.error?.message || t('admin.errorAnnouncements', 'Failed to load announcements.'));
      }
    } catch (err) {
      setError(err?.message || t('admin.errorAnnouncements', 'Failed to load announcements.'));
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(a) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      message: a.message,
      severity: a.severity,
      active: a.active,
      starts_at: a.starts_at ? a.starts_at.slice(0, 16) : '',
      priority: a.priority || 'medium',
      expires_at: a.expires_at ? a.expires_at.slice(0, 16) : '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function handleSave() {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error(t('admin.announcementTitleRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        severity: form.severity,
        active: form.active,
        starts_at: form.starts_at || null,
        priority: form.priority,
        expires_at: form.expires_at || null,
      };
      const res = editingId
        ? await api.adminUpdateAnnouncement(editingId, payload)
        : await api.adminCreateAnnouncement(payload);
      if (res.success) {
        toast.success(editingId ? t('admin.announcementUpdated') : t('admin.announcementCreated'));
        closeForm();
        await load();
      } else {
        toast.error(res.error?.message || t('admin.announcementSaveFailed'));
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
          const res = await api.adminDeleteAnnouncement(id);
          if (res.success) {
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            toast.success(t('admin.announcementDeleted'));
            if (editingId === id) closeForm();
          } else {
            toast.error(res.error?.message || t('admin.announcementDeleteFailed'));
          }
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerGap weight="bold" className={`w-8 h-8 animate-spin ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`} />
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
          {isIndia ? 'Announcements Desk Offline' : t('admin.errorTitle', 'Error Occurred')}
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

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1 ${
    isVoid 
      ? 'bg-slate-950 border-slate-700 text-white focus:ring-cyan-500' 
      : isIndia 
      ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:ring-[#FF9933] focus:border-[#FF9933]' 
      : 'bg-white dark:bg-surface-950 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white focus:ring-primary-500'
  }`;

  const labelClass = `block text-sm font-semibold mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`;

  const severityIcons = {
    info:    { color: isIndia ? 'text-[#000080]' : 'text-blue-600 dark:text-blue-400',   bg: isIndia ? 'bg-[#000080]/5' : 'bg-blue-100 dark:bg-blue-900/30',   icon: Info },
    warning: { color: isIndia ? 'text-[#FF9933]' : 'text-amber-600 dark:text-amber-400', bg: isIndia ? 'bg-[#FF9933]/5' : 'bg-amber-100 dark:bg-amber-900/30', icon: Warning },
    error:   { color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-100 dark:bg-red-900/30',     icon: WarningCircle },
    success: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
  };

  const severityLabelKeys = {
    info: 'admin.severityInfo',
    warning: 'admin.severityWarning',
    error: 'admin.severityError',
    success: 'admin.severitySuccess',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Megaphone weight="fill" className={`w-6 h-6 ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`} />
          <h2 className={`text-xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {isIndia ? 'Regional Broadcasts' : t('admin.announcements')}
          </h2>
        </div>
        <button 
          onClick={openCreate} 
          className={`px-4 py-2 rounded-xl font-bold text-white transition flex items-center gap-2 ${
            isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          <Plus weight="bold" className="w-4 h-4" />
          {t('admin.newAnnouncement')}
        </button>
      </div>

      {/* Form (Create / Edit) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`rounded-3xl border p-6 space-y-5 transition-colors ${
              isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                  {editingId ? t('admin.editAnnouncement') : t('admin.newAnnouncement')}
                </h3>
                <button onClick={closeForm} aria-label={t('common.close')} className={`p-1.5 rounded-lg transition-colors ${isIndia ? 'text-[#000080]/30 hover:bg-[#000080]/5' : 'hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
                  <X weight="bold" className="w-5 h-5 text-surface-400" />
                </button>
              </div>

              {/* Title */}
              <div>
                <label className={labelClass}>{t('admin.announcementTitle')}</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className={inputClass}
                  placeholder={isIndia ? 'e.g., Jalandhar Lot Maintenance' : t('admin.announcementTitle')}
                />
              </div>

              {/* Message */}
              <div>
                <label className={labelClass}>{t('admin.announcementMessage')}</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                  className={inputClass + ' h-28 resize-y'}
                  placeholder={t('admin.announcementMessage')}
                />
              </div>

              {/* Grid Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {/* Severity */}
                <div>
                  <label className={labelClass}>{t('admin.severity')}</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(severityIcons).map(sev => {
                      const cfg = severityIcons[sev];
                      const Icon = cfg.icon;
                      const isSelected = form.severity === sev;
                      return (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, severity: sev }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all ${
                            isSelected
                              ? `${cfg.bg} ${cfg.color} border-current`
                              : isIndia 
                                ? 'border-[#000080]/5 text-[#000080]/30 hover:border-[#000080]/10' 
                                : 'border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                          }`}
                        >
                          <Icon weight={isSelected ? 'fill' : 'regular'} className="w-4 h-4" />
                          {t(severityLabelKeys[sev])}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className={labelClass}>{t('admin.priority', 'Priority')}</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="high">{t('admin.priorityHigh', 'High')}</option>
                    <option value="medium">{t('admin.priorityMedium', 'Medium')}</option>
                    <option value="low">{t('admin.priorityLow', 'Low')}</option>
                  </select>
                </div>

                {/* Active toggle */}
                <div>
                  <label className={labelClass}>{t('admin.status')}</label>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                      form.active
                        ? isIndia 
                          ? 'bg-[#138808]/10 text-[#138808] border-[#138808]/20' 
                          : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700'
                        : isIndia 
                          ? 'bg-[#000080]/5 text-[#000080]/30 border-transparent' 
                          : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 border-surface-200 dark:border-surface-700'
                    }`}
                  >
                    {form.active ? (
                      <><CheckCircle weight="fill" className="w-4 h-4" />{t('admin.active')}</>
                    ) : (
                      <><Clock weight="fill" className="w-4 h-4" />{t('admin.inactive')}</>
                    )}
                  </button>
                </div>

                {/* Starts at */}
                <div>
                  <label className={labelClass}>{t('admin.startsAt', 'Starts At (Schedule)')}</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={e => setForm(prev => ({ ...prev, starts_at: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                {/* Expires at */}
                <div>
                  <label className={labelClass}>{t('admin.expiresAt')}</label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={e => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className={`px-6 py-2.5 rounded-xl font-bold text-white transition flex items-center gap-2 btn-primary ${
                    isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {saving
                    ? <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" />
                    : <Check weight="bold" className="w-4 h-4" />}
                  {editingId ? t('common.save') : t('admin.create')}
                </button>
                <button onClick={closeForm} className={`px-6 py-2.5 rounded-xl font-bold transition-colors ${
                  isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                }`}>
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements List */}
      {announcements.length === 0 && !showForm ? (
        <div className="p-12 text-center">
          <Megaphone weight="light" className={`w-16 h-16 mx-auto mb-4 ${isIndia ? 'text-[#000080]/10' : 'text-surface-200 dark:text-surface-700'}`} />
          <p className={`${isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-surface-400'}`}>{t('admin.noAnnouncements')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a, i) => (
            <motion.div
              key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`rounded-2xl border p-5 transition-all hover:shadow-md ${
                isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className={`text-base font-bold truncate ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                      {a.title}
                    </h3>
                    <SeverityBadge severity={a.severity} t={t} isIndia={isIndia} />
                    <PriorityBadge priority={a.priority || 'medium'} t={t} isIndia={isIndia} />
                    <StatusBadge active={a.active} startsAt={a.starts_at} expiresAt={a.expires_at} t={t} isIndia={isIndia} />
                  </div>
                  <p className={`text-sm line-clamp-2 mb-2 ${isIndia ? 'text-[#000080]/70' : 'text-surface-600 dark:text-surface-400'}`}>
                    {a.message}
                  </p>
                  <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-surface-400'}`}>
                    <span>{t('admin.announcementCreatedAt')} {new Date(a.created_at).toLocaleDateString()}</span>
                    {a.starts_at && <span>{t('admin.announcementStartsAt', 'Starts:')} {new Date(a.starts_at).toLocaleString()}</span>}
                    {a.expires_at && <span>{t('admin.announcementExpiresAt')} {new Date(a.expires_at).toLocaleString()}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEdit(a)}
                    aria-label={t('common.edit')}
                    className={`p-2 rounded-lg transition-colors ${isIndia ? 'text-[#000080]/30 hover:bg-[#000080]/5 hover:text-[#000080]' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-primary-600'}`}
                  >
                    <PencilSimple weight="bold" className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    aria-label={t('common.delete')}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-surface-400 hover:text-red-600 disabled:opacity-50"
                  >
                    {deletingId === a.id
                      ? <SpinnerGap weight="bold" className="w-4.5 h-4.5 animate-spin" />
                      : <Trash weight="bold" className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={confirmState.open}
        title={t('common.delete')}
        message={t('admin.announcementDeleteConfirm')}
        variant="danger"
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState({open: false, action: () => {}})}
      />
    </motion.div>
  );
}

export default AdminAnnouncementsPage;
