import { useActionState, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, QrCode, Trash, CheckCircle, Question, MagnifyingGlass, CalendarBlank, Envelope, IdentificationCard, Sparkle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const emptyForm = {
  name: '',
  email: '',
  vehicle_plate: '',
  visit_date: '',
  purpose: '',
};

export function VisitorsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isAdmin = user && ['admin', 'superadmin'].includes(user.role);
  
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showQr, setShowQr] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('my');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const url = viewMode === 'admin' && isAdmin ? '/api/v1/admin/visitors' : '/api/v1/visitors';
      const res = await fetch(url).then(r => r.json());
      if (res.success) setVisitors(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [viewMode, isAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  const [, registerAction, isSubmitting] = useActionState(async () => {
    if (!form.name.trim() || !form.email.trim() || !form.visit_date) {
      toast.error(t('visitors.requiredFields'));
      return null;
    }
    try {
      const body = {
        name: form.name,
        email: form.email,
        visit_date: new Date(form.visit_date).toISOString(),
      };
      if (form.vehicle_plate) body.vehicle_plate = form.vehicle_plate;
      if (form.purpose) body.purpose = form.purpose;

      const res = await fetch('/api/v1/visitors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json());

      if (res.success) {
        toast.success(t('visitors.registered'));
        setShowForm(false);
        setForm(emptyForm);
        loadData();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    }
    return null;
  }, null);

  async function handleCheckIn(id) {
    try {
      const res = await fetch(`/api/v1/visitors/${id}/check-in`, { method: 'PUT' }).then(r => r.json());
      if (res.success) {
        toast.success(t('visitors.checkedIn'));
        loadData();
      }
    } catch { toast.error(t('common.error')); }
  }

  async function handleCancel(id) {
    try {
      const res = await fetch(`/api/v1/visitors/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        toast.success(t('visitors.cancelled'));
        loadData();
      }
    } catch { toast.error(t('common.error')); }
  }

  const filtered = visitors.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 p-2 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 text-primary-500'}`}>
               <IdentificationCard weight="bold" className="w-7 h-7" />
            </div>
            <div>
               <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>
                  {isIndia ? 'Atithi Heritage Registry' : t('visitors.title')}
                  <Sparkle weight="fill" className="inline ml-2 w-5 h-5 text-yellow-400" />
               </h2>
               <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
                  {isIndia ? 'Official guest management for your regional hub operations.' : t('visitors.subtitle')}
               </p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            {isAdmin && (
              <div className="flex bg-surface-50 p-1.5 rounded-2xl border">
                 {(['my', 'admin']).map(mode => (
                   <button 
                     key={mode} 
                     onClick={() => setViewMode(mode)}
                     className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? (isIndia ? 'bg-[#000080] text-white shadow-lg' : 'bg-white text-surface-900 shadow-sm') : 'text-surface-400'}`}
                   >
                      {mode}
                   </button>
                 ))}
              </div>
            )}
            <button onClick={() => setShowForm(true)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-2xl transition-all ${isIndia ? 'bg-[#FF9933] shadow-[#FF9933]/20 hover:scale-105' : 'bg-primary-600'}`}>
               <UserPlus weight="bold" size={16} />
               Register Guest
            </button>
         </div>
      </div>

      {/* Control Panel */}
      <div className={`rounded-[2.5rem] p-8 border transition-all ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-xl shadow-[#000080]/5' : 'bg-white border-surface-100'}`}>
         <div className="relative">
            <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search registry by name, email, or plate..." 
              className="input-field pl-12 w-full" 
            />
         </div>
      </div>

      {/* Register Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
             <div className={`rounded-[2.5rem] p-10 border-4 ${isIndia ? 'border-[#FF9933] bg-[#FF9933]/5' : 'border-primary-500 bg-primary-50/10'}`}>
                <div className="flex items-center justify-between mb-8">
                   <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>Register New Atithi</h3>
                   <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/50 rounded-xl transition-all"><X weight="bold" size={24} /></button>
                </div>
                
                <form action={registerAction}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Full Name</label>
                         <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field w-full" required />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Contact Email</label>
                         <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field w-full" required />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Vehicle Plate (Optional)</label>
                         <input value={form.vehicle_plate} onChange={e => setForm({...form, vehicle_plate: e.target.value})} className="input-field w-full" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Visit Date & Time</label>
                         <input type="datetime-local" value={form.visit_date} onChange={e => setForm({...form, visit_date: e.target.value})} className="input-field w-full" required />
                      </div>
                   </div>

                   <div className="space-y-3 mb-8">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Purpose of Visit</label>
                      <textarea value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} rows={2} className="input-field w-full py-4 resize-none" />
                   </div>

                   <div className="flex gap-4">
                      <button type="submit" disabled={isSubmitting} className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl ${isIndia ? 'bg-[#FF9933]' : 'bg-primary-600'}`}>
                         {isSubmitting ? 'Registering...' : 'Confirm Guest'}
                      </button>
                      <button type="button" onClick={() => setShowForm(false)} className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-white border border-surface-200">Cancel</button>
                   </div>
                </form>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="space-y-6">
         {loading ? (
           <div className="flex justify-center py-20"><SpinnerGap className="animate-spin opacity-20" size={40} /></div>
         ) : filtered.length === 0 ? (
           <div className="py-20 text-center rounded-[3rem] border-2 border-dashed border-surface-100">
              <IdentificationCard weight="thin" size={80} className="mx-auto mb-6 opacity-10" />
              <p className="text-[11px] font-black uppercase tracking-widest opacity-30">No guests in the registry</p>
           </div>
         ) : (
           <div className="grid gap-4">
              {filtered.map(v => (
                <VisitorCard key={v.id} visitor={v} onCheckIn={handleCheckIn} onCancel={handleCancel} onShowQr={setShowQr} isIndia={isIndia} />
              ))}
           </div>
         )}
      </div>

      {/* QR Modal */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000080]/20 backdrop-blur-sm" onClick={() => setShowQr(null)}>
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className={`text-xl font-black mb-8 text-center ${isIndia ? 'text-[#000080]' : ''}`}>Digital Entry Pass</h3>
              <div className="p-8 bg-surface-50 rounded-[2rem] border-2 border-dashed border-surface-200 mb-8">
                 <img src={showQr} alt="QR" className="w-64 h-64 mx-auto" />
              </div>
              <button onClick={() => setShowQr(null)} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white ${isIndia ? 'bg-[#000080]' : 'bg-primary-600'}`}>Close</button>
           </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function VisitorCard({ visitor, onCheckIn, onCancel, onShowQr, isIndia }) {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    checked_in: 'bg-[#138808]/10 text-[#138808]',
    expired: 'bg-surface-100 text-surface-500',
    cancelled: 'bg-red-50 text-red-600',
  };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`rounded-[2.5rem] p-8 border transition-all ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white border-surface-50'}`}>
       <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-wrap">
             <span className={`text-lg font-black ${isIndia ? 'text-[#000080]' : ''}`}>{visitor.name}</span>
             <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${statusColors[visitor.status] || statusColors.pending}`}>
                {visitor.status.replace('_', ' ')}
             </span>
          </div>
          <div className="flex items-center gap-2">
             {visitor.qr_code && (
               <button onClick={() => onShowQr(visitor.qr_code)} className="p-3 rounded-xl hover:bg-surface-50 transition-all text-surface-400"><QrCode size={20} /></button>
             )}
             {visitor.status === 'pending' && (
               <>
                 <button onClick={() => onCheckIn(visitor.id)} className="p-3 rounded-xl hover:bg-[#138808]/5 text-[#138808] transition-all"><CheckCircle size={20} /></button>
                 <button onClick={() => onCancel(visitor.id)} className="p-3 rounded-xl hover:bg-red-50 text-red-500 transition-all"><Trash size={20} /></button>
               </>
             )}
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
          <div className="flex items-center gap-3">
             <Envelope weight="bold" />
             <span className="text-xs font-medium">{visitor.email}</span>
          </div>
          <div className="flex items-center gap-3">
             <CalendarBlank weight="bold" />
             <span className="text-xs font-medium">{new Date(visitor.visit_date).toLocaleString()}</span>
          </div>
          {visitor.vehicle_plate && (
            <div className="flex items-center gap-3">
               <Car weight="bold" />
               <span className="text-xs font-bold uppercase tracking-widest">{visitor.vehicle_plate}</span>
            </div>
          )}
       </div>

       {visitor.purpose && (
         <div className="mt-6 p-4 rounded-xl bg-surface-50/50 text-[11px] font-medium italic">
            "{visitor.purpose}"
         </div>
       )}
    </motion.div>
  );
}

export function AdminVisitorsPage() {
  return <VisitorsPage />;
}

export default VisitorsPage;
