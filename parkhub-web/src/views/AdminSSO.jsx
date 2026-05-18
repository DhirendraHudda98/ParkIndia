import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Plus, Trash, Pencil, Question, ToggleLeft, ToggleRight } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export function AdminSSOPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editSlug, setEditSlug] = useState(null);
  const [formSlug, setFormSlug] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formEntityId, setFormEntityId] = useState('');
  const [formMetadataUrl, setFormMetadataUrl] = useState('');
  const [formSsoUrl, setFormSsoUrl] = useState('');
  const [formCertificate, setFormCertificate] = useState('');
  const [error, setError] = useState(null);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/sso/providers');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        setProviders(data.data?.providers || []);
      } else {
        throw new Error(data.error?.message || 'Failed to load SSO providers');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadProviders(); }, [loadProviders]);

  function resetForm() {
    setFormSlug('');
    setFormDisplayName('');
    setFormEntityId('');
    setFormMetadataUrl('');
    setFormSsoUrl('');
    setFormCertificate('');
    setEditSlug(null);
    setShowForm(false);
  }

  function openEdit(p) {
    setFormSlug(p.slug);
    setFormDisplayName(p.display_name);
    setFormEntityId(p.entity_id);
    setFormMetadataUrl(p.metadata_url);
    setFormSsoUrl(p.sso_url);
    setFormCertificate(p.certificate);
    setEditSlug(p.slug);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formSlug.trim() || !formDisplayName.trim() || !formEntityId.trim() || !formSsoUrl.trim() || !formCertificate.trim()) {
      toast.error(t('sso.requiredFields'));
      return;
    }
    const slug = editSlug || formSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    try {
      const res = await fetch(`/api/v1/admin/sso/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: formDisplayName.trim(),
          entity_id: formEntityId.trim(),
          metadata_url: formMetadataUrl.trim(),
          sso_url: formSsoUrl.trim(),
          certificate: formCertificate.trim(),
          enabled: true,
        }),
      }).then(r => r.json());

      if (res.success) {
        toast.success(editSlug ? t('sso.updated') : t('sso.created'));
        resetForm();
        loadProviders();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch { toast.error(t('common.error')); }
  }

  async function handleDelete(slug) {
    try {
      const res = await fetch(`/api/v1/admin/sso/${slug}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        toast.success(t('sso.deleted'));
        loadProviders();
      }
    } catch { toast.error(t('common.error')); }
  }

  return (
    <div className="space-y-8 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-primary-50 dark:bg-primary-950/30 text-primary-500'}`}>
            <ShieldCheck weight="bold" className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Identity Federation' : t('sso.title')}
            </h2>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              {isIndia ? 'Configure enterprise-grade authentication for Indian corporate accounts.' : t('sso.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowHelp(!showHelp)} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/30 hover:bg-[#000080]/5' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
            <Question weight="bold" size={24} />
          </button>
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-all shadow-lg ${isIndia ? 'bg-[#000080] hover:bg-[#000060] shadow-[#000080]/20' : 'bg-primary-500 hover:bg-primary-600'}`}
          >
            <Plus size={16} weight="bold" />
            {isIndia ? 'Register Identity Provider' : t('sso.addProvider')}
          </button>
        </div>
      </div>

      {/* Help */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`rounded-2xl p-5 border overflow-hidden ${isIndia ? 'bg-[#FF9933]/5 border-[#FF9933]/10 text-[#000080]' : 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800 text-surface-700 dark:text-surface-300'}`}>
            <p className="text-sm font-medium leading-relaxed italic">
              {isIndia ? 'Identity Federation allows large Indian enterprises to use their internal credentials (like Microsoft Entra or Okta) to access the ParkIndia platform securely. Ensure your metadata URLs and certificates are valid and updated to prevent lockout.' : t('sso.help')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`rounded-[2.5rem] border p-8 space-y-8 ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-2xl shadow-[#000080]/10' : 'bg-white dark:bg-surface-800 border-surface-200 shadow-sm'}`}>
            <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>
              {editSlug ? (isIndia ? 'Update Provider Configuration' : t('sso.editProvider')) : (isIndia ? 'Onboard Identity Provider' : t('sso.newProvider'))}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormGroup label={t('sso.slug')} isIndia={isIndia}>
                <input type="text" value={formSlug} onChange={e => setFormSlug(e.target.value)} disabled={!!editSlug} className="input-field w-full" placeholder="e.g. corp-ad, hub-id" />
              </FormGroup>
              <FormGroup label={t('sso.displayName')} isIndia={isIndia}>
                <input type="text" value={formDisplayName} onChange={e => setFormDisplayName(e.target.value)} className="input-field w-full" placeholder="e.g. Enterprise Azure AD" />
              </FormGroup>
              <FormGroup label={t('sso.entityId')} isIndia={isIndia}>
                <input type="text" value={formEntityId} onChange={e => setFormEntityId(e.target.value)} className="input-field w-full" placeholder="https://idp.example.in/entity" />
              </FormGroup>
              <FormGroup label={t('sso.ssoUrl')} isIndia={isIndia}>
                <input type="text" value={formSsoUrl} onChange={e => setFormSsoUrl(e.target.value)} className="input-field w-full" placeholder="https://idp.example.in/sso" />
              </FormGroup>
              <div className="md:col-span-2">
                <FormGroup label={t('sso.metadataUrl')} isIndia={isIndia}>
                  <input type="text" value={formMetadataUrl} onChange={e => setFormMetadataUrl(e.target.value)} className="input-field w-full" placeholder="https://idp.example.in/metadata.xml" />
                </FormGroup>
              </div>
              <div className="md:col-span-2">
                <FormGroup label={t('sso.certificate')} isIndia={isIndia}>
                  <textarea value={formCertificate} onChange={e => setFormCertificate(e.target.value)} className="input-field w-full min-h-[120px] font-mono text-xs" placeholder="Paste X.509 Certificate contents here..." />
                </FormGroup>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button onClick={handleSave} className={`px-10 py-4 rounded-2xl font-black text-white transition-all shadow-xl ${isIndia ? 'bg-[#000080] hover:bg-[#000060]' : 'bg-primary-500 hover:bg-primary-600'}`}>
                {t('sso.save')}
              </button>
              <button onClick={resetForm} className={`px-10 py-4 rounded-2xl font-bold transition-all ${isIndia ? 'text-[#000080]/50 hover:bg-[#000080]/5' : 'bg-surface-100 text-surface-600'}`}>
                {t('common.cancel')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider list */}
      {loading ? (
        <div className="text-center py-24 text-surface-400 font-bold uppercase tracking-widest animate-pulse">{t('common.loading')}</div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 min-h-[300px] text-center bg-white dark:bg-surface-800 rounded-[2.5rem] border border-amber-200 dark:border-amber-900/30 shadow-xl shadow-[#000080]/5 space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500">
            <ShieldCheck weight="thin" size={36} />
          </div>
          <div className="max-w-md">
            <h2 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Identity Federation Disabled' : 'SSO System Offline'}
            </h2>
            <p className={`text-sm font-medium mt-2 leading-relaxed ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
              Enterprise SAML Single Sign-On is disabled in this environment. To enable federated identities, please set <code className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-900 font-mono text-xs text-red-500">MODULE_SSO=true</code> in your backend <code className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-900 font-mono text-xs">.env</code> file.
            </p>
          </div>
          <button
            onClick={loadProviders}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-lg ${isIndia ? 'bg-[#000080] hover:bg-[#000060] shadow-[#000080]/20' : 'bg-primary-600 shadow-primary-500/20'}`}
          >
            {t('common.retry') || 'Retry Connection'}
          </button>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-24 text-surface-400">
          <ShieldCheck size={64} weight="thin" className="mx-auto mb-6 opacity-10" />
          <p className="font-bold uppercase tracking-widest">{t('sso.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {providers.map(p => (
            <motion.div key={p.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[2rem] border p-6 flex items-center justify-between group transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm hover:shadow-xl hover:shadow-[#000080]/5' : 'bg-white border-surface-200'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-surface-50 text-primary-500'}`}>
                  <ShieldCheck size={28} weight="fill" />
                </div>
                <div>
                  <p className={`text-lg font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>{p.display_name}</p>
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-1`}>{p.slug} <span className="mx-2">|</span> {p.entity_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {p.enabled ? (
                  <ToggleRight size={42} weight="fill" className={isIndia ? 'text-[#138808]' : 'text-green-500'} />
                ) : (
                  <ToggleLeft size={42} className="text-surface-300 opacity-40" />
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/40 hover:bg-[#000080]/5 hover:text-[#000080]' : 'text-surface-500 hover:bg-surface-100'}`}>
                    <Pencil size={20} weight="bold" />
                  </button>
                  <button onClick={() => handleDelete(p.slug)} className={`p-3 rounded-2xl transition-all text-red-300 hover:bg-red-50 hover:text-red-600`}>
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

export default AdminSSOPage;
