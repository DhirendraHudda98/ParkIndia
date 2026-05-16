import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadSimple, DownloadSimple, FileArrowUp, FileArrowDown, Table, Warning, CheckCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export function AdminDataManagementPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';
  const [tab, setTab] = useState('import');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Table weight="duotone" className={`w-6 h-6 ${isIndia ? 'text-[#FF9933]' : 'text-primary-500'}`} />
        <div>
          <h2 className={`text-xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {isIndia ? 'Hub Data Management' : t('dataManagement.title')}
          </h2>
          <p className={`text-sm ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>
            {isIndia ? 'Import and export Indian parking hub data and user ledgers.' : t('dataManagement.subtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 rounded-xl p-1 w-fit transition-colors ${isIndia ? 'bg-[#000080]/5' : 'bg-surface-100 dark:bg-surface-800'}`}>
        <button
          onClick={() => setTab('import')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'import'
              ? isIndia ? 'bg-white text-[#000080] shadow-sm' : 'bg-primary-600 text-white shadow-md'
              : 'text-surface-500 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
          }`}
        >
          <UploadSimple weight="bold" className="w-4 h-4" />
          {t('dataManagement.import')}
        </button>
        <button
          onClick={() => setTab('export')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'export'
              ? isIndia ? 'bg-white text-[#000080] shadow-sm' : 'bg-primary-600 text-white shadow-md'
              : 'text-surface-500 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
          }`}
        >
          <DownloadSimple weight="bold" className="w-4 h-4" />
          {t('dataManagement.export')}
        </button>
      </div>

      {tab === 'import' ? <ImportSection isIndia={isIndia} isVoid={isVoid} /> : <ExportSection isIndia={isIndia} isVoid={isVoid} />}
    </motion.div>
  );
}

function ImportSection({ isIndia, isVoid }) {
  const { t } = useTranslation();
  const [importType, setImportType] = useState('users');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  async function handleFileSelect(f) {
    setFile(f);
    setResult(null);
    const text = await f.text();
    const lines = text.split('\n').filter(l => l.trim()).slice(0, 6);
    setPreview(lines.map(l => l.split(',')));
  }

  function handleDrop(e) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const isJson = file.name.endsWith('.json');
      const data = isJson ? text : btoa(text);
      const format = isJson ? 'json' : 'csv';

      const endpoint = importType === 'users' ? '/api/v1/admin/import/users' : '/api/v1/admin/import/lots';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, data }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
        if (json.data.imported > 0) {
          toast.success(t('dataManagement.importSuccess', '{{count}} records imported', { count: json.data.imported }));
        }
      } else {
        toast.error(json.error || t('common.error'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setImporting(false);
    }
  }

  const cardClass = `rounded-[2rem] border p-6 transition-colors ${
    isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
  }`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => { setImportType('users'); setFile(null); setPreview([]); setResult(null); }}
          className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
            importType === 'users' 
              ? isIndia ? 'bg-[#000080] text-white' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
              : isIndia ? 'bg-[#000080]/5 text-[#000080]/40 hover:bg-[#000080]/10' : 'bg-surface-100 dark:bg-surface-800 text-surface-600'
          }`}
        >
          {t('dataManagement.importUsers')}
        </button>
        <button
          onClick={() => { setImportType('lots'); setFile(null); setPreview([]); setResult(null); }}
          className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
            importType === 'lots' 
              ? isIndia ? 'bg-[#000080] text-white' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
              : isIndia ? 'bg-[#000080]/5 text-[#000080]/40 hover:bg-[#000080]/10' : 'bg-surface-100 dark:bg-surface-800 text-surface-600'
          }`}
        >
          {isIndia ? 'Indian Hubs' : t('dataManagement.importLots')}
        </button>
      </div>

      <div
        onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-[2rem] p-10 text-center cursor-pointer transition-all hover:scale-[1.01] ${
          isIndia ? 'border-[#FF9933]/20 bg-[#FF9933]/5 hover:border-[#FF9933]' : 'border-surface-300 dark:border-surface-600 hover:border-primary-400'
        }`}
      >
        <FileArrowUp weight="duotone" className={`w-12 h-12 mx-auto mb-4 ${isIndia ? 'text-[#FF9933]' : 'text-surface-400'}`} />
        <p className={`text-sm font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-600 dark:text-surface-300'}`}>
          {file ? file.name : t('dataManagement.dropHint')}
        </p>
        <p className={`text-xs mt-2 font-medium ${isIndia ? 'text-[#000080]/40' : 'text-surface-400'}`}>
          {importType === 'users'
            ? t('dataManagement.usersFormat')
            : (isIndia ? 'CSV: Hub Name, City, Coordinates, Total Slots, Hourly Rate (₹)' : t('dataManagement.lotsFormat'))}
        </p>
        <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
      </div>

      {preview.length > 0 && (
        <div className={cardClass + ' overflow-hidden !p-0'}>
          <div className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#000080]/60' : 'bg-surface-100 dark:bg-surface-800 text-surface-600'}`}>
            {t('dataManagement.preview')} ({preview.length} {t('dataManagement.rows')})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className={i === 0 ? `font-bold ${isIndia ? 'bg-[#FF9933]/5' : 'bg-surface-50 dark:bg-surface-800/50'}` : `border-t ${isIndia ? 'border-[#000080]/5' : 'border-surface-100 dark:border-surface-800'}`}>
                    {row.map((cell, j) => (
                      <td key={j} className={`px-4 py-3 font-medium ${isIndia ? 'text-[#000080]/70' : 'text-surface-600 dark:text-surface-300'}`}>{cell.trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {file && (
        <button
          onClick={handleImport} disabled={importing}
          className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${isIndia ? 'bg-[#000080] hover:bg-[#000060] shadow-[#000080]/20' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20'}`}
        >
          {importing ? t('common.loading') : t('dataManagement.importNow')}
        </button>
      )}

      {result && (
        <div className={cardClass + ' space-y-4'}>
          <div className="flex items-center gap-2">
            <CheckCircle weight="fill" className="w-6 h-6 text-[#138808]" />
            <span className={`text-lg font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
              {t('dataManagement.importComplete')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <ResultItem label={t('dataManagement.imported')} value={result.imported} color="#138808" isIndia={isIndia} />
            <ResultItem label={t('dataManagement.skipped')} value={result.skipped} color="#FF9933" isIndia={isIndia} />
            <ResultItem label={t('dataManagement.errorsCount')} value={result.errors.length} color="#ef4444" isIndia={isIndia} />
          </div>
          {result.errors.length > 0 && (
            <div className={`mt-4 p-4 rounded-xl border ${isIndia ? 'bg-red-50 border-red-100' : 'bg-surface-50 dark:bg-red-950/10 border-surface-100'}`}>
              {result.errors.slice(0, 10).map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-600 font-medium py-1">
                  <Warning weight="fill" className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Row {err.row}{err.field ? ` (${err.field})` : ''}: {err.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultItem({ label, value, color, isIndia }) {
  return (
    <div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${isIndia ? 'text-[#000080]/40' : 'text-surface-500'}`}>{label}</span>
      <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
    </div>
  );
}

function ExportSection({ isIndia, isVoid }) {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  function handleExport(type) {
    const base = import.meta.env.VITE_API_URL || '';
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    const qs = params.toString();
    const url = `${base}/api/v1/admin/data/export/${type}${qs ? `?${qs}` : ''}`;
    window.open(url, '_blank');
  }

  const exportCards = [
    { type: 'users', title: t('dataManagement.exportUsers'), desc: t('dataManagement.exportUsersDesc') },
    { type: 'lots', title: isIndia ? 'Export Indian Hubs' : t('dataManagement.exportLots'), desc: t('dataManagement.exportLotsDesc') },
    { type: 'bookings', title: t('dataManagement.exportBookings'), desc: t('dataManagement.exportBookingsDesc') },
  ];

  const inputClass = `rounded-xl border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1 ${
    isVoid 
      ? 'bg-slate-950 border-slate-700 text-white focus:ring-cyan-500' 
      : isIndia 
      ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:ring-[#FF9933]' 
      : 'bg-white dark:bg-surface-950 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white focus:ring-primary-500'
  }`;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>{t('dataManagement.dateFrom')}</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block ${isIndia ? 'text-[#000080]/60' : 'text-surface-500'}`}>{t('dataManagement.dateTo')}</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {exportCards.map(card => (
          <div key={card.type} className={`rounded-[2rem] border p-6 space-y-4 transition-all hover:shadow-xl ${
            isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/10 shadow-sm shadow-[#000080]/5' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
          }`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isIndia ? 'bg-[#000080]/5 text-[#FF9933]' : 'bg-primary-50 dark:bg-primary-950/30 text-primary-500'}`}>
              <FileArrowDown weight="duotone" className="w-8 h-8" />
            </div>
            <div>
              <h3 className={`font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{card.title}</h3>
              <p className={`text-xs mt-1 font-medium ${isIndia ? 'text-[#000080]/50' : 'text-surface-500'}`}>{card.desc}</p>
            </div>
            <button
              onClick={() => handleExport(card.type)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all w-full justify-center ${isIndia ? 'bg-[#000080] hover:bg-[#000060]' : 'bg-primary-600 hover:bg-primary-700'}`}
            >
              <DownloadSimple weight="bold" className="w-4 h-4" />
              DOWNLOAD CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDataManagementPage;
