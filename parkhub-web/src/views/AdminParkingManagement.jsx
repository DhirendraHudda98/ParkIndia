import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Plus,
  Pencil,
  Trash,
  Eye,
  EyeSlash,
  Download,
  Upload,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

export function AdminParkingManagement() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    total_slots: 0,
    hourly_rate_inr: 0,
    daily_max_inr: 0,
  });

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  // Load parking lots data
  const loadParkingData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/admin/parking');
      if (res.success) {
        setLots(res.data.lots);
      }
    } catch (error) {
      console.error('Error loading parking data:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadParkingData();
  }, [loadParkingData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = editingLot 
        ? await api.put(`/api/v1/admin/parking/${editingLot.id}`, formData)
        : await api.post('/api/v1/admin/parking', formData);
      
      if (res.success) {
        toast.success(t(editingLot ? 'admin.parking.updated' : 'admin.parking.created'));
        setShowModal(false);
        setEditingLot(null);
        setFormData({
          name: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          total_slots: 0,
          hourly_rate_inr: 0,
          daily_max_inr: 0,
        });
        loadParkingData();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleEdit = (lot) => {
    setEditingLot(lot);
    setFormData({
      name: lot.name,
      address: lot.address,
      city: lot.city,
      state: lot.state,
      pincode: lot.pincode,
      total_slots: lot.total_slots,
      hourly_rate_inr: lot.hourly_rate_inr,
      daily_max_inr: lot.daily_max_inr,
    });
    setShowModal(true);
  };

  const handleDelete = async (lotId) => {
    try {
      const res = await api.delete(`/api/v1/admin/parking/${lotId}`);
      if (res.success) {
        toast.success(t('admin.parking.deleted'));
        loadParkingData();
      } else {
        toast.error(t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const openAddModal = () => {
    setEditingLot(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      total_slots: 0,
      hourly_rate_inr: 0,
      daily_max_inr: 0,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLot(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {t('admin.parking.title')}
          </h1>
          <p className={`mt-1 ${isIndia ? 'text-[#000080]/70' : 'text-surface-500 dark:text-surface-400'}`}>
            {t('admin.parking.subtitle')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={openAddModal}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              isIndia ? 'bg-[#FF9933] text-white' : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <Plus size={18} />
            {t('admin.parking.add')}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t('admin.parking.stats.totalLots')} 
          value={lots.length} 
          icon={MapPin} 
          color="text-blue-600"
          isIndia={isIndia}
          isVoid={isVoid}
        />
        <StatCard 
          title={t('admin.parking.stats.totalSlots')} 
          value={lots.reduce((sum, lot) => sum + lot.total_slots, 0)} 
          icon={MapPin} 
          color="text-green-600"
          isIndia={isIndia}
          isVoid={isVoid}
        />
        <StatCard 
          title={t('admin.parking.stats.availableSlots')} 
          value={lots.reduce((sum, lot) => sum + lot.available_slots, 0)} 
          icon={MapPin} 
          color="text-amber-600"
          isIndia={isIndia}
          isVoid={isVoid}
        />
        <StatCard 
          title={t('admin.parking.stats.occupancyRate')} 
          value={`${Math.round((1 - (lots.reduce((sum, lot) => sum + lot.available_slots, 0) / 
            Math.max(1, lots.reduce((sum, lot) => sum + lot.total_slots, 0)))) * 100)}%`} 
          icon={MapPin} 
          color="text-purple-600"
          isIndia={isIndia}
          isVoid={isVoid}
        />
      </div>

      {/* Parking Lots Table */}
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
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.parking.table.name')}</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.parking.table.location')}</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.parking.table.slots')}</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.parking.table.pricing')}</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('admin.parking.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center">
                    <div className={`h-8 w-48 rounded-lg ${isVoid ? 'bg-slate-800 animate-pulse' : 'skeleton'}`} />
                  </td>
                </tr>
              ) : (
                lots.map((lot, index) => (
                  <motion.tr 
                    key={lot.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-t ${isIndia ? 'border-[#FF9933]/10' : 'border-surface-200 dark:border-surface-700'}`}
                  >
                    <td className={`px-4 py-3 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{lot.name}</td>
                    <td className={`px-4 py-3 ${isIndia ? 'text-[#000080]/70' : 'text-surface-500 dark:text-surface-400'}`}>{lot.city}, {lot.state}</td>
                    <td className={`px-4 py-3 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{lot.available_slots}/{lot.total_slots}</td>
                    <td className={`px-4 py-3 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                      ₹{lot.hourly_rate_inr}/hr, ₹{lot.daily_max_inr}/day
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(lot)}
                          className={`p-2 rounded ${isIndia ? 'text-[#000080] hover:bg-[#000080]/10' : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(lot.id)}
                          className={`p-2 rounded ${isIndia ? 'text-red-500 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-500/10'}`}
                        >
                          <Trash size={16} />
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

      {/* Modal for Add/Edit Parking Lot */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-2xl rounded-2xl p-6 ${
              isVoid 
                ? 'bg-slate-900 border-slate-800' 
                : isIndia 
                ? 'bg-white border-[#FF9933]/20 shadow-sm' 
                : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                {editingLot ? t('admin.parking.edit') : t('admin.parking.add')}
              </h2>
              <button
                onClick={closeModal}
                className={`p-2 rounded ${isIndia ? 'text-[#000080] hover:bg-[#000080]/10' : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                    {t('admin.parking.form.name')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isVoid 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : isIndia 
                        ? 'border-[#FF9933]/20 bg-white' 
                        : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
                    }`}
                    required
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                    {t('admin.parking.form.totalSlots')}
                  </label>
                  <input
                    type="number"
                    name="total_slots"
                    value={formData.total_slots}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isVoid 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : isIndia 
                        ? 'border-[#FF9933]/20 bg-white' 
                        : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
                    }`}
                    required
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                    {t('admin.parking.form.hourlyRate')}
                  </label>
                  <input
                    type="number"
                    name="hourly_rate_inr"
                    value={formData.hourly_rate_inr}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isVoid 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : isIndia 
                        ? 'border-[#FF9933]/20 bg-white' 
                        : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
                    }`}
                    required
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                    {t('admin.parking.form.dailyMax')}
                  </label>
                  <input
                    type="number"
                    name="daily_max_inr"
                    value={formData.daily_max_inr}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isVoid 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : isIndia 
                        ? 'border-[#FF9933]/20 bg-white' 
                        : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
                    }`}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className={`block mb-2 text-sm font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                  {t('admin.parking.form.address')}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isVoid 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : isIndia 
                      ? 'border-[#FF9933]/20 bg-white' 
                      : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
                  }`}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                    {t('admin.parking.form.city')}
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isVoid 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : isIndia 
                        ? 'border-[#FF9933]/20 bg-white' 
                        : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                    {t('admin.parking.form.state')}
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isVoid 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : isIndia 
                        ? 'border-[#FF9933]/20 bg-white' 
                        : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block mb-2 text-sm font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                    {t('admin.parking.form.pincode')}
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isVoid 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : isIndia 
                        ? 'border-[#FF9933]/20 bg-white' 
                        : 'border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800'
                    }`}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isIndia ? 'text-[#000080] border-[#000080] border' : 'text-surface-600 border-surface-300 border dark:text-surface-400 dark:border-surface-700'
                  }`}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                    isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {editingLot ? t('common.update') : t('common.create')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, isIndia, isVoid }) {
  return (
    <div className={`rounded-2xl border p-4 transition-colors ${
      isVoid 
        ? 'bg-slate-900 border-slate-800' 
        : isIndia 
        ? 'bg-white border-[#FF9933]/20 shadow-sm' 
        : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 shadow-sm'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}