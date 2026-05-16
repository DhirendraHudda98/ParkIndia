import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash, PaperPlaneTilt, Question, Pencil, ToggleLeft, ToggleRight } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const reportTypeLabels = {
  occupancy_summary: 'Occupancy Summary',
  revenue_report: 'Revenue Report',
  user_activity: 'User Activity',
  booking_trends: 'Booking Trends',
};

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const frequencyCron = {
  daily: '0 8 * * *',
  weekly: '0 8 * * MON',
  monthly: '0 8 1 * *',
};

export function AdminScheduledReportsPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('occupancy_summary');
  const [formFrequency, setFormFrequency] = useState('daily');
  const [formRecipients, setFormRecipients] = useState('');

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/reports/schedules').then(r => r.json());
      if (res.success) {
        setSchedules(res.data.schedules);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  const resetForm = () => {
    setFormName('');
    setFormType('occupancy_summary');
    setFormFrequency('daily');
    setFormRecipients('');
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error(t('scheduledReports.nameRequired'));
      return;
    }
    const recipients = formRecipients.split(',').map(e => e.trim()).filter(Boolean);
    if (recipients.length === 0) {
      toast.error(t('scheduledReports.recipientsRequired'));
      return;
    }
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/v1/admin/reports/schedules/${editId}` : '/api/v1/admin/reports/schedules';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, report_type: formType, frequency: formFrequency, recipients }),
      }).then(r => r.json());
      if (res.success) {
        toast.success(editId ? t('scheduledReports.updated') : t('scheduledReports.created'));
        resetForm();
        loadSchedules();
      }
    } catch { toast.error(t('common.error')); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/v1/admin/reports/schedules/${id}`, { method: 'DELETE' });
      toast.success(t('scheduledReports.deleted'));
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch { toast.error(t('common.error')); }
  };

  const handleSendNow = async (id) => {
    try {
      const res = await fetch(`/api/v1/admin/reports/schedules/${id}/send-now`, { method: 'POST' }).then(r => r.json());
      if (res.success) toast.success(t('scheduledReports.sentNow'));
    } catch { toast.error(t('common.error')); }
  };

  const startEdit = (schedule) => {
    setEditId(schedule.id);
    setFormName(schedule.name);
    setFormType(schedule.report_type);
    setFormFrequency(schedule.frequency);
    setFormRecipients(schedule.recipients.join(', '));
    setShowForm(true);
  };

  return (
    <div className="space-y-8 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 dark:bg-primary-950/30 text-primary-500'}`}>
            <Clock weight="bold" className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Automated Briefings' : t('scheduledReports.title')}
            </h2>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              {isIndia ? 'Configure periodic analytics delivery for regional stakeholders.' : t('scheduledReports.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowHelp(!showHelp)} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/30 hover:bg-[#000080]/5' : 'text-surface-400 hover:bg-surface-100'}`}>
            <Question weight="bold" size={24} />
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-all shadow-lg ${isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00] shadow-[#FF9933]/20' : 'bg-primary-500 hover:bg-primary-600'}`}>
            <Plus size={16} weight="bold" />
            {isIndia ? 'Schedule Briefing' : t('scheduledReports.create')}
          </button>
        </div>
      </div>

      {/* Help */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`rounded-2xl p-5 border overflow-hidden ${isIndia ? 'bg-[#000080]/5 border-[#000080]/10 text-[#000080]' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700'}`}>
            <p className="text-sm font-medium leading-relaxed italic">
              {isIndia ? 'Automated briefings ensure your operations team stays informed without manual exports. Reports are generated at 08:00 IST based on your selected frequency (Daily, Weekly, or Monthly) and dispatched to the provided list of stakeholders.' : t('scheduledReports.help')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`rounded-[2.5rem] border p-8 space-y-8 ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-2xl shadow-[#000080]/10' : 'bg-white dark:bg-surface-800 border-surface-200'}`}>
            <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>
              {editId ? (isIndia ? 'Update Delivery Routine' : t('scheduledReports.editSchedule')) : (isIndia ? 'Configure New Routine' : t('scheduledReports.newSchedule'))}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormGroup label={t('scheduledReports.name')} isIndia={isIndia}>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="input-field w-full" placeholder="e.g. Daily Occupancy Digest" />
              </FormGroup>
              <FormGroup label={t('scheduledReports.reportType')} isIndia={isIndia}>
                <select value={formType} onChange={e => setFormType(e.target.value)} className="input-field w-full">
                  {Object.entries(reportTypeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup label={t('scheduledReports.frequency')} isIndia={isIndia}>
                <select value={formFrequency} onChange={e => setFormFrequency(e.target.value)} className="input-field w-full">
                  {Object.entries(frequencyLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup label={t('scheduledReports.recipients')} isIndia={isIndia}>
                <input type="text" value={formRecipients} onChange={e => setFormRecipients(e.target.value)} placeholder="stakeholder@parkindia.in, manager@hub.in" className="input-field w-full" />
              </FormGroup>
            </div>

            <div className="flex gap-3 pt-6">
              <button onClick={handleSave} className={`px-10 py-4 rounded-2xl font-black text-white transition-all shadow-xl ${isIndia ? 'bg-[#000080] hover:bg-[#000060]' : 'bg-primary-500 hover:bg-primary-600'}`}>
                {t('scheduledReports.save')}
              </button>
              <button onClick={resetForm} className={`px-10 py-4 rounded-2xl font-bold transition-all ${isIndia ? 'text-[#000080]/50 hover:bg-[#000080]/5' : 'bg-surface-100 text-surface-600'}`}>
                {t('common.cancel')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="text-center py-24 font-black uppercase tracking-widest animate-pulse opacity-20">{t('common.loading')}</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-24 text-surface-400 italic">{t('scheduledReports.empty')}</div>
      ) : (
        <div className="grid gap-6">
          {schedules.map(schedule => (
            <motion.div key={schedule.id} layout className={`rounded-[2rem] border p-8 group transition-all ${isVoid ? 'bg-slate-900 border-slate-800 shadow-xl' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm hover:shadow-xl hover:shadow-[#000080]/5' : 'bg-white border-surface-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>{schedule.name}</h3>
                    {schedule.enabled ? (
                      <ToggleRight size={32} weight="fill" className={isIndia ? 'text-[#138808]' : 'text-green-500'} />
                    ) : (
                      <ToggleLeft size={32} className="text-surface-300 opacity-40" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl ${isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-blue-50 text-blue-600'}`}>
                      {reportTypeLabels[schedule.report_type]}
                    </span>
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-purple-50 text-purple-600'}`}>
                      {frequencyLabels[schedule.frequency]}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest opacity-30 ml-2">
                      <Clock size={14} weight="bold" />
                      {frequencyCron[schedule.frequency]}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('scheduledReports.recipientsLabel')}</p>
                    <p className={`text-sm font-bold ${isIndia ? 'text-[#000080]' : ''}`}>{schedule.recipients.join(', ')}</p>
                  </div>
                  {schedule.last_sent_at && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mt-4 opacity-50">
                      {t('scheduledReports.lastSent')}: {new Date(schedule.last_sent_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleSendNow(schedule.id)} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/40 hover:bg-[#000080]/5 hover:text-[#000080]' : 'text-primary-500 hover:bg-primary-50'}`}>
                    <PaperPlaneTilt size={20} weight="bold" />
                  </button>
                  <button onClick={() => startEdit(schedule)} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/40 hover:bg-[#000080]/5 hover:text-[#000080]' : 'text-surface-500 hover:bg-surface-100'}`}>
                    <Pencil size={20} weight="bold" />
                  </button>
                  <button onClick={() => handleDelete(schedule.id)} className={`p-3 rounded-2xl transition-all text-red-300 hover:bg-red-50 hover:text-red-600`}>
                    <Trash size={20} weight="bold" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormGroup({ label, children, isIndia }) {
  return (
    <div>
      <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isIndia ? 'text-[#000080]/40' : 'text-surface-700'}`}>{label}</label>
      {children}
    </div>
  );
}

export default AdminScheduledReportsPage;
