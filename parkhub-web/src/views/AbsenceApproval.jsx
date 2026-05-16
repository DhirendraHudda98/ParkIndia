import { useActionState, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Check, X, Clock, Question, PaperPlaneTilt, ChatText,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const typeLabels = {
  vacation: 'absenceApproval.types.vacation',
  sick: 'absenceApproval.types.sick',
  homeoffice: 'absenceApproval.types.homeoffice',
  business_trip: 'absenceApproval.types.businessTrip',
  personal: 'absenceApproval.types.personal',
  other: 'absenceApproval.types.other',
};

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' });
}

// ── User Submission Form ──
function SubmitForm({ onSubmitted }) {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [absenceType, setAbsenceType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const [, submitAction, isSubmitting] = useActionState(async () => {
    if (!startDate || !endDate || !reason.trim()) {
      toast.error(t('absenceApproval.requiredFields'));
      return null;
    }
    try {
      const res = await api.submitAbsenceRequest({ absence_type: absenceType, start_date: startDate, end_date: endDate, reason });
      if (res.success) {
        toast.success(t('absenceApproval.submitted'));
        setStartDate(''); setEndDate(''); setReason('');
        onSubmitted();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    return null;
  }, null);

  const inputClass = `w-full mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 transition-colors ${
    isVoid 
      ? 'bg-slate-900 border-slate-700 text-white focus:ring-cyan-500' 
      : isIndia 
      ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:ring-[#FF9933] focus:border-[#FF9933]' 
      : 'bg-white dark:bg-surface-900 border-surface-300 dark:border-surface-600 text-surface-900 dark:text-surface-100 focus:ring-primary-500'
  }`;

  return (
    <form action={submitAction} className={`space-y-4 rounded-xl p-4 border transition-colors ${
      isVoid ? 'bg-slate-900/50 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
    }`}>
      <h3 className={`font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-surface-100'}`}>
        {isIndia ? 'Request Leave — ParkIndia Hub' : t('absenceApproval.submitTitle')}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-600 dark:text-surface-400'}`}>{t('absenceApproval.type')}</label>
          <select value={absenceType} onChange={e => setAbsenceType(e.target.value)} className={inputClass}>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>{t(label)}</option>
            ))}
          </select>
        </div>
        <div />
        <div>
          <label className={`text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-600 dark:text-surface-400'}`}>{t('absenceApproval.startDate')}</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={`text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-600 dark:text-surface-400'}`}>{t('absenceApproval.endDate')}</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={`text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-600 dark:text-surface-400'}`}>{t('absenceApproval.reason')}</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={t('absenceApproval.reasonPlaceholder')} rows={2} className={inputClass + ' resize-none'} />
      </div>
      <button 
        type="submit" 
        disabled={isSubmitting} 
        className={`w-full py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2 ${
          isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
        }`}
      >
        <PaperPlaneTilt size={18} />
        {isSubmitting ? t('absenceApproval.submitting') : t('absenceApproval.submitBtn')}
      </button>
    </form>
  );
}

