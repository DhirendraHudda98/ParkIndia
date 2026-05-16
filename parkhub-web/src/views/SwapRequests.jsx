import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Swap, Check, X, SpinnerGap, Plus, ArrowClockwise,
  CalendarBlank, Clock, ChatText, Sparkle, ArrowRight
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { api, getInMemoryToken } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { stagger, fadeUp, modalVariants, modalTransition } from '../constants/animations';

function authHeaders() {
  const token = getInMemoryToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const statusConfig = {
  pending: { cls: 'bg-[#FF9933]/10 text-[#FF9933]' },
  accepted: { cls: 'bg-[#138808]/10 text-[#138808]' },
  declined: { cls: 'bg-red-50 text-red-600' },
};

export function SwapRequestsPage() {
  const { t, i18n } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';
  
  const dateFnsLocale = i18n.language?.startsWith('de') ? de : enUS;
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [targetBookingId, setTargetBookingId] = useState('');
  const [swapMessage, setSwapMessage] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [swapRes, bookingsRes] = await Promise.all([
        fetch('/api/v1/swap-requests', { headers: authHeaders(), credentials: 'include' }).then(r => r.json()),
        api.getBookings(),
      ]);
      if (swapRes.success && swapRes.data) setRequests(swapRes.data);
      if (bookingsRes.success && bookingsRes.data) setBookings(bookingsRes.data);
    } catch {
      toast.error(t('common.error'));
    }
    setLoading(false);
  }

  useEffect(() => { void loadData(); }, []);

  async function handleAccept(id) {
    setActing(id);
    try {
      const res = await fetch(`/api/v1/swap-requests/${id}/accept`, { method: 'POST', headers: authHeaders(), credentials: 'include' }).then(r => r.json());
      if (res.success) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' } : r));
        toast.success(t('swap.accepted'));
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setActing(null);
  }

  async function handleDecline(id) {
    setActing(id);
    try {
      const res = await fetch(`/api/v1/swap-requests/${id}/decline`, { method: 'POST', headers: authHeaders(), credentials: 'include' }).then(r => r.json());
      if (res.success) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'declined' } : r));
        toast.success(t('swap.declined'));
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setActing(null);
  }

  async function handleCreate() {
    if (!selectedBooking || !targetBookingId) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/v1/bookings/${selectedBooking}/swap-request`, {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ target_booking_id: targetBookingId, message: swapMessage || null }),
      }).then(r => r.json());
      if (res.success) {
        toast.success(t('swap.created'));
        setShowModal(false);
        setSelectedBooking('');
        setTargetBookingId('');
        setSwapMessage('');
        loadData();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    setCreating(false);
  }

  const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'confirmed');
  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-[#000080]/10 border-t-[#000080] rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Synching Marketplace</p>
    </div>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-10 p-2 max-w-7xl">
      {/* Hero Panel */}
      <motion.section variants={fadeUp} className={`rounded-[3rem] p-10 relative overflow-hidden border transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-2xl shadow-[#000080]/5' : 'bg-white border-surface-100 shadow-xl'}`}>
         <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Swap weight="fill" size={240} />
         </div>

         <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div className="space-y-6">
               <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] ${isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-primary-50 text-primary-600'}`}>
                  <Swap weight="bold" size={16} />
                  {isIndia ? 'Regional Slot Exchange' : 'Booking Swap Marketplace'}
               </div>

               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                     <h1 className={`text-4xl font-black tracking-tighter ${isIndia ? 'text-[#000080]' : ''}`}>
                        {isIndia ? 'Exchange Permits' : t('swap.title')}
                        <Sparkle weight="fill" className="inline ml-2 w-6 h-6 text-yellow-400" />
                     </h1>
                     <p className={`mt-3 text-sm font-medium leading-relaxed max-w-md ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
                        {t('swap.subtitle')}
                     </p>
                  </div>
                  <div className="flex items-center gap-3">
                     <button onClick={() => void loadData()} className={`p-4 rounded-2xl transition-all ${isIndia ? 'bg-[#000080]/5 text-[#000080] hover:bg-[#000080]/10' : 'bg-surface-50 text-surface-400'}`}>
                        <ArrowClockwise weight="bold" size={20} />
                     </button>
                     <button onClick={() => setShowModal(true)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-2xl transition-all ${isIndia ? 'bg-[#FF9933] shadow-[#FF9933]/20 hover:scale-105' : 'bg-primary-600'}`}>
                        <Plus weight="bold" size={16} />
                        {t('swap.create')}
                     </button>
                  </div>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatCard label="Awaiting" value={pendingCount} isIndia={isIndia} highlight />
                  <StatCard label="Success" value={requests.filter(r => r.status === 'accepted').length} isIndia={isIndia} />
                  <StatCard label="Eligible" value={activeBookings.length} isIndia={isIndia} />
               </div>
            </div>

            <div className={`rounded-[2.5rem] p-8 border transition-all ${isIndia ? 'bg-[#000080]/5 border-[#000080]/5' : 'bg-surface-50 border-surface-100'}`}>
               <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-6">Marketplace Analytics</p>
               <div className="space-y-6">
                  <DigestLine label="Global Traffic" value={`${requests.length} Conversations`} isIndia={isIndia} />
                  <DigestLine label="Suggested Action" value={pendingCount > 0 ? 'Respond Now' : 'Create Offer'} isIndia={isIndia} color={pendingCount > 0 ? 'text-[#FF9933]' : ''} />
               </div>
            </div>
         </div>
      </motion.section>

      {/* Requests List */}
      <motion.div variants={fadeUp} className="space-y-4">
         <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3 ${isIndia ? 'text-[#000080]/40' : 'text-surface-400'}`}>
            Permit Exchange Queue
         </h3>

         {requests.length === 0 ? (
           <div className="py-20 text-center rounded-[3rem] border-2 border-dashed border-surface-100">
              <Swap weight="thin" size={80} className="mx-auto mb-6 opacity-10" />
              <p className="text-[11px] font-black uppercase tracking-widest opacity-30">{t('swap.empty')}</p>
           </div>
         ) : (
           <div className="grid gap-4">
              <AnimatePresence>
                 {requests.map(req => (
                   <motion.div
                     key={req.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`rounded-[2rem] p-6 border transition-all ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white border-surface-50'}`}
                   >
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-primary-50 text-primary-600'}`}>
                              <Swap weight="bold" size={20} />
                           </div>
                           <div className="flex items-center gap-3">
                              <span className={`text-sm font-black ${isIndia ? 'text-[#000080]' : ''}`}>{req.source_booking.lot_name}</span>
                              <ArrowRight weight="bold" className="opacity-20" />
                              <span className={`text-sm font-black ${isIndia ? 'text-[#000080]' : ''}`}>{req.target_booking.lot_name}</span>
                           </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${statusConfig[req.status]?.cls || ''}`}>
                           {req.status}
                        </span>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <BookingBox label="Your Permit" booking={req.source_booking} isIndia={isIndia} locale={dateFnsLocale} />
                        <BookingBox label="Desired Permit" booking={req.target_booking} isIndia={isIndia} locale={dateFnsLocale} />
                     </div>

                     {req.message && (
                        <div className={`p-4 rounded-2xl mb-6 flex items-start gap-4 ${isIndia ? 'bg-[#FF9933]/5' : 'bg-surface-50'}`}>
                           <ChatText weight="fill" className="text-surface-300 flex-shrink-0" size={20} />
                           <p className="text-xs font-medium italic opacity-70">"{req.message}"</p>
                        </div>
                     )}

                     {req.status === 'pending' && (
                        <div className="flex items-center gap-3 pt-6 border-t border-surface-50">
                           <button onClick={() => handleAccept(req.id)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isIndia ? 'bg-[#138808] text-white shadow-lg shadow-[#138808]/20 hover:scale-[1.02]' : 'bg-primary-600 text-white'}`}>
                              Accept Exchange
                           </button>
                           <button onClick={() => handleDecline(req.id)} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isIndia ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-surface-50 text-surface-400'}`}>
                              Decline
                           </button>
                        </div>
                     )}
                   </motion.div>
                 ))}
              </AnimatePresence>
           </div>
         )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
         {showModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-[#000080]/20 backdrop-blur-md" />
              <motion.div 
                 variants={modalVariants} initial="initial" animate="animate" exit="exit"
                 className={`relative w-full max-w-lg rounded-[3rem] p-10 border shadow-2xl transition-all ${isIndia ? 'bg-white border-[#FF9933]/20' : 'bg-white border-surface-100'}`}
              >
                 <div className="flex items-center justify-between mb-8">
                    <h2 className={`text-2xl font-black tracking-tight ${isIndia ? 'text-[#000080]' : ''}`}>Initiate Exchange</h2>
                    <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-surface-50 transition-all">
                       <X weight="bold" size={20} />
                    </button>
                 </div>

                 <div className="space-y-6">
                    <FormGroup label="Select Your Permit" isIndia={isIndia}>
                       <select value={selectedBooking} onChange={e => setSelectedBooking(e.target.value)} className="input-field w-full py-3">
                          <option value="">Choose Booking...</option>
                          {activeBookings.map(b => (
                            <option key={b.id} value={b.id}>{b.lot_name} • Slot {b.slot_number}</option>
                          ))}
                       </select>
                    </FormGroup>

                    <FormGroup label="Target Hub ID" isIndia={isIndia}>
                       <input type="text" value={targetBookingId} onChange={e => setTargetBookingId(e.target.value)} placeholder="e.g. PH-992-X" className="input-field w-full" />
                    </FormGroup>

                    <FormGroup label="Negotiation Note (Optional)" isIndia={isIndia}>
                       <textarea value={swapMessage} onChange={e => setSwapMessage(e.target.value)} rows={3} placeholder="Explain why you want to swap..." className="input-field w-full py-3 resize-none" />
                    </FormGroup>

                    <div className="flex gap-4 pt-4">
                       <button onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-surface-50 text-surface-400">Cancel</button>
                       <button onClick={handleCreate} disabled={creating || !selectedBooking || !targetBookingId} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl transition-all ${isIndia ? 'bg-[#FF9933] shadow-[#FF9933]/20' : 'bg-primary-600'}`}>
                          {creating ? <SpinnerGap className="animate-spin mx-auto" /> : 'Send Request'}
                       </button>
                    </div>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({ label, value, isIndia, highlight = false }) {
  return (
    <div className={`rounded-2xl p-4 border transition-all ${highlight ? (isIndia ? 'bg-[#000080] border-[#000080] text-white' : 'bg-primary-600 border-primary-600 text-white') : 'bg-white border-surface-50 shadow-sm'}`}>
      <div className={`text-[9px] font-black uppercase tracking-widest mb-2 ${highlight ? 'text-white/40' : 'text-surface-400'}`}>{label}</div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}

function DigestLine({ label, value, isIndia, color = '' }) {
  return (
    <div className="flex items-center justify-between">
       <span className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${isIndia ? 'text-[#000080]' : ''}`}>{label}</span>
       <span className={`text-xs font-black ${color} ${isIndia ? 'text-[#000080]' : ''}`}>{value}</span>
    </div>
  );
}

function BookingBox({ label, booking, isIndia, locale }) {
  return (
    <div className={`rounded-2xl p-4 border ${isIndia ? 'bg-surface-50/50 border-surface-50' : 'bg-surface-50'}`}>
       <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-3">{label}</div>
       <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold">
             <CalendarBlank weight="bold" className="opacity-30" />
             {format(new Date(booking.start_time), 'd MMM yyyy', { locale })}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium opacity-60">
             <Clock weight="bold" className="opacity-30" />
             Slot {booking.slot_number} • {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
          </div>
       </div>
    </div>
  );
}

function FormGroup({ label, children, isIndia }) {
  return (
    <div>
       <label className={`block text-[10px] font-black uppercase tracking-[0.3em] mb-3 ${isIndia ? 'text-[#000080]/40' : 'text-surface-400'}`}>{label}</label>
       {children}
    </div>
  );
}

export default SwapRequestsPage;
