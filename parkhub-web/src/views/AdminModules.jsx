import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useModuleToggle } from '../hooks/useModuleToggle';
import { ConfigEditorModal } from '../components/ConfigEditorModal';
import { useTheme } from '../context/ThemeContext';

const CATEGORY_ORDER = [
  'core',
  'booking',
  'vehicle',
  'payment',
  'admin',
  'analytics',
  'integration',
  'notification',
  'compliance',
  'enterprise',
  'experimental',
];

function categoryLabel(t, cat) {
  return t(`admin.modules.category.${cat}`, cat.charAt(0).toUpperCase() + cat.slice(1));
}

function categoryKey(category) {
  return category.trim().toLowerCase();
}

function StatusDot({ m }) {
  const runtime = m.runtime_enabled ?? m.enabled;
  let cls;
  let label;
  if (!m.enabled) {
    cls = 'bg-neutral-500';
    label = 'compile-time off';
  } else if (runtime) {
    cls = 'bg-[#138808] shadow-[0_0_8px_rgba(19,136,8,0.4)]';
    label = 'enabled';
  } else {
    cls = 'bg-[#FF9933] shadow-[0_0_8px_rgba(255,153,51,0.4)]';
    label = 'runtime off';
  }
  return (
    <span aria-label={label} className={`inline-block h-2 w-2 rounded-full ${cls}`} />
  );
}

