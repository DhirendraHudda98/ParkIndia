import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Buildings, House, UsersThree, Car, ArrowRight, ArrowLeft, Check,
  SunDim, Moon, ToggleLeft, ToggleRight, Info, ShieldCheck, Sparkle
} from '@phosphor-icons/react';
import { useUseCase } from '../context/UseCaseContext';
import { useTheme } from '../context/ThemeContext';
import { useBgClass } from '../components/GenerativeBg';
import {
  useFeatures,
  FEATURE_REGISTRY,
  USE_CASE_PRESETS,
} from '../context/FeaturesContext';

const USE_CASES = [
  { id: 'business', icon: Buildings, color: 'text-[#000080]', bg: 'bg-[#000080]/5', border: 'border-[#000080]/20' },
  { id: 'residential', icon: House, color: 'text-[#138808]', bg: 'bg-[#138808]/5', border: 'border-[#138808]/20' },
  { id: 'personal', icon: UsersThree, color: 'text-[#FF9933]', bg: 'bg-[#FF9933]/5', border: 'border-[#FF9933]/20' },
];

const CATEGORY_ORDER = ['core', 'collaboration', 'billing', 'admin', 'experience'];

export function UseCaseSelectorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUseCase } = useUseCase();
  const { resolved, setTheme, designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';
  const { setFeatures } = useFeatures();

  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState('usecase');
  const [localFeatures, setLocalFeatures] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState(null);

  const handleUseCaseContinue = () => {
    if (!selected) return;
    const preset = USE_CASE_PRESETS[selected];
    setLocalFeatures([...preset]);
    setStep('features');
  };

  const handleFeatureToggle = (id) => {
    setLocalFeatures(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleFinish = () => {
    if (!selected) return;
    setConfirmed(true);
    setUseCase(selected);
    setFeatures(localFeatures);
    setTimeout(() => navigate('/welcome'), 400);
  };

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    modules: FEATURE_REGISTRY.filter(f => f.category === cat),
  })).filter(g => g.modules.length > 0);

  const bgClass = useBgClass('hatch');

  return (
    <main className={`min-h-dvh ${isVoid ? 'bg-slate-950' : isIndia ? 'bg-white' : 'bg-surface-50'} relative overflow-hidden p-6`}>
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#FF9933 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-3rem)]">
         {/* Logo */}
         <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-12">
            <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl ${isIndia ? 'bg-[#000080] text-[#FF9933]' : 'bg-primary-900 text-white'}`}>
               <Car weight="fill" size={32} />
            </div>
         </motion.div>

         <AnimatePresence mode="wait">
            {step === 'usecase' ? (
              <motion.div key="uc" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full text-center">
                 <h1 className={`text-5xl font-black tracking-tighter mb-4 ${isIndia ? 'text-[#000080]' : ''}`}>
                    {isIndia ? 'Regional Infrastructure Architect' : t('useCase.title')}
                    <Sparkle weight="fill" className="inline ml-3 text-yellow-400" />
                 </h1>
                 <p className={`text-sm font-medium mb-12 max-w-xl mx-auto ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
                    Define the core operational blueprint for your localized parking ecosystem.
                 </p>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                    {USE_CASES.map(uc => (
                      <button
                        key={uc.id}
                        onClick={() => setSelected(uc.id)}
                        className={`group relative rounded-[3rem] p-10 border-4 transition-all text-left overflow-hidden ${selected === uc.id ? (isIndia ? 'border-[#FF9933] bg-white shadow-2xl shadow-[#FF9933]/10 scale-105' : 'border-primary-600 bg-white') : 'border-transparent bg-surface-50/50 hover:bg-surface-50'}`}
                      >
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${uc.bg} ${uc.color}`}>
                            <uc.icon weight="bold" size={28} />
                         </div>
                         <h3 className={`text-xl font-black mb-2 ${isIndia ? 'text-[#000080]' : ''}`}>{t(`useCase.${uc.id}.name`)}</h3>
                         <p className="text-xs font-medium opacity-50 mb-6 leading-relaxed">{t(`useCase.${uc.id}.desc`)}</p>
                         
                         <div className="space-y-2">
                            {[1,2].map(n => (
                              <div key={n} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-30">
                                 <Check weight="bold" />
                                 {t(`useCase.${uc.id}.feature${n}`)}
                              </div>
                            ))}
                         </div>

                         {selected === uc.id && (
                           <motion.div layoutId="check" className={`absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-white ${isIndia ? 'bg-[#138808]' : 'bg-primary-600'}`}>
                              <Check weight="bold" />
                           </motion.div>
                         )}
                      </button>
                    ))}
                 </div>

                 <button 
                   onClick={handleUseCaseContinue} 
                   disabled={!selected}
                   className={`px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] text-white shadow-2xl transition-all disabled:opacity-20 ${isIndia ? 'bg-[#000080] shadow-[#000080]/20 hover:scale-105' : 'bg-primary-600'}`}
                 >
                    Continue to Configuration
                    <ArrowRight weight="bold" className="inline ml-3" />
                 </button>
              </motion.div>
            ) : (
              <motion.div key="feat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
                 <div className="text-center mb-12">
                    <h2 className={`text-4xl font-black tracking-tighter mb-3 ${isIndia ? 'text-[#000080]' : ''}`}>Engine Capabilities</h2>
                    <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>Customize your regional hub features for maximum efficiency.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {grouped.map(({ category, modules }) => (
                      <div key={category} className="space-y-4">
                         <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-30 ${isIndia ? 'text-[#000080]' : ''}`}>
                            {category} modules
                         </h4>
                         <div className="space-y-3">
                            {modules.map(mod => {
                              const enabled = localFeatures.includes(mod.id);
                              return (
                                <button
                                  key={mod.id}
                                  onClick={() => handleFeatureToggle(mod.id)}
                                  className={`w-full flex items-center gap-6 p-6 rounded-[2.5rem] border transition-all text-left ${enabled ? (isIndia ? 'border-[#FF9933]/20 bg-white shadow-lg' : 'border-primary-100 bg-white shadow-sm') : 'border-transparent bg-surface-50/50'}`}
                                >
                                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${enabled ? (isIndia ? 'bg-[#138808] text-white' : 'bg-primary-600 text-white') : 'bg-surface-200 text-surface-400'}`}>
                                      {enabled ? <Check weight="bold" /> : <ToggleLeft weight="bold" size={24} />}
                                   </div>
                                   <div className="flex-1">
                                      <div className={`text-xs font-black uppercase tracking-widest ${enabled ? (isIndia ? 'text-[#000080]' : '') : 'opacity-30'}`}>{t(`features.modules.${mod.id}.name`)}</div>
                                      <p className="text-[10px] font-medium opacity-50 mt-1 line-clamp-1">{t(`features.modules.${mod.id}.desc`)}</p>
                                   </div>
                                </button>
                              );
                            })}
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="flex items-center justify-between border-t border-surface-100 pt-10">
                    <button onClick={() => setStep('usecase')} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${isIndia ? 'text-[#000080] hover:bg-[#000080]/5' : 'text-surface-400'}`}>
                       <ArrowLeft weight="bold" />
                       Back
                    </button>
                    <button 
                      onClick={handleFinish}
                      disabled={confirmed}
                      className={`px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] text-white shadow-2xl transition-all ${confirmed ? 'bg-[#138808]' : (isIndia ? 'bg-[#FF9933] shadow-[#FF9933]/20 hover:scale-105' : 'bg-primary-600')}`}
                    >
                       {confirmed ? 'Activating Heritage Engine...' : 'Finalize Infrastructure'}
                       {!confirmed && <ArrowRight weight="bold" className="inline ml-3" />}
                    </button>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>
    </main>
  );
}

export default UseCaseSelectorPage;