// ── Admin Pending Queue ──
function AdminPendingQueue({ requests, onAction }) {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const statusColors = {
    pending: isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const [comment, setComment] = useState({});
  const [processing, setProcessing] = useState(null);

  async function handleApprove(id) {
    setProcessing(id);
    try {
      const res = await api.approveAbsenceRequest(id, comment[id] || undefined);
      if (res.success) {
        toast.success(t('absenceApproval.approved'));
        onAction();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch { toast.error(t('common.error')); }
    setProcessing(null);
  }

  async function handleReject(id) {
    if (!comment[id]?.trim()) {
      toast.error(t('absenceApproval.rejectReasonRequired'));
      return;
    }
    setProcessing(id);
    try {
      const res = await api.rejectAbsenceRequest(id, comment[id]);
      if (res.success) {
        toast.success(t('absenceApproval.rejected'));
        onAction();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch { toast.error(t('common.error')); }
    setProcessing(null);
  }

  if (requests.length === 0) {
    return (
      <div className={`text-center py-8 ${isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-surface-400'}`}>
        <Check size={32} className="mx-auto mb-2 opacity-50" />
        <p>{t('absenceApproval.noPending')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 border transition-colors ${
            isVoid ? 'bg-slate-900/50 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
          }`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className={`font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-surface-100'}`}>{req.user_name}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                {t(`absenceApproval.status.${req.status}`)}
              </span>
            </div>
            <span className={`text-xs ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t(typeLabels[req.absence_type] || req.absence_type)}</span>
          </div>
          <div className={`text-sm mb-2 ${isIndia ? 'text-[#000080]/70' : 'text-surface-600 dark:text-surface-400'}`}>
            <Calendar size={14} className="inline mr-1" />
            {formatDate(req.start_date)} — {formatDate(req.end_date)}
          </div>
          <p className={`text-sm mb-3 ${isIndia ? 'text-[#000080]/80' : 'text-surface-700 dark:text-surface-300'}`}>{req.reason}</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('absenceApproval.commentPlaceholder')}
              value={comment[req.id] || ''}
              onChange={e => setComment(c => ({ ...c, [req.id]: e.target.value }))}
              className={`flex-1 px-3 py-1.5 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-1 ${
                isVoid 
                  ? 'bg-slate-950 border-slate-700 text-white focus:ring-cyan-500' 
                  : isIndia 
                  ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:ring-[#FF9933]' 
                  : 'bg-white dark:bg-surface-900 border-surface-300 dark:border-surface-600 text-surface-900 dark:text-surface-100 focus:ring-primary-500'
              }`}
            />
            <button onClick={() => handleApprove(req.id)} disabled={processing === req.id}
              className={`px-3 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1 ${
                isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-green-600 hover:bg-green-700'
              }`}>
              <Check size={14} /> {t('absenceApproval.approveBtn')}
            </button>
            <button onClick={() => handleReject(req.id)} disabled={processing === req.id}
              className={`px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1`}>
              <X size={14} /> {t('absenceApproval.rejectBtn')}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main Page ──
export function AbsenceApprovalPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const statusColors = {
    pending: isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const [myRequests, setMyRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [tab, setTab] = useState('my');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const myRes = await api.myAbsenceRequests();
      if (myRes.success && myRes.data) setMyRequests(myRes.data);

      try {
        const pendingRes = await api.pendingAbsenceRequests();
        if (pendingRes.success && pendingRes.data) {
          setPendingRequests(pendingRes.data);
          setIsAdmin(true);
        }
      } catch { /* not admin */ }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-surface-100'}`}>
            {isIndia ? 'Absence & Leave Hub' : t('absenceApproval.title')}
          </h1>
          <p className={`text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
            {isIndia ? 'Manage your leave requests and team availability.' : t('absenceApproval.subtitle')}
          </p>
        </div>
        <button 
          onClick={() => setShowHelp(!showHelp)} 
          className={`p-2 rounded-lg transition-colors ${isIndia ? 'text-[#FF9933] hover:bg-[#FF9933]/10' : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500'}`} 
          title={t('absenceApproval.helpLabel')}
        >
          <Question size={20} />
        </button>
      </div>

      {/* Help tooltip */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`mb-4 p-3 rounded-lg border text-sm flex items-start gap-2 transition-colors ${
              isIndia 
                ? 'bg-[#FF9933]/10 border-[#FF9933]/20 text-[#FF9933]' 
                : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300'
            }`}>
            <ChatText size={18} className="mt-0.5 shrink-0" />
            <span>{t('absenceApproval.help')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit form */}
      <div className="mb-6">
        <SubmitForm onSubmitted={loadData} />
      </div>

      {/* Tabs */}
      {isAdmin && (
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => setTab('my')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'my' 
                ? isIndia ? 'bg-[#000080] text-white' : 'bg-primary-600 text-white' 
                : isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            {t('absenceApproval.myRequests')}
          </button>
          <button 
            onClick={() => setTab('admin')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              tab === 'admin' 
                ? isIndia ? 'bg-[#000080] text-white' : 'bg-primary-600 text-white' 
                : isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            {t('absenceApproval.pendingQueue')}
            {pendingRequests.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-white text-xs ${isIndia ? 'bg-[#FF9933]' : 'bg-amber-500'}`}>{pendingRequests.length}</span>
            )}
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className={`text-center py-8 ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>{t('common.loading')}</div>
      ) : tab === 'admin' && isAdmin ? (
        <AdminPendingQueue requests={pendingRequests} onAction={loadData} />
      ) : (
        <div className="space-y-3">
          {myRequests.length === 0 ? (
            <div className={`text-center py-8 ${isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-surface-400'}`}>
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p>{t('absenceApproval.noRequests')}</p>
            </div>
          ) : (
            myRequests.map(req => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 border transition-colors ${
                  isVoid ? 'bg-slate-900/50 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isIndia ? 'text-[#000080]/50' : 'text-surface-600 dark:text-surface-400'}`}>{t(typeLabels[req.absence_type] || req.absence_type)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                    {t(`absenceApproval.status.${req.status}`)}
                  </span>
                </div>
                <div className={`text-sm mb-1 ${isIndia ? 'text-[#000080]/70' : 'text-surface-700 dark:text-surface-300'}`}>
                  <Calendar size={14} className="inline mr-1" />
                  {formatDate(req.start_date)} — {formatDate(req.end_date)}
                </div>
                <p className={`text-sm ${isIndia ? 'text-[#000080]/80' : 'text-surface-600 dark:text-surface-400'}`}>{req.reason}</p>
                {req.reviewer_comment && (
                  <div className={`mt-2 p-2 rounded-lg text-sm flex items-start gap-1.5 ${
                    isIndia ? 'bg-[#000080]/5 text-[#000080]/70' : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                  }`}>
                    <ChatText size={14} className="mt-0.5 shrink-0" />
                    <span>{req.reviewer_comment}</span>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AbsenceApprovalPage;
