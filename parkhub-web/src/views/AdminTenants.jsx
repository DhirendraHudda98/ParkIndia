import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Buildings, Plus, X, PencilSimple } from '@phosphor-icons/react';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export function AdminTenantsPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formColor, setFormColor] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTenants(); }, []);

  async function loadTenants() {
    setLoading(true);
    try {
      const res = await api.listTenants();
      if (res.success && res.data) setTenants(res.data);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormName('');
    setFormDomain('');
    setFormColor('');
    setShowModal(true);
  }, []);

  const openEdit = useCallback((tenant) => {
    setEditing(tenant);
    setFormName(tenant.name);
    setFormDomain(tenant.domain || '');
    setFormColor(tenant.branding?.primary_color || '');
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formName.trim()) return;
    setSaving(true);
    const data = {
      name: formName.trim(),
      domain: formDomain.trim() || undefined,
      branding: formColor.trim() ? { primary_color: formColor.trim() } : undefined,
    };
    try {
      if (editing) {
        const res = await api.updateTenant(editing.id, data);
        if (res.success) {
          toast.success(t('tenants.updated', 'Tenant updated'));
          setShowModal(false);
          loadTenants();
        }
      } else {
        const res = await api.createTenant(data);
        if (res.success) {
          toast.success(t('tenants.created', 'Tenant created'));
          setShowModal(false);
          loadTenants();
        }
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  }, [editing, formName, formDomain, formColor, t]);

  if (loading) return (
    <div className="space-y-8 p-2 animate-pulse">
      <div className={`h-12 w-64 rounded-2xl ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-100'}`} />
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className={`h-24 rounded-[2rem] ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-50'}`} />)}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 text-primary-500'}`}>
            <Buildings weight="bold" className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>
              {isIndia ? 'Regional Hub Organizations' : t('tenants.title')}
            </h2>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              {isIndia ? 'Manage isolated partner networks and city-specific hub registries.' : 'Manage independent organizations and multi-tenant isolation.'}
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-all shadow-lg ${isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00] shadow-[#FF9933]/20' : 'bg-primary-600 hover:bg-primary-700'}`}
        >
          <Plus weight="bold" className="w-4 h-4" />
          {isIndia ? 'Establish Hub' : t('tenants.create')}
        </button>
      </div>

      {tenants.length === 0 ? (
        <div className={`rounded-[2.5rem] border p-16 text-center ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10' : 'bg-white border-surface-200'}`}>
          <Buildings weight="thin" className={`w-20 h-20 mx-auto mb-6 opacity-10 ${isIndia ? 'text-[#000080]' : ''}`} />
          <p className={`text-lg font-black uppercase tracking-widest opacity-30 ${isIndia ? 'text-[#000080]' : ''}`}>
            {isIndia ? 'NO REGIONAL HUBS DETECTED' : t('tenants.empty')}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {tenants.map(tenant => (
            <motion.div 
              key={tenant.id} 
              layout 
              className={`flex items-center justify-between p-8 rounded-[2rem] border group transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm hover:shadow-xl hover:shadow-[#000080]/5' : 'bg-white border-surface-200 shadow-sm'}`}
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105" style={{ backgroundColor: tenant.branding?.primary_color || (isIndia ? '#000080' : '#6366f1') }}>
                  <Buildings weight="fill" className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>{tenant.name}</h3>
                  {tenant.domain && <p className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-1`}>{tenant.domain}</p>}
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                  <div className="flex flex-col items-end">
                    <span className="opacity-30">{t('tenants.users', 'users')}</span>
                    <span className={isIndia ? 'text-[#000080]' : ''}>{tenant.user_count}</span>
                  </div>
                  <div className="w-px h-8 bg-surface-100 dark:bg-surface-800" />
                  <div className="flex flex-col items-end">
                    <span className="opacity-30">{t('tenants.lots', 'lots')}</span>
                    <span className={isIndia ? 'text-[#000080]' : ''}>{tenant.lot_count}</span>
                  </div>
                </div>
                <button onClick={() => openEdit(tenant)} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/40 hover:bg-[#000080]/5 hover:text-[#000080]' : 'text-surface-400 hover:bg-surface-100 hover:text-primary-600'}`}>
                  <PencilSimple weight="bold" className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000080]/20 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-[2.5rem] border p-8 max-w-md w-full shadow-2xl ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10' : 'bg-white border-surface-200'}`}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>
                  {editing ? (isIndia ? 'Update Hub Registry' : t('tenants.editTitle')) : (isIndia ? 'New Hub Onboarding' : t('tenants.create'))}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors">
                  <X weight="bold" className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <FormGroup label={t('tenants.name')} isIndia={isIndia}>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="input-field w-full" placeholder="e.g. Maharashtra Regional Hub" />
                </FormGroup>
                <FormGroup label={t('tenants.domain')} isIndia={isIndia}>
                  <input type="text" value={formDomain} onChange={(e) => setFormDomain(e.target.value)} placeholder="mh.parkindia.in" className="input-field w-full" />
                </FormGroup>
                <FormGroup label={isIndia ? 'HUB BRANDING COLOR' : t('tenants.brandColor')} isIndia={isIndia}>
                  <div className="flex items-center gap-4">
                    <input type="color" value={formColor || '#000080'} onChange={(e) => setFormColor(e.target.value)} className="w-14 h-14 rounded-2xl border-none cursor-pointer overflow-hidden p-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{formColor || '#000080'}</span>
                  </div>
                </FormGroup>
              </div>

              <div className="flex gap-3 mt-10">
                <button onClick={handleSave} disabled={saving || !formName.trim()} className={`flex-1 py-4 rounded-2xl font-black text-white transition-all shadow-xl disabled:opacity-50 ${isIndia ? 'bg-[#000080] hover:bg-[#000060]' : 'bg-primary-600 hover:bg-primary-700'}`}>
                  {saving ? t('common.saving') : t('common.save')}
                </button>
                <button onClick={() => setShowModal(false)} className={`px-6 py-4 rounded-2xl font-bold transition-all ${isIndia ? 'text-[#000080]/50 hover:bg-[#000080]/5' : 'bg-surface-100 text-surface-600'}`}>
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
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

export default AdminTenantsPage;
