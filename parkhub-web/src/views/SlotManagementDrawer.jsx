import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash, SpinnerGap, Check, MagnifyingGlass,
  Wheelchair, Lightning, Star, ShieldCheck, Tag, Info, List
} from '@phosphor-icons/react';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export function SlotManagementDrawer({ lot, onClose }) {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  
  const [slots, setSlots] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [newSlotType, setNewSlotType] = useState('standard');
  const [newZoneId, setNewZoneId] = useState('');
  const [newReservedDept, setNewReservedDept] = useState('');
  const [newIsAccessible, setNewIsAccessible] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm transition-colors ${
    isVoid 
      ? 'bg-slate-950 border-slate-700 text-white focus:border-slate-500 focus:ring-slate-500' 
      : isIndia 
      ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933]' 
      : 'bg-white dark:bg-surface-950 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white focus:border-primary-500 focus:ring-primary-500'
  }`;

  const availableFeatures = [
    { id: 'ev_charging', label: 'EV Charger' },
    { id: 'undercover', label: 'Undercover / Covered' },
    { id: 'near_elevator', label: 'Near Elevator' },
    { id: 'wide_space', label: 'Extra Wide' }
  ];

  useEffect(() => {
    if (lot?.id) {
      loadData();
    }
  }, [lot]);

  async function loadData() {
    setLoading(true);
    try {
      const [slotsRes, zonesRes] = await Promise.all([
        api.getLotSlots(lot.id),
        api.getLotZones(lot.id)
      ]);
      if (slotsRes.success && slotsRes.data) {
        setSlots(slotsRes.data);
      }
      if (zonesRes.success && zonesRes.data) {
        setZones(zonesRes.data);
      }
    } catch (err) {
      toast.error('Failed to load slots data');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSlot(e) {
    e.preventDefault();
    if (!newSlotNumber.trim()) {
      toast.error('Slot number is required');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        slot_number: newSlotNumber.trim().toUpperCase(),
        slot_type: newSlotType,
        is_accessible: newIsAccessible,
        zone_id: newZoneId || undefined,
        reserved_for_department: newReservedDept.trim() || undefined,
        features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
        status: 'available'
      };

      const res = await api.createSlot(lot.id, data);
      if (res.success) {
        toast.success(t('admin.slotSaved'));
        setNewSlotNumber('');
        setNewSlotType('standard');
        setNewZoneId('');
        setNewReservedDept('');
        setNewIsAccessible(false);
        setSelectedFeatures([]);
        await loadData();
      } else {
        toast.error(res.error?.message || 'Failed to create slot');
      }
    } catch (err) {
      toast.error('An error occurred while creating slot');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusToggle(slot) {
    const nextStatus = slot.status === 'available' ? 'maintenance' : 'available';
    try {
      const res = await api.updateSlot(lot.id, slot.id, { status: nextStatus });
      if (res.success) {
        setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: nextStatus } : s));
        toast.success(`Slot ${slot.slot_number} marked as ${nextStatus}`);
      } else {
        toast.error(res.error?.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Error updating status');
    }
  }

  async function handleDeleteSlot(slotId) {
    if (!window.confirm('Are you sure you want to delete this parking slot?')) {
      return;
    }
    setDeletingId(slotId);
    try {
      const res = await api.deleteSlot(lot.id, slotId);
      if (res.success) {
        toast.success(t('admin.slotDeleted'));
        setSlots(prev => prev.filter(s => s.id !== slotId));
      } else {
        toast.error(res.error?.message || 'Failed to delete slot');
      }
    } catch (err) {
      toast.error('Error deleting slot');
    } finally {
      setDeletingId(null);
    }
  }

  const toggleFeature = (id) => {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredSlots = useMemo(() => {
    return slots.filter(s => 
      s.slot_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.reserved_for_department || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [slots, searchQuery]);

  const typeConfig = {
    standard: { label: 'Standard', icon: ShieldCheck, color: 'text-slate-500 bg-slate-100 dark:bg-slate-900/40 dark:text-slate-400' },
    ev: { label: 'EV Charge', icon: Lightning, color: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400' },
    premium: { label: 'Premium', icon: Star, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400' },
    accessible: { label: 'Accessible', icon: Wheelchair, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400' }
  };

  return (
    <>
      {/* Overlay backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black z-40"
      />

      {/* Drawer Container */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg md:max-w-xl shadow-2xl flex flex-col overflow-hidden ${
          isVoid ? 'bg-slate-900 text-slate-100 border-l border-slate-800' : 'bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white border-l border-surface-200 dark:border-surface-800'
        }`}
      >
        {/* Drawer Header */}
        <div className={`p-5 flex items-center justify-between border-b ${
          isVoid ? 'border-slate-800' : 'border-surface-200 dark:border-surface-800'
        }`}>
          <div>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isIndia ? 'text-[#000080]' : ''}`}>
              <List weight="bold" className={`w-5 h-5 ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`} />
              {t('admin.slotsTitle')}
            </h3>
            <p className={`text-xs mt-0.5 font-medium ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>
              {lot.name} — {slots.length} total slots
            </p>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-xl transition-colors ${
              isIndia ? 'text-[#000080]/60 hover:bg-[#000080]/5' : 'hover:bg-surface-150 dark:hover:bg-surface-800'
            }`}
          >
            <X weight="bold" className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body - Split scrollable layout */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Add New Slot Panel */}
          <form onSubmit={handleAddSlot} className={`p-4 rounded-2xl border space-y-4 ${
            isVoid ? 'bg-slate-950/40 border-slate-800' : 'bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800 shadow-sm'
          }`}>
            <h4 className={`text-sm font-bold flex items-center gap-1.5 ${isIndia ? 'text-[#000080]' : ''}`}>
              <Plus weight="bold" className="w-4 h-4 text-emerald-500" />
              {t('admin.newSlot')}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isIndia ? 'text-[#000080]' : 'text-surface-600 dark:text-surface-400'}`}>
                  {t('admin.slotNumber')} *
                </label>
                <input
                  type="text"
                  placeholder="e.g. A-101"
                  value={newSlotNumber}
                  onChange={e => setNewSlotNumber(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isIndia ? 'text-[#000080]' : 'text-surface-600 dark:text-surface-400'}`}>
                  {t('admin.slotType')}
                </label>
                <select
                  value={newSlotType}
                  onChange={e => {
                    setNewSlotType(e.target.value);
                    if (e.target.value === 'accessible') {
                      setNewIsAccessible(true);
                    }
                  }}
                  className={inputClass}
                >
                  <option value="standard">Standard</option>
                  <option value="ev">EV Charging</option>
                  <option value="premium">Premium</option>
                  <option value="accessible">Accessible</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isIndia ? 'text-[#000080]' : 'text-surface-600 dark:text-surface-400'}`}>
                  {t('admin.zoneLabel')}
                </label>
                <select
                  value={newZoneId}
                  onChange={e => setNewZoneId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">No Zone</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isIndia ? 'text-[#000080]' : 'text-surface-600 dark:text-surface-400'}`}>
                  {t('admin.reservedDept')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Finance"
                  value={newReservedDept}
                  onChange={e => setNewReservedDept(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Checkbox for Accessible */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="drawer-is-accessible"
                type="checkbox"
                checked={newIsAccessible}
                onChange={e => setNewIsAccessible(e.target.checked)}
                className={`rounded h-4 w-4 border-2 transition-colors ${
                  isIndia ? 'text-[#FF9933] border-[#FF9933]/20 focus:ring-[#FF9933]' : 'text-primary-600 border-surface-300 focus:ring-primary-500'
                }`}
              />
              <label htmlFor="drawer-is-accessible" className={`text-xs font-semibold cursor-pointer ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`}>
                {t('admin.isAccessible')}
              </label>
            </div>

            {/* Features Tags */}
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isIndia ? 'text-[#000080]' : 'text-surface-600'}`}>
                {t('admin.featuresLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableFeatures.map(f => {
                  const active = selectedFeatures.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFeature(f.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border-2 transition ${
                        active 
                          ? isIndia 
                            ? 'bg-[#FF9933] text-white border-[#FF9933]' 
                            : 'bg-primary-600 text-white border-primary-600'
                          : isVoid
                          ? 'border-slate-800 text-slate-400 hover:border-slate-700'
                          : 'bg-surface-100 hover:bg-surface-200 text-surface-600 dark:bg-surface-850 dark:text-surface-400 border-transparent'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2 ${
                isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {submitting ? (
                <SpinnerGap className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {t('admin.newSlot')}
            </button>
          </form>

          {/* Slots List Header with search */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-bold ${isIndia ? 'text-[#000080]' : ''}`}>
                Slots List ({filteredSlots.length})
              </h4>
              <div className="relative w-44">
                <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search slot..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`${inputClass} pl-8 py-1 text-xs`}
                />
              </div>
            </div>

            {/* Slots Cards List */}
            {loading ? (
              <div className="flex justify-center py-8">
                <SpinnerGap className="w-6 h-6 animate-spin text-surface-400" />
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border text-xs font-semibold ${
                isVoid ? 'border-slate-800 text-slate-500' : 'bg-white dark:bg-surface-950 border-surface-150 text-surface-400 dark:text-surface-500'
              }`}>
                No slots found. Create one above to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                <AnimatePresence initial={false}>
                  {filteredSlots.map(s => {
                    const cfg = typeConfig[s.slot_type] || typeConfig.standard;
                    const TypeIcon = cfg.icon;
                    const zoneObj = zones.find(z => z.id === s.zone_id);

                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-4 transition ${
                          isVoid ? 'bg-slate-950/30 border-slate-800 hover:border-slate-700' : 'bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-850 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Slot type Icon badge */}
                          <div className={`p-2 rounded-xl ${cfg.color} shrink-0`}>
                            <TypeIcon weight="fill" className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                                {s.slot_number}
                              </span>
                              {s.is_accessible && (
                                <span className="inline-flex text-[10px] font-bold px-1.5 py-0.2 bg-blue-500/10 text-blue-500 rounded">
                                  Access
                                </span>
                              )}
                              {s.reserved_for_department && (
                                <span className="inline-flex text-[10px] font-bold px-1.5 py-0.2 bg-[#FF9933]/10 text-[#FF9933] rounded">
                                  Dept: {s.reserved_for_department}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-surface-400 dark:text-surface-500">
                                Type: {cfg.label}
                              </span>
                              {zoneObj && (
                                <>
                                  <span className="text-[10px] text-surface-400 dark:text-surface-500">•</span>
                                  <span className="text-[10px] font-medium text-emerald-500">
                                    Zone: {zoneObj.name}
                                  </span>
                                </>
                              )}
                              {s.features && s.features.length > 0 && (
                                <>
                                  <span className="text-[10px] text-surface-400 dark:text-surface-500">•</span>
                                  <span className="text-[10px] text-indigo-500">
                                    {s.features.map(f => availableFeatures.find(af => af.id === f)?.label || f).join(', ')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Status Toggle */}
                          <button
                            onClick={() => handleStatusToggle(s)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                              s.status === 'available'
                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                            }`}
                          >
                            {s.status === 'available' ? 'Available' : 'Maintenance'}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteSlot(s.id)}
                            disabled={deletingId === s.id}
                            className={`p-2 rounded-xl text-surface-400 hover:text-red-500 hover:bg-red-500/10 transition disabled:opacity-50`}
                          >
                            {deletingId === s.id ? (
                              <SpinnerGap className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
