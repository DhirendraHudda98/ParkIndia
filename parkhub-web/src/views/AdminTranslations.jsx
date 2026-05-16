import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Translate, SpinnerGap, Check, X, Clock, Eye,
  ThumbsUp, ThumbsDown, ChatCircleDots, ArrowsClockwise,
  CheckCircle, XCircle, MagnifyingGlass,
} from '@phosphor-icons/react';
import { api } from '../api/client';
import toast from 'react-hot-toast';
import { DataTable } from '../components/ui/DataTable';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useTheme } from '../context/ThemeContext';

const columnHelper = createColumnHelper();

const STATUS_COLORS = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-error',
};

const STATUS_ICONS = {
  pending: <Clock weight="bold" className="w-3 h-3" />,
  approved: <Check weight="bold" className="w-3 h-3" />,
  rejected: <X weight="bold" className="w-3 h-3" />,
};

export function AdminTranslationsPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [confirmState, setConfirmState] = useState({open: false, action: () => {}});

  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const res = await api.getTranslationProposals(status);
      if (res.success && res.data) setProposals(res.data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadProposals(); }, [loadProposals]);

  async function handleReview(id, status) {
    setSubmittingReview(true);
    try {
      const res = await api.reviewProposal(id, { status, comment: reviewComment || undefined });
      if (res.success && res.data) {
        setProposals(prev => prev.map(p => p.id === id ? res.data : p));
        toast.success(status === 'approved' ? t('translations.admin.approved') : t('translations.admin.rejected'));
        setReviewingId(null);
        setReviewComment('');
        setReviewAction(null);
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } finally {
      setSubmittingReview(false);
    }
  }

  function handleBulkAction(action) {
    const pending = proposals.filter(p => p.status === 'pending');
    if (pending.length === 0) return;

    setConfirmState({
      open: true,
      action: async () => {
        setConfirmState({open: false, action: () => {}});
        let success = 0;
        for (const p of pending) {
          const res = await api.reviewProposal(p.id, { status: action });
          if (res.success) success++;
        }
        toast.success(t('translations.admin.bulkComplete', { count: success }));
        loadProposals();
      },
    });
  }

  const filteredProposals = useMemo(() => {
    if (!search) return proposals;
    const q = search.toLowerCase();
    return proposals.filter(p =>
      p.key.toLowerCase().includes(q) ||
      p.proposed_value.toLowerCase().includes(q) ||
      p.proposed_by_name.toLowerCase().includes(q) ||
      p.language.toLowerCase().includes(q)
    );
  }, [proposals, search]);

  const pendingCount = proposals.filter(p => p.status === 'pending').length;

  const columns = useMemo(() => [
    columnHelper.accessor('key', {
      header: () => t('translations.keyLabel'),
      cell: info => (
        <div className="min-w-0">
          <code className={`text-xs font-mono px-1.5 py-0.5 rounded ${isIndia ? 'text-[#000080] bg-[#000080]/5' : 'text-primary-600 bg-surface-100 dark:bg-surface-800'}`}>
            {info.getValue()}
          </code>
          <p className={`text-[10px] font-black uppercase tracking-widest mt-1 opacity-40`}>{info.row.original.language}</p>
        </div>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('current_value', {
      header: () => t('translations.current'),
      cell: info => (
        <span className="text-sm text-red-600 dark:text-red-400 line-through opacity-70 truncate block max-w-[150px]">
          {info.getValue() || <em className="text-surface-400 no-underline">{t('translations.empty')}</em>}
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('proposed_value', {
      header: () => t('translations.proposed'),
      cell: info => (
        <span className={`text-sm font-bold truncate block max-w-[150px] ${isIndia ? 'text-[#138808]' : 'text-emerald-600'}`}>
          {info.getValue()}
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('proposed_by_name', {
      header: () => t('translations.admin.proposedBy'),
      cell: info => <span className={`text-sm font-medium ${isIndia ? 'text-[#000080]/70' : ''}`}>{info.getValue()}</span>,
      enableSorting: true,
    }),
    columnHelper.accessor('votes_for', {
      header: () => t('translations.score'),
      cell: info => {
        const p = info.row.original;
        const net = p.votes_for - p.votes_against;
        return (
          <div className="flex items-center gap-3 tabular-nums text-[11px] font-black">
            <span className="text-emerald-500"><ThumbsUp weight="bold" className="inline mr-1" />{p.votes_for}</span>
            <span className="text-red-400"><ThumbsDown weight="bold" className="inline mr-1" />{p.votes_against}</span>
            <span className={`px-2 py-0.5 rounded ${net > 0 ? 'bg-emerald-50 text-emerald-600' : net < 0 ? 'bg-red-50 text-red-600' : 'bg-surface-50 text-surface-400'}`}>
              {net > 0 ? '+' : ''}{net}
            </span>
          </div>
        );
      },
      enableSorting: true,
    }),
    columnHelper.accessor('status', {
      header: () => t('admin.status'),
      cell: info => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          info.getValue() === 'pending' ? (isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-100 text-amber-600') :
          info.getValue() === 'approved' ? (isIndia ? 'bg-[#138808]/10 text-[#138808]' : 'bg-emerald-100 text-emerald-600') :
          'bg-red-50 text-red-600'
        }`}>
          {STATUS_ICONS[info.getValue()]} {info.getValue()}
        </span>
      ),
      enableSorting: true,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: info => {
        const p = info.row.original;
        if (p.status !== 'pending') return null;
        return (
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => { setReviewingId(p.id); setReviewAction('approved'); setReviewComment(''); }}
              className={`p-2 rounded-xl transition-all ${isIndia ? 'text-[#138808]/40 hover:bg-[#138808]/5 hover:text-[#138808]' : 'text-emerald-500 hover:bg-emerald-50'}`}
              title={t('translations.admin.approve')}
            >
              <CheckCircle weight="bold" className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setReviewingId(p.id); setReviewAction('rejected'); setReviewComment(''); }}
              className="p-2 rounded-xl transition-all text-red-300 hover:bg-red-50 hover:text-red-500"
              title={t('translations.admin.reject')}
            >
              <XCircle weight="bold" className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setReviewingId(p.id); setReviewAction(null); setReviewComment(''); }}
              className={`p-2 rounded-xl transition-all ${isIndia ? 'text-[#000080]/40 hover:bg-[#000080]/5 hover:text-[#000080]' : 'text-surface-400 hover:bg-surface-50'}`}
              title={t('translations.admin.reviewDetail')}
            >
              <Eye weight="bold" className="w-5 h-5" />
            </button>
          </div>
        );
      },
    }),
  ], [t, isIndia]);

  const reviewProposal = reviewingId ? proposals.find(p => p.id === reviewingId) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 text-primary-500'}`}>
            <Translate weight="bold" className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Regional Dialect Review' : t('translations.admin.title')}
            </h2>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              {isIndia ? 'Moderate community translation proposals for Hindi, Marathi, and other regional scripts.' : t('translations.admin.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <>
              <button onClick={() => handleBulkAction('approved')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isIndia ? 'bg-[#138808] text-white' : 'bg-emerald-600 text-white'}`}>
                <CheckCircle weight="bold" className="w-4 h-4" />
                {t('translations.admin.approveAll')}
              </button>
              <button onClick={() => handleBulkAction('rejected')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-red-600 text-white transition-all">
                <XCircle weight="bold" className="w-4 h-4" />
                {t('translations.admin.rejectAll')}
              </button>
            </>
          )}
          <button onClick={loadProposals} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/40 hover:bg-[#000080]/5' : 'text-surface-400 hover:bg-surface-100'}`}>
            <ArrowsClockwise weight="bold" size={24} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass weight="bold" className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isIndia ? 'text-[#000080]/30' : 'text-surface-400'}`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isIndia ? 'Search proposed strings...' : t('translations.admin.searchProposals')}
            className="input-field pl-12 w-full"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input-field w-auto min-w-[200px]"
        >
          <option value="all">{t('translations.allStatuses')}</option>
          <option value="pending">{t('translations.statusPending')}</option>
          <option value="approved">{t('translations.statusApproved')}</option>
          <option value="rejected">{t('translations.statusRejected')}</option>
        </select>
      </div>

      {/* Review Detail Panel */}
      <AnimatePresence>
        {reviewProposal && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className={`rounded-[2.5rem] border p-8 space-y-6 ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-2xl shadow-[#000080]/10' : 'bg-white border-surface-200 shadow-sm'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>
                    {t('translations.admin.reviewProposal')}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">
                    {t('translations.proposedBy')} <span className={isIndia ? 'text-[#000080]' : ''}>{reviewProposal.proposed_by_name}</span>
                    {' · '}{new Date(reviewProposal.created_at).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => { setReviewingId(null); setReviewAction(null); }} className="p-2 rounded-xl text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <X weight="bold" className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <code className={`text-sm font-mono px-3 py-1 rounded-xl ${isIndia ? 'text-[#000080] bg-[#000080]/5' : 'bg-surface-50'}`}>
                  {reviewProposal.key}
                </code>
                <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-primary-50'}`}>{reviewProposal.language}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className={`rounded-3xl border p-6 ${isIndia ? 'bg-red-50/50 border-red-100' : 'bg-red-50/50'}`}>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">{t('translations.current')}</p>
                  <p className={`text-lg font-medium text-red-800 line-through opacity-40`}>{reviewProposal.current_value || t('translations.empty')}</p>
                </div>
                <div className={`rounded-3xl border p-6 ${isIndia ? 'bg-[#138808]/5 border-[#138808]/10' : 'bg-emerald-50/50'}`}>
                  <p className="text-[10px] font-black text-[#138808] uppercase tracking-widest mb-3">{t('translations.proposed')}</p>
                  <p className={`text-xl font-black ${isIndia ? 'text-[#000080]' : 'text-emerald-800'}`}>{reviewProposal.proposed_value}</p>
                </div>
              </div>

              {reviewProposal.status === 'pending' && (
                <div className="pt-8 border-t border-surface-100 dark:border-surface-800 space-y-6">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isIndia ? 'text-[#000080]/40' : ''}`}>
                      {t('translations.admin.comment')}
                    </label>
                    <input
                      type="text"
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      className="input-field w-full"
                      placeholder={t('translations.admin.commentPlaceholder')}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleReview(reviewProposal.id, 'approved')}
                      disabled={submittingReview}
                      className={`flex-1 py-4 rounded-2xl font-black text-white transition-all shadow-xl disabled:opacity-50 ${isIndia ? 'bg-[#138808]' : 'bg-emerald-600'}`}
                    >
                      {submittingReview && reviewAction === 'approved' ? <SpinnerGap weight="bold" className="w-5 h-5 animate-spin mx-auto" /> : t('translations.admin.approve')}
                    </button>
                    <button
                      onClick={() => handleReview(reviewProposal.id, 'rejected')}
                      disabled={submittingReview}
                      className="flex-1 py-4 rounded-2xl font-black bg-red-600 text-white transition-all shadow-xl disabled:opacity-50"
                    >
                      {submittingReview && reviewAction === 'rejected' ? <SpinnerGap weight="bold" className="w-5 h-5 animate-spin mx-auto" /> : t('translations.admin.reject')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DataTable
        data={filteredProposals}
        columns={columns}
        searchValue=""
        emptyMessage={t('translations.noProposals')}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={t('ui.confirmAction')}
        message={t('translations.admin.confirmBulkApprove', { count: pendingCount })}
        variant="danger"
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState({open: false, action: () => {}})}
      />
    </motion.div>
  );
}

export default AdminTranslationsPage;
