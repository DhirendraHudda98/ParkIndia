import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Eye,
  EyeSlash,
  Download,
  X,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { DataTable } from '../components/ui/DataTable';

export function AdminUsersManagement() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  // Load users data
  const loadUsersData = useCallback(async (page = 1, search = '', role = 'all', status = 'all') => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/admin/users?page=${page}&search=${search}&role=${role}&status=${status}&sort=${sortBy}&order=${sortOrder}`);
      if (res.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, t]);

  useEffect(() => {
    loadUsersData(currentPage, searchTerm, filterRole, filterStatus);
  }, [loadUsersData, currentPage, searchTerm, filterRole, filterStatus]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    loadUsersData(1, e.target.value, filterRole, filterStatus);
  };

  const handleRoleFilter = (role) => {
    setFilterRole(role);
    setCurrentPage(1);
    loadUsersData(1, searchTerm, role, filterStatus);
  };

  const handleStatusFilter = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
    loadUsersData(1, searchTerm, filterRole, status);
  };

  const handleBlockUser = async (userId, isBlocked) => {
    try {
      const res = await api.post(`/api/v1/admin/users/${userId}/${isBlocked ? 'unblock' : 'block'}`);
      if (res.success) {
        toast.success(t(`admin.users.${isBlocked ? 'unblocked' : 'blocked'}`));
        // Refresh the user list
        loadUsersData(currentPage, searchTerm, filterRole, filterStatus);
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const exportUsers = async () => {
    try {
      const res = await api.get('/api/v1/admin/users/export');
      if (res.success) {
        // Create a download link for the CSV
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users-export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(t('admin.users.exportSuccess'));
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const columns = [
    { header: t('admin.users.table.id'), accessor: 'id' },
    { header: t('admin.users.table.name'), accessor: 'name' },
    { header: t('admin.users.table.email'), accessor: 'email' },
    { header: t('admin.users.table.role'), accessor: 'role' },
    { header: t('admin.users.table.status'), accessor: 'status' },
    { header: t('admin.users.table.actions'), accessor: 'actions' },
  ];

  const tableData = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.is_active ? 'active' : 'blocked',
    actions: (
      <div className="flex space-x-2">
        <button
          onClick={() => handleBlockUser(user.id, !user.is_active)}
          className={`px-3 py-1 rounded text-sm ${
            user.is_active 
              ? isIndia 
                ? 'bg-[#FF9933] text-white' 
                : 'bg-red-500 text-white'
              : isIndia 
                ? 'bg-emerald-500 text-white' 
                : 'bg-green-500 text-white'
          }`}
        >
          {user.is_active ? t('admin.users.block') : t('admin.users.unblock')}
        </button>
        <button
          onClick={() => {
            // View user details
          }}
          className={`px-3 py-1 rounded text-sm ${
            isIndia ? 'bg-[#000080] text-white' : 'bg-blue-500 text-white'
          }`}
        >
          {t('common.view')}
        </button>
      </div>
    )
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {t('admin.users.title')}
          </h1>
          <p className={`mt-1 ${isIndia ? 'text-[#000080]/70' : 'text-surface-500 dark:text-surface-400'}`}>
            {t('admin.users.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportUsers}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              isIndia ? 'bg-[#FF9933] text-white' : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <Download size={18} />
            {t('admin.users.export')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-2xl border ${
        isVoid 
          ? 'bg-slate-900 border-slate-800' 
          : isIndia 
          ? 'bg-white border-[#FF9933]/20 shadow-sm' 
          : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-sm'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 dark:text-surface-500" size={20} />
            <input
              type="text"
              placeholder={t('admin.users.search.placeholder')}
              value={searchTerm}
              onChange={handleSearch}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isVoid 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : isIndia 
                  ? 'border-[#FF9933]/20 bg-white' 
                  : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
              }`}
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className={`w-full pl-4 pr-10 py-2 rounded-lg border appearance-none ${
                isVoid 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : isIndia 
                  ? 'border-[#FF9933]/20 bg-white' 
                  : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
              }`}
            >
              <option value="all">{t('admin.users.filter.all')}</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-surface-400 dark:text-surface-500" size={20} />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className={`w-full pl-4 pr-10 py-2 rounded-lg border appearance-none ${
                isVoid 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : isIndia 
                  ? 'border-[#FF9933]/20 bg-white' 
                  : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
              }`}
            >
              <option value="all">{t('admin.users.filter.allStatus')}</option>
              <option value="active">{t('admin.users.filter.active')}</option>
              <option value="blocked">{t('admin.users.filter.blocked')}</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-surface-400 dark:text-surface-500" size={20} />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={`rounded-2xl border p-4 transition-colors ${
        isVoid 
          ? 'bg-slate-900 border-slate-800' 
          : isIndia 
          ? 'bg-white border-[#FF9933]/20 shadow-sm' 
          : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
      }`}>
        <DataTable 
          columns={columns} 
          data={tableData} 
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}