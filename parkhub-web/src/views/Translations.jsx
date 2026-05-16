import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Translate, MagnifyingGlass, ThumbsUp, ThumbsDown,
  SpinnerGap, PaperPlaneTilt, X, Check, Clock,
  ChatCircleDots, Sparkle
} from '@phosphor-icons/react';
import { api } from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function flattenKeys(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value, path));
    } else {
      result[path] = String(value);
    }
  }
  return result;
}

const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'bn', label: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
];

export function TranslationsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState(i18n.language?.substring(0, 2) || 'hi');
  const [activeTab, setActiveTab] = useState('proposals');

  const [showPropose, setShowPropose] = useState(false);
  const [proposeKey, setProposeKey] = useState('');
  const [proposeValue, setProposeValue] = useState('');
  const [proposeContext, setProposeContext] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allKeys = useMemo(() => {
    const resources = i18n.getResourceBundle(selectedLang, 'translation');
    return resources ? flattenKeys(resources) : {};
  }, [selectedLang, i18n]);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const res = await api.getTranslationProposals(status);
      if (res.success && res.data) setProposals(res.data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadProposals(); }, [loadProposals]);

  const handleVote = async (id, vote) => {
    const res = await api.voteOnProposal(id, vote);
    if (res.success && res.data) {
      setProposals(prev => prev.map(p => p.id === id ? res.data : p));
      toast.success(t('translations.voteCast'));
    } else {
      toast.error(res.error?.message || t('common.error'));
    }
  };

  const handlePropose = async () => {
    if (!proposeKey || !proposeValue) return;
    setSubmitting(true);
    try {
      const res = await api.createTranslationProposal({
        language: selectedLang,
        key: proposeKey,
        proposed_value: proposeValue,
        context: proposeContext || undefined,
      });
      if (res.success) {
        toast.success(t('translations.proposalCreated'));
        setShowPropose(false);
        setProposeKey('');
        setProposeValue('');
        setProposeContext('');
        loadProposals();
      } else {
        toast.error(res.error?.message || t('common.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProposals = proposals.filter(p => {
    if (selectedLang !== 'all' && p.language !== selectedLang) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return p.key.toLowerCase().includes(q) || p.proposed_value.toLowerCase().includes(q);
  });

  const filteredKeys = useMemo(() => {
    const entries = Object.entries(allKeys);
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q));
  }, [allKeys, search]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 p-2 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 text-primary-500'}`}>
               <Translate weight="bold" className="w-7 h-7" />
            </div>
            <div>
               <h2 className={`text-2xl font-black ${isIndia ? 'text-[#000080]' : 'text-surface-900'}`}>
                  {isIndia ? 'Regional Dialect Registry' : t('translations.title')}
                  <Sparkle weight="fill" className="inline ml-2 w-5 h-5 text-yellow-400" />
               </h2>
               <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
                  {isIndia ? 'Modernizing the Indian linguistic experience across regional hubs.' : t('translations.subtitle')}
               </p>
            </div>
         </div>
         <button onClick={() => setShowPropose(true)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-2xl transition-all ${isIndia ? 'bg-[#FF9933] shadow-[#FF9933]/20 hover:scale-105' : 'bg-primary-600'}`}>
            <PaperPlaneTilt weight="bold" size={16} />
            {t('translations.propose')}
         </button>
      </div>

      {/* Control Panel */}
      <div className={`rounded-[2.5rem] p-8 border transition-all ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-xl shadow-[#000080]/5' : 'bg-white border-surface-100'}`}>
         <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-6">
            <div className="relative">
               <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
               <input 
                 type="text" 
                 value={search} 
                 onChange={e => setSearch(e.target.value)} 
                 placeholder="Search registry keys or values..." 
                 className="input-field pl-12 w-full" 
               />
            </div>
            <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)} className="input-field py-3 min-w-45">
               {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
            </select>
            <div className="flex bg-surface-50 p-1.5 rounded-2xl">
               {(['proposals', 'browse']).map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? (isIndia ? 'bg-[#000080] text-white shadow-lg' : 'bg-white text-surface-900 shadow-sm') : 'text-surface-400'}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* Propose Form */}
      <AnimatePresence>
        {showPropose && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
             <div className={`rounded-[2.5rem] p-10 border-4 ${isIndia ? 'border-[#FF9933] bg-[#FF9933]/5' : 'border-primary-500 bg-primary-50/10'}`}>
                <div className="flex items-center justify-between mb-8">
                   <h3 className={`text-xl font-black ${isIndia ? 'text-[#000080]' : ''}`}>Submit Regional Nuance</h3>
                   <button onClick={() => setShowPropose(false)} className="p-2 hover:bg-white/50 rounded-xl transition-all">
                      <X weight="bold" size={24} />
                   </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40">System Key</label>
                      <input value={proposeKey} onChange={e => setProposeKey(e.target.value)} placeholder="e.g. auth.login.title" className="input-field w-full font-mono text-xs" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Proposed Localization</label>
                      <input value={proposeValue} onChange={e => setProposeValue(e.target.value)} placeholder="Enter localized text..." className="input-field w-full" />
                   </div>
                </div>

                <div className="space-y-3 mb-8">
                   <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Cultural Context / Rational</label>
                   <textarea value={proposeContext} onChange={e => setProposeContext(e.target.value)} rows={3} placeholder="Explain why this nuance is important for the region..." className="input-field w-full py-4 resize-none" />
                </div>

                <div className="flex gap-4">
                   <button onClick={handlePropose} disabled={submitting || !proposeKey || !proposeValue} className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl ${isIndia ? 'bg-[#FF9933]' : 'bg-primary-600'}`}>
                      {submitting ? 'Transmitting...' : 'Dispatch Proposal'}
                   </button>
                   <button onClick={() => setShowPropose(false)} className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-white border border-surface-200">Cancel</button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="space-y-6">
         {activeTab === 'proposals' ? (
           loading ? (
             <div className="flex justify-center py-20"><SpinnerGap className="animate-spin opacity-20" size={40} /></div>
           ) : filteredProposals.length === 0 ? (
             <div className="py-20 text-center rounded-[3rem] border-2 border-dashed border-surface-100">
                <Translate weight="thin" size={80} className="mx-auto mb-6 opacity-10" />
                <p className="text-[11px] font-black uppercase tracking-widest opacity-30">No active dialect proposals</p>
             </div>
           ) : (
             <div className="grid gap-4">
                {filteredProposals.map(p => (
                  <ProposalCard key={p.id} proposal={p} onVote={handleVote} currentUserId={user?.id} isIndia={isIndia} />
                ))}
             </div>
           )
         ) : (
           <div className={`rounded-[3rem] overflow-hidden border ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-xl' : 'bg-white border-surface-100'}`}>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-surface-50 border-b">
                       <tr>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-30">Registry Key</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-30">Current Value</th>
                          <th className="px-8 py-5 text-right"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-50">
                       {filteredKeys.slice(0, 50).map(([key, val]) => (
                         <tr key={key} className="hover:bg-surface-50/50 transition-all">
                            <td className="px-8 py-5"><code className={`text-xs font-mono font-bold ${isIndia ? 'text-[#000080]/60' : 'text-primary-600'}`}>{key}</code></td>
                            <td className="px-8 py-5 text-sm font-medium opacity-70">{val}</td>
                            <td className="px-8 py-5 text-right">
                               <button onClick={() => { setProposeKey(key); setShowPropose(true); }} className={`text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`}>Edit</button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
         )}
      </div>
    </motion.div>
  );
}

function ProposalCard({ proposal, onVote, currentUserId, isIndia }) {
  const isOwn = proposal.proposed_by === currentUserId;
  const statusColors = {
    pending: 'bg-[#FF9933]/10 text-[#FF9933]',
    approved: 'bg-[#138808]/10 text-[#138808]',
    rejected: 'bg-red-50 text-red-600',
  };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`rounded-[2.5rem] p-8 border transition-all ${isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white border-surface-50'}`}>
       <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-wrap">
             <code className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${isIndia ? 'bg-[#000080]/5 text-[#000080]' : 'bg-surface-50 text-primary-600'}`}>{proposal.key}</code>
             <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${statusColors[proposal.status]}`}>{proposal.status}</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-20">By {proposal.proposed_by_name}</div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-4 border border-dashed border-red-100 bg-red-50/10">
             <div className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-2">Stale Value</div>
             <p className="text-sm font-medium opacity-60 line-through">{proposal.current_value || '—'}</p>
          </div>
          <div className="rounded-2xl p-4 border border-[#138808]/20 bg-[#138808]/5">
             <div className="text-[9px] font-black uppercase tracking-widest text-[#138808] mb-2">Regional Nuance</div>
             <p className="text-sm font-black text-[#138808]">{proposal.proposed_value}</p>
          </div>
       </div>

       {proposal.context && (
         <div className="flex items-start gap-4 mb-8">
            <ChatCircleDots className="opacity-20 shrink-0" size={20} />
            <p className="text-xs font-medium italic opacity-60">"{proposal.context}"</p>
         </div>
       )}

       {proposal.status === 'pending' && (
         <div className="flex items-center gap-4 pt-6 border-t border-surface-50">
            <div className="flex bg-surface-50 p-1 rounded-xl">
               <VoteBtn active={proposal.user_vote === 'up'} icon={<ThumbsUp />} count={proposal.votes_for} onClick={() => onVote(proposal.id, 'up')} disabled={isOwn} isIndia={isIndia} color="text-[#138808]" />
               <VoteBtn active={proposal.user_vote === 'down'} icon={<ThumbsDown />} count={proposal.votes_against} onClick={() => onVote(proposal.id, 'down')} disabled={isOwn} isIndia={isIndia} color="text-red-500" />
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest ml-auto ${proposal.votes_for >= proposal.votes_against ? 'text-[#138808]' : 'text-red-500'}`}>
               Registry Influence: {proposal.votes_for - proposal.votes_against}
            </div>
         </div>
       )}
    </motion.div>
  );
}

function VoteBtn({ active, icon, count, onClick, disabled, isIndia, color }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${active ? `bg-white shadow-sm ${color}` : 'opacity-30 hover:opacity-100'} ${disabled ? 'cursor-not-allowed' : ''}`}
    >
       {icon}
       {count}
    </button>
  );
}

export default TranslationsPage;
