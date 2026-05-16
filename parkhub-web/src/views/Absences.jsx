import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House, Calendar, CalendarCheck, Trash, Plus, CaretLeft, CaretRight,
  X,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { ABSENCE_CONFIG } from '../constants/absenceConfig';
import { useTheme } from '../context/ThemeContext';

function isDateInRange(date, start, end) {
  const d = date.toISOString().slice(0, 10);
  return d >= start && d <= end;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function AbsencesPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [entries, setEntries] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPattern, setShowPattern] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().slice(0, 10);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const loadData = useCallback(async () => {
    try {
      const [absRes, patRes] = await Promise.all([api.listAbsences(), api.getAbsencePattern()]);
      if (absRes.success && absRes.data) setEntries(absRes.data);
      if (patRes.success && patRes.data) setPatterns(patRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const hoPattern = useMemo(() => patterns.find(p => p.absence_type === 'homeoffice'), [patterns]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days = [];

    for (let i = 0; i < startDow; i++) {
      days.push({ date: new Date(calYear, calMonth, 1 - startDow + i), inMonth: false, isToday: false, types: [] });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(calYear, calMonth, d);
      const dow = date.getDay() === 0 ? 6 : date.getDay() - 1;
      const types = [];
      for (const e of entries) {
        if (isDateInRange(date, e.start_date, e.end_date)) {
          const at = e.absence_type;
          if (!types.includes(at)) types.push(at);
        }
      }
      if (dow < 5 && hoPattern && hoPattern.weekdays.includes(dow) && !types.includes('homeoffice')) {
        types.push('homeoffice');
      }
      days.push({ date, inMonth: true, isToday: isSameDay(date, today), types });
    }
    while (days.length % 7 !== 0) {
      days.push({ date: new Date(calYear, calMonth + 1, days.length - startDow - lastDay.getDate() + 1), inMonth: false, isToday: false, types: [] });
    }
    return days;
  }, [entries, hoPattern, calMonth, calYear, today]);

  const calMonthLabel = new Date(calYear, calMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }
  function nextMonth() { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }

  async function deleteEntry(id) {
    const res = await api.deleteAbsence(id);
    if (res.success) {
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success(t('absences.deleted', 'Absence deleted'));
    }
  }

  async function handleAdd(type, startDate, endDate, note) {
    const res = await api.createAbsence(type, startDate, endDate, note || undefined);
    if (res.success && res.data) {
      setEntries(prev => [...prev, res.data].sort((a, b) => a.start_date.localeCompare(b.start_date)));
      toast.success(t('absences.added', 'Absence added'));
      setShowAdd(false);
    } else {
      toast.error(res.error?.message || t('common.error'));
    }
  }

  async function handlePatternSave(weekdays) {
    const res = await api.setAbsencePattern('homeoffice', weekdays);
    if (res.success && res.data) {
      setPatterns(prev => [...prev.filter(p => p.absence_type !== 'homeoffice'), res.data]);
      toast.success(t('absences.patternUpdated', 'Pattern updated'));
    }
  }

  const WEEKDAYS = [
    t('homeoffice.weekdaysShort.mon'), t('homeoffice.weekdaysShort.tue'), t('homeoffice.weekdaysShort.wed'),
    t('homeoffice.weekdaysShort.thu'), t('homeoffice.weekdaysShort.fri'), t('homeoffice.weekdaysShort.sat'),
    t('homeoffice.weekdaysShort.sun'),
  ];

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-64 skeleton rounded-xl" />
      <div className="h-80 skeleton rounded-2xl" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            <Calendar weight="fill" className={`w-7 h-7 ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`} />
            {isIndia ? 'ParkIndia Availability Hub' : t('absences.title', 'Absences')}
          </h1>
          <p className={`mt-1 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
            {isIndia ? 'Manage remote work, leaves, and out-of-office status.' : t('absences.subtitle')}
          </p>
        </div>
        <button 
          onClick={() => setShowAdd(true)} 
          className={`px-4 py-2 rounded-xl font-semibold text-white transition flex items-center gap-2 ${
            isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          <Plus weight="bold" className="w-4 h-4" /> {t('absences.addAbsence', 'Register')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar */}
        <div className={`lg:col-span-3 rounded-2xl border p-6 transition-colors ${
          isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{calMonthLabel}</h2>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className={`p-2 rounded-lg transition-colors ${isIndia ? 'hover:bg-[#FF9933]/10 text-[#000080]' : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400'}`}>
                <CaretLeft weight="bold" className="w-5 h-5" />
              </button>
              <button 
                onClick={() => { setCalMonth(today.getMonth()); setCalYear(today.getFullYear()); }} 
                className={`px-3 py-2 text-xs font-medium transition-colors ${isIndia ? 'text-[#000080]/60 hover:text-[#000080]' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}
              >
                {t('absences.today')}
              </button>
              <button onClick={nextMonth} className={`p-2 rounded-lg transition-colors ${isIndia ? 'hover:bg-[#FF9933]/10 text-[#000080]' : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400'}`}>
                <CaretRight weight="bold" className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map(d => <div key={d} className={`text-center text-xs font-semibold py-2 ${isIndia ? 'text-[#000080]/40' : 'text-surface-500 dark:text-surface-400'}`}>{d}</div>)}
            {calendarDays.map((day, i) => {
              const mainType = day.types[0];
              const cfg = mainType ? ABSENCE_CONFIG[mainType] : null;
              const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
              
              let bgClass = '';
              let textClass = '';
              
              if (cfg) {
                bgClass = cfg.bg;
                textClass = cfg.color.split(' ')[0];
                if (isIndia && mainType === 'homeoffice') {
                  bgClass = 'bg-[#000080]/10';
                  textClass = 'text-[#000080]';
                }
              } else if (isWeekend && day.inMonth) {
                textClass = isIndia ? 'text-[#000080]/20' : 'text-surface-400';
              } else if (day.inMonth) {
                textClass = isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300';
                bgClass = isIndia ? 'hover:bg-[#FF9933]/5' : 'hover:bg-surface-50 dark:hover:bg-surface-800';
              } else {
                textClass = isIndia ? 'text-[#000080]/10' : 'text-surface-300 dark:text-surface-700';
              }

              return (
                <div key={i} className={`relative flex flex-col items-center justify-center rounded-lg text-sm font-medium min-h-[40px] transition-all ${bgClass} ${textClass} ${
                  day.isToday ? (isIndia ? 'ring-2 ring-[#FF9933] ring-offset-1' : 'ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-surface-900') : ''
                }`}>
                  {day.date.getDate()}
                  {day.types.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {day.types.slice(0, 3).map((at, j) => (
                        <div key={j} className={`w-1.5 h-1.5 rounded-full ${isIndia && at === 'homeoffice' ? 'bg-[#000080]' : ABSENCE_CONFIG[at].dot}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className={`flex flex-wrap gap-3 mt-4 pt-4 border-t text-xs ${isIndia ? 'border-[#FF9933]/10 text-[#000080]/40' : 'border-surface-100 dark:border-surface-800 text-surface-500'}`}>
            {Object.entries(ABSENCE_CONFIG).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${isIndia && type === 'homeoffice' ? 'bg-[#000080]' : cfg.bg}`} />
                <span>{t(`absences.types.${type}`, type)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Homeoffice pattern */}
          <div className={`rounded-2xl border p-6 transition-colors ${
            isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
          }`}>
            <button onClick={() => setShowPattern(!showPattern)} className="flex items-center justify-between w-full text-left">
              <h3 className={`text-base font-semibold flex items-center gap-2 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                <House weight="fill" className={`w-5 h-5 ${isIndia ? 'text-[#000080]' : 'text-primary-600'}`} />
                {t('absences.weeklyPattern', 'Homeoffice Pattern')}
              </h3>
              <CaretRight weight="bold" className={`w-4 h-4 transition-transform ${showPattern ? 'rotate-90' : ''} ${isIndia ? 'text-[#000080]/30' : 'text-surface-400'}`} />
            </button>
            <AnimatePresence>
              {showPattern && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className={`text-sm mt-3 mb-3 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>{t('absences.patternDesc')}</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[t('homeoffice.weekdaysShort.mon'), t('homeoffice.weekdaysShort.tue'), t('homeoffice.weekdaysShort.wed'), t('homeoffice.weekdaysShort.thu'), t('homeoffice.weekdaysShort.fri')].map((name, i) => {
                      const active = hoPattern?.weekdays.includes(i);
                      return (
                        <button key={i} onClick={() => {
                          const current = hoPattern?.weekdays || [];
                          const next = current.includes(i) ? current.filter(d => d !== i) : [...current, i].sort();
                          handlePatternSave(next);
                        }}
                          className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all font-medium ${
                            active 
                              ? isIndia 
                                ? 'bg-[#000080]/10 border-[#000080] text-[#000080]' 
                                : 'bg-primary-100 dark:bg-primary-900/40 border-primary-400 dark:border-primary-600 text-primary-700 dark:text-primary-300' 
                              : isIndia 
                                ? 'bg-[#000080]/5 border-transparent text-[#000080]/30' 
                                : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500'
                          }`}
                        >
                          <span className="text-sm">{name}</span>
                          {active && <House weight="fill" className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Upcoming entries */}
          <div className={`rounded-2xl border p-6 transition-colors ${
            isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/20 shadow-sm' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
          }`}>
            <h3 className={`text-base font-semibold mb-3 flex items-center gap-2 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              <CalendarCheck weight="fill" className={`w-5 h-5 ${isIndia ? 'text-[#FF9933]' : 'text-emerald-600'}`} />
              {t('absences.upcoming', 'Upcoming')}
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {entries.filter(e => e.end_date >= todayStr).sort((a, b) => a.start_date.localeCompare(b.start_date)).map(entry => {
                const cfg = ABSENCE_CONFIG[entry.absence_type] || ABSENCE_CONFIG.other;
                const Icon = cfg.icon;
                return (
                  <div key={entry.id} className={`flex items-center justify-between p-3 rounded-xl ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-50 dark:bg-surface-800/50'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon weight="fill" className={`w-5 h-5 flex-shrink-0 ${isIndia && entry.absence_type === 'homeoffice' ? 'text-[#000080]' : cfg.color}`} />
                      <div className="min-w-0">
                        <span className={`text-sm font-medium block truncate ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                          {new Date(entry.start_date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          {entry.start_date !== entry.end_date && <> &ndash; {new Date(entry.end_date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</>}
                        </span>
                        <span className={`text-xs ${isIndia && entry.absence_type === 'homeoffice' ? 'text-[#000080]/60' : cfg.color}`}>{t(`absences.types.${entry.absence_type}`, entry.absence_type)}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash weight="bold" className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {entries.filter(e => e.end_date >= todayStr).length === 0 && (
                <div className="text-center py-6">
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                    <CalendarCheck weight="light" className={`w-12 h-12 mx-auto ${isIndia ? 'text-[#000080]/10' : 'text-surface-200 dark:text-surface-700'}`} />
                  </motion.div>
                  <p className={`text-sm mt-3 ${isIndia ? 'text-[#000080]/30' : 'text-surface-500 dark:text-surface-400'}`}>{t('absences.noEntries')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add absence modal */}
      <AnimatePresence>
        {showAdd && <AddAbsenceModal onClose={() => setShowAdd(false)} onAdd={handleAdd} t={t} isIndia={isIndia} isVoid={isVoid} />}
      </AnimatePresence>
    </motion.div>
  );
}

function AddAbsenceModal({ onClose, onAdd, t, isIndia, isVoid }) {
  const [type, setType] = useState('homeoffice');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1 ${
    isVoid 
      ? 'bg-slate-950 border-slate-700 text-white focus:ring-cyan-500' 
      : isIndia 
      ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:ring-[#FF9933]' 
      : 'bg-white dark:bg-surface-950 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white focus:ring-primary-500'
  }`;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-3xl shadow-2xl transition-colors ${
          isVoid ? 'bg-slate-900 border border-slate-800' : isIndia ? 'bg-white' : 'bg-white dark:bg-surface-900'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{t('absences.addAbsence')}</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${isIndia ? 'text-[#000080]/30 hover:bg-[#000080]/5' : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500'}`}>
            <X weight="bold" className="w-5 h-5" />
          </button>
        </div>

        {/* Type pills */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
          {Object.entries(ABSENCE_CONFIG).map(([at, cfg]) => {
            const Icon = cfg.icon;
            const active = type === at;
            
            let activeStyles = `${cfg.bg} border-current ${cfg.color}`;
            if (isIndia && at === 'homeoffice') {
              activeStyles = 'bg-[#000080] border-[#000080] text-white';
            }

            return (
              <button key={at} onClick={() => setType(at)}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
                  active ? activeStyles : isIndia ? 'bg-[#000080]/5 border-transparent text-[#000080]/30' : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-500'
                }`}
              >
                <Icon weight={active ? 'fill' : 'regular'} className="w-5 h-5" />
                <span className="text-xs font-medium truncate w-full text-center">{t(`absences.types.${at}`, at)}</span>
              </button>
            );
          })}
        </div>

        {/* Quick buttons */}
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => { setStartDate(todayStr); setEndDate(todayStr); }} 
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${
              isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            {t('absences.quickToday')}
          </button>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={`text-xs mb-1 block ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('absences.startDate')}</label>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (!endDate || e.target.value > endDate) setEndDate(e.target.value); }} className={inputClass} />
          </div>
          <div>
            <label className={`text-xs mb-1 block ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{t('absences.endDate')}</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} min={startDate} />
          </div>
        </div>

        <input type="text" placeholder={t('absences.notePlaceholder')} value={note} onChange={e => setNote(e.target.value)} className={inputClass + ' mb-4'} />

        <button 
          onClick={() => {
            if (!startDate || !endDate || endDate < startDate) return;
            onAdd(type, startDate, endDate, note);
          }} 
          disabled={!startDate || !endDate || endDate < startDate} 
          className={`w-full py-3 rounded-xl font-bold text-white transition flex items-center justify-center gap-2 ${
            isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          <Plus weight="bold" className="w-4 h-4" /> {t('absences.addBtn')}
        </button>
      </motion.div>
    </>
  );
}

export default AbsencesPage;
