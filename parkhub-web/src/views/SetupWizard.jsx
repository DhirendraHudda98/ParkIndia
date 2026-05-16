import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Buildings, MapTrifold, Users, Palette, CaretRight, CaretLeft, Check, Sparkle } from '@phosphor-icons/react';
import { useTheme } from '../context/ThemeContext';

const THEMES = [
  { id: 'india', label: 'India Heritage', color: 'bg-[#FF9933]' },
  { id: 'void', label: 'Deep Void', color: 'bg-slate-900' },
  { id: 'classic', label: 'Classic Blue', color: 'bg-blue-600' },
  { id: 'glass', label: 'Glassmorphism', color: 'bg-sky-400/60' },
  { id: 'bento', label: 'Bento Grid', color: 'bg-amber-500' },
  { id: 'neon', label: 'Cyber Neon', color: 'bg-fuchsia-500' },
];

const TIMEZONES = [
  'Asia/Kolkata', 'UTC', 'Europe/Berlin', 'Europe/London', 'America/New_York', 'Asia/Tokyo',
];

export function SetupWizardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [logoBase64, setLogoBase64] = useState(null);
  const [lotName, setLotName] = useState('');
  const [floorCount, setFloorCount] = useState(1);
  const [slotsPerFloor, setSlotsPerFloor] = useState(10);
  const [inviteEmails, setInviteEmails] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('india');

  useEffect(() => {
    fetch('/api/v1/setup/wizard/status')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.completed) {
          navigate('/', { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const submitStep = async () => {
    setLoading(true);
    setError(null);

    let body = { step: currentStep };
    switch (currentStep) {
      case 1:
        if (!companyName.trim()) { setError(t('setup.companyNameRequired')); setLoading(false); return; }
        body = { ...body, company_name: companyName, timezone, logo_base64: logoBase64 };
        break;
      case 2:
        if (!lotName.trim()) { setError(t('setup.lotNameRequired')); setLoading(false); return; }
        body = { ...body, lot_name: lotName, floor_count: floorCount, slots_per_floor: slotsPerFloor };
        break;
      case 3:
        body = { ...body, invite_emails: inviteEmails.split(',').map(e => e.trim()).filter(e => e.includes('@')) };
        break;
      case 4:
        body = { ...body, theme: selectedTheme };
        break;
    }

    try {
      const res = await fetch('/api/v1/setup/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
        else navigate('/', { replace: true });
      } else {
        setError(json.error?.message || 'Failed to save');
      }
    } catch {
      setError(t('setup.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { icon: <Buildings weight="bold" />, label: 'Organization' },
    { icon: <MapTrifold weight="bold" />, label: 'Regional Hub' },
    { icon: <Users weight="bold" />, label: 'Onboarding' },
    { icon: <Palette weight="bold" />, label: 'Branding' },
  ];

  return (
    <div className={`min-h-dvh flex flex-col items-center justify-center p-6 transition-colors duration-1000 ${isVoid ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="w-full max-w-2xl relative">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 opacity-20">
           <Sparkle weight="fill" size={120} className={isIndia ? 'text-[#FF9933]' : 'text-primary-500'} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
           <h1 className={`text-4xl font-black tracking-tighter mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Establish Regional Hub' : t('setup.title')}
           </h1>
           <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              Complete the foundational registry for your Indian heritage parking network.
           </p>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-16 relative px-10">
           <div className="absolute top-5 left-10 right-10 h-0.5 bg-surface-100 dark:bg-surface-800 -z-10" />
           {steps.map((s, i) => (
             <div key={i} className="flex flex-col items-center gap-4 relative z-10">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 ${
                  i + 1 < currentStep 
                    ? (isIndia ? 'bg-[#138808] border-[#138808] text-white' : 'bg-primary-600 border-primary-600 text-white')
                    : i + 1 === currentStep
                    ? (isIndia ? 'bg-white border-[#FF9933] text-[#FF9933]' : 'bg-white border-primary-600 text-primary-600')
                    : 'bg-white border-surface-100 text-surface-200 dark:bg-slate-900 dark:border-slate-800'
                }`}>
                   {i + 1 < currentStep ? <Check weight="bold" size={18} /> : s.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${i + 1 <= currentStep ? (isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white') : 'text-surface-300'}`}>
                   {s.label}
                </span>
             </div>
           ))}
        </div>

        {/* Form Container */}
        <motion.div 
           key={currentStep}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className={`rounded-[3rem] p-12 border shadow-2xl transition-all ${isVoid ? 'bg-slate-900 border-slate-800 shadow-slate-950' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-[#000080]/5' : 'bg-white border-surface-200'}`}
        >
           <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <div className="space-y-8">
                   <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>Organizational Identity</h2>
                   <div className="space-y-6">
                      <FormGroup label="Entity Name" isIndia={isIndia}>
                         <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. ParkIndia Maharashtra Hub" className="input-field w-full" />
                      </FormGroup>
                      <FormGroup label="Operations Timezone" isIndia={isIndia}>
                         <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input-field w-full py-3">
                            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                         </select>
                      </FormGroup>
                      <FormGroup label="Heritage Symbol (Logo)" isIndia={isIndia}>
                         <div className="flex items-center gap-6">
                            <label className={`cursor-pointer px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-50 text-surface-600'}`}>
                               Select File
                               <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                            {logoBase64 && <img src={logoBase64} className="w-12 h-12 rounded-xl object-cover border" alt="preview" />}
                         </div>
                      </FormGroup>
                   </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                   <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>Regional Hub Registry</h2>
                   <div className="space-y-6">
                      <FormGroup label="Primary Hub Name" isIndia={isIndia}>
                         <input type="text" value={lotName} onChange={e => setLotName(e.target.value)} placeholder="e.g. Mumbai Central Depot" className="input-field w-full" />
                      </FormGroup>
                      <div className="grid grid-cols-2 gap-6">
                         <FormGroup label="Total Floors" isIndia={isIndia}>
                            <input type="number" value={floorCount} onChange={e => setFloorCount(Number(e.target.value))} className="input-field w-full" />
                         </FormGroup>
                         <FormGroup label="Units Per Floor" isIndia={isIndia}>
                            <input type="number" value={slotsPerFloor} onChange={e => setSlotsPerFloor(Number(e.target.value))} className="input-field w-full" />
                         </FormGroup>
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest text-center opacity-30 ${isIndia ? 'text-[#000080]' : ''}`}>
                         Total Hub Capacity: {floorCount * slotsPerFloor} Units
                      </p>
                   </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                   <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>Partner Onboarding</h2>
                   <div className="space-y-6">
                      <FormGroup label="Partner Email Registry" isIndia={isIndia}>
                         <textarea 
                           value={inviteEmails} 
                           onChange={e => setInviteEmails(e.target.value)} 
                           rows={4} 
                           placeholder="Enter emails separated by commas..." 
                           className="input-field w-full py-4 resize-none" 
                         />
                      </FormGroup>
                      <p className={`text-xs font-medium leading-relaxed ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
                         Your administrative account is already established. You may now register additional hub operators.
                      </p>
                   </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8">
                   <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>System Aesthetics</h2>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {THEMES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTheme(t.id)}
                          className={`p-6 rounded-[2rem] border-4 transition-all text-center ${selectedTheme === t.id ? (isIndia ? 'border-[#FF9933] bg-[#FF9933]/5' : 'border-primary-600 bg-primary-50') : 'border-surface-50 bg-white dark:bg-slate-800'}`}
                        >
                           <div className={`w-12 h-12 rounded-2xl mx-auto mb-4 shadow-lg ${t.color}`} />
                           <span className={`text-[10px] font-black uppercase tracking-widest ${selectedTheme === t.id ? (isIndia ? 'text-[#000080]' : 'text-primary-700') : 'text-surface-400'}`}>
                              {t.label}
                           </span>
                        </button>
                      ))}
                   </div>
                </div>
              )}
           </AnimatePresence>

           {error && (
             <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center text-xs font-black text-red-500 uppercase tracking-widest">{error}</motion.p>
           )}
        </motion.div>

        {/* Nav */}
        <div className="flex items-center justify-between mt-10">
           <button 
             onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
             disabled={currentStep === 1 || loading}
             className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-20 ${isIndia ? 'text-[#000080] hover:bg-[#000080]/5' : 'text-surface-400 hover:bg-surface-50'}`}
           >
              <CaretLeft weight="bold" />
              Back
           </button>
           <button 
             onClick={submitStep}
             disabled={loading}
             className={`flex items-center gap-4 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white transition-all shadow-2xl disabled:opacity-50 ${isIndia ? 'bg-[#FF9933] shadow-[#FF9933]/20' : 'bg-primary-600 shadow-primary-600/20'}`}
           >
              {loading ? 'Processing...' : currentStep === 4 ? 'Establish Hub' : 'Continue'}
              {!loading && <CaretRight weight="bold" />}
           </button>
        </div>
      </div>
    </div>
  );
}

function FormGroup({ label, children, isIndia }) {
  return (
    <div>
       <label className={`block text-[10px] font-black uppercase tracking-[0.3em] mb-3 ${isIndia ? 'text-[#000080]/40' : 'text-surface-400'}`}>{label}</label>
       {children}
    </div>
  );
}

export default SetupWizardPage;
