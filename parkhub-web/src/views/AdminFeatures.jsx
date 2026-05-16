import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ToggleLeft, ToggleRight, Info, ShieldCheck, ArrowLeft,
  ArrowClockwise, FloppyDisk, Check,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import {
  useFeatures,
  FEATURE_REGISTRY,
  USE_CASE_PRESETS,
} from '../context/FeaturesContext';
import { useUseCase } from '../context/UseCaseContext';
import { stagger } from '../constants/animations';
import toast from 'react-hot-toast';

const CATEGORY_ORDER = ['core', 'collaboration', 'billing', 'admin', 'experience'];

export function AdminFeaturesPage() {
  const { t } = useTranslation();
  const { features, setFeatures } = useFeatures();
  const { useCase } = useUseCase();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [local, setLocal] = useState([...features]);
  const [expandedHelp, setExpandedHelp] = useState(null);
  const [saved, setSaved] = useState(false);

  const hasChanges = JSON.stringify([...local].sort()) !== JSON.stringify([...features].sort());

  function toggle(id) {
    setLocal(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
    setSaved(false);
  }

  function handleSave() {
    setFeatures(local);
    setSaved(true);
    toast.success(t('features.saved'));
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    const preset = USE_CASE_PRESETS[useCase] || USE_CASE_PRESETS.business;
    setLocal([...preset]);
    setSaved(false);
  }

  function handleEnableAll() {
    setLocal(FEATURE_REGISTRY.map(f => f.id));
    setSaved(false);
  }

  function handleDisableAll() {
    setLocal([]);
    setSaved(false);
  }

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    modules: FEATURE_REGISTRY.filter(f => f.category === cat),
  })).filter(g => g.modules.length > 0);

  const container = stagger;
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1] } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <Link to="/" className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-4 transition-colors ${isIndia ? 'text-[#000080]/40 hover:text-[#FF9933]' : 'text-surface-500 hover:text-accent-600'}`}>
          <ArrowLeft weight="bold" className="w-3.5 h-3.5" /> {t('nav.dashboard')}
        </Link>
        <p className={`text-xs font-black uppercase tracking-[0.2em] mb-1 ${isIndia ? 'text-[#FF9933]' : 'text-accent-600 dark:text-accent-400'}`}>
          {isIndia ? 'INDIAN OPERATION ADMIN' : t('nav.admin')}
        </p>
        <h1 className={`text-3xl font-black tracking-tight ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
          {isIndia ? 'Modular Capabilities' : t('features.title')}
        </h1>
        <p className={`text-sm mt-0.5 font-medium ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
          {isIndia ? 'Toggle ParkIndia platform features for localized Indian parking markets.' : t('features.subtitle')}
        </p>
      </motion.div>

      {/* Actions bar */}
      <motion.div variants={item} className="flex flex-wrap items-center gap-2">
        <ActionBtn onClick={handleEnableAll} label={t('features.enableAll')} isIndia={isIndia} />
        <ActionBtn onClick={handleDisableAll} label={t('features.disableAll')} isIndia={isIndia} />
        <ActionBtn onClick={handleReset} icon={<ArrowClockwise weight="bold" className="w-3.5 h-3.5" />} label={isIndia ? 'Standard India Preset' : t('features.resetToPreset')} isIndia={isIndia} />
        <div className="flex-1" />
        <span className={`text-[11px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/30' : 'text-surface-400'}`}>
          {local.length}/{FEATURE_REGISTRY.length} {isIndia ? 'ACTIVE HUBS' : t('features.enabled').toLowerCase()}
        </span>
      </motion.div>

      {/* Feature toggles by category */}
      {grouped.map(({ category, modules }, gi) => (
        <motion.div key={category} variants={item} className={`rounded-[2rem] border overflow-hidden transition-all shadow-sm ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'}`}>
          <div className={`px-5 py-3 transition-colors ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-50 dark:bg-surface-800/50'} border-b border-surface-200/50 dark:border-surface-700/50`}>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
              {t(`features.categories.${category}`)}
            </span>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-800/50">
            {modules.map(mod => {
              const enabled = local.includes(mod.id);
              const helpOpen = expandedHelp === mod.id;
              return (
                <div key={mod.id} className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggle(mod.id)}
                      className="flex-shrink-0 cursor-pointer outline-none"
                    >
                      {enabled ? (
                        <ToggleRight weight="fill" className={`w-9 h-9 transition-colors ${isIndia ? 'text-[#138808]' : 'text-accent-500'}`} />
                      ) : (
                        <ToggleLeft weight="regular" className="w-9 h-9 text-surface-300 dark:text-surface-600 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold transition-colors ${enabled ? (isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white') : 'text-surface-400 dark:text-surface-500'}`}>
                          {t(`features.modules.${mod.id}.name`)}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all ${
                          enabled
                            ? isIndia ? 'bg-[#138808]/10 text-[#138808]' : 'bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400'
                            : 'bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500'
                        }`}>
                          {enabled ? t('features.enabled') : t('features.disabled')}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 font-medium leading-relaxed transition-colors ${enabled ? (isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400') : 'text-surface-400 dark:text-surface-600'}`}>
                        {t(`features.modules.${mod.id}.desc`)}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedHelp(helpOpen ? null : mod.id)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                        helpOpen 
                          ? isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-accent-100 dark:bg-accent-900/20 text-accent-600' 
                          : isIndia ? 'text-[#000080]/20 hover:bg-[#000080]/5' : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
                      }`}
                    >
                      <Info weight={helpOpen ? 'fill' : 'bold'} className="w-5 h-5" />
                    </button>
                  </div>
                  <AnimatePresence>
                    {helpOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={`mt-3 ml-13 p-4 rounded-xl border transition-colors ${isIndia ? 'bg-[#000080]/5 border-[#000080]/10 text-[#000080]/70' : 'bg-surface-50 dark:bg-surface-800/40 border-surface-200/50 dark:border-surface-700/50 text-surface-600 dark:text-surface-400'}`}>
                          <p className="text-xs font-medium leading-relaxed italic">
                            {t(`features.modules.${mod.id}.help`)}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Compliance */}
      <motion.div variants={item} className={`rounded-[2rem] p-5 border-l-4 transition-all ${isIndia ? 'bg-white border-[#138808] border border-y border-r border-[#FF9933]/10 shadow-sm shadow-[#138808]/5' : 'card p-4 border-l-emerald-500'}`}>
        <div className="flex items-start gap-4">
          <ShieldCheck weight="fill" className={`w-6 h-6 flex-shrink-0 mt-0.5 ${isIndia ? 'text-[#138808]' : 'text-emerald-500'}`} />
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.2em] mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'INDIAN REGULATORY STANDARDS' : t('features.compliance.title')}
            </p>
            <ul className="space-y-1.5">
              <ComplianceItem text={isIndia ? 'Digital Personal Data Protection (DPDP) Act, 2023 Compliant' : t('features.compliance.gdpr')} isIndia={isIndia} />
              <ComplianceItem text={isIndia ? 'RBI Guideline Compliant Payment Settlements' : t('features.compliance.audit')} isIndia={isIndia} />
              <ComplianceItem text={isIndia ? 'Indian Regional Data Sovereignty (Mumbai/Delhi Nodes)' : t('features.compliance.encryption')} isIndia={isIndia} />
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Save bar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-2xl active:scale-95 ${
                isIndia 
                  ? 'bg-[#FF9933] text-white shadow-[#FF9933]/40' 
                  : 'bg-primary-600 text-white shadow-primary-600/40'
              }`}
            >
              {saved ? (
                <><Check weight="bold" className="w-5 h-5" /> {t('features.saved')}</>
              ) : (
                <><FloppyDisk weight="bold" className="w-5 h-5" /> {t('features.saveChanges')}</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ActionBtn({ onClick, icon, label, isIndia }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
        isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10 hover:shadow-sm' : 'btn btn-secondary'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ComplianceItem({ text, isIndia }) {
  return (
    <li className={`text-[11px] font-bold leading-relaxed flex items-center gap-2 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
      <div className={`w-1 h-1 rounded-full ${isIndia ? 'bg-[#FF9933]' : 'bg-surface-400'}`} />
      {text}
    </li>
  );
}

import { useTheme } from '../context/ThemeContext';
export default AdminFeaturesPage;
