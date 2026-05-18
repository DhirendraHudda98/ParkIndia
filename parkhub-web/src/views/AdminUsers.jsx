import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createColumnHelper } from '@tanstack/react-table';
import {
  SpinnerGap, MagnifyingGlass, Coins,
  PencilSimple, X, Check, UserMinus, UserPlus,
  Lightning,
} from '@phosphor-icons/react';
import { api } from '../api/client';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { DataTable } from '../components/ui/DataTable';
import { useTheme } from '../context/ThemeContext';

const columnHelper = createColumnHelper();

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [creditUserId, setCreditUserId] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [grantingCredits, setGrantingCredits] = useState(false);
  const [editingQuotaId, setEditingQuotaId] = useState(null);
  const [editQuota, setEditQuota] = useState('');
  const [savingQuota, setSavingQuota] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkRole, setBulkRole] = useState('user');
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';
  const surfaceVariant = isVoid ? 'void' : isIndia ? 'india' : 'marble';

  const activeUsers = users.filter(user => user.is_active).length;
  const adminUsers = users.filter(user => ['admin', 'superadmin'].includes(user.role)).length;
  const totalCredits = users.reduce((sum, user) => sum + user.credits_balance, 0);
  const totalQuota = users.reduce((sum, user) => sum + user.credits_monthly_quota, 0);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      } else {
        setError(res.error?.message || t('admin.errorUsers', 'Failed to load user directories.'));
      }
    } catch (err) {
      setError(err?.message || t('admin.errorUsers', 'Failed to load user directories.'));
    } finally {
      setLoading(false);
    }
  }

  function startEditRole(user) {
    setEditingId(user.id);
    setEditRole(user.role);
  }

  async function saveRole(userId) {
    setSavingRole(true);
    try {
      const res = await api.adminUpdateUserRole(userId, editRole);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: editRole } : u));
        toast.success(t('admin.roleUpdated'));
        setEditingId(null);
      } else {
        toast.error(res.error?.message || t('admin.roleUpdateFailed'));
      }
    } finally {
      setSavingRole(false);
    }
  }

  async function toggleActive(user) {
    const res = await api.adminUpdateUser(user.id, { is_active: !user.is_active });
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      toast.success(user.is_active ? t('admin.userDeactivated') : t('admin.userActivated'));
    } else {
      toast.error(res.error?.message || t('admin.userUpdateFailed'));
    }
  }

  async function handleGrantCredits() {
    if (!creditUserId || !creditAmount) return;
    setGrantingCredits(true);
    try {
      const res = await api.adminGrantCredits(creditUserId, Number(creditAmount), creditDesc || undefined);
      if (res.success) {
        toast.success(t('admin.creditsGranted'));
        setCreditUserId(null);
        setCreditAmount('');
        setCreditDesc('');
        await loadUsers();
      } else {
        toast.error(res.error?.message || t('admin.creditsGrantFailed'));
      }
    } finally {
      setGrantingCredits(false);
    }
  }

  function startEditQuota(user) {
    setEditingQuotaId(user.id);
    setEditQuota(String(user.credits_monthly_quota));
  }

  async function saveQuota(userId) {
    const quota = Number(editQuota);
    if (isNaN(quota) || quota < 0 || quota > 999) {
      toast.error(t('admin.quotaRange'));
      return;
    }
    setSavingQuota(true);
    try {
      const res = await api.adminUpdateUserQuota(userId, quota);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits_monthly_quota: quota } : u));
        toast.success(t('admin.quotaUpdated'));
        setEditingQuotaId(null);
      } else {
        toast.error(res.error?.message || t('admin.quotaUpdateFailed'));
      }
    } finally {
      setSavingQuota(false);
    }
  }

  async function handleBulkAction() {
    if (selectedIds.size === 0 || !bulkAction) return;
    setBulkRunning(true);
    try {
      if (bulkAction === 'delete') {
        const res = await api.adminBulkDelete(Array.from(selectedIds));
        if (res.success && res.data) {
          toast.success(t('admin.bulkDeleted', { succeeded: res.data.succeeded, total: res.data.total }));
          await loadUsers();
          setSelectedIds(new Set());
        } else {
          toast.error(res.error?.message || t('admin.bulkDeleteFailed'));
        }
      } else {
        const res = await api.adminBulkUpdate(
          Array.from(selectedIds),
          bulkAction,
          bulkAction === 'set_role' ? bulkRole : undefined,
        );
        if (res.success && res.data) {
          toast.success(t('admin.bulkUpdated', { succeeded: res.data.succeeded, total: res.data.total }));
          await loadUsers();
          setSelectedIds(new Set());
        } else {
          toast.error(res.error?.message || t('admin.bulkUpdateFailed'));
        }
      }
    } finally {
      setBulkRunning(false);
      setBulkConfirm(false);
      setBulkAction('');
    }
  }

  function roleBadge(role) {
    const colors = {
      superadmin: isIndia ? 'bg-[#FF9933]/20 text-[#FF9933]' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      admin: isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      user: isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[role] || colors.user}`}>
        {role}
      </span>
    );
  }

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: () => t('admin.users'),
      cell: info => (
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{info.getValue()}</p>
          <p className={`text-xs truncate ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>{info.row.original.email}</p>
        </div>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('role', {
      header: () => t('admin.editRole'),
      cell: info => {
        const user = info.row.original;
        if (editingId === user.id) {
          return (
            <div className="flex items-center gap-2">
              <select 
                value={editRole} 
                onChange={e => setEditRole(e.target.value)} 
                className={`text-xs py-1 px-2 w-28 rounded-lg border focus:outline-none focus:ring-1 ${
                  isIndia ? 'bg-white border-[#FF9933]/20 focus:ring-[#FF9933]' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                }`}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
              <button onClick={() => saveRole(user.id)} disabled={savingRole} className={`p-1 rounded transition-colors ${isIndia ? 'text-[#FF9933] hover:bg-[#FF9933]/10' : 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'}`}>
                {savingRole ? <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" /> : <Check weight="bold" className="w-4 h-4" />}
              </button>
              <button onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400">
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>
          );
        }
        return roleBadge(user.role);
      },
      enableSorting: true,
    }),
    columnHelper.accessor('credits_balance', {
      header: () => t('admin.credits'),
      cell: info => <span className={`text-sm font-semibold tabular-nums ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{info.getValue()}</span>,
      enableSorting: true,
    }),
    columnHelper.accessor('credits_monthly_quota', {
      header: () => t('admin.monthlyQuota'),
      cell: info => {
        const user = info.row.original;
        if (editingQuotaId === user.id) {
          return (
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min={0} 
                max={999} 
                value={editQuota} 
                onChange={e => setEditQuota(e.target.value)} 
                className={`text-xs py-1 px-2 w-20 rounded-lg border focus:outline-none focus:ring-1 ${
                  isIndia ? 'bg-white border-[#FF9933]/20 focus:ring-[#FF9933]' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
                }`}
              />
              <button onClick={() => saveQuota(user.id)} disabled={savingQuota} className={`p-1 rounded transition-colors ${isIndia ? 'text-[#FF9933] hover:bg-[#FF9933]/10' : 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'}`}>
                {savingQuota ? <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" /> : <Check weight="bold" className="w-4 h-4" />}
              </button>
              <button onClick={() => setEditingQuotaId(null)} className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400">
                <X weight="bold" className="w-4 h-4" />
              </button>
            </div>
          );
        }
        return (
          <button
            onClick={() => startEditQuota(user)}
            className={`inline-flex items-center gap-1.5 text-sm transition-colors ${isIndia ? 'text-[#000080]/70 hover:text-[#FF9933]' : 'text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400'}`}
          >
            <span className="font-semibold tabular-nums">{user.credits_monthly_quota}</span>
          </button>
        );
      },
      enableSorting: true,
    }),
    columnHelper.accessor('is_active', {
      header: () => t('admin.status'),
      cell: info => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          info.getValue()
            ? isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400'
        }`}>
          {info.getValue() ? t('admin.active') : t('admin.inactive')}
        </span>
      ),
      enableSorting: true,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: info => {
        const user = info.row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => startEditRole(user)}
              className={`p-2 rounded-lg transition-colors ${isIndia ? 'text-[#000080]/40 hover:text-[#FF9933]' : 'text-surface-400 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-800'}`}
              title={t('admin.editRole')}
            >
              <PencilSimple weight="bold" className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setCreditUserId(user.id); setCreditAmount(''); setCreditDesc(''); }}
              className={`p-2 rounded-lg transition-colors ${isIndia ? 'text-[#000080]/40 hover:text-[#FF9933]' : 'text-surface-400 hover:text-accent-600 hover:bg-surface-100 dark:hover:bg-surface-800'}`}
              title={t('admin.grantCreditsFor')}
            >
              <Coins weight="bold" className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleActive(user)}
              className={`p-2 rounded-lg transition-colors ${
                user.is_active
                  ? isIndia ? 'text-[#000080]/40 hover:text-red-600 hover:bg-red-50' : 'text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : isIndia ? 'text-[#000080]/40 hover:text-[#FF9933] hover:bg-[#FF9933]/10' : 'text-surface-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              }`}
              title={user.is_active ? t('admin.deactivate') : t('admin.activate')}
            >
              {user.is_active ? <UserMinus weight="bold" className="w-4 h-4" /> : <UserPlus weight="bold" className="w-4 h-4" />}
            </button>
          </div>
        );
      },
    }),
  ], [editingId, editRole, savingRole, editingQuotaId, editQuota, savingQuota, t, isIndia]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label={t('common.loading')}>
        <SpinnerGap weight="bold" className={`w-8 h-8 animate-spin ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-[2rem] border p-8 text-center transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/15 shadow-sm shadow-[#FF9933]/5' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'}`}>
        <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-red-50 dark:bg-red-950/20 text-red-500'}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className={`text-lg font-black mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
          {isIndia ? 'User Management Ledger Offline' : t('admin.errorTitle', 'Error Occurred')}
        </h3>
        <p className={`text-sm max-w-md mx-auto mb-6 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
          {error}
        </p>
        <button
          onClick={loadUsers}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all ${isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00] text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
        >
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  const heroCardClass = (accent) => `overflow-hidden rounded-[28px] border px-6 py-6 shadow-sm transition-all ${
    isVoid
      ? accent ? 'border-cyan-500/20 bg-cyan-500/10 text-white' : 'border-slate-800 bg-slate-900 text-white'
      : isIndia 
      ? accent ? 'border-[#FF9933]/20 bg-[#FF9933]/10 text-[#000080]' : 'border-[#FF9933]/10 bg-white text-[#000080]'
      : accent ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20 text-surface-900 dark:text-white' : 'border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900 text-surface-900 dark:text-white'
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <section className={heroCardClass(true)}>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
              isIndia ? 'bg-[#FF9933]/20 text-[#FF9933]' : isVoid ? 'bg-cyan-500/10 text-cyan-100' : 'bg-primary-100 text-primary-700'
            }`}>
              <Coins weight="fill" className="h-3.5 w-3.5" />
              {isIndia ? 'ParkIndia User Management' : isVoid ? 'Void user ledger' : 'Marble user ledger'}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-[-0.04em]">{t('admin.users')}</h1>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${
                    isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-surface-100 text-surface-600'
                  }`}>
                    ({users.length})
                  </span>
                </div>
                <p className={`mt-2 max-w-2xl text-sm leading-6 ${isIndia ? 'text-[#000080]/70' : isVoid ? 'text-slate-300' : 'text-surface-600 dark:text-surface-300'}`}>
                  Manage ParkIndia users, roles, and credits in a single unified interface. Complete migration to pure JS architecture.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <AdminUsersHeroStat
                  label="Active accounts"
                  value={String(activeUsers)}
                  meta={`${users.length - activeUsers} inactive`}
                  isIndia={isIndia}
                  isVoid={isVoid}
                  accent
                />
                <AdminUsersHeroStat
                  label="Privileged"
                  value={String(adminUsers)}
                  meta="Admin + superadmin"
                  isIndia={isIndia}
                  isVoid={isVoid}
                />
                <AdminUsersHeroStat
                  label="Credit pool"
                  value={String(totalCredits)}
                  meta={`${totalQuota} monthly quota`}
                  isIndia={isIndia}
                  isVoid={isVoid}
                />
              </div>

              <div className="relative max-w-md">
                <MagnifyingGlass weight="bold" className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isIndia ? 'text-[#000080]/40' : 'text-surface-400'}`} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('admin.searchUsers')}
                  className={`w-full rounded-2xl border py-3 pl-10 pr-10 text-sm outline-none transition ${
                    isIndia 
                      ? 'border-[#FF9933]/20 bg-white text-[#000080] placeholder:text-[#000080]/40 focus:border-[#FF9933]' 
                      : 'border-surface-200 bg-white text-surface-900 dark:bg-surface-950/60 dark:border-surface-800'
                  }`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors ${
                      isIndia ? 'text-[#FF9933] hover:bg-[#FF9933]/10' : 'text-surface-400 hover:bg-surface-100'
                    }`}
                  >
                    <X weight="bold" className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`rounded-[24px] border p-5 ${
            isIndia ? 'bg-[#000080]/5 border-[#000080]/10' : isVoid ? 'border-white/10 bg-white/[0.04]' : 'bg-surface-50 dark:bg-white/[0.04]'
          }`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>
              System Overview
            </p>
            <div className="mt-4 space-y-3">
              <AdminUsersPanelMetric
                label="Bulk operations"
                value={selectedIds.size ? `${selectedIds.size} selected` : 'Ready'}
                helper="Perform mass updates on user accounts."
                isIndia={isIndia}
                isVoid={isVoid}
              />
              <AdminUsersPanelMetric
                label="Credits + quota"
                value={`${totalQuota}`}
                helper="Total monthly credit allocation."
                isIndia={isIndia}
                isVoid={isVoid}
              />
              <AdminUsersPanelMetric
                label="Lifecycle"
                value={`${activeUsers}/${users.length || 0}`}
                helper="User health and activity ratio."
                isIndia={isIndia}
                isVoid={isVoid}
              />
            </div>
          </div>
        </div>
      </section>

      {selectedIds.size > 0 && (
        <div className={`flex flex-wrap items-center gap-3 rounded-[22px] border p-4 ${
          isIndia ? 'border-[#FF9933]/20 bg-[#FF9933]/10' : 'border-primary-200 bg-primary-50 dark:bg-primary-900/20'
        }`}>
          <span className={`text-sm font-medium ${isIndia ? 'text-[#FF9933]' : 'text-primary-700'}`}>
            {t('admin.selectedCount', { count: selectedIds.size })}
          </span>
          <select
            value={bulkAction}
            onChange={e => setBulkAction(e.target.value)}
            className={`rounded-xl border px-3 py-2 text-xs outline-none ${
              isIndia ? 'bg-white border-[#FF9933]/20 text-[#000080]' : 'bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800'
            }`}
          >
            <option value="">{t('admin.selectAction')}</option>
            <option value="activate">{t('admin.bulkActivate')}</option>
            <option value="deactivate">{t('admin.bulkDeactivate')}</option>
            <option value="set_role">{t('admin.bulkChangeRole')}</option>
            <option value="delete">{t('admin.bulkDelete')}</option>
          </select>
          {bulkAction === 'set_role' && (
            <select
              value={bulkRole}
              onChange={e => setBulkRole(e.target.value)}
              className={`rounded-xl border px-3 py-2 text-xs outline-none ${
                isIndia ? 'bg-white border-[#FF9933]/20 text-[#000080]' : 'bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800'
              }`}
            >
              <option value="user">user</option>
              <option value="premium">premium</option>
              <option value="admin">admin</option>
            </select>
          )}
          <button
            onClick={() => setBulkConfirm(true)}
            disabled={!bulkAction || bulkRunning}
            className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-50 ${
              isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {bulkRunning ? <SpinnerGap className="animate-spin" weight="bold" size={14} /> : <Lightning weight="bold" size={14} />}
            {t('admin.bulkApply')}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className={`text-xs font-medium transition-colors ${isIndia ? 'text-[#000080]/60 hover:text-[#000080]' : 'text-surface-500 hover:text-surface-700'}`}
          >
            {t('admin.bulkClear')}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={bulkConfirm}
        title={t('admin.bulkAction')}
        message={t('admin.bulkActionConfirm', { action: bulkAction, count: selectedIds.size })}
        variant={bulkAction === 'delete' ? 'danger' : 'default'}
        onConfirm={handleBulkAction}
        onCancel={() => setBulkConfirm(false)}
      />

      <AnimatePresence>
        {creditUserId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`rounded-[24px] border p-6 shadow-lg ${
              isIndia ? 'bg-white border-[#FF9933]/20' : 'bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isIndia ? 'text-[#FF9933]' : 'text-surface-500'}`}>
                    Credit adjustment
                  </p>
                  <h3 className={`mt-2 text-lg font-semibold tracking-[-0.03em] ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.grantCredits')}</h3>
                </div>
                <button
                  onClick={() => setCreditUserId(null)}
                  className={`rounded-lg p-1.5 transition-colors ${isIndia ? 'hover:bg-[#FF9933]/10 text-[#FF9933]' : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400'}`}
                >
                  <X weight="bold" className="w-5 h-5" />
                </button>
              </div>
              <p className={`mt-3 text-sm ${isIndia ? 'text-[#000080]/70' : 'text-surface-500 dark:text-surface-400'}`}>
                {t('admin.grantingTo')} <strong className={isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}>{users.find(u => u.id === creditUserId)?.name}</strong>
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="credit-amount" className={`mb-2 block text-sm font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`}>{t('admin.amount')}</label>
                  <input
                    id="credit-amount"
                    type="number"
                    min={1}
                    value={creditAmount}
                    onChange={e => setCreditAmount(e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
                      isIndia ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:border-[#FF9933]' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 focus:border-primary-300'
                    }`}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label htmlFor="credit-description" className={`mb-2 block text-sm font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`}>{t('admin.description')}</label>
                  <input
                    id="credit-description"
                    type="text"
                    value={creditDesc}
                    onChange={e => setCreditDesc(e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
                      isIndia ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:border-[#FF9933]' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 focus:border-primary-300'
                    }`}
                  />
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleGrantCredits}
                  disabled={grantingCredits || !creditAmount}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
                    isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {grantingCredits ? <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" /> : <Check weight="bold" className="w-4 h-4" />}
                  {t('admin.grant')}
                </button>
                <button
                  onClick={() => setCreditUserId(null)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-50 text-surface-700 hover:bg-surface-100 dark:bg-surface-900 dark:text-surface-200'
                  }`}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className={`rounded-[24px] border p-5 shadow-sm ${
        isIndia ? 'bg-white border-[#FF9933]/20' : 'bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800'
      }`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isIndia ? 'text-[#FF9933]' : 'text-surface-500 dark:text-surface-400'}`}>
              Directory
            </p>
            <h2 className={`mt-1 text-xl font-semibold tracking-[-0.03em] ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>Accounts table</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-surface-100 text-surface-600'
            }`}>
              {activeUsers} active
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-primary-50 text-primary-700'
            }`}>
              {adminUsers} privileged
            </span>
          </div>
        </div>

        <DataTable
          data={users}
          columns={columns}
          searchValue={debouncedSearch}
          emptyMessage={search ? t('admin.noUsersMatch') : t('admin.noUsersFound')}
          exportFilename="users"
        />
      </section>
    </motion.div>
  );
}

function AdminUsersHeroStat({ label, value, meta, isIndia, isVoid, accent = false }) {
  const cardClass = `rounded-[22px] border px-4 py-4 transition-all ${
    isVoid
      ? accent ? 'border-cyan-500/20 bg-cyan-500/10' : 'border-white/10 bg-white/[0.04]'
      : isIndia 
      ? accent ? 'border-[#FF9933]/30 bg-[#FF9933]/5' : 'border-[#000080]/10 bg-white'
      : accent ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60' : 'border-surface-200 bg-white dark:border-surface-800'
  }`;

  const labelClass = `text-[11px] font-semibold uppercase tracking-[0.2em] ${
    isIndia ? accent ? 'text-[#FF9933]' : 'text-[#000080]/40' : 'text-surface-500'
  }`;

  const valueClass = `mt-3 text-3xl font-black tracking-[-0.04em] ${
    isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'
  }`;

  return (
    <div className={cardClass}>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value}</p>
      <p className={`mt-2 text-xs ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>{meta}</p>
    </div>
  );
}

function AdminUsersPanelMetric({ label, value, helper, isIndia, isVoid }) {
  const cardClass = `rounded-[20px] border px-4 py-3 transition-all ${
    isIndia ? 'border-[#000080]/10 bg-white shadow-sm' : isVoid ? 'border-white/10 bg-white/[0.03]' : 'bg-white dark:bg-white/[0.03] border-surface-200 dark:border-surface-800'
  }`;

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isIndia ? 'text-[#FF9933]' : 'text-surface-500'}`}>
          {label}
        </p>
        <span className={`text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</span>
      </div>
      <p className={`mt-2 text-xs leading-5 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>{helper}</p>
    </div>
  );
}
