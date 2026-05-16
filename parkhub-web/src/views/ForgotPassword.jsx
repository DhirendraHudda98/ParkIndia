import { useActionState, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CarSimple, ArrowLeft, SpinnerGap, CheckCircle } from '@phosphor-icons/react';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const INITIAL_STATE = { sent: false };

async function forgotPasswordAction(_prev, formData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { sent: false };
  await api.forgotPassword(email).catch(() => undefined);
  return { sent: true };
}

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';
  
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, INITIAL_STATE);
  const [emailDraft, setEmailDraft] = useState('');

  return (
    <main className={`min-h-dvh flex items-center justify-center px-6 py-12 ${isVoid ? 'bg-slate-950' : 'bg-white'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link
          to="/login"
          className={`inline-flex items-center gap-2 text-sm mb-12 transition-colors ${isIndia ? 'text-[#000080]/40 hover:text-[#000080]' : 'text-surface-500 hover:text-primary-600'}`}
        >
          <ArrowLeft weight="bold" className="w-4 h-4" />
          {t('auth.signIn')}
        </Link>

        <div className="flex items-center gap-4 mb-12">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${isIndia ? 'bg-[#FF9933] shadow-[#FF9933]/20' : 'bg-primary-600 shadow-primary-500/20'}`}>
            <CarSimple weight="fill" className="w-6 h-6 text-white" />
          </div>
          <span className={`text-2xl font-black tracking-tighter ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {isIndia ? 'ParkIndia' : 'ParkHub'}
          </span>
        </div>

        {state.sent ? (
          <div className="space-y-6" role="status">
            <div className={`flex items-center gap-3 ${isIndia ? 'text-[#138808]' : 'text-emerald-600'}`}>
              <CheckCircle weight="fill" className="w-8 h-8" />
              <h1 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('forgotPassword.successTitle')}</h1>
            </div>
            <p className={`text-sm font-medium leading-relaxed ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
              {t('forgotPassword.successMessage')}
            </p>
            <Link to="/login" className={`flex items-center justify-center w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all shadow-xl ${isIndia ? 'bg-[#FF9933] shadow-[#FF9933]/20' : 'bg-primary-600'}`}>
              {t('forgotPassword.backToSignIn')}
            </Link>
          </div>
        ) : (
          <>
            <h1 className={`text-3xl font-black tracking-tight mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {t('forgotPassword.title')}
            </h1>
            <p className={`text-sm font-medium mb-10 ${isIndia ? 'text-[#000080]/50' : 'text-surface-500 dark:text-surface-400'}`}>
              {t('forgotPassword.subtitle')}
            </p>

            <form action={formAction} className="space-y-6">
              <div>
                <label htmlFor="email" className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isIndia ? 'text-[#000080]/40' : 'text-surface-700 dark:text-surface-300'}`}>
                  {t('forgotPassword.emailLabel')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  placeholder={t('auth.email')}
                  autoComplete="email"
                  className="input-field w-full"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !emailDraft.trim()}
                className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all shadow-xl disabled:opacity-50 ${isIndia ? 'bg-[#FF9933] shadow-[#FF9933]/20' : 'bg-primary-600'}`}
              >
                {isPending ? (
                  <><SpinnerGap weight="bold" className="w-5 h-5 animate-spin" /> {t('forgotPassword.sending')}</>
                ) : (
                  t('forgotPassword.sendResetLink')
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </main>
  );
}

export default ForgotPasswordPage;
