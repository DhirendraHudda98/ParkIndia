import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  SignIn, SignOut, SpinnerGap, Clock,
  MapPin, CalendarBlank, ArrowClockwise,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { api } from '../api/client';
import { stagger, fadeUp } from '../constants/animations';
import { useTheme } from '../context/ThemeContext';

export function QRCheckInPage() {
  const { t, i18n } = useTranslation();
  const { designTheme } = useTheme();
  const dateFnsLocale = i18n.language?.startsWith('de') ? de : enUS;
  const [booking, setBooking] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState('');
  const [currentStatus, setCurrentStatus] = useState('NOT_ARRIVED'); // NOT_ARRIVED, READY, CHECKED_IN, EXPIRED
  const timerRef = useRef(null);

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  async function loadData() {
    setLoading(true);
    try {
      const bookingsRes = await api.getBookings();
      if (bookingsRes.success && bookingsRes.data) {
        const now = Date.now();
        // Find active booking or the next upcoming one
        const sorted = bookingsRes.data
          .filter(b => b.status === 'active' || b.status === 'confirmed')
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        
        const active = sorted.find(b => new Date(b.end_time).getTime() > now);

        if (active) {
          setBooking(active);
          const statusRes = await api.getCheckInStatus(active.id);
          if (statusRes.success && statusRes.data) {
            setCheckInStatus(statusRes.data);
          } else {
            setCheckInStatus({ checked_in: false, checked_in_at: null, checked_out_at: null });
          }
        } else {
          setBooking(null);
          setCheckInStatus(null);
        }
      }
    } catch {
      toast.error(t('common.error'));
    }
    setLoading(false);
  }

  useEffect(() => { void loadData(); }, []);

  // Live Timer and Status Logic
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const update = () => {
      if (!booking) return;

      const now = new Date();
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      const checkInWindowStart = new Date(start.getTime() - 15 * 60000); // 15 mins before

      let newStatus = 'NOT_ARRIVED';
      let displayTime = '';

      if (checkInStatus?.checked_in && !checkInStatus?.checked_out_at) {
        newStatus = 'CHECKED_IN';
        const diff = now.getTime() - new Date(checkInStatus.checked_in_at).getTime();
        displayTime = formatDuration(diff);
      } else if (now > end) {
        newStatus = 'EXPIRED';
        displayTime = '00:00:00';
      } else if (now >= checkInWindowStart) {
        newStatus = 'READY';
        const diff = end.getTime() - now.getTime(); // Time remaining until booking ends
        displayTime = formatDuration(diff);
      } else {
        newStatus = 'NOT_ARRIVED';
        const diff = start.getTime() - now.getTime(); // Time until check-in window opens
        displayTime = formatDuration(diff);
      }

      setCurrentStatus(newStatus);
      setTimerDisplay(displayTime);
    };

    if (booking) {
      update();
      timerRef.current = setInterval(update, 1000);
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [booking, checkInStatus]);

  function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  const getStatusConfig = () => {
    switch (currentStatus) {
      case 'CHECKED_IN':
        return { label: t('checkin.sessionActive'), color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: <SignIn weight="fill" /> };
      case 'READY':
        return { label: t('checkin.readyToPark'), color: 'text-blue-500', bg: 'bg-blue-500/10', icon: <Clock weight="fill" /> };
      case 'EXPIRED':
        return { label: t('checkin.expired'), color: 'text-red-500', bg: 'bg-red-500/10', icon: <SignOut weight="fill" /> };
      default:
        return { label: t('checkin.notArrived'), color: 'text-amber-500', bg: 'bg-amber-500/10', icon: <CalendarBlank weight="fill" /> };
    }
  };

  const statusConfig = getStatusConfig();

  async function handleCheckIn() {
    if (!booking || currentStatus !== 'READY') {
      if (currentStatus === 'NOT_ARRIVED') toast.error(t('checkin.tooEarly'));
      if (currentStatus === 'EXPIRED') toast.error(t('checkin.expired'));
      return;
    }
    setActing(true);
    try {
      const res = await api.checkInDirect();
      if (res.success) {
        toast.success(res.message || t('checkin.checkedIn', 'Checked in successfully'));
        loadData();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setActing(false);
  }

  async function handleCheckOut() {
    if (!booking) return;
    setActing(true);
    try {
      const res = await api.checkOut(booking.id);
      if (res.success) {
        toast.success(t('checkin.checkedOut', 'Checked out successfully'));
        loadData();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setActing(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className={`animate-spin rounded-full h-8 w-8 border-2 ${isIndia ? 'border-[#FF9933]' : 'border-primary-500'} border-t-transparent`} />
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-5xl mx-auto"
      data-testid="checkin-shell"
      data-surface={isVoid ? 'void' : isIndia ? 'india' : 'marble'}
    >
      <motion.div
        variants={fadeUp}
        className={`overflow-hidden rounded-[30px] border px-6 py-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)] ${
          isVoid
            ? 'border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_32%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.95))] text-white'
            : isIndia
            ? 'border-[#FF9933]/20 bg-[radial-gradient(circle_at_top_left,_rgba(255,153,51,0.14),_transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,248,240,0.92))] text-[#000080] dark:border-[#FF9933]/30 dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,153,51,0.22),_transparent_36%),linear-gradient(135deg,rgba(10,10,26,0.98),rgba(0,0,51,0.94))] dark:text-white'
            : 'border-stone-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_34%),linear-gradient(135deg,rgba(255,252,248,0.98),rgba(240,253,250,0.92))] text-surface-900 dark:border-surface-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.22),_transparent_36%),linear-gradient(135deg,rgba(22,26,34,0.98),rgba(31,41,55,0.94))] dark:text-white'
        }`}
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
              isVoid
                ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100'
                : isIndia
                ? 'border-[#FF9933]/30 bg-[#FF9933]/10 text-[#FF9933]'
                : 'border-emerald-200/80 bg-white/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-white/10 dark:text-emerald-300'
            }`}>
              <SignIn weight="duotone" className="h-4 w-4" />
              {isVoid ? 'Void check-in' : isIndia ? '🇮🇳 ParkIndia' : 'Marble check-in'}
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-[-0.04em]">{t('checkin.title')}</h1>
                <p className={`mt-2 max-w-2xl text-sm leading-6 ${isVoid ? 'text-slate-300' : 'text-surface-600 dark:text-surface-300'}`}>
                  {t('checkin.subtitle')}
                </p>
              </div>
              <button onClick={loadData} className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                isVoid
                  ? 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                  : isIndia
                  ? 'border-[#FF9933]/20 bg-white/85 text-[#FF9933] hover:bg-white dark:bg-white/[0.04] dark:text-white'
                  : 'border-white/80 bg-white/85 text-surface-700 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white'
              }`}>
                <ArrowClockwise weight="bold" className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <CheckinStatCard
                label={t('dashboard.slot')}
                value={booking?.slot_number ?? '—'}
                meta={booking?.lot_name ?? t('checkin.noBooking')}
                isVoid={isVoid}
                isIndia={isIndia}
                accent
                icon={<MapPin weight="duotone" className="h-4 w-4" />}
              />
              <CheckinStatCard
                label={t('checkin.statusLabel')}
                value={statusConfig.label}
                meta={booking ? (currentStatus === 'CHECKED_IN' ? t('checkin.sessionActive') : t('checkin.readyToPark')) : '—'}
                isVoid={isVoid}
                isIndia={isIndia}
                icon={statusConfig.icon}
              />
              <CheckinStatCard
                label={currentStatus === 'CHECKED_IN' ? t('checkin.elapsed') : t('checkin.endTime')}
                value={booking ? timerDisplay : '—'}
                meta={currentStatus === 'CHECKED_IN' ? t('checkin.since', { time: format(new Date(checkInStatus?.checked_in_at), 'HH:mm', { locale: dateFnsLocale }) }) : (booking ? format(new Date(booking.end_time), 'HH:mm') : '—')}
                isVoid={isVoid}
                isIndia={isIndia}
                icon={<Clock weight="duotone" className="h-4 w-4" />}
              />
            </div>
          </div>

          <div className={`rounded-[24px] border p-5 ${
            isVoid
              ? 'border-white/10 bg-white/[0.04]'
              : isIndia
              ? 'border-[#FF9933]/20 bg-white/85 dark:bg-white/[0.04]'
              : 'border-white/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.04]'
          }`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isVoid ? 'text-white/45' : 'text-surface-500 dark:text-white/45'}`}>
              {t('checkin.opsLabel', 'Arrival briefing')}
            </p>
            <div className="mt-4 space-y-3">
              <DigestLine
                icon={<MapPin weight="fill" className="h-4 w-4" />}
                title={t('dashboard.slot')}
                body={booking ? `${booking.lot_name} · ${booking.slot_number}` : t('checkin.noBooking')}
                meta={booking ? format(new Date(booking.start_time), 'EEEE, d. MMM', { locale: dateFnsLocale }) : t('checkin.noBookingHint')}
                isVoid={isVoid}
                isIndia={isIndia}
              />
              <DigestLine
                icon={<CalendarBlank weight="fill" className="h-4 w-4" />}
                title={t('checkin.startTime')}
                body={booking ? format(new Date(booking.start_time), 'HH:mm') : '—'}
                meta={booking ? `${t('checkin.endTime')} ${format(new Date(booking.end_time), 'HH:mm')}` : t('checkin.bookNow')}
                isVoid={isVoid}
                isIndia={isIndia}
              />
              <DigestLine
                icon={<Clock weight="fill" className="h-4 w-4" />}
                title={t('checkin.statusLabel', 'Status')}
                body={statusConfig.label}
                meta={checkInStatus?.checked_in_at ? t('checkin.since', { time: format(new Date(checkInStatus.checked_in_at), 'HH:mm', { locale: dateFnsLocale }) }) : t('checkin.statusLabel')}
                isVoid={isVoid}
                isIndia={isIndia}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {!booking && (
        <motion.div variants={fadeUp} className={`rounded-[28px] border p-12 text-center ${
          isVoid
            ? 'border-slate-800 bg-slate-950/85 text-white'
            : isIndia
            ? 'border-[#FF9933]/20 bg-white text-[#000080] shadow-[0_18px_50px_-38px_rgba(15,23,42,0.18)] dark:bg-surface-950/80 dark:text-white'
            : 'border-surface-200 bg-white text-surface-900 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.18)] dark:border-surface-800 dark:bg-surface-950/80 dark:text-white'
        }`}>
          <SignIn weight="thin" className={`mx-auto mb-4 h-16 w-16 ${isVoid ? 'text-slate-600' : isIndia ? 'text-[#FF9933]' : 'text-surface-300 dark:text-surface-600'}`} />
          <p className={`text-lg font-semibold ${isVoid ? 'text-white' : 'text-surface-700 dark:text-white'}`}>{t('checkin.noBooking')}</p>
          <p className={`mt-1 mb-5 text-sm ${isVoid ? 'text-slate-400' : 'text-surface-500 dark:text-surface-400'}`}>{t('checkin.noBookingHint')}</p>
          <Link to="/book" className={`btn ${isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00] text-white' : 'btn-primary'}`}>{t('checkin.bookNow')}</Link>
        </motion.div>
      )}

      {booking && (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.div variants={fadeUp} className={`rounded-[28px] border p-5 ${
            isVoid
              ? 'border-slate-800 bg-slate-950/85 text-white'
              : isIndia
              ? 'border-[#FF9933]/20 bg-white dark:bg-surface-950/80 dark:text-white'
              : 'border-surface-200 bg-white text-surface-900 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.18)] dark:border-surface-800 dark:bg-surface-950/80 dark:text-white'
          }`}>
            <div className="flex items-center gap-2">
              <MapPin weight="fill" className={`h-5 w-5 ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`} />
              <span className="text-lg font-semibold">{booking.lot_name}</span>
            </div>
            <p className={`mt-1 text-sm ${isVoid ? 'text-slate-400' : 'text-surface-500 dark:text-surface-400'}`}>
              {booking.slot_number} · {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className={`rounded-[22px] border p-4 ${isVoid ? 'border-white/10 bg-white/[0.04]' : isIndia ? 'border-[#FF9933]/10 bg-white/50 dark:bg-surface-900/70' : 'border-surface-100 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/70'}`}>
                <p className="mb-1 text-xs text-surface-400 dark:text-surface-500">{t('dashboard.slot')}</p>
                <p className="font-semibold text-surface-800 dark:text-surface-200">{booking.slot_number}</p>
              </div>
              <div className={`rounded-[22px] border p-4 ${isVoid ? 'border-white/10 bg-white/[0.04]' : isIndia ? 'border-[#FF9933]/10 bg-white/50 dark:bg-surface-900/70' : 'border-surface-100 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/70'}`}>
                <p className="mb-1 text-xs text-surface-400 dark:text-surface-500">{t('checkin.date')}</p>
                <p className="font-semibold text-surface-800 dark:text-surface-200">
                  {format(new Date(booking.start_time), 'd. MMM', { locale: dateFnsLocale })}
                </p>
              </div>
            </div>
            
            {currentStatus === 'NOT_ARRIVED' && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {t('checkin.tooEarly')}
                </p>
                <p className="text-xs text-amber-500 mt-1">
                  You can check-in 15 minutes before your booking starts.
                </p>
              </div>
            )}
            
            {currentStatus === 'EXPIRED' && (
              <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                  <SignOut className="w-4 h-4" /> {t('checkin.expired')}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  This booking has expired. Please book a new spot.
                </p>
              </div>
            )}
          </motion.div>

          <div className="flex flex-col gap-4">
            {currentStatus === 'READY' && (
              <motion.div variants={fadeUp} className={`rounded-[28px] border p-8 flex flex-col items-center justify-center flex-1 ${
                isVoid
                  ? 'border-slate-800 bg-slate-950/85 text-white'
                  : isIndia
                  ? 'border-[#FF9933]/20 bg-white dark:bg-surface-950/80 dark:text-white'
                  : 'border-surface-200 bg-white text-surface-900 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.18)] dark:border-surface-800 dark:bg-surface-950/80 dark:text-white'
              }`}>
                <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-primary-500/10 text-primary-500'}`}>
                  <SignIn weight="bold" className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('checkin.readyToPark')}</h3>
                <p className={`text-center text-sm mb-8 ${isVoid ? 'text-slate-400' : 'text-surface-500 dark:text-surface-400'}`}>
                  Click the button below to confirm your arrival and start your session.
                </p>
                <button
                  onClick={handleCheckIn}
                  disabled={acting}
                  className={`btn w-full py-4 text-lg font-bold shadow-lg transform transition active:scale-95 ${isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00] text-white shadow-[#FF9933]/20' : 'btn-primary shadow-primary-500/20'}`}
                  data-testid="checkin-btn"
                >
                  {acting
                    ? <SpinnerGap weight="bold" className="w-6 h-6 animate-spin" />
                    : <><SignIn weight="bold" className="w-6 h-6" /> {t('checkin.checkInBtn')}</>
                  }
                </button>
              </motion.div>
            )}

            {currentStatus === 'CHECKED_IN' && (
              <div className="space-y-4 flex-1 flex flex-col">
                <motion.div variants={fadeUp} className={`rounded-[28px] border p-8 text-center flex-1 flex flex-col justify-center ${
                  isVoid
                    ? 'border-cyan-500/20 bg-cyan-500/10 text-white'
                    : isIndia
                    ? 'border-[#FF9933]/20 bg-[#FF9933]/10 text-[#000080] dark:text-white'
                    : 'border-emerald-200 bg-emerald-500/10 text-surface-900 dark:border-emerald-900/60 dark:text-white'
                }`}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-60">
                    {t('checkin.elapsed')}
                  </p>
                  <p className="text-5xl font-mono font-black" data-testid="elapsed-timer">{timerDisplay}</p>
                  {checkInStatus?.checked_in_at && (
                    <p className="mt-3 text-sm font-medium opacity-70">
                      {t('checkin.since', { time: format(new Date(checkInStatus.checked_in_at), 'HH:mm', { locale: dateFnsLocale }) })}
                    </p>
                  )}
                </motion.div>
                <motion.div variants={fadeUp}>
                  <button
                    onClick={handleCheckOut}
                    disabled={acting}
                    className="btn w-full py-4 text-lg font-bold border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 transform transition active:scale-95"
                    data-testid="checkout-btn"
                  >
                    {acting
                      ? <SpinnerGap weight="bold" className="w-6 h-6 animate-spin" />
                      : <><SignOut weight="bold" className="h-6 h-6" /> {t('checkin.checkOutBtn')}</>
                    }
                  </button>
                </motion.div>
              </div>
            )}
            
            {(currentStatus === 'NOT_ARRIVED' || currentStatus === 'EXPIRED') && (
              <motion.div variants={fadeUp} className={`rounded-[28px] border p-12 text-center opacity-50 grayscale flex-1 flex flex-col justify-center ${
                isVoid ? 'border-slate-800 bg-slate-950/85' : 'border-surface-200 bg-white dark:bg-surface-950/80'
              }`}>
                <SignIn weight="thin" className="mx-auto mb-4 h-24 w-24" />
                <p className="text-sm font-medium">{currentStatus === 'EXPIRED' ? t('checkin.expired') : t('checkin.tooEarly')}</p>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CheckinStatCard({
  label,
  value,
  meta,
  isVoid,
  isIndia,
  accent = false,
  icon,
}) {
  return (
    <div className={`rounded-[22px] border px-4 py-4 ${
      isVoid
        ? accent
          ? 'border-cyan-500/20 bg-cyan-500/10'
          : 'border-white/10 bg-white/[0.04]'
        : isIndia
        ? accent
          ? 'border-[#FF9933]/30 bg-[#FF9933]/10'
          : 'border-[#FF9933]/10 bg-white/80 dark:bg-white/5'
        : accent
          ? 'border-emerald-200 bg-emerald-500/10 dark:border-emerald-900/60'
          : 'border-white/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.04]'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-400'}>
          {icon}
        </div>
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
          isVoid
            ? accent ? 'text-cyan-100' : 'text-white/45'
            : accent ? 'text-emerald-700 dark:text-emerald-300' : 'text-surface-500 dark:text-white/45'
        }`}>
          {label}
        </p>
      </div>
      <p className={`text-2xl font-black tracking-[-0.05em] truncate ${isVoid ? 'text-white' : 'text-surface-900 dark:text-white'}`}>{value}</p>
      <p className={`mt-1 text-[11px] font-medium truncate ${isVoid ? 'text-white/60' : 'text-surface-500 dark:text-surface-400'}`}>{meta}</p>
    </div>
  );
}

function DigestLine({
  icon,
  title,
  body,
  meta,
  isVoid,
  isIndia,
}) {
  return (
    <div className={`rounded-[20px] border px-4 py-4 ${
      isVoid
        ? 'border-white/10 bg-white/[0.03]'
        : isIndia
        ? 'border-[#FF9933]/10 bg-white/80 dark:bg-white/[0.03]'
        : 'border-white/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.03]'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${
          isVoid ? 'bg-cyan-500/10 text-cyan-100' : isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        }`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isVoid ? 'text-white/45' : 'text-surface-500 dark:text-white/45'}`}>{title}</p>
          <p className={`mt-2 text-sm font-semibold ${isVoid ? 'text-white' : 'text-surface-900 dark:text-white'}`}>{body}</p>
          <p className={`mt-1 text-xs ${isVoid ? 'text-white/60' : 'text-surface-500 dark:text-surface-400'}`}>{meta}</p>
        </div>
      </div>
    </div>
  );
}
