import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, SunDim, Moon, CarSimple, Sparkle, Buildings, ShieldCheck, Globe
} from '@phosphor-icons/react';
import { useTheme } from '../context/ThemeContext';

const GREETINGS = [
  { text: 'Namaste', flag: '🇮🇳' },
  { text: 'Welcome', flag: '🇬🇧' },
  { text: 'Vanakkam', flag: '🇮🇳' },
  { text: 'Satsriakal', flag: '🇮🇳' },
];

export function WelcomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { resolved, setTheme, designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  
  const [greetingIdx, setGreetingIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setGreetingIdx(prev => (prev + 1) % GREETINGS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  function handleGetStarted() {
    localStorage.setItem('parkhub_welcome_seen', '1');
    const toured = localStorage.getItem('parkhub_onboarding_v5_seen') === '1';
    navigate(toured ? '/login' : '/tour');
  }

  const currentGreeting = GREETINGS[greetingIdx];

  return (
    <div className={`min-h-dvh relative overflow-hidden flex flex-col ${isIndia ? 'bg-white' : 'mesh-gradient-animated'}`}>
      {/* Heritage Accents */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
         <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#FF9933 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
         <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${isIndia ? 'bg-[#000080] text-[#FF9933]' : 'bg-primary-600 text-white'}`}>
               <CarSimple weight="fill" size={22} />
            </div>
            <span className={`text-xl font-black tracking-tight ${isIndia ? 'text-[#000080]' : ''}`}>ParkIndia</span>
         </div>
         <button onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')} className="p-3 hover:bg-surface-100 rounded-2xl transition-all">
            {resolved === 'dark' ? <SunDim weight="bold" size={20} /> : <Moon weight="bold" size={20} />}
         </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-8 sm:px-20 max-w-5xl">
         <div className="h-32 mb-6 flex items-center">
            <AnimatePresence mode="wait">
               <motion.div 
                 key={greetingIdx}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ duration: 0.5 }}
                 className="flex items-center gap-6"
               >
                  <h1 className={`text-6xl sm:text-8xl font-black tracking-tighter ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>
                     {currentGreeting.text}
                  </h1>
                  <span className="text-5xl sm:text-7xl">{currentGreeting.flag}</span>
               </motion.div>
            </AnimatePresence>
         </div>

         <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className={`text-xl sm:text-2xl font-medium mb-12 max-w-2xl leading-relaxed ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>
            {isIndia ? t('welcome.heritageSubtitle') : t('welcome.subtitle')}
         </motion.p>

         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-wrap gap-10 mb-16">
            <Feature icon={<Buildings />} text={t('welcome.smartHubs')} />
            <Feature icon={<ShieldCheck />} text={t('welcome.secureEntry')} />
            <Feature icon={<Globe />} text={t('welcome.regionalSupport')} />
         </motion.div>

         <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}>
            <button 
              onClick={handleGetStarted}
              className={`group flex items-center gap-4 px-12 py-6 rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] text-white shadow-2xl transition-all ${isIndia ? 'bg-[#FF9933] shadow-[#FF9933]/20 hover:scale-105' : 'bg-primary-600'}`}
            >
               {t('welcome.getStarted')}
               <ArrowRight weight="bold" className="transition-transform group-hover:translate-x-2" />
            </button>
         </motion.div>
      </main>

      {/* Decorative Orb */}
      <div className={`absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-all ${isIndia ? 'bg-[#FF9933]/10' : 'bg-primary-500/10'}`} />
    </div>
  );
}

function Feature({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
       <div className="text-[#FF9933] opacity-60">{icon}</div>
       <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{text}</span>
    </div>
  );
}

export default WelcomePage;
