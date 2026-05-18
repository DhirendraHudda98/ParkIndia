import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  MagnifyingGlass as Search,
  Funnel as Filter,
  Download,
  X,
  Eye,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

export function AdminBookingsManagement() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  // Load bookings data
  const loadBookingsData = useCallback(async (page = 1, search = '', status = 'all', date = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/admin/bookings?page=${page}&search=${search}&status=${status}&date=${date}&sort=${sortBy}&order=${sortOrder}`);
      if (res.success) {
        setBookings(res.data.bookings);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, t]);

  useEffect(() => {
    loadBookingsData(currentPage, searchTerm, statusFilter, dateFilter);
  }, [loadBookingsData, currentPage, searchTerm, statusFilter, dateFilter]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    loadBookingsData(1, e.target.value, statusFilter, dateFilter);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
    loadBookingsData(1, searchTerm, status, dateFilter);
  };

  const handleDateFilter = (date) => {
    setDateFilter(date);
    setCurrentPage(1);
    loadBookingsData(1, searchTerm, statusFilter, date);
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const res = await api.post(`/api/v1/admin/bookings/${bookingId}/cancel`);
      if (res.success) {
        toast.success(t('admin.bookings.cancelled'));
        // Refresh the booking list
        loadBookingsData(currentPage, searchTerm, statusFilter, dateFilter);
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      const res = await api.post(`/api/v1/admin/bookings/${bookingId}/approve`);
      if (res.success) {
        toast.success(t('admin.bookings.approved'));
        // Refresh the booking list
        loadBookingsData(currentPage, searchTerm, statusFilter, dateFilter);
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const exportBookings = async () => {
    try {
      // Implementation for exporting bookings
      toast.success(t('admin.bookings.exportSuccess'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {t('admin.bookings.title')}
          </h1>
          <p className={`mt-1 ${isIndia ? 'text-[#000080]/70' : 'text-surface-500 dark:text-surface-400'}`}>
            {t('admin.bookings.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportBookings}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              isIndia ? 'bg-[#FF9933] text-white' : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <Download size={18} />
            {t('admin.bookings.export')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-2xl border ${
        isVoid 
          ? 'bg-slate-900 border-slate-800' 
          : isIndia 
          ? 'bg-white border-[#FF9933]/20 shadow-sm' 
          : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 dark:text-surface-500" size={20} />
            <input
              type="text"
              placeholder={t('admin.bookings.search.placeholder')}
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

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className={`w-full pl-4 pr-10 py-2 rounded-lg border appearance-none ${
                isVoid 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : isIndia 
                  ? 'border-[#FF9933]/20 bg-white' 
                  : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
              }`}
            >
              <option value="all">{t('admin.bookings.filter.all')}</option>
              <option value="active">{t('admin.bookings.filter.active')}</option>
              <option value="completed">{t('admin.bookings.filter.completed')}</option>
              <option value="cancelled">{t('admin.bookings.filter.cancelled')}</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-surface-400 dark:text-surface-500" size={20} />
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => handleDateFilter(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                isVoid 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : isIndia 
                  ? 'border-[#FF9933]/20 bg-white' 
                  : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className={`rounded-2xl border p-4 transition-colors ${
        isVoid 
          ? 'bg-slate-900 border-slate-800' 
          : isIndia 
          ? 'bg-white border-[#FF9933]/20 shadow-sm' 
          : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isIndia ? 'bg-[#000080]/5' : 'bg-surface-100 dark:bg-surface-800'}>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.bookings.table.id')}</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.bookings.table.user')}</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.bookings.table.lot')}</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.bookings.table.slot')}</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.bookings.table.status')}</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.bookings.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <div className={`h-8 w-48 rounded-lg ${isVoid ? 'bg-slate-800 animate-pulse' : 'skeleton'}`} />
                  </td>
                </tr>
              ) : (
                bookings.map((booking, index) => (
                  <motion.tr 
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-t ${isIndia ? 'border-[#FF9933]/10' : 'border-surface-200 dark:border-surface-700'}`}
                  >
                    <td className={`px-4 py-3 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{booking.id}</td>
                    <td className={`px-4 py-3 ${isIndia ? 'text-[#000080]/70' : 'text-surface-500 dark:text-surface-400'}`}>{booking.user_name}</td>
                    <td className={`px-4 py-3 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{booking.lot_name}</td>
                    <td className={`px-4 py-3 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{booking.slot_number}</td>
                    <td className={`px-4 py-3 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === 'active' 
                          ? isIndia ? 'bg-emerald-100 text-emerald-800' : 'bg-green-100 text-green-800' 
                          : booking.status === 'completed' 
                          ? isIndia ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800' 
                          : isIndia ? 'bg-rose-100 text-rose-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className={`p-2 rounded ${isIndia ? 'text-[#000080] hover:bg-[#000080]/10' : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'}`}
                        >
                          {t('admin.bookings.cancel')}
                        </button>
                        <button
                          onClick={() => handleApproveBooking(booking.id)}
                          className={`p-2 rounded ${isIndia ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                        >
                          {t('admin.bookings.approve')}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}