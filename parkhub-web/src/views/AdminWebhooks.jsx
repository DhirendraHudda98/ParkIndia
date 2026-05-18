import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WebhooksLogo, Plus, Trash, Pencil, Question, PaperPlaneTilt, ListChecks, X } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const EVENTS = [
  'booking.created',
  'booking.cancelled',
  'user.registered',
  'lot.full',
  'payment.completed',
];

export function AdminWebhooksPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formUrl, setFormUrl] = useState('');
  const [formEvents, setFormEvents] = useState([]);
  const [formDesc, setFormDesc] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [showDeliveries, setShowDeliveries] = useState(null);
  const [error, setError] = useState(null);

  const loadWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/webhooks-v2');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        setWebhooks(data.data || []);
      } else {
        throw new Error(data.error?.message || 'Failed to load webhooks');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  function resetForm() {
    setFormUrl('');
    setFormEvents([]);
    setFormDesc('');
    setEditId(null);
    setShowForm(false);
  }

  function toggleEvent(ev) {
    setFormEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  }

  async function handleSave() {
    if (!formUrl.trim() || formEvents.length === 0) {
      toast.error(t('webhooksV2.requiredFields'));
      return;
    }

    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/v1/admin/webhooks-v2/${editId}` : '/api/v1/admin/webhooks-v2';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formUrl.trim(),
          events: formEvents,
          description: formDesc.trim() || null,
          active: true,
        }),
      }).then(r => r.json());

      if (res.success) {
        toast.success(editId ? t('webhooksV2.updated') : t('webhooksV2.created'));
        resetForm();
        loadWebhooks();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/v1/admin/webhooks-v2/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        toast.success(t('webhooksV2.deleted'));
        loadWebhooks();
      }
    } catch {
      toast.error(t('common.error'));
    }
  }

  async function handleTest(id) {
    try {
      const res = await fetch(`/api/v1/admin/webhooks-v2/${id}/test`, { method: 'POST' }).then(r => r.json());
      if (res.success) {
        toast.success(res.data?.success ? t('webhooksV2.testSuccess') : t('webhooksV2.testFailed'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  }

  async function loadDeliveries(id) {
    try {
      const res = await fetch(`/api/v1/admin/webhooks-v2/${id}/deliveries`).then(r => r.json());
      if (res.success) {
        setDeliveries(res.data || []);
        setShowDeliveries(id);
      }
    } catch {
      toast.error(t('common.error'));
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 p-2 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 text-primary-500'}`}>
            <WebhooksLogo weight="bold" className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Platform API Gateway' : t('webhooksV2.title')}
            </h2>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              {isIndia ? 'Configure real-time event triggers for external Indian heritage partners.' : t('webhooksV2.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHelp(!showHelp)} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/40 hover:bg-[#000080]/5' : 'text-surface-400 hover:bg-surface-100'}`}>
            <Question weight="bold" size={24} />
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isIndia ? 'bg-[#FF9933] text-white shadow-xl shadow-[#FF9933]/20' : 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'}`}>
            <Plus size={16} weight="bold" />
            {t('webhooksV2.create')}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`rounded-[2rem] border p-6 text-sm leading-relaxed ${isIndia ? 'bg-[#000080]/5 border-[#000080]/10 text-[#000080]/70' : 'bg-primary-50 border-primary-100 text-primary-800'}`}>
            <p className="font-bold mb-2 uppercase tracking-widest text-[10px] opacity-60">Developer Guidance</p>
            {t('webhooksV2.help')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`rounded-[2.5rem] border p-8 space-y-6 ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-2xl shadow-[#000080]/10' : 'bg-white border-surface-200 shadow-xl'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>
                {editId ? t('webhooksV2.editWebhook') : t('webhooksV2.newWebhook')}
              </h3>
              <button onClick={resetForm} className="p-2 rounded-xl text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                <X weight="bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-surface-400">{t('webhooksV2.url')}</label>
                <input type="text" value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://api.indianheritage.io/v1/webhook" className="input-field w-full" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-surface-400">{t('webhooksV2.events')}</label>
                <div className="flex flex-wrap gap-2">
                  {EVENTS.map(ev => (
                    <button key={ev} onClick={() => toggleEvent(ev)} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${formEvents.includes(ev) ? (isIndia ? 'bg-[#FF9933] text-white border-[#FF9933]' : 'bg-primary-500 text-white border-primary-500') : 'bg-white text-surface-400 border-surface-200 hover:border-surface-300'}`}>
                      {ev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-surface-400">{t('webhooksV2.description')}</label>
                <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder={t('webhooksV2.descriptionPlaceholder')} className="input-field w-full" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={resetForm} className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-surface-400 hover:bg-surface-50">{t('common.cancel')}</button>
              <button onClick={handleSave} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl ${isIndia ? 'bg-[#138808] shadow-[#138808]/20' : 'bg-primary-600 shadow-primary-500/20'}`}>{t('webhooksV2.save')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton rounded-[2rem]" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 min-h-[300px] text-center bg-white dark:bg-surface-800 rounded-[2.5rem] border border-amber-200 dark:border-amber-900/30 shadow-xl shadow-[#000080]/5 space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500">
              <WebhooksLogo weight="thin" size={36} />
            </div>
            <div className="max-w-md">
              <h2 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                {isIndia ? 'API Gateway Offline' : 'Webhooks System Offline'}
              </h2>
              <p className={`text-sm font-medium mt-2 leading-relaxed ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
                Real-time API event triggers are disabled in this environment. To enable this gateway, please set <code className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-900 font-mono text-xs text-red-500">MODULE_WEBHOOKS=true</code> in your backend <code className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-900 font-mono text-xs">.env</code> file.
              </p>
            </div>
            <button
              onClick={loadWebhooks}
              className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-lg ${isIndia ? 'bg-[#000080] hover:bg-[#000060] shadow-[#000080]/20' : 'bg-primary-600 shadow-primary-500/20'}`}
            >
              {t('common.retry') || 'Retry Connection'}
            </button>
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-20 rounded-[3rem] border border-dashed border-surface-200">
            <WebhooksLogo weight="thin" size={80} className="mx-auto mb-6 opacity-10" />
            <p className="text-lg font-bold text-surface-400">{t('webhooksV2.empty')}</p>
          </div>
        ) : (
          webhooks.map(wh => (
            <motion.div key={wh.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[2rem] border p-6 transition-all hover:shadow-lg ${isIndia ? 'bg-white border-[#FF9933]/10 hover:border-[#FF9933]/30 shadow-sm shadow-[#000080]/5' : 'bg-white border-surface-100 shadow-sm'}`}>
              <div className="flex items-center justify-between gap-6">
                <div className="min-w-0">
                  <p className={`font-black truncate ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>{wh.url}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {wh.events.map(ev => (
                      <span key={ev} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${isIndia ? 'bg-[#000080]/5 text-[#000080]/40' : 'bg-surface-50 text-surface-400'}`}>
                        {ev}
                      </span>
                    ))}
                  </div>
                  {wh.description && <p className="text-xs font-medium text-surface-400 mt-3">{wh.description}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleTest(wh.id)} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/30 hover:bg-[#FF9933]/10 hover:text-[#FF9933]' : 'text-surface-300 hover:text-primary-500'}`} title={t('webhooksV2.test')}>
                    <PaperPlaneTilt weight="bold" size={20} />
                  </button>
                  <button onClick={() => loadDeliveries(wh.id)} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/30 hover:bg-[#FF9933]/10 hover:text-[#FF9933]' : 'text-surface-300 hover:text-primary-500'}`} title={t('webhooksV2.deliveries')}>
                    <ListChecks weight="bold" size={20} />
                  </button>
                  <button onClick={() => { setEditId(wh.id); setFormUrl(wh.url); setFormEvents(wh.events); setFormDesc(wh.description || ''); setShowForm(true); }} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/30 hover:bg-[#FF9933]/10 hover:text-[#FF9933]' : 'text-surface-300 hover:text-primary-500'}`} title={t('webhooksV2.edit')}>
                    <Pencil weight="bold" size={20} />
                  </button>
                  <button onClick={() => handleDelete(wh.id)} className="p-3 rounded-2xl transition-all text-red-200 hover:bg-red-50 hover:text-red-500" title={t('webhooksV2.delete')}>
                    <Trash weight="bold" size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Delivery log */}
      <AnimatePresence>
        {showDeliveries && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`rounded-[2.5rem] border p-8 space-y-6 ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-2xl' : 'bg-white border-surface-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>{t('webhooksV2.deliveryLog')}</h3>
              <button onClick={() => setShowDeliveries(null)} className="p-2 rounded-xl text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                <X weight="bold" className="w-6 h-6" />
              </button>
            </div>
            {deliveries.length === 0 ? (
              <p className="text-center py-10 font-bold text-surface-300">{t('webhooksV2.noDeliveries')}</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {deliveries.map(d => (
                  <div key={d.id} className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all ${d.success ? (isIndia ? 'bg-[#138808]/5 border-[#138808]/10' : 'bg-emerald-50 border-emerald-100') : 'bg-red-50 border-red-100'}`}>
                    <div>
                      <p className={`font-black text-sm ${d.success ? (isIndia ? 'text-[#138808]' : 'text-emerald-800') : 'text-red-800'}`}>{d.event_type}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mt-1">{new Date(d.delivered_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${d.success ? 'bg-white text-emerald-600' : 'bg-white text-red-600'}`}>
                        {d.status_code || 'ERR'}
                      </span>
                      <p className="text-[9px] font-black uppercase tracking-widest text-surface-400 mt-2 opacity-60">{t('webhooksV2.attempt')} {d.attempt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AdminWebhooksPage;
