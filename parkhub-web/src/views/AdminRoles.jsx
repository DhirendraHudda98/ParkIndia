import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Plus, Trash, Pencil, Question } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const ALL_PERMISSIONS = [
  'manage_users',
  'manage_lots',
  'manage_bookings',
  'view_reports',
  'manage_settings',
  'manage_plugins',
];

export function AdminRolesPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPerms, setFormPerms] = useState([]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/roles').then(r => r.json());
      if (res.success) {
        setRoles(res.data || []);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  function resetForm() {
    setShowForm(false);
    setEditId(null);
    setFormName('');
    setFormDesc('');
    setFormPerms([]);
  }

  function startEdit(role) {
    setEditId(role.id);
    setFormName(role.name);
    setFormDesc(role.description || '');
    setFormPerms([...role.permissions]);
    setShowForm(true);
  }

  function togglePerm(perm) {
    setFormPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error(t('rbac.nameRequired'));
      return;
    }
    try {
      const url = editId ? `/api/v1/admin/roles/${editId}` : '/api/v1/admin/roles';
      const method = editId ? 'PUT' : 'POST';
      const body = { name: formName, description: formDesc || null, permissions: formPerms };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json());

      if (res.success) {
        toast.success(editId ? t('rbac.updated') : t('rbac.created'));
        resetForm();
        loadRoles();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch { toast.error(t('common.error')); }
  }

  async function handleDelete(role) {
    if (role.built_in) return;
    if (!confirm(t('rbac.deleteConfirm'))) return;
    try {
      const res = await fetch(`/api/v1/admin/roles/${role.id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        toast.success(t('rbac.deleted'));
        loadRoles();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch { toast.error(t('common.error')); }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 dark:bg-primary-950/30 text-primary-500'}`}>
            <ShieldCheck weight="bold" className="w-8 h-8" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Authority & Access Tiers' : t('rbac.title')}
            </h2>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              {isIndia ? 'Define administrative permissions for regional hub operators.' : t('rbac.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/30 hover:bg-[#000080]/5' : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'}`}
          >
            <Question weight="bold" size={22} />
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-all shadow-lg ${isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00] shadow-[#FF9933]/20' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'}`}
          >
            <Plus weight="bold" className="w-4 h-4" />
            {isIndia ? 'Create Tier' : t('rbac.createRole')}
          </button>
        </div>
      </div>

      {/* Help tooltip */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`rounded-2xl p-5 border overflow-hidden ${isIndia ? 'bg-[#000080]/5 border-[#000080]/10 text-[#000080]' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'}`}>
            <p className="text-sm font-medium leading-relaxed">
              {isIndia ? 'Define specialized roles for your Indian parking network. Roles allow you to group permissions (like managing bookings or viewing revenue reports) and assign them to specific staff members at localized hubs.' : t('rbac.help')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`rounded-[2.5rem] border p-8 space-y-8 ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-2xl shadow-[#000080]/10' : 'bg-white dark:bg-surface-800 border-surface-200 shadow-sm'}`}>
            <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>
              {editId ? (isIndia ? 'Update Access Tier' : t('rbac.editRole')) : (isIndia ? 'Log New Tier' : t('rbac.newRole'))}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <FormGroup label={t('rbac.name')} isIndia={isIndia}>
                  <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="input-field w-full" placeholder={t('rbac.namePlaceholder')} />
                </FormGroup>
                <FormGroup label={t('rbac.description')} isIndia={isIndia}>
                  <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} className="input-field w-full" placeholder={t('rbac.descriptionPlaceholder')} />
                </FormGroup>
              </div>

              <div>
                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>
                  {isIndia ? 'Tier Permissions Registry' : t('rbac.permissions')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_PERMISSIONS.map(perm => (
                    <label key={perm} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer group transition-all ${formPerms.includes(perm) ? (isIndia ? 'bg-[#000080] border-[#000080]' : 'bg-primary-600 border-primary-600') : 'bg-surface-50 border-transparent hover:border-surface-200'}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${formPerms.includes(perm) ? 'bg-white border-white' : 'border-surface-300'}`}>
                        {formPerms.includes(perm) && <div className={`w-2 h-2 rounded-sm ${isIndia ? 'bg-[#000080]' : 'bg-primary-600'}`} />}
                      </div>
                      <input type="checkbox" className="hidden" checked={formPerms.includes(perm)} onChange={() => togglePerm(perm)} />
                      <span className={`text-xs font-black uppercase tracking-widest ${formPerms.includes(perm) ? 'text-white' : 'text-surface-400'}`}>
                        {t(`rbac.perm.${perm}`).replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button onClick={handleSave} className={`px-10 py-4 rounded-2xl font-black text-white transition-all shadow-xl ${isIndia ? 'bg-[#000080] hover:bg-[#000060]' : 'bg-primary-600 hover:bg-primary-700'}`}>
                {t('rbac.save')}
              </button>
              <button onClick={resetForm} className={`px-10 py-4 rounded-2xl font-bold transition-all ${isIndia ? 'text-[#000080]/50 hover:bg-[#000080]/5' : 'bg-surface-100 text-surface-600'}`}>
                {t('common.cancel')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roles list */}
      {loading ? (
        <div className="text-center py-24 text-surface-400 font-bold uppercase tracking-widest animate-pulse">{t('common.loading')}</div>
      ) : roles.length === 0 ? (
        <div className="text-center py-24 text-surface-400 italic font-medium">{t('rbac.empty')}</div>
      ) : (
        <div className="grid gap-6">
          {roles.map(role => (
            <motion.div key={role.id} layout className={`rounded-[2rem] border p-8 transition-all group ${isVoid ? 'bg-slate-900 border-slate-800 shadow-xl' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm hover:shadow-xl hover:shadow-[#000080]/5' : 'bg-white border-surface-200 shadow-sm'}`}>
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>{role.name}</h3>
                    {role.built_in && (
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-100 text-amber-700'}`}>
                        {isIndia ? 'SYSTEM CORE' : t('rbac.builtIn')}
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className={`text-sm font-medium leading-relaxed ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{role.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(role)} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/40 hover:bg-[#000080]/5 hover:text-[#000080]' : 'text-surface-400 hover:text-primary-600'}`}>
                    <Pencil weight="bold" size={20} />
                  </button>
                  {!role.built_in && (
                    <button onClick={() => handleDelete(role)} className={`p-3 rounded-2xl transition-all text-red-300 hover:bg-red-50 hover:text-red-600`}>
                      <Trash weight="bold" size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-surface-100 dark:border-surface-800">
                {role.permissions.length === 0 ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-surface-300">{t('rbac.noPermissions')}</span>
                ) : (
                  role.permissions.map(perm => (
                    <span key={perm} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-primary-50 text-primary-600'}`}>
                      {t(`rbac.perm.${perm}`).replace(/_/g, ' ')}
                    </span>
                  ))
                )}
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

export default AdminRolesPage;
