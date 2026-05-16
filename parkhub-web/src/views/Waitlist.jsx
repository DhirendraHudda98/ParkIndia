import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Queue, Check, X, Question, Clock, ArrowUp } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export function WaitlistPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const [lots, setLots] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [joining, setJoining] = useState(null);

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const statusColors = {
    waiting: isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    offered: isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    accepted: isIndia ? 'bg-[#000080]/20 text-[#000080]' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    declined: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const lotsRes = await fetch('/api/v1/lots').then(r => r.json());
      if (lotsRes.success) {
        const allLots = lotsRes.data || [];
        setLots(allLots);

        const fullLots = allLots.filter(l => l.available_slots === 0);
        const waitlistPromises = fullLots.map(async (lot) => {
          try {
            const res = await fetch(`/api/v1/lots/${lot.id}/waitlist`).then(r => r.json());
            if (res.success && res.data.entries.length > 0) {
              return res.data.entries;
            }
          } catch { /* ignore */ }
          return [];
        });
        const results = await Promise.all(waitlistPromises);
        setEntries(results.flat());
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleJoin(lotId) {
    setJoining(lotId);
    try {
      const res = await fetch(`/api/v1/lots/${lotId}/waitlist/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: 3 }),
      }).then(r => r.json());
      if (res.success) {
        toast.success(t('waitlistExt.joined'));
        loadData();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setJoining(null);
  }

  async function handleLeave(lotId) {
    try {
      const res = await fetch(`/api/v1/lots/${lotId}/waitlist`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        toast.success(t('waitlistExt.left'));
        loadData();
      }
    } catch {
      toast.error(t('common.error'));
    }
  }

  async function handleAccept(lotId, entryId) {
    try {
      const res = await fetch(`/api/v1/lots/${lotId}/waitlist/${entryId}/accept`, { method: 'POST' }).then(r => r.json());
      if (res.success) {
        toast.success(t('waitlistExt.accepted'));
        loadData();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  }

  async function handleDecline(lotId, entryId) {
    try {
      const res = await fetch(`/api/v1/lots/${lotId}/waitlist/${entryId}/decline`, { method: 'POST' }).then(r => r.json());
      if (res.success) {
        toast.success(t('waitlistExt.declined'));
        loadData();
      }
    } catch {
      toast.error(t('common.error'));
    }
  }

  const fullLots = lots.filter(l => l.available_slots === 0);
  const userEntryLotIds = new Set(entries.map(e => e.entry.lot_id));

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-surface-50'}`}>
            {t('waitlistExt.title')}
          </h1>
          <p className={`mt-1 ${isIndia ? 'text-[#000080]/70' : 'text-surface-500 dark:text-surface-400'}`}>
            {t('waitlistExt.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`p-2 rounded-lg transition-colors ${isIndia ? 'text-[#FF9933] hover:bg-[#FF9933]/10' : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'}`}
          aria-label={t('waitlistExt.helpLabel')}
        >
          <Question size={24} />
        </button>
      </div>

      {showHelp && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border text-sm transition-colors ${
            isIndia ? 'bg-[#FF9933]/10 border-[#FF9933]/20 text-[#FF9933]' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
          }`}
        >
          <p>{t('waitlistExt.help')}</p>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className={`animate-spin rounded-full h-8 w-8 border-2 border-t-transparent ${isIndia ? 'border-[#FF9933]' : 'border-primary-500'}`} />
        </div>
      ) : (
        <>
          {entries.length > 0 && (
            <div className="space-y-3">
              <h2 className={`text-lg font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-800 dark:text-surface-200'}`}>
                {t('waitlistExt.yourEntries')}
              </h2>
              {entries.map(wp => {
                const lot = lots.find(l => l.id === wp.entry.lot_id);
                return (
                  <motion.div
                    key={wp.entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border shadow-sm transition-all ${
                      isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Queue size={20} className={isIndia ? 'text-[#FF9933]' : 'text-primary-500'} />
                        <div>
                          <p className={`font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-surface-100'}`}>
                            {lot?.name || wp.entry.lot_id}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[wp.entry.status]}`}>
                              {t(`waitlistExt.status.${wp.entry.status}`)}
                            </span>
                            {wp.entry.status === 'waiting' && (
                              <span className={`text-xs flex items-center gap-1 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>
                                <ArrowUp size={12} />
                                {t('waitlistExt.position', { pos: wp.position })}
                              </span>
                            )}
                            {wp.estimated_wait_minutes != null && wp.entry.status === 'waiting' && (
                              <span className={`text-xs flex items-center gap-1 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>
                                <Clock size={12} />
                                {t('waitlistExt.estimatedWait', { minutes: wp.estimated_wait_minutes })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {wp.entry.status === 'offered' && (
                          <>
                            <button
                              onClick={() => handleAccept(wp.entry.lot_id, wp.entry.id)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors text-white ${
                                isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-green-500 hover:bg-green-600'
                              }`}
                            >
                              <Check size={16} /> {t('waitlistExt.accept')}
                            </button>
                            <button
                              onClick={() => handleDecline(wp.entry.lot_id, wp.entry.id)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                isIndia ? 'bg-[#000080]/10 text-[#000080] hover:bg-[#000080]/20' : 'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-300'
                              }`}
                            >
                              <X size={16} /> {t('waitlistExt.decline')}
                            </button>
                          </>
                        )}
                        {wp.entry.status === 'waiting' && (
                          <button
                            onClick={() => handleLeave(wp.entry.lot_id)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              isIndia ? 'text-red-600 hover:bg-red-50' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                          >
                            {t('waitlistExt.leave')}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {fullLots.length > 0 && (
            <div className="space-y-3">
              <h2 className={`text-lg font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-800 dark:text-surface-200'}`}>
                {t('waitlistExt.fullLots')}
              </h2>
              {fullLots
                .filter(l => !userEntryLotIds.has(l.id))
                .map(lot => (
                  <motion.div
                    key={lot.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border shadow-sm flex items-center justify-between transition-all ${
                      isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 shadow-sm'
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-surface-100'}`}>{lot.name}</p>
                      <p className={`text-xs mt-0.5 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>
                        {t('waitlistExt.lotFull', { total: lot.total_slots })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoin(lot.id)}
                      disabled={joining === lot.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 ${
                        isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-500 hover:bg-primary-600'
                      }`}
                    >
                      <Bell size={16} />
                      {joining === lot.id ? t('waitlistExt.joiningWaitlist') : t('waitlistExt.joinWaitlist')}
                    </button>
                  </motion.div>
                ))}
            </div>
          )}

          {fullLots.length === 0 && entries.length === 0 && (
            <div className={`text-center py-12 ${isIndia ? 'text-[#000080]/40' : 'text-surface-400'}`}>
              <Queue size={48} className="mx-auto mb-3 opacity-40" />
              <p>{t('waitlistExt.noFullLots')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default WaitlistPage;
