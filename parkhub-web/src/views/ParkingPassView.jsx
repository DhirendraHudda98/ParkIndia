import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, QrCode, Clock, MapPin, Question, CalendarBlank, X } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const statusColors = {
  active: 'bg-[#138808]/10 text-[#138808]',
  expired: 'bg-surface-100 text-surface-500',
  revoked: 'bg-red-50 text-red-600',
  used: 'bg-[#000080]/10 text-[#000080]',
};

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function ParkingPassPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const loadPasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/me/passes').then(r => r.json());
      if (res.success) setPasses(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadPasses(); }, [loadPasses]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 p-2 max-w-5xl">
      {/* Header Panel */}
      <section className={`rounded-[3rem] p-10 relative overflow-hidden border transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-2xl shadow-[#000080]/5' : 'bg-white border-surface-200 shadow-xl'}`}>
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
           <Ticket weight="fill" size={240} />
        </div>
        
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_0.8fr]">
           <div className="space-y-6">
              <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-primary-50 text-primary-600'}`}>
                 <Ticket weight="bold" size={16} />
                 {isIndia ? 'Heritage Access Wallet' : 'Digital Pass Wallet'}
              </div>

              <div className="flex items-start justify-between gap-6">
                 <div>
                    <h1 className={`text-4xl font-black tracking-tight ${isIndia ? 'text-[#000080]' : ''}`}>
                       {isIndia ? 'My Digital Permits' : t('parkingPass.title')}
                    </h1>
                    <p className={`mt-3 text-sm font-medium leading-relaxed max-w-md ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
                       {t('parkingPass.subtitle')}
                    </p>
                 </div>
                 <button onClick={() => setShowHelp(!showHelp)} className={`p-4 rounded-2xl transition-all ${isIndia ? 'text-[#000080]/30 hover:bg-[#000080]/5 hover:text-[#000080]' : 'text-surface-400 hover:bg-surface-50'}`}>
                    <Question weight="bold" size={24} />
                 </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 <StatCard label="Active" value={passes.filter(p => p.status === 'active').length} isIndia={isIndia} highlight />
                 <StatCard label="Total" value={passes.length} isIndia={isIndia} />
                 <StatCard label="Slot" value={selectedPass ? selectedPass.slot_number : '—'} isIndia={isIndia} />
              </div>
           </div>

           <div className={`rounded-[2.5rem] p-8 border transition-all ${isIndia ? 'bg-[#000080]/5 border-[#000080]/5' : 'bg-surface-50 border-surface-100'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-6">Live Permit Inspection</p>
              <div className="space-y-4">
                 <DigestLine icon={<QrCode weight="bold" />} label="Identity" value={selectedPass ? selectedPass.user_name : 'No Selection'} isIndia={isIndia} />
                 <DigestLine icon={<Clock weight="bold" />} label="Expiry" value={selectedPass ? formatDate(selectedPass.valid_until) : 'Waiting...'} isIndia={isIndia} />
              </div>
           </div>
        </div>
      </section>

      <AnimatePresence>
        {showHelp && (
           <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`rounded-[2rem] border p-6 text-sm ${isIndia ? 'bg-[#FF9933]/5 border-[#FF9933]/10 text-[#000080]/60' : 'bg-blue-50 border-blue-100'}`}>
              {t('parkingPass.help')}
           </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-[#FF9933]/20 border-t-[#FF9933] rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Retrieving Permits</p>
        </div>
      ) : selectedPass ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center">
           <div className={`w-full max-w-sm rounded-[3rem] p-10 border relative overflow-hidden text-center transition-all ${isIndia ? 'bg-gradient-to-b from-[#000080] to-[#000040] text-white border-white/10 shadow-2xl' : 'bg-surface-900 text-white shadow-2xl'}`}>
              <button onClick={() => setSelectedPass(null)} className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                 <X weight="bold" size={20} />
              </button>

              <div className="flex flex-col items-center gap-6">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">
                    <Ticket weight="bold" size={14} />
                    {isIndia ? 'Official Heritage Pass' : 'Valid Parking Pass'}
                 </div>

                 <h2 className="text-2xl font-black tracking-tight">{selectedPass.user_name}</h2>

                 <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl">
                    <img src={selectedPass.qr_data} alt="QR Permit" className="w-48 h-48" />
                 </div>

                 <div className="space-y-4 w-full">
                    <div className="flex items-center justify-center gap-3 text-sm font-bold text-white/80">
                       <MapPin weight="bold" className={isIndia ? 'text-[#FF9933]' : 'text-primary-400'} />
                       {selectedPass.lot_name} • SLOT {selectedPass.slot_number}
                    </div>
                    <div className="flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest text-white/40">
                       <Clock weight="bold" />
                       Expires: {formatDate(selectedPass.valid_until)}
                    </div>
                 </div>

                 <div className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] ${statusColors[selectedPass.status]} bg-white`}>
                    {selectedPass.status}
                 </div>

                 <p className="text-[10px] font-black font-mono tracking-widest opacity-20 uppercase mt-4">{selectedPass.verification_code}</p>
              </div>
           </div>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
           {passes.length === 0 ? (
             <div className="md:col-span-2 py-20 text-center rounded-[3rem] border-2 border-dashed border-surface-100">
                <Ticket weight="thin" size={80} className="mx-auto mb-6 opacity-10" />
                <p className="text-[11px] font-black uppercase tracking-widest opacity-30">{t('parkingPass.empty')}</p>
             </div>
           ) : (
             passes.map((pass, idx) => (
                <motion.div
                   key={pass.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   onClick={() => setSelectedPass(pass)}
                   className={`rounded-[2.5rem] p-8 border cursor-pointer group transition-all hover:shadow-2xl hover:-translate-y-1 ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white border-surface-100'}`}
                >
                   <div className="flex items-center justify-between mb-8">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-primary-50 text-primary-600'}`}>
                         <QrCode weight="bold" size={24} />
                      </div>
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${statusColors[pass.status]}`}>
                         {pass.status}
                      </span>
                   </div>

                   <h3 className={`text-xl font-black mb-1 ${isIndia ? 'text-[#000080]' : ''}`}>{pass.lot_name}</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-8">Permit Slot: {pass.slot_number}</p>

                   <div className="grid grid-cols-2 gap-4 pt-6 border-t border-surface-50">
                      <div>
                         <div className="text-[9px] font-black uppercase tracking-widest text-surface-400 mb-1">Holder</div>
                         <div className={`text-xs font-black ${isIndia ? 'text-[#000080]' : ''}`}>{pass.user_name}</div>
                      </div>
                      <div className="text-right">
                         <div className="text-[9px] font-black uppercase tracking-widest text-surface-400 mb-1">Valid Until</div>
                         <div className={`text-xs font-black ${isIndia ? 'text-[#000080]' : ''}`}>{new Date(pass.valid_until).toLocaleDateString()}</div>
                      </div>
                   </div>
                </motion.div>
             ))
           )}
        </div>
      )}
    </motion.div>
  );
}

function StatCard({ label, value, isIndia, highlight = false }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? (isIndia ? 'bg-[#000080] border-[#000080] text-white shadow-xl shadow-[#000080]/20' : 'bg-primary-600 border-primary-600 text-white') : 'bg-white border-surface-50 shadow-sm'}`}>
      <div className={`text-[9px] font-black uppercase tracking-widest mb-2 ${highlight ? 'text-white/40' : 'text-surface-400'}`}>{label}</div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}

function DigestLine({ icon, label, value, isIndia }) {
  return (
    <div className="flex items-center gap-4">
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isIndia ? 'bg-[#000080]/10 text-[#000080]' : 'bg-white text-surface-400'}`}>
          {icon}
       </div>
       <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-widest opacity-30">{label}</div>
          <div className={`text-xs font-bold truncate ${isIndia ? 'text-[#000080]' : ''}`}>{value}</div>
       </div>
    </div>
  );
}

export default ParkingPassPage;