function ModuleToggleSwitch({ m, onLocalChange, onRevert, t, isIndia }) {
  const { inFlight, toggle } = useModuleToggle(m.name);
  const currentRuntime = m.runtime_enabled ?? m.enabled;

  const disabledForCompileTime = !m.enabled;
  const notToggleable = !m.runtime_toggleable;
  const disabled = inFlight || disabledForCompileTime || notToggleable;

  async function onClick() {
    if (disabled) return;
    const next = !currentRuntime;
    onLocalChange(next);
    const result = await toggle(next);
    if (result.ok) {
      toast.success(t('admin.modules.toggle.success', 'Module {{name}} toggled', { name: m.name }));
    } else {
      onRevert();
      toast.error(t('admin.modules.toggle.error', 'Could not toggle {{name}}', { name: m.name }));
    }
  }

  return (
    <button
      type="button" role="switch" aria-checked={currentRuntime} disabled={disabled} onClick={onClick}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all focus:outline-none ${
        currentRuntime
          ? isIndia ? 'bg-[#138808]' : 'bg-primary-600'
          : 'bg-surface-300 dark:bg-surface-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all shadow-sm ${currentRuntime ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function ModuleCard({ m, t, isAdmin, onModuleChange, onOpenConfig, isIndia, isVoid }) {
  const enabled = m.runtime_enabled ?? m.enabled;
  return (
    <div className={`rounded-[1.5rem] border p-5 transition-all group ${
      enabled
        ? isVoid ? 'bg-slate-900 border-slate-800 shadow-lg shadow-cyan-500/5' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm shadow-[#000080]/5' : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900'
        : 'opacity-50 grayscale border-surface-100 bg-surface-50'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <StatusDot m={m} />
        <h3 className={`font-black text-sm uppercase tracking-tight ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{m.name.replace(/-/g, ' ')}</h3>
        {isAdmin && (
          <div className="ml-auto">
            <ModuleToggleSwitch m={m} onLocalChange={(next) => onModuleChange(m.name, next)} onRevert={() => onModuleChange(m.name, enabled)} t={t} isIndia={isIndia} />
          </div>
        )}
      </div>
      <p className={`text-xs font-medium leading-relaxed mb-4 ${isIndia ? 'text-[#000080]/60' : 'text-surface-600 dark:text-surface-400'}`}>{m.description}</p>
      
      <div className="flex flex-wrap gap-1 mb-4">
        {m.config_keys.map((k) => (
          <code key={k} className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${isIndia ? 'bg-[#000080]/5 text-[#000080]/40' : 'bg-surface-100 dark:bg-surface-800 text-surface-500'}`}>
            {k}
          </code>
        ))}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-100 dark:border-surface-800">
        <div className="flex items-center gap-3">
          {m.ui_route ? (
            <Link to={m.ui_route} className={`text-xs font-black uppercase tracking-widest transition-colors ${isIndia ? 'text-[#FF9933] hover:text-[#000080]' : 'text-primary-600 hover:underline'}`}>
              OPEN UI
            </Link>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-surface-300">{t('admin.modules.noUi')}</span>
          )}
          {isAdmin && m.config_schema != null && (
            <button
              onClick={() => onOpenConfig(m.name)}
              className={`text-[10px] font-black uppercase tracking-widest transition-all ${isIndia ? 'text-[#000080]/50 hover:text-[#000080]' : 'text-surface-500 hover:text-surface-900'}`}
            >
              CONFIG
            </button>
          )}
        </div>
        <span className="text-[10px] font-bold opacity-30 tracking-widest">V{m.version}</span>
      </div>
    </div>
  );
}

export function AdminModulesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [modules, setModules] = useState(null);
  const [err, setErr] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [hideDisabled, setHideDisabled] = useState(false);
  const [configOpenFor, setConfigOpenFor] = useState(null);

  useEffect(() => {
    let active = true;
    fetch('/api/v1/modules/info', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        if (!active) return;
        const data = j?.data ?? j?.module_info ?? [];
        setModules(data);
      })
      .catch((e) => active && setErr(String(e)));
    return () => { active = false; };
  }, []);

  function handleModuleChange(name, runtimeEnabled) {
    setModules((prev) =>
      prev?.map((m) => (m.name === name ? { ...m, runtime_enabled: runtimeEnabled } : m)) ?? prev,
    );
  }

  const filtered = useMemo(() => {
    if (!modules) return [];
    const q = query.trim().toLowerCase();
    return modules.filter((m) => {
      if (filter !== 'all' && categoryKey(m.category) !== filter) return false;
      if (hideDisabled && !(m.runtime_enabled ?? m.enabled)) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.config_keys.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [modules, query, filter, hideDisabled]);

  const grouped = useMemo(() => {
    const by = new Map();
    for (const m of filtered) {
      const cat = categoryKey(m.category);
      if (!by.has(cat)) by.set(cat, []);
      by.get(cat).push(m);
    }
    return CATEGORY_ORDER.map((c) => ({ cat: c, mods: by.get(c) ?? [] })).filter(
      (g) => g.mods.length > 0,
    );
  }, [filtered]);

  const total = modules?.length ?? 0;
  const enabledCount = modules?.filter((m) => m.runtime_enabled ?? m.enabled).length ?? 0;

  if (err) {
    return (
      <div className="p-8 text-red-500 font-bold bg-red-50 rounded-2xl border border-red-100" role="alert">
        {t('admin.modules.loadError')}: {err}
      </div>
    );
  }

  const inputClass = `rounded-xl border px-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-1 ${
    isVoid ? 'bg-slate-950 border-slate-700 text-white focus:ring-cyan-500 shadow-lg' : isIndia ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:ring-[#FF9933] shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white'
  }`;

  return (
    <div className="p-2 space-y-8">
      <header className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 dark:bg-primary-950/30 text-primary-500'}`}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          </div>
          <div>
            <h1 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'National Capability Registry' : t('admin.modules.title')}
            </h1>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-600 dark:text-surface-400'}`}>
              {isIndia ? 'Manage active service modules for ParkIndia deployments.' : t('admin.modules.subtitle')}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-sm ${isIndia ? 'bg-[#138808]/10 text-[#138808]' : 'bg-emerald-500/10 text-emerald-600'}`}>
            {enabledCount}/{total} {isIndia ? 'DEPLOYED' : t('admin.modules.active')}
          </span>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={isIndia ? 'Filter by service name or regional config...' : t('admin.modules.searchPlaceholder')}
          className={`flex-1 min-w-[280px] ${inputClass}`}
        />
        <select
          value={filter} onChange={(e) => setFilter(e.target.value)}
          className={inputClass}
        >
          <option value="all">{t('admin.modules.allCategories')}</option>
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>{categoryLabel(t, c)}</option>
          ))}
        </select>
        <label className={`flex items-center gap-3 text-xs font-black uppercase tracking-widest cursor-pointer ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${hideDisabled ? (isIndia ? 'bg-[#000080] border-[#000080]' : 'bg-primary-600 border-primary-600') : 'border-surface-300'}`}>
            {hideDisabled && <Check weight="bold" className="text-white w-3.5 h-3.5" />}
          </div>
          <input type="checkbox" checked={hideDisabled} onChange={(e) => setHideDisabled(e.target.checked)} className="hidden" />
          {t('admin.modules.hideDisabled')}
        </label>
      </div>

      <div className="space-y-12">
        {modules === null ? (
          <div className="text-sm font-bold text-surface-400 animate-pulse uppercase tracking-[0.2em]">{t('loading')}</div>
        ) : grouped.length === 0 ? (
          <div className="text-sm font-bold text-surface-400 italic">{t('admin.modules.noMatches')}</div>
        ) : (
          grouped.map(({ cat, mods }) => (
            <section key={cat} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className={`text-sm font-black uppercase tracking-[0.3em] ${isIndia ? 'text-[#FF9933]' : 'text-surface-400 dark:text-surface-500'}`}>
                  {categoryLabel(t, cat)}
                </h2>
                <div className={`h-px flex-1 ${isIndia ? 'bg-[#FF9933]/10' : 'bg-surface-100 dark:bg-surface-800'}`} />
                <span className={`text-[10px] font-black opacity-30`}>{mods.length}</span>
              </div>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mods.map((m) => (
                  <ModuleCard key={m.name} m={m} t={t} isAdmin={isAdmin} onModuleChange={handleModuleChange} onOpenConfig={(name) => setConfigOpenFor(name)} isIndia={isIndia} isVoid={isVoid} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {configOpenFor && (
        <ConfigEditorModal moduleName={configOpenFor} isOpen onClose={() => setConfigOpenFor(null)} />
      )}
    </div>
  );
}

import { Check } from '@phosphor-icons/react';
export default AdminModulesPage;
