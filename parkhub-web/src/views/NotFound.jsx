import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CarSimple, ArrowLeft, WarningCircle } from '@phosphor-icons/react';
import { useTheme } from '../context/ThemeContext';

export function NotFoundPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';

  return (
    <main className={`min-h-dvh flex items-center justify-center px-6 ${isIndia ? 'bg-white' : 'bg-surface-50'}`}>
      <div className="text-center max-w-md">
        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl ${isIndia ? 'bg-[#000080] text-[#FF9933]' : 'bg-primary-600 text-white'}`}>
          <WarningCircle weight="bold" size={40} />
        </div>
        
        <div className="relative mb-6">
           <h2 className={`text-9xl font-black opacity-5 ${isIndia ? 'text-[#000080]' : ''}`}>404</h2>
           <h1 className={`absolute inset-0 flex items-center justify-center text-2xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>
             {isIndia ? 'Path Obstruction' : t('notFound.title')}
           </h1>
        </div>

        <p className={`text-sm font-medium mb-10 ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
          {isIndia ? 'The requested regional hub coordinates could not be located in our registry.' : t('notFound.description')}
        </p>

        <Link 
          to="/" 
          className={`inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl transition-all hover:scale-105 ${isIndia ? 'bg-[#FF9933]' : 'bg-primary-600'}`}
        >
          <ArrowLeft weight="bold" />
          {t('notFound.backToDashboard')}
        </Link>
      </div>
    </main>
  );
}

export default NotFoundPage;
