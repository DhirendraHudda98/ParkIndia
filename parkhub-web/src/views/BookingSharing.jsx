import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareNetwork, Link as LinkIcon, Copy, Envelope, Question, Trash, CheckCircle, X, SpinnerGap } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export function BookingSharingModal({ bookingId, bookingLabel, onClose }) {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('link');
  const [shareLink, setShareLink] = useState(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [expiryHours, setExpiryHours] = useState(168);
  const [showHelp, setShowHelp] = useState(false);

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const createShareLink = useCallback(async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in_hours: expiryHours }),
      }).then(r => r.json());
      if (res.success) {
        setShareLink(res.data);
        toast.success(t('sharing.linkCreated'));
      } else {
        toast.error(res.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setCreating(false);
    }
  }, [bookingId, expiryHours, t]);

  const revokeLink = useCallback(async () => {
    setRevoking(true);
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/share`, {
        method: 'DELETE',
      }).then(r => r.json());
      if (res.success) {
        setShareLink(null);
        toast.success(t('sharing.linkRevoked'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setRevoking(false);
    }
  }, [bookingId, t]);

  const copyLink = useCallback(() => {
    if (!shareLink) return;
    const fullUrl = `${window.location.origin}${shareLink.url}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      toast.success(t('sharing.copied'));
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareLink, t]);

  const sendInvite = useCallback(async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error(t('sharing.invalidEmail'));
      return;
    }
    setInviting(true);
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, message: inviteMessage || null }),
      }).then(r => r.json());
      if (res.success) {
        toast.success(t('sharing.inviteSent', { email: inviteEmail }));
        setInviteEmail('');
        setInviteMessage('');
      } else {
        toast.error(res.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setInviting(false);
    }
  }, [bookingId, inviteEmail, inviteMessage, t]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl shadow-xl border w-full max-w-md overflow-hidden ${
        isVoid
          ? 'bg-slate-900 border-slate-700 text-white'
          : isIndia
          ? 'bg-white border-[#FF9933]/20 text-[#000080]'
          : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white'
      }`}
      data-testid="sharing-modal"
    >
      <div className={`flex items-center justify-between p-4 border-b ${
        isVoid ? 'border-slate-700' : isIndia ? 'border-[#FF9933]/10' : 'border-surface-200 dark:border-surface-700'
      }`}>
        <div className="flex items-center gap-2">
          <ShareNetwork size={20} className={isIndia ? 'text-[#FF9933]' : 'text-primary-500'} />
          <h2 className="font-semibold">
            {t('sharing.title')}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`p-1.5 rounded-lg transition ${
              isVoid ? 'hover:bg-slate-800' : 'hover:bg-surface-100 dark:hover:bg-surface-700'
            }`}
            aria-label={t('sharing.helpLabel')}
            data-testid="sharing-help-btn"
          >
            <Question size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${
                isVoid ? 'hover:bg-slate-800' : 'hover:bg-surface-100 dark:hover:bg-surface-700'
              }`}
              data-testid="sharing-close-btn"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`px-4 py-3 border-b ${
              isVoid 
                ? 'bg-cyan-900/20 border-cyan-800/50 text-cyan-200' 
                : isIndia 
                ? 'bg-[#FF9933]/5 border-[#FF9933]/10 text-[#FF9933]' 
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            }`}
            data-testid="sharing-help"
          >
            <p className="text-sm">
              {t('sharing.help')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex border-b ${isVoid ? 'border-slate-700' : isIndia ? 'border-[#FF9933]/10' : 'border-surface-200 dark:border-surface-700'}`}>
        <button
          onClick={() => setActiveTab('link')}
          className={`flex-1 py-2.5 text-sm font-medium text-center transition ${
            activeTab === 'link'
              ? isIndia ? 'text-[#FF9933] border-b-2 border-[#FF9933]' : 'text-primary-500 border-b-2 border-primary-500'
              : 'text-surface-500 hover:text-surface-700'
          }`}
          data-testid="tab-link"
        >
          <LinkIcon size={14} className="inline mr-1" />
          {t('sharing.tabLink')}
        </button>
        <button
          onClick={() => setActiveTab('invite')}
          className={`flex-1 py-2.5 text-sm font-medium text-center transition ${
            activeTab === 'invite'
              ? isIndia ? 'text-[#FF9933] border-b-2 border-[#FF9933]' : 'text-primary-500 border-b-2 border-primary-500'
              : 'text-surface-500 hover:text-surface-700'
          }`}
          data-testid="tab-invite"
        >
          <Envelope size={14} className="inline mr-1" />
          {t('sharing.tabInvite')}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'link' && (
          <div data-testid="link-panel">
            {!shareLink ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-surface-600 dark:text-surface-400">
                    {t('sharing.expiryLabel')}
                  </label>
                  <select
                    value={expiryHours}
                    onChange={e => setExpiryHours(Number(e.target.value))}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                      isVoid ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600'
                    }`}
                    data-testid="expiry-select"
                  >
                    <option value={24}>{t('sharing.expiry24h')}</option>
                    <option value={72}>{t('sharing.expiry3d')}</option>
                    <option value={168}>{t('sharing.expiry7d')}</option>
                    <option value={720}>{t('sharing.expiry30d')}</option>
                    <option value={0}>{t('sharing.expiryNever')}</option>
                  </select>
                </div>
                <button
                  onClick={createShareLink}
                  disabled={creating}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white transition disabled:opacity-50 ${
                    isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-500 hover:bg-primary-600'
                  }`}
                  data-testid="create-link-btn"
                >
                  {creating ? <SpinnerGap size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                  {creating ? t('sharing.creating') : t('sharing.createLink')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 rounded-lg p-3 ${
                  isVoid ? 'bg-slate-800' : 'bg-surface-50 dark:bg-surface-700'
                }`}>
                  <input
                    readOnly
                    value={`${window.location.origin}${shareLink.url}`}
                    className="flex-1 bg-transparent text-sm outline-none"
                    data-testid="share-url-input"
                  />
                  <button
                    onClick={copyLink}
                    className={`p-2 rounded-lg transition ${
                      isVoid ? 'hover:bg-slate-700' : 'hover:bg-surface-200 dark:hover:bg-surface-600'
                    }`}
                    data-testid="copy-link-btn"
                  >
                    {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
                {shareLink.expires_at && (
                  <p className="text-xs text-surface-500">
                    {t('sharing.expiresAt', { date: new Date(shareLink.expires_at).toLocaleDateString() })}
                  </p>
                )}
                <button
                  onClick={revokeLink}
                  disabled={revoking}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                  data-testid="revoke-link-btn"
                >
                  {revoking ? <SpinnerGap size={16} className="animate-spin" /> : <Trash size={16} />}
                  {t('sharing.revokeLink')}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invite' && (
          <div className="space-y-3" data-testid="invite-panel">
            <div>
              <label className="text-sm text-surface-600 dark:text-surface-400">
                {t('sharing.guestEmail')}
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder={t('sharing.emailPlaceholder')}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                  isVoid ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600'
                }`}
                data-testid="invite-email-input"
              />
            </div>
            <div>
              <label className="text-sm text-surface-600 dark:text-surface-400">
                {t('sharing.messageLabel')}
              </label>
              <textarea
                value={inviteMessage}
                onChange={e => setInviteMessage(e.target.value)}
                placeholder={t('sharing.messagePlaceholder')}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm h-20 resize-none ${
                  isVoid ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white dark:bg-surface-700 border-surface-300 dark:border-surface-600'
                }`}
                data-testid="invite-message-input"
              />
            </div>
            <button
              onClick={sendInvite}
              disabled={inviting || !inviteEmail}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white transition disabled:opacity-50 ${
                isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-500 hover:bg-primary-600'
              }`}
              data-testid="send-invite-btn"
            >
              {inviting ? <SpinnerGap size={16} className="animate-spin" /> : <Envelope size={16} />}
              {inviting ? t('sharing.sending') : t('sharing.sendInvite')}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
