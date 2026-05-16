import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapTrifold, Pencil, Question, Tag, X } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const TIER_STYLES = {
  economy: { bg: 'bg-[#138808]/10', text: 'text-[#138808]', border: 'border-[#138808]/20' },
  standard: { bg: 'bg-[#000080]/10', text: 'text-[#000080]', border: 'border-[#000080]/20' },
  premium: { bg: 'bg-[#FF9933]/10', text: 'text-[#FF9933]', border: 'border-[#FF9933]/20' },
  vip: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
};

export function AdminZonesPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [editZoneId, setEditZoneId] = useState(null);
  const [editTier, setEditTier] = useState('standard');
  const [editMultiplier, setEditMultiplier] = useState('1.0');
  const [editCapacity, setEditCapacity] = useState('');

  const loadZones = useCallback(async () => {
    setLoading(true);
    try {
      const lotsRes = await fetch('/api/v1/lots').then(r => r.json());
      if (lotsRes.success && lotsRes.data) {
        const allZones = [];
        for (const lot of lotsRes.data) {
          const zRes = await fetch(`/api/v1/lots/${lot.id}/zones/pricing`).then(r => r.json());
          if (zRes.success && zRes.data) {
            allZones.push(...zRes.data);
          }
        }
        setZones(allZones);
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadZones(); }, [loadZones]);

  function startEdit(zone) {
    setEditZoneId(zone.id);
    setEditTier(zone.tier);
    setEditMultiplier(zone.pricing_multiplier.toString());
    setEditCapacity(zone.max_capacity?.toString() || '');
  }

  async function handleSavePricing() {
    if (!editZoneId) return;
    try {
      const body = { tier: editTier };
      const mult = parseFloat(editMultiplier);
      if (!isNaN(mult) && mult > 0) body.pricing_multiplier = mult;
      const cap = parseInt(editCapacity, 10);
      if (!isNaN(cap) && cap > 0) body.max_capacity = cap;

      const res = await fetch(`/api/v1/admin/zones/${editZoneId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json());

      if (res.success) {
        toast.success(t('parkingZones.pricingUpdated'));
        setEditZoneId(null);
        loadZones();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 p-2 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 text-primary-500'}`}>
            <MapTrifold weight="bold" className="w-7 h-7" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {isIndia ? 'Regional Hub Zones' : t('parkingZones.title')}
            </h2>
            <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
              {isIndia ? 'Configure localized pricing multipliers and occupancy limits for regional hubs.' : t('parkingZones.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(h => !h)}
          className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/40 hover:bg-[#000080]/5' : 'text-surface-400 hover:bg-surface-100'}`}
        >
          <Question weight="bold" size={24} />
        </button>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`rounded-[2rem] border p-6 text-sm leading-relaxed ${isIndia ? 'bg-[#000080]/5 border-[#000080]/10 text-[#000080]/70' : 'bg-primary-50 border-primary-100'}`}>
            <p className="font-bold mb-2 uppercase tracking-widest text-[10px] opacity-60">Operations Briefing</p>
            {t('parkingZones.help')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-64 skeleton rounded-[2.5rem]" />)}
        </div>
      ) : zones.length === 0 ? (
        <div className="text-center py-20 rounded-[3rem] border border-dashed border-surface-200">
          <MapTrifold weight="thin" size={80} className="mx-auto mb-6 opacity-10" />
          <p className="text-lg font-bold text-surface-400">{t('parkingZones.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map(zone => {
            const style = TIER_STYLES[zone.tier] || TIER_STYLES.standard;
            const isEditing = editZoneId === zone.id;
            return (
              <motion.div
                key={zone.id}
                layout
                className={`rounded-[2.5rem] border p-8 transition-all hover:shadow-2xl ${isEditing ? 'border-[#FF9933] bg-white ring-4 ring-[#FF9933]/5' : (isIndia ? 'bg-white border-[#FF9933]/10 hover:border-[#FF9933]/30 shadow-sm shadow-[#000080]/5' : 'bg-white border-surface-100')}`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="min-w-0">
                    <h3 className={`text-xl font-black truncate ${isIndia ? 'text-[#000080]' : ''}`}>{zone.name}</h3>
                    {zone.description && <p className="text-xs font-medium text-surface-400 mt-1 truncate">{zone.description}</p>}
                  </div>
                  {!isEditing && (
                    <button onClick={() => startEdit(zone)} className={`p-3 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/30 hover:bg-[#FF9933]/10 hover:text-[#FF9933]' : 'text-surface-300 hover:text-primary-600'}`}>
                      <Pencil weight="bold" size={20} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-8">
                  <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${style.bg} ${style.text} ${style.border}`}>
                    <Tag weight="bold" className="w-3 h-3 inline mr-1.5" />
                    {zone.tier_display}
                  </span>
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black font-mono tracking-widest ${isIndia ? 'bg-[#000080]/5 text-[#000080]/40' : 'bg-surface-50 text-surface-400'}`}>
                    {zone.pricing_multiplier.toFixed(1)}x
                  </span>
                </div>

                {zone.max_capacity && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-surface-400">
                      <span>{t('parkingZones.capacity')}</span>
                      <span className={isIndia ? 'text-[#000080]' : ''}>{zone.max_capacity} UNITS</span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-100'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '60%' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: zone.color || (isIndia ? '#FF9933' : '#3b82f6') }}
                      />
                    </div>
                  </div>
                )}

                {isEditing && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 pt-8 border-t border-surface-50 space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-surface-400">{t('parkingZones.tier')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(TIER_STYLES).map(tier => (
                          <button
                            key={tier}
                            onClick={() => setEditTier(tier)}
                            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${editTier === tier ? (isIndia ? 'bg-[#000080] text-white border-[#000080]' : 'bg-primary-600 text-white border-primary-600') : 'bg-white text-surface-400 border-surface-100 hover:border-surface-200'}`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-surface-400">{t('parkingZones.multiplier')}</label>
                        <input type="number" step="0.1" min="0.1" value={editMultiplier} onChange={e => setEditMultiplier(e.target.value)} className="input-field w-full text-center font-mono font-black" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-surface-400">{t('parkingZones.maxCapacity')}</label>
                        <input type="number" min="1" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} className="input-field w-full text-center font-mono font-black" />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={handleSavePricing} className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl ${isIndia ? 'bg-[#138808] shadow-[#138808]/20' : 'bg-primary-600'}`}>{t('parkingZones.save')}</button>
                      <button onClick={() => setEditZoneId(null)} className="px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-surface-400 hover:bg-surface-50">{t('common.cancel')}</button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default AdminZonesPage;
