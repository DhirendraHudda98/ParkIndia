import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, MapPin, Clock, Car, SpinnerGap, Check,
  Lightning, Wheelchair, Motorcycle, Star,
  TrendUp, TrendDown,
} from '@phosphor-icons/react';
import { api } from '../api/client';
import { SkeletonCard } from '../components/Skeleton';
import toast from 'react-hot-toast';
import { useNavLayout } from '../hooks/useNavLayout';
import { useTheme } from '../context/ThemeContext';
import { echo } from '../lib/echo';
import ParkingMap from '../components/ParkingMap';
import { ParkingClusterMap } from '../components/ParkingClusterMap';

const DURATIONS = [
  { label: '1h', hours: 1 },
  { label: '2h', hours: 2 },
  { label: '4h', hours: 4 },
  { label: '8h', hours: 8 },
];

export function BookPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [navLayout] = useNavLayout();
  const { designTheme } = useTheme();

  const [step, setStep] = useState(1);
  const [lots, setLots] = useState([]);
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingLots, setLoadingLots] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dynamicPrice, setDynamicPrice] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [favoritesSet, setFavoritesSet] = useState(new Set());
  const [favPending, setFavPending] = useState(new Set());
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState(2);

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  useEffect(() => {
    Promise.all([api.getLots(userCoords?.lat, userCoords?.lng), api.getVehicles()])
      .then(([lRes, vRes]) => {
        if (lRes.success && lRes.data) {
          const filteredLots = lRes.data.filter((lot) => lot.status === 'open');
          setLots(filteredLots);
          
          // Pre-select lot from URL if present
          const params = new URLSearchParams(window.location.search);
          const preId = params.get('lot_id');
          if (preId) {
            const found = filteredLots.find(l => String(l.id) === String(preId));
            if (found) setSelectedLot(found);
          }
        }
        if (vRes.success && vRes.data) {
          setVehicles(vRes.data);
          const defaultVehicle = vRes.data.find((v) => v.is_default);
          if (defaultVehicle) setSelectedVehicle(defaultVehicle.id);
        }
      })
      .finally(() => setLoadingLots(false));

    // Handle Time Pre-filling
    const params = new URLSearchParams(window.location.search);
    const day = params.get('day');
    const hour = params.get('hour');
    if (day && hour) {
      const now = new Date();
      const target = new Date();
      const dayIdx = DAYS_FULL.findIndex(d => d.toLowerCase() === day.toLowerCase());
      if (dayIdx !== -1) {
        const currentDay = (now.getDay() + 6) % 7; // Monday = 0
        let diff = dayIdx - currentDay;
        if (diff < 0) diff += 7;
        target.setDate(now.getDate() + diff);
        target.setHours(parseInt(hour), 0, 0, 0);
        setStartDate(target.toISOString().slice(0, 16));
        toast.success(`Booking suggested for ${day} at ${hour}:00`);
      }
    }
  }, []);

  // Load user favorites for slot-level favorite toggles
  useEffect(() => {
    let mounted = true;
    api.getFavorites().then((res) => {
      if (!mounted) return;
      if (res.success && res.data) {
        setFavoritesSet(new Set(res.data.map((f) => f.slot_id)));
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  async function toggleFavorite(slot) {
    const slotId = slot.id;
    if (favPending?.has(slotId)) return;
    setFavPending((p) => new Set(p).add(slotId));

    if (favoritesSet.has(slotId)) {
      // remove
      const res = await api.removeFavorite(slotId);
      if (res.success) {
        setFavoritesSet((p) => {
          const n = new Set(p);
          n.delete(slotId);
          return n;
        });
        toast.success(t('favorites.removed'));
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } else {
      // add
      const res = await api.addFavorite(slotId, selectedLot?.id || slot.lot_id);
      if (res.success) {
        setFavoritesSet((p) => new Set(p).add(slotId));
        toast.success(t('favorites.added'));
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    }

    setFavPending((p) => {
      const n = new Set(p);
      n.delete(slotId);
      return n;
    });
  }

  const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (!selectedLot) return;

    const channelName = `lot.${selectedLot.id}`;
    const channel = echo.channel(channelName);

    channel.listen('.slot.availability.changed', (e) => {
      console.log('Real-time slot update:', e);
      setSlots(prev => {
        const slot = prev.find(s => s.id === e.slot_id);
        if (slot && slot.status !== e.status) {
          if (e.status === 'unavailable') {
            toast(`Another user just booked slot ${slot.slot_number}!`, { icon: '⚡' });
          } else {
            toast(`Slot ${slot.slot_number} is available again!`, { icon: '🟢' });
          }
        }
        return prev.map(s => s.id === e.slot_id ? { ...s, status: e.status } : s);
      });
    });

    return () => {
      channel.stopListening('.slot.availability.changed');
      echo.leaveChannel(channelName);
    };
  }, [selectedLot]);

  function selectVehicle(vehicleId) {
    setSelectedVehicle(vehicleId);
    setStep(2);
  }

  async function selectLot(lot) {
    setSelectedLot(lot);
    setSelectedSlot(null);
    setDynamicPrice(null);
    setLoadingSlots(true);
    setStep(3);

    const [slotsRes, priceRes] = await Promise.all([
      api.getLotSlots(lot.id),
      api.getDynamicPrice(lot.id),
    ]);

    if (slotsRes.success && slotsRes.data) setSlots(slotsRes.data);
    else {
      toast.error(t('common.error'));
      setSlots([]);
    }

    if (priceRes.success && priceRes.data) setDynamicPrice(priceRes.data);
    setLoadingSlots(false);
  }

  function goToConfirm() {
    if (selectedSlot) setStep(4);
  }

  function goBack() {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
      setSelectedLot(null);
      setSelectedSlot(null);
    } else if (step === 4) {
      setStep(3);
    }
  }

  async function handleConfirm() {
    if (!selectedLot || !selectedSlot) return;

    setSubmitting(true);
    const start = new Date(startDate);
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    const payload = {
      lot_id: selectedLot.id,
      slot_id: selectedSlot.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      vehicle_id: selectedVehicle || undefined,
    };

    const res = await api.createBooking(payload);
    if (res.success) {
      setConfirmed(true);
      toast.success(t('book.success'));
      setTimeout(() => navigate('/bookings'), 1500);
    } else {
      const message = res.error?.code === 'INSUFFICIENT_CREDITS'
        ? t('bookings.insufficientCredits')
        : res.error?.message || t('common.error');
      toast.error(message);
    }
    setSubmitting(false);
  }

  const start = new Date(startDate);
  const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
  const effectiveRate = dynamicPrice?.dynamic_pricing_active ? dynamicPrice.current_price : selectedLot?.hourly_rate;
  const effectiveRateNum = effectiveRate != null ? Number(effectiveRate) : null;
  const estimatedCost = effectiveRateNum != null ? (effectiveRateNum * duration).toFixed(0) : null;
  const shell = getStepShell(step, isVoid, isIndia, t);

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="space-y-6">
      {confirmed && <ConfettiOverlay />}

      <div className={`overflow-hidden rounded-[2rem] border p-5 shadow-xl transition-all ${
        isVoid
          ? 'border-slate-800/90 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.20),_transparent_32%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))]'
          : isIndia
          ? 'border-[#FF9933]/20 bg-[radial-gradient(circle_at_top_left,_rgba(255,153,51,0.12),_transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,248,240,0.92))] dark:border-[#FF9933]/30 dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,153,51,0.2),_transparent_38%),linear-gradient(135deg,rgba(10,10,26,0.98),rgba(0,0,51,0.94))]'
          : 'border-stone-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_38%),linear-gradient(135deg,rgba(255,252,248,0.98),rgba(240,253,250,0.92))] dark:border-surface-800 dark:bg-surface-900'
      }`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            {step > 1 && (
              <button onClick={goBack} className={`btn btn-ghost btn-sm mt-0.5 p-1.5 ${isIndia ? 'text-[#FF9933]' : ''}`} aria-label={t('common.back')}>
                <ArrowLeft weight="bold" className="h-5 w-5" />
              </button>
            )}
            <div className="space-y-2">
              <div className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] shadow-sm ${
                isVoid
                  ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100'
                  : isIndia
                  ? 'border-[#FF9933]/30 bg-[#FF9933]/10 text-[#FF9933]'
                  : 'border-emerald-200/70 bg-white/85 text-emerald-700 dark:border-emerald-900/60 dark:bg-surface-950/65 dark:text-emerald-300'
              }`}>
                {shell.kicker}
              </div>
              <div>
                <h1 className={`text-3xl font-black tracking-tighter ${isVoid ? 'text-white' : isIndia ? 'text-[#000080] dark:text-white' : 'text-surface-900 dark:text-white'}`}>
                  {shell.title}
                </h1>
                <p className={`mt-1 max-w-2xl text-sm leading-6 ${isVoid ? 'text-slate-300' : isIndia ? 'text-[#000080]/70 dark:text-[#FF9933]/80' : 'text-surface-600 dark:text-surface-300'}`}>
                  {shell.description}
                </p>
              </div>
            </div>
          </div>

          <nav className={`grid grid-cols-4 gap-2 rounded-[1.5rem] border p-2 shadow-sm backdrop-blur ${
            isVoid ? 'border-slate-800 bg-slate-950/70' : isIndia ? 'border-[#FF9933]/20 bg-white/80 dark:bg-[#000080]/20' : 'border-white/70 bg-white/80 dark:border-surface-800 dark:bg-surface-950/70'
          }`}>
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`min-w-[80px] rounded-[1.1rem] border px-3 py-3 text-left transition-all ${
                  s === step
                    ? isIndia ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-lg' : 'border-primary-400 bg-primary-600 text-white shadow-lg'
                    : s < step
                    ? isIndia ? 'border-[#000080]/20 bg-[#000080]/5 text-[#000080] dark:text-[#FF9933]' : 'border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-900/60 dark:bg-primary-950/40'
                    : 'border-surface-200 bg-white/80 text-surface-500 dark:border-surface-800 dark:bg-surface-950/50'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    s === step
                      ? 'bg-white/20 text-white'
                      : s < step
                      ? isIndia ? 'bg-[#000080] text-white' : 'bg-primary-600 text-white'
                      : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'
                  }`}>
                    {s < step ? <Check weight="bold" className="h-3.5 w-3.5" /> : s}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{t(`book.stepName${s}`)}</span>
                </div>
                <p className={`text-[10px] leading-4 ${s === step ? 'text-white/90' : 'opacity-70'}`}>
                  {t(`book.step${s}Label`)}
                </p>
              </div>
            ))}
          </nav>
        </div>

        <div className={`mt-5 flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between ${isVoid ? 'border-slate-800' : 'border-white/70 dark:border-surface-800'}`}>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className={`rounded-full px-3 py-1 ${isVoid ? 'bg-slate-950/70' : 'bg-white/80 dark:bg-surface-950/65'}`}>
              {t('book.progress', 'Booking progress')} {step}/4
            </span>
          </div>
          <div className={`h-2 w-full overflow-hidden rounded-full lg:max-w-sm ${isVoid ? 'bg-slate-950/70' : 'bg-white/80 dark:bg-surface-950/65'}`}>
            <motion.div
              className={`h-full rounded-full ${isIndia ? 'bg-gradient-to-r from-[#FF9933] via-white to-[#138808]' : 'bg-gradient-to-r from-teal-500 via-primary-500 to-amber-400'}`}
              initial={{ width: `${(step / 4) * 100}%` }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait" custom={step}>
        {step === 1 && (
          <motion.div key="step-1" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit">
            <StepSelectVehicle
              vehicles={vehicles}
              selectedVehicle={selectedVehicle}
              onSelect={selectVehicle}
              t={t}
              isIndia={isIndia}
            />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="step-2" custom={2} variants={slideVariants} initial="enter" animate="center" exit="exit">
            <StepSelectLot lots={lots} loading={loadingLots} onSelect={selectLot} t={t} isIndia={isIndia} />
          </motion.div>
        )}
        {step === 3 && selectedLot && (
          <motion.div key="step-3" custom={3} variants={slideVariants} initial="enter" animate="center" exit="exit">
            <StepSelectSlot
              lot={selectedLot}
              slots={slots}
              loading={loadingSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              startDate={startDate}
              onStartDateChange={setStartDate}
              duration={duration}
              onDurationChange={setDuration}
              vehicles={vehicles}
              selectedVehicle={selectedVehicle}
              onVehicleChange={setSelectedVehicle}
              onContinue={goToConfirm}
              t={t}
              isIndia={isIndia}
              isVoid={isVoid}
              favoritesSet={favoritesSet}
              favPending={favPending}
              toggleFavorite={toggleFavorite}
            />
          </motion.div>
        )}
        {step === 4 && selectedLot && selectedSlot && (
          <motion.div key="step-4" custom={4} variants={slideVariants} initial="enter" animate="center" exit="exit">
            <StepConfirm
              lot={selectedLot}
              slot={selectedSlot}
              start={start}
              end={end}
              duration={duration}
              estimatedCost={estimatedCost}
              vehicle={vehicles.find((v) => v.id === selectedVehicle)}
              submitting={submitting}
              onConfirm={handleConfirm}
              t={t}
              isIndia={isIndia}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function isLotOpenNow(hours) {
  if (!hours || hours.is_24h) return true;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const dayKey = days[now.getDay()];
  const dayHours = hours[dayKey];
  if (!dayHours || dayHours.closed) return false;
  const [openH, openM] = dayHours.open.split(':').map(Number);
  const [closeH, closeM] = dayHours.close.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  if (closeMins > openMins) return nowMins >= openMins && nowMins < closeMins;
  return nowMins >= openMins || nowMins < closeMins;
}

const badgeLabels = {
  your_usual_spot: { label: 'Usual Spot', color: 'bg-purple-100 text-purple-700' },
  best_price: { label: 'Best Price', color: 'bg-green-100 text-green-700' },
  closest_entrance: { label: 'Closest', color: 'bg-blue-100 text-blue-700' },
  available_now: { label: 'Available', color: 'bg-emerald-100 text-emerald-700' },
  preferred_lot: { label: 'Preferred', color: 'bg-amber-100 text-amber-700' },
  accessible: { label: 'Accessible', color: 'bg-indigo-100 text-indigo-700' },
};

function RecommendationsSection({ lots, onSelect, t, isIndia }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBookingRecommendations()
      .then((res) => { if (res.success && res.data) setRecs(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading || recs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Star weight="duotone" className={`h-5 w-5 ${isIndia ? 'text-[#FF9933]' : 'text-amber-500'}`} />
        <h2 className={`text-lg font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>{t('book.recommendedForYou')}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {recs.slice(0, 3).map((rec, index) => {
          const lot = lots.find((l) => l.id === rec.lot_id);
          return (
            <motion.button
              key={rec.slot_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => lot && onSelect(lot)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isIndia ? 'border-[#FF9933]/20 bg-white shadow-sm hover:border-[#FF9933]/50' : 'border-amber-200 bg-white hover:border-amber-400'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-sm font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>{rec.lot_name} - Slot {rec.slot_number}</p>
                  <p className="mt-0.5 text-[10px] uppercase font-bold tracking-tighter opacity-50">{rec.floor_name}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} weight={star <= Math.round(rec.score / 20) ? 'fill' : 'regular'} className={`h-3 w-3 ${star <= Math.round(rec.score / 20) ? 'text-[#FF9933]' : 'text-surface-300'}`} />
                  ))}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {rec.reason_badges.map((badge) => {
                  const info = badgeLabels[badge] || { label: badge, color: 'bg-surface-100 text-surface-600' };
                  return <span key={badge} className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter ${info.color}`}>{info.label}</span>;
                })}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StepSelectLot({ lots, loading, onSelect, t, isIndia }) {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState(null);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [mapProvider, setMapProvider] = useState('leaflet');
  const featuredCities = ['Delhi', 'Mumbai', 'Bangalore', 'Jalandhar', 'Chandigarh', 'Ludhiana', 'Amritsar'];
  const listRef = useRef(null);

  const filtered = lots.filter(l => {
    const cityMatch = cityFilter ? l.city === cityFilter : true;
    const searchMatch = search ? (
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.city || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.address || '').toLowerCase().includes(search.toLowerCase())
    ) : true;
    const priceMatch = Number(l.hourly_rate) <= maxPrice;
    const availabilityMatch = onlyAvailable ? l.available_slots > 0 : true;

    return cityMatch && searchMatch && priceMatch && availabilityMatch;
  }).sort((a, b) => (a.distance || 0) - (b.distance || 0));

  const handleMapSelect = (lot) => {
    onSelect(lot);
    // Smooth scroll to lot details if needed
    listRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cityGroups = filtered.reduce((acc, l) => {
    const city = l.city || 'Other';
    if (!acc[city]) acc[city] = [];
    acc[city].push(l);
    return acc;
  }, {});

  if (loading) return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <SkeletonCard key={i} height="h-36" />)}</div>;
  if (lots.length === 0) return <div className="p-8 text-center"><p>{t('book.noLots')}</p></div>;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_320px]">
      <div className="space-y-6">
        <div className={`rounded-[2rem] border p-6 shadow-xl transition-all ${
          isIndia ? 'border-[#FF9933]/10 bg-gradient-to-br from-[#FF9933]/5 to-white dark:from-[#0a0a1a] dark:to-[#000033]' : 'border-surface-200 bg-white'
        }`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080] dark:text-white' : ''}`}>{t('book.findLot', 'Find Your Deck')}</h3>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`}>{t('book.premiumFinder', 'Premium Parking Finder')}</p>
            </div>
            <div className="relative w-full md:max-w-xs">
              <MapPin className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isIndia ? 'text-[#000080]/40' : ''}`} />
              <input
                type="text"
                placeholder={t('book.searchPlaceholder', 'Search city, sector or lot...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full rounded-xl border px-10 py-3 text-sm focus:ring-2 ${
                  isIndia ? 'border-[#FF9933]/20 bg-white focus:border-[#FF9933] focus:ring-[#FF9933]/10 dark:bg-white/5' : ''
                }`}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-dashed border-surface-200 pt-6 dark:border-surface-800">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Price Range (max ₹{maxPrice})</p>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                step="50" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-48 accent-[#FF9933]"
              />
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Availability</p>
              <button 
                onClick={() => setOnlyAvailable(!onlyAvailable)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${onlyAvailable ? 'bg-[#138808]' : 'bg-surface-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${onlyAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-xs font-bold">{onlyAvailable ? 'Slots only' : 'All lots'}</span>
            </div>
          </div>
          <div className="mt-6">
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${isIndia ? 'text-[#000080]/40' : 'text-surface-400'}`}>
              Explore Regions
            </p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setCityFilter(null)} 
                className={`group relative overflow-hidden rounded-2xl px-6 py-4 transition-all ${
                  !cityFilter 
                    ? (isIndia ? 'bg-[#000080] text-white shadow-xl shadow-[#000080]/20' : 'bg-primary-600 text-white') 
                    : 'bg-white border border-surface-100 text-surface-600 hover:border-[#FF9933]/30 dark:bg-white/5 dark:border-white/10'
                }`}
              >
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">National</p>
                  <p className="text-sm font-black">All Cities</p>
                </div>
              </button>
              {featuredCities.map(c => (
                <button 
                  key={c} 
                  onClick={() => setCityFilter(c)} 
                  className={`group relative overflow-hidden rounded-2xl px-6 py-4 transition-all ${
                    cityFilter === c 
                      ? (isIndia ? 'bg-[#FF9933] text-white shadow-xl shadow-[#FF9933]/20' : 'bg-primary-600 text-white') 
                      : 'bg-white border border-surface-100 text-surface-600 hover:border-[#FF9933]/30 dark:bg-white/5 dark:border-white/10'
                  }`}
                >
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">India</p>
                    <p className="text-sm font-black">{c}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full relative z-0">
          <div className="flex justify-between items-center mb-4">
            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isIndia ? 'text-[#000080]' : 'text-primary-500'}`}>Map View Option</h4>
            <div className="flex gap-1.5 p-1 bg-surface-100 dark:bg-white/5 rounded-xl border border-surface-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setMapProvider('leaflet')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  mapProvider === 'leaflet'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-surface-600 dark:text-slate-400 hover:text-surface-900 dark:hover:text-white'
                }`}
              >
                Leaflet Cluster Map
              </button>
              <button
                type="button"
                onClick={() => setMapProvider('google')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  mapProvider === 'google'
                    ? 'bg-[#FF9933] text-white shadow-md'
                    : 'text-surface-600 dark:text-slate-400 hover:text-surface-900 dark:hover:text-white'
                }`}
              >
                Google Map
              </button>
            </div>
          </div>
          {mapProvider === 'leaflet' ? (
            <div className="rounded-3xl overflow-hidden border border-surface-200 dark:border-white/10 shadow-2xl h-[650px] relative z-0">
              <ParkingClusterMap onSelectLot={handleMapSelect} lots={lots} fullScreen={false} />
            </div>
          ) : (
            <ParkingMap onSelectLot={handleMapSelect} />
          )}
        </div>

        <RecommendationsSection lots={lots} onSelect={onSelect} t={t} isIndia={isIndia} />

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-12 text-center border-surface-200 dark:border-surface-800">
            <p className="text-surface-500">No parking lots found in this region.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(cityGroups).map(([city, cityLots]) => (
              <div key={city} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-surface-200 dark:bg-surface-800" />
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isIndia ? 'text-[#000080] dark:text-white/60' : ''}`}>{city}</h4>
                  <div className="h-px flex-1 bg-surface-200 dark:bg-surface-800" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {cityLots.map((l, i) => {
                    const occ = l.total_slots > 0 ? Math.round(((l.total_slots - l.available_slots) / l.total_slots) * 100) : 0;
                    const open = isLotOpenNow(l.operating_hours);
                    return (
                      <motion.button
                        key={l.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onSelect(l)}
                        className={`group relative overflow-hidden rounded-[2rem] border p-5 text-left transition-all ${
                          isIndia 
                            ? (i === 0 && l.distance != null ? 'border-[#FF9933] bg-[#FF9933]/5 ring-1 ring-[#FF9933]/20 shadow-xl' : 'border-surface-200 bg-white hover:border-[#FF9933]/40') 
                            : 'border-surface-200 bg-white'
                        }`}
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                               <p className={`text-[9px] font-black uppercase tracking-widest ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`}>{l.city || 'Sector Unknown'}</p>
                               {i === 0 && l.distance != null && (
                                 <span className="bg-[#138808]/10 text-[#138808] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">Best Option</span>
                               )}
                            </div>
                            <p className={`mt-1 text-lg font-black leading-tight truncate ${isIndia ? 'text-[#000080] dark:text-white' : ''}`}>{l.name}</p>
                            {l.distance != null && <p className="text-[10px] font-bold opacity-40 mt-1">📍 {l.distance} km away</p>}
                          </div>
                          <div className={`h-2.5 w-2.5 rounded-full ${!open ? 'bg-rose-500' : 'bg-[#138808]'} shadow-lg shadow-current/20`} />
                        </div>
                        <div className={`mt-4 flex items-center justify-between rounded-2xl px-4 py-3 ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-50'}`}>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">{t('book.available')}</p>
                            <p className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>{l.available_slots}</p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className={`h-1.5 w-1.5 rounded-full ${l.demand_level === 'High' ? 'bg-rose-500' : l.demand_level === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{l.demand_level} Demand</span>
                            </div>
                            <p className={`text-sm font-black ${occ > 80 ? 'text-rose-500' : 'text-[#138808]'}`}>{occ}% Full</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <p className={`text-xs font-black ${isIndia ? 'text-[#000080]' : ''}`}>
                            {l.hourly_rate != null ? `${l.currency === 'INR' || isIndia || import.meta.env.VITE_APP_NAME === 'ParkIndia' ? '₹' : (l.currency || import.meta.env.VITE_CURRENCY_SYMBOL || '€')}${Number(l.hourly_rate).toFixed(0)}/hr` : t('book.premium', 'Premium')}
                          </p>
                          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-white opacity-0 transition-all group-hover:opacity-100 ${isIndia ? 'bg-[#000080]' : 'bg-primary-600'}`}>
                            <ArrowLeft weight="bold" className="h-4 w-4 rotate-180" />
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className={`rounded-[1.75rem] border p-5 shadow-xl ${isIndia ? 'border-[#FF9933]/10 bg-white' : 'border-surface-200 bg-white'}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-surface-400">{t('book.selectionGuide')}</p>
        <h2 className={`mt-2 text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`} style={{ letterSpacing: '-0.03em' }}>{t('book.step1AsideTitle')}</h2>
        <p className="mt-2 text-sm leading-6 opacity-70">{t('book.step1Aside')}</p>
        <div className="mt-5 space-y-3">
          {[t('book.step1Guide1'), t('book.step1Guide2'), t('book.step1Guide3')].map((it) => (
            <div key={it} className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-50'}`}>
              <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white ${isIndia ? 'bg-[#FF9933]' : 'bg-primary-600'}`}>
                <Check weight="bold" className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm opacity-80">{it}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

const SLOT_ICON = { electric: Lightning, handicap: Wheelchair, motorcycle: Motorcycle, vip: Star };

function StepSelectSlot({ lot, slots, loading, selectedSlot, onSelectSlot, startDate, onStartDateChange, duration, onDurationChange, vehicles, selectedVehicle, onVehicleChange, onContinue, t, isIndia, isVoid, favoritesSet, favPending, toggleFavorite }) {
  const available = slots.filter(s => s.status === 'available');
  const start = new Date(startDate);
  const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
  const rate = lot.hourly_rate;
  const rateNum = rate != null ? Number(rate) : null;
  const isParkIndia = import.meta.env.VITE_APP_NAME === 'ParkIndia';
  const currency = isParkIndia || lot.currency === 'INR' || isIndia ? '₹' : (lot.currency || import.meta.env.VITE_CURRENCY_SYMBOL || '€');
  const rateLabel = rateNum != null ? `${currency}${rateNum.toFixed(0)}/h` : '—';
  const costLabel = rateNum != null ? `${currency}${(rateNum * duration).toFixed(0)}` : null;
  const grouped = groupSlotsByZone(slots);
  const selectedV = vehicles.find(v => v.id === selectedVehicle);

  const cardClass = `rounded-[1.75rem] border p-5 shadow-xl transition-all ${
    isVoid ? 'border-slate-800 bg-slate-950/80 text-white' : isIndia ? 'border-[#FF9933]/10 bg-white text-[#000080]' : 'border-surface-200 bg-white'
  }`;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
      <div className="space-y-6">
        <div className={cardClass}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-40">{t('book.plannerLabel')}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tighter">{lot.name}</h2>
              <p className="mt-1 text-sm opacity-60">{t('book.availableSlots', { count: available.length, total: slots.length })}</p>
            </div>
            {lot.dynamic_pricing_active && (
              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${
                lot.pricing_tier === 'surge' ? 'bg-red-100 text-red-700' : lot.pricing_tier === 'discount' ? 'bg-green-100 text-green-700' : 'bg-surface-100'
              }`}>
                {lot.pricing_tier === 'surge' ? <TrendUp weight="bold" /> : lot.pricing_tier === 'discount' ? <TrendDown weight="bold" /> : <Lightning weight="bold" />}
                <span>{currency}{Number(lot.hourly_rate).toFixed(0)}/h</span>
              </div>
            )}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className={`rounded-2xl p-4 ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-50'}`}>
              <label className="block text-sm font-bold"><Clock className="mr-1 inline h-4 w-4" />{t('book.startTime')}</label>
              <input type="datetime-local" value={startDate} onChange={e => onStartDateChange(e.target.value)} className={`input mt-3 text-sm ${isIndia ? 'border-[#FF9933]/20 focus:border-[#FF9933]' : ''}`} />
              <div className={`mt-3 rounded-2xl border bg-white px-4 py-3 text-sm font-bold ${isIndia ? 'border-[#FF9933]/20' : ''}`}>
                <div className="text-[10px] uppercase opacity-40">{t('book.window')}</div>
                <div className="mt-1">{formatDateTimeSummary(start)} - {formatTimeOnly(end)}</div>
              </div>
            </div>
            <div className={`rounded-2xl p-4 ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-50'}`}>
              <span className="block text-sm font-bold">{t('book.duration')}</span>
              <div className="mt-3 flex gap-2">
                {DURATIONS.map(it => (
                  <button key={it.hours} onClick={() => onDurationChange(it.hours)} className={`flex-1 rounded-xl border py-2 text-xs font-black transition ${
                    duration === it.hours 
                      ? (isIndia ? 'bg-[#FF9933] border-[#FF9933] text-white shadow-lg' : 'bg-primary-600 border-primary-600 text-white')
                      : 'bg-white border-surface-200 hover:border-[#FF9933]'
                  }`}>{it.label}</button>
                ))}
              </div>
              <div className={`mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold ${isIndia ? 'border border-[#FF9933]/20' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="opacity-40">{t('book.estimatedCost')}</span>
                  <span>{costLabel || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-40">{t('book.slotPlannerLabel')}</p>
              <h3 className="mt-2 text-xl font-black tracking-tighter">{t('book.selectSlot')}</h3>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-tighter">
              {[{ l: 'Free', t: 'bg-teal-500' }, { l: 'Busy', t: 'bg-red-400' }, { l: 'EV', t: 'bg-amber-400' }, { l: 'Access', t: 'bg-blue-500' }].map(it => (
                <span key={it.l} className="inline-flex items-center gap-1.5 rounded-full bg-surface-50 px-3 py-1">{it.l} <span className={`h-2 w-2 rounded-full ${it.t}`} /></span>
              ))}
            </div>
          </div>
          <div className="mt-5 space-y-5">
            {grouped.map(g => (
              <div key={g.zone} className={`rounded-2xl border p-4 ${isIndia ? 'bg-[#000080]/5 border-[#FF9933]/10' : 'bg-surface-50 border-surface-200'}`}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{t('book.zone')} {g.zone}</p>
                  <p className="text-xs font-bold">{g.availableCount}/{g.slots.length} {t('book.available')}</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {g.slots.map(s => {
                    const free = s.status === 'available';
                    const active = selectedSlot?.id === s.id;
                    const Icon = SLOT_ICON[s.slot_type];
                    return (
                      <motion.button
                        key={s.id}
                        disabled={!free}
                        onClick={() => onSelectSlot(s)}
                        whileHover={free ? { scale: 1.05 } : {}}
                        className={`relative flex h-16 w-20 flex-col items-center justify-center rounded-2xl border-2 text-sm font-black transition-all ${
                          active
                            ? (isIndia ? 'border-[#FF9933] bg-[#FF9933] text-white shadow-lg' : 'border-primary-500 bg-primary-600 text-white shadow-lg')
                            : free
                            ? (isIndia ? 'border-surface-200 bg-white text-[#000080] hover:border-[#FF9933]' : 'border-surface-200 bg-white')
                            : 'cursor-not-allowed border-surface-100 bg-surface-100 opacity-40'
                        }`}
                      >
                        {s.slot_number}
                            {Icon && <Icon weight="bold" className={`absolute right-2 top-2 h-3.5 w-3.5 ${active ? 'opacity-100' : 'opacity-40'}`} />}
                            {s.is_accessible && !Icon && <Wheelchair weight="bold" className={`absolute right-2 top-2 h-3.5 w-3.5 ${active ? 'opacity-100' : 'opacity-40 text-blue-500'}`} />}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(s); }}
                              disabled={favPending?.has(s.id)}
                              aria-label={favoritesSet.has(s.id) ? `Remove ${s.slot_number} from favorites` : `Add ${s.slot_number} to favorites`}
                              className={`absolute left-2 top-2 rounded-full p-1 transition-colors ${isVoid ? 'text-slate-300 hover:bg-white/[0.04]' : isIndia ? 'text-[#FF9933] hover:bg-[#FF9933]/5' : 'text-surface-400 hover:bg-surface-50'}`}
                            >
                              {favoritesSet.has(s.id) ? <Star weight="fill" className="h-4 w-4" /> : <Star weight="regular" className="h-4 w-4" />}
                            </button>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className={cardClass}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-40">{t('book.liveEstimate')}</p>
        <h3 className="mt-2 text-2xl font-black tracking-tighter">{t('book.summaryTitle')}</h3>
        <div className={`mt-5 rounded-2xl border px-4 py-4 transition ${
          selectedSlot 
            ? (isIndia ? 'border-[#FF9933]/30 bg-[#FF9933]/5' : 'border-primary-200 bg-primary-50')
            : 'border-dashed border-surface-200 bg-surface-50 opacity-50'
        }`}>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('book.selectedSlot')}</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-black">{selectedSlot?.slot_number || '—'}</p>
            {selectedSlot?.slot_type === 'electric' && <Lightning weight="bold" className="h-6 w-6 text-[#FF9933]" />}
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <SummaryBlock label={t('admin.lotName', 'Lot')} value={lot.name} />
          <SummaryBlock label={t('book.arrival', 'Arrival')} value={formatDateTimeSummary(start)} />
          <SummaryBlock label={t('book.end', 'End')} value={formatTimeOnly(end)} />
          <SummaryBlock label={t('admin.hourlyRate', 'Rate')} value={rateLabel} />
          <SummaryBlock label={t('credits.deduction', 'Total')} value={costLabel || '—'} emphasis />
        </div>
        <button onClick={onContinue} disabled={!selectedSlot} className={`btn btn-primary mt-6 w-full font-bold uppercase tracking-widest ${isIndia ? 'bg-[#000080] hover:bg-[#000066]' : ''}`}>
          {t('book.continue')}
        </button>
      </aside>
    </div>
  );
}

function StepConfirm({ lot, slot, start, end, duration, estimatedCost, vehicle, submitting, onConfirm, t, isIndia }) {
  const fmt = d => d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const currency = import.meta.env.VITE_APP_NAME === 'ParkIndia' || lot.currency === 'INR' || isIndia ? '₹' : (lot.currency || import.meta.env.VITE_CURRENCY_SYMBOL || '€');
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
      <div className={`rounded-[1.75rem] border p-5 shadow-xl bg-white ${isIndia ? 'border-[#FF9933]/10 text-[#000080]' : ''}`}>
        <div className={`rounded-2xl p-6 ${isIndia ? 'bg-gradient-to-br from-[#FF9933]/10 to-white' : 'bg-surface-50'}`}>
          <div className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm">{t('book.review', 'Review')}</div>
          <h2 className="mt-3 text-3xl font-black tracking-tighter">{t('book.readyToPark', 'Ready to park?')}</h2>
          <p className="mt-2 text-sm opacity-70">{t('book.confirmDesc', 'Confirm your premium spot reservation.')}</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className={`rounded-2xl border p-4 ${isIndia ? 'bg-[#000080]/5 border-[#FF9933]/10' : 'bg-surface-50'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Slot</p>
            <p className="mt-2 text-3xl font-black">{slot.slot_number}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${isIndia ? 'bg-[#000080]/5 border-[#FF9933]/10' : 'bg-surface-50'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Total Cost</p>
            <p className="mt-2 text-3xl font-black">{estimatedCost ? `${currency}${estimatedCost}` : '—'}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryTile label={t('book.arriving', 'Arriving')} value={fmt(start)} />
          <SummaryTile label={t('book.departing', 'Departing')} value={fmt(end)} />
          <SummaryTile label={t('vehicles.title', 'Vehicle')} value={vehicle ? vehicle.plate : t('common.none', 'None')} />
          <SummaryTile label={t('book.time', 'Time')} value={`${duration} ${t('book.hours', 'Hours')}`} />
        </div>
      </div>
      <aside className={`rounded-[1.75rem] border p-5 shadow-xl bg-white ${isIndia ? 'border-[#FF9933]/10 text-[#000080]' : ''}`}>
        <div className="divide-y divide-surface-100">
          <SummaryRow label="Lot" value={lot.name} />
          <SummaryRow label="Slot" value={slot.slot_number} />
          <SummaryRow label="Total" value={estimatedCost ? `${currency}${estimatedCost}` : '—'} bold />
        </div>
        <button onClick={onConfirm} disabled={submitting} className={`btn btn-primary mt-6 w-full font-bold uppercase tracking-widest ${isIndia ? 'bg-[#000080] hover:bg-[#000066]' : ''}`}>
          {submitting ? <SpinnerGap className="animate-spin h-5 w-5 mx-auto" /> : t('book.confirm')}
        </button>
      </aside>
    </div>
  );
}

function SummaryRow({ label, value, bold }) {
  return <div className="flex items-center justify-between py-3"><span className="text-sm opacity-50">{label}</span><span className={`text-sm ${bold ? 'font-black' : 'font-bold'}`}>{value}</span></div>;
}

function SummaryBlock({ label, value, emphasis }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-50 px-4 py-2.5"><span className="text-xs font-bold opacity-40 uppercase tracking-tighter">{label}</span><span className={`text-xs font-black ${emphasis ? 'text-[#FF9933]' : ''}`}>{value}</span></div>;
}

function SummaryTile({ label, value }) {
  return <div className="rounded-xl border border-surface-100 bg-white px-4 py-3"><p className="text-[9px] font-black uppercase tracking-widest opacity-40">{label}</p><p className="mt-1 text-xs font-black">{value}</p></div>;
}

function StepSelectVehicle({ vehicles, selectedVehicle, onSelect, t, isIndia }) {
  if (vehicles.length === 0) {
    return (
      <div className={`rounded-[2rem] border p-8 text-center bg-white shadow-xl ${isIndia ? 'border-[#FF9933]/10' : ''}`}>
        <Car weight="duotone" className={`mx-auto h-16 w-16 opacity-20 mb-4 ${isIndia ? 'text-[#FF9933]' : ''}`} />
        <h3 className="text-xl font-bold">{t('vehicles.noVehicles', 'No vehicles found')}</h3>
        <p className="mt-2 text-sm opacity-60 mb-6">{t('vehicles.addVehiclePrompt', 'Add a vehicle to your account to start booking.')}</p>
        <button 
          onClick={() => window.location.href = '/vehicles'} 
          className={`btn btn-primary px-8 ${isIndia ? 'bg-[#000080]' : ''}`}
        >
          {t('nav.vehicles')}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className={`rounded-[2rem] border p-6 bg-white shadow-xl ${isIndia ? 'border-[#FF9933]/10' : ''}`}>
        <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>{t('book.vehicleTitle', 'Select Your Vehicle')}</h3>
        <p className="mt-1 text-sm opacity-60">{t('book.step0Hint', 'Choose which vehicle you are parking today.')}</p>
        
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <motion.button
              key={v.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(v.id)}
              className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                selectedVehicle === v.id
                  ? isIndia ? 'border-[#FF9933] bg-[#FF9933]/5 ring-2 ring-[#FF9933]/20' : 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
                  : 'border-surface-100 bg-white hover:border-surface-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  selectedVehicle === v.id 
                    ? isIndia ? 'bg-[#FF9933] text-white' : 'bg-primary-600 text-white'
                    : 'bg-surface-50 text-surface-400'
                }`}>
                  <Car weight="bold" className="h-5 w-5" />
                </div>
                {v.is_default && (
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                    isIndia ? 'bg-[#000080] text-white' : 'bg-primary-100 text-primary-700'
                  }`}>
                    Default
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className={`text-xs font-black uppercase tracking-[0.2em] opacity-40 ${isIndia ? 'text-[#000080]' : ''}`}>
                  {v.make} {v.model}
                </p>
                <p className={`mt-1 text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>
                  {v.plate}
                </p>
              </div>
              {selectedVehicle === v.id && (
                <div className={`absolute right-4 top-4 rounded-full p-1 ${isIndia ? 'bg-[#FF9933] text-white' : 'bg-primary-600 text-white'}`}>
                  <Check weight="bold" className="h-3 w-3" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getStepShell(step, isVoid, isIndia, t) {
  if (isVoid) return { kicker: t('book.shellLotKicker'), title: t('book.title'), description: t('book.step1Hint') };
  
  switch (step) {
    case 1:
      return {
        kicker: t('book.shellVehicleKicker'),
        title: t('book.vehicleTitle'),
        description: t('book.step0Hint')
      };
    case 2: 
      return { 
        kicker: t('book.shellLotKicker'), 
        title: t('book.findLot'), 
        description: t('book.step1Hint') 
      };
    case 3: 
      return { 
        kicker: t('book.detailsTitle'), 
        title: t('book.selectionTitle'), 
        description: t('book.step2Hint') 
      };
    default: 
      return { 
        kicker: t('book.finalReview'), 
        title: t('book.summaryTitle'), 
        description: t('book.step3Hint') 
      };
  }
}

function formatDateTimeSummary(d) { return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function formatTimeOnly(d) { return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }

function groupSlotsByZone(slots) {
  const m = new Map();
  slots.forEach(s => {
    const z = s.zone_id || s.slot_number.match(/[A-Za-z]+/)?.[0]?.toUpperCase() || 'Gen';
    const ex = m.get(z) || []; ex.push(s); m.set(z, ex);
  });
  return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([z, zs]) => ({
    zone: z, slots: zs.sort((a, b) => a.slot_number.localeCompare(b.slot_number, undefined, { numeric: true })),
    availableCount: zs.filter(s => s.status === 'available').length
  }));
}

function ConfettiOverlay() {
  const pieces = Array.from({ length: 30 }, (_, i) => ({ id: i, left: `${Math.random() * 100}%`, delay: Math.random() * 0.5, dur: 1.5 + Math.random(), size: 5 + Math.random() * 5 }));
  return <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">{pieces.map(p => <motion.div key={p.id} className="absolute rounded-full bg-[#FF9933]" style={{ left: p.left, top: -10, width: p.size, height: p.size }} initial={{ y: -20, opacity: 1 }} animate={{ y: '100vh', opacity: 0 }} transition={{ duration: p.dur, delay: p.delay }} />)}</div>;
}

export default BookPage;
