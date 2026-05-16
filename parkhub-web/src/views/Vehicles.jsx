import { useActionState, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Plus, Trash, Star, X, SpinnerGap, Lightning, Image as ImageIcon, Clock, Pencil } from '@phosphor-icons/react';
import { api } from '../api/client';
import { VehiclesSkeleton } from '../components/Skeleton';
import { stagger, fadeUp } from '../constants/animations';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const PLACEHOLDER_CAR = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400';

const BRAND_LOGOS = {
  toyota: 'https://www.vectorlogo.zone/logos/toyota/toyota-icon.svg',
  mahindra: 'https://www.vectorlogo.zone/logos/mahindra/mahindra-icon.svg',
  tata: 'https://www.vectorlogo.zone/logos/tatamotors/tatamotors-icon.svg',
  suzuki: 'https://www.vectorlogo.zone/logos/suzuki/suzuki-icon.svg',
  maruti: 'https://www.vectorlogo.zone/logos/suzuki/suzuki-icon.svg',
  hyundai: 'https://www.vectorlogo.zone/logos/hyundai/hyundai-icon.svg',
  honda: 'https://www.vectorlogo.zone/logos/honda/honda-icon.svg',
  kia: 'https://www.vectorlogo.zone/logos/kia/kia-icon.svg',
  mg: 'https://www.vectorlogo.zone/logos/mg/mg-icon.svg',
  skoda: 'https://www.vectorlogo.zone/logos/skoda/skoda-icon.svg',
  volkswagen: 'https://www.vectorlogo.zone/logos/volkswagen/volkswagen-icon.svg',
  renault: 'https://www.vectorlogo.zone/logos/renault/renault-icon.svg',
  mercedes: 'https://www.vectorlogo.zone/logos/mercedes/mercedes-icon.svg',
  bmw: 'https://www.vectorlogo.zone/logos/bmw/bmw-icon.svg',
  audi: 'https://www.vectorlogo.zone/logos/audi/audi-icon.svg',
  ford: 'https://www.vectorlogo.zone/logos/ford/ford-icon.svg',
};

const getBrandSticker = (make) => {
  if (!make) return PLACEHOLDER_CAR;
  let key = make.toLowerCase().trim();
  if (key.includes('maruti')) key = 'suzuki';
  // Try to find exact match, or partial match
  const match = Object.keys(BRAND_LOGOS).find(b => key.includes(b));
  return match ? BRAND_LOGOS[match] : PLACEHOLDER_CAR;
};

const IDLE = { kind: 'idle' };

const COLOR_DEFS = [
  { key: 'black', bg: 'bg-gray-900' },
  { key: 'white', bg: 'bg-white border border-surface-300' },
  { key: 'silver', bg: 'bg-gray-400' },
  { key: 'gray', bg: 'bg-gray-500' },
  { key: 'blue', bg: 'bg-blue-600' },
  { key: 'red', bg: 'bg-red-600' },
  { key: 'green', bg: 'bg-green-600' },
  { key: 'brown', bg: 'bg-amber-800' },
  { key: 'beige', bg: 'bg-amber-200' },
  { key: 'other', bg: 'bg-surface-400' },
];

const colorBgMap = {
  black: 'bg-gray-900',
  white: 'bg-white border border-surface-300',
  silver: 'bg-gray-400',
  gray: 'bg-gray-500',
  blue: 'bg-blue-600',
  red: 'bg-red-600',
  green: 'bg-green-600',
  brown: 'bg-amber-800',
  beige: 'bg-amber-200',
  other: 'bg-surface-400',
};

export function VehiclesPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState({ plate: '', make: '', model: '', color: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    api.getVehicles().then((res) => {
      if (res.success && res.data) setVehicles(res.data);
    }).finally(() => setLoading(false));
  }, []);

  const [addResult, addAction, isAdding] = useActionState(
    async (_prev, _formData) => {
      const plate = form.plate.trim().toUpperCase();
      if (!plate) return { kind: 'err', message: t('vehicles.plateRequired', 'Plate required') };
      
      const isEdit = !!editingVehicle;
      const url = isEdit ? `/api/v1/vehicles/${editingVehicle.id}` : '/api/v1/vehicles';
      
      const formData = new FormData();
      formData.append('plate', plate);
      if (form.make) formData.append('make', form.make);
      if (form.model) formData.append('model', form.model);
      if (form.color) formData.append('color', form.color);
      if (selectedImage) formData.append('image', selectedImage);
      
      if (isEdit) {
        formData.append('_method', 'PUT');
      }

      const res = await api.request(url, {
        method: 'POST', // Use POST with _method spoofing for FormData
        body: formData,
      });

      if (res.success && res.data) return { kind: 'ok', vehicle: res.data };
      return { kind: 'err', message: res.error?.message || t('common.error') };
    },
    IDLE,
  );

  useEffect(() => {
    if (addResult.kind === 'ok') {
      if (editingVehicle) {
        setVehicles((prev) => prev.map(v => v.id === editingVehicle.id ? addResult.vehicle : v));
        toast.success(t('vehicles.updated', 'Vehicle updated'));
      } else {
        setVehicles((prev) => [...prev, addResult.vehicle]);
        toast.success(t('vehicles.added', 'Vehicle added'));
      }
      setForm({ plate: '', make: '', model: '', color: '' });
      setSelectedImage(null);
      setImagePreview(null);
      setEditingVehicle(null);
      setShowForm(false);
    } else if (addResult.kind === 'err') {
      toast.error(addResult.message);
    }
  }, [addResult, t]);

  async function handleDelete(id) {
    if (!window.confirm(t('common.confirmDelete', 'Are you sure?'))) return;
    const res = await api.deleteVehicle(id);
    if (res.success) {
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success(t('vehicles.removed', 'Vehicle removed'));
    }
  }

  async function handleSetDefault(id) {
    const res = await api.setVehicleDefault(id);
    if (res.success) {
      setVehicles((prev) => prev.map(v => ({
        ...v,
        is_default: v.id === id
      })));
      toast.success(t('vehicles.defaultSet', 'Default vehicle updated'));
    }
  }

  function handleEdit(vehicle) {
    setEditingVehicle(vehicle);
    setForm({
      plate: vehicle.plate,
      make: vehicle.make || '',
      model: vehicle.model || '',
      color: vehicle.color || ''
    });
    setImagePreview(vehicle.image_url || vehicle.photo_url || null);
    setShowForm(true);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  }

  const isVoid = designTheme === 'void';
  const isIndia = designTheme === 'india';
  const container = stagger;
  const item = fadeUp;
  const activeVehicles = vehicles.filter((vehicle) => isVehicleActive(vehicle)).length;
  const evVehicles = vehicles.filter((vehicle) => isEvVehicle(vehicle)).length;
  const uniqueMakes = new Set(vehicles.map((vehicle) => vehicle.make).filter(Boolean)).size;

  const defaultVehicles = vehicles.filter((vehicle) => vehicle.is_default).length;
  const stats = useMemo(() => ([
    { label: t('vehicles.registeredCount', 'Registered'), value: String(vehicles.length), meta: t('vehicles.fleetReady', 'Fleet ready') },
    { label: t('vehicles.activeLabel', 'Active'), value: String(activeVehicles), meta: `${defaultVehicles} ${t('vehicles.defaultMeta', 'default')}` },
    { label: t('vehicles.evLabel', 'EV-ready'), value: String(evVehicles), meta: `${uniqueMakes} ${t('vehicles.makesMeta', 'makes')}` },
  ]), [activeVehicles, defaultVehicles, evVehicles, t, uniqueMakes, vehicles.length]);

  if (loading) return <VehiclesSkeleton />;

  return (
    <AnimatePresence mode="wait">
      <motion.div key="vehicles-loaded" variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div
          variants={item}
          className={`overflow-hidden rounded-[28px] border px-6 py-6 shadow-[0_22px_64px_-42px_rgba(15,23,42,0.45)] ${
            isVoid
              ? 'border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.95))] text-white'
              : isIndia
              ? 'border-[#FF9933]/20 bg-[radial-gradient(circle_at_top_left,rgba(255,153,51,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,248,240,0.92))] text-[#000080] dark:border-[#FF9933]/30 dark:bg-[radial-gradient(circle_at_top_left,rgba(255,153,51,0.2),transparent_38%),linear-gradient(135deg,rgba(10,10,26,0.98),rgba(0,0,51,0.94))] dark:text-white'
              : 'border-stone-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_38%),linear-gradient(135deg,rgba(255,252,248,0.98),rgba(240,253,250,0.92))] text-surface-900 dark:border-surface-800 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_38%),linear-gradient(135deg,rgba(22,26,34,0.98),rgba(31,41,55,0.94))] dark:text-white'
          }`}
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                isVoid
                  ? 'bg-cyan-500/10 text-cyan-100'
                  : isIndia
                  ? 'bg-[#FF9933]/10 text-[#FF9933]'
                  : 'bg-white/80 text-emerald-700 dark:bg-white/10 dark:text-emerald-300'
              }`}>
                <Car weight="fill" className="h-3.5 w-3.5" />
                {isVoid ? 'Void fleet deck' : isIndia ? 'India Heritage Fleet' : 'Marble vehicle registry'}
              </div>

              <h1 className="text-3xl font-black tracking-[-0.04em] text-surface-900 dark:text-white">{t('vehicles.title', 'My Vehicles')}</h1>
              <p className={`mt-2 max-w-2xl text-sm leading-6 ${isVoid ? 'text-slate-300' : 'text-surface-600 dark:text-surface-300'}`}>
                {t('vehicles.subtitle', 'Manage vehicles')}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {stats.map((stat, index) => (
                  <VehicleHeroStat
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    meta={stat.meta}
                    isVoid={isVoid}
                    isIndia={isIndia}
                    accent={index === 0}
                  />
                ))}
              </div>
            </div>

            <div className={`rounded-3xl border p-5 ${
              isVoid
                ? 'border-white/10 bg-white/4'
                : isIndia
                ? 'border-[#FF9933]/20 bg-white/80 dark:border-[#FF9933]/20 dark:bg-white/4'
                : 'border-white/80 bg-white/80 dark:border-white/10 dark:bg-white/4'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isVoid ? 'text-white/45' : 'text-surface-500 dark:text-white/45'}`}>
                    {t('vehicles.registryLabel', 'Registry')}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{t('vehicles.title', 'My Vehicles')}</h2>
                  <p className={`mt-2 text-sm leading-6 ${isVoid ? 'text-slate-300' : 'text-surface-600 dark:text-surface-300'}`}>
                    {t('vehicles.registryHint', 'Keep license plates, EV capability, and preferred defaults aligned before you book.' )}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setEditingVehicle(null);
                    setForm({ plate: '', make: '', model: '', color: '' });
                    setImagePreview(null);
                    setShowForm(true);
                  }} 
                  className="btn btn-primary shrink-0"
                >
                  <Plus weight="bold" className="w-4 h-4" /> {t('vehicles.add', 'Add')}
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <PanelMetric label={t('vehicles.defaultLabel', 'Default')} value={vehicles.find((vehicle) => vehicle.is_default)?.plate ?? '—'} isVoid={isVoid} isIndia={isIndia} mono />
                <PanelMetric label={t('vehicles.evLabel', 'EV-ready')} value={evVehicles ? `${evVehicles}` : '0'} isVoid={isVoid} isIndia={isIndia} />
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label={t('vehicles.newVehicle', 'New vehicle')}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowForm(false)}
                aria-hidden="true"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md glass-modal shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4 dark:border-surface-800">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-surface-900 dark:text-white">
                    <Car weight="fill" className="h-5 w-5 text-primary-600" />
                    {editingVehicle ? t('vehicles.editTitle', 'Edit Vehicle') : t('vehicles.addTitle', 'Add Vehicle')}
                  </h2>
                  <button 
                    onClick={() => {
                      setShowForm(false);
                      setEditingVehicle(null);
                    }} 
                    className="rounded-full p-2 hover:bg-surface-100 dark:hover:bg-surface-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form action={addAction} className="space-y-4 p-6">
                  <div>
                    <label htmlFor="vehicle-plate" className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">{t('vehicles.plate', 'License Plate')} *</label>
                    <input id="vehicle-plate" type="text" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} className="input w-full" placeholder="M-AB 1234" required autoFocus />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="vehicle-make" className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">{t('vehicles.make', 'Make')}</label>
                      <input id="vehicle-make" type="text" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className="input w-full" placeholder="BMW" />
                    </div>
                    <div>
                      <label htmlFor="vehicle-model" className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">{t('vehicles.model', 'Model')}</label>
                      <input id="vehicle-model" type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="input w-full" placeholder="3er" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">{t('vehicles.color', 'Color')}</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {COLOR_DEFS.map((color) => (
                        <button
                          key={color.key}
                          type="button"
                          onClick={() => setForm({ ...form, color: form.color === color.key ? '' : color.key })}
                          aria-label={t(`vehicles.colors.${color.key}`)}
                          aria-pressed={form.color === color.key}
                          className={`h-8 w-8 rounded-full transition-all ${color.bg} ${form.color === color.key ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900 scale-110' : ''}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">{t('vehicles.photo', 'Vehicle Photo')}</label>
                    <div className="mt-1 flex items-center gap-4">
                      <div className="relative h-16 w-24 overflow-hidden rounded-xl border border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon weight="light" className="h-8 w-8 text-surface-300" />
                          </div>
                        )}
                      </div>
                      <label className="btn btn-secondary cursor-pointer text-sm">
                        <span>{t('common.upload', 'Upload')}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => { setShowForm(false); setImagePreview(null); setSelectedImage(null); }} className="btn btn-secondary">{t('common.cancel', 'Cancel')}</button>
                    <button type="submit" disabled={isAdding} className="btn btn-primary w-full py-3">
                      {isAdding ? t('common.saving', 'Saving...') : (editingVehicle ? t('common.saveChanges', 'Save Changes') : t('vehicles.addSubmit', 'Add Vehicle'))}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {vehicles.length === 0 ? (
          <motion.div variants={item} className="rounded-3xl border border-surface-200 bg-white p-16 text-center shadow-[0_18px_50px_-38px_rgba(15,23,42,0.18)] dark:border-surface-800 dark:bg-surface-950/80">
            <Car weight="light" className="mx-auto h-20 w-20 text-surface-200 dark:text-surface-700" />
            <p className="mt-4 text-surface-500 dark:text-surface-400">{t('vehicles.noVehicles', 'No vehicles registered yet')}</p>
            <motion.button onClick={() => setShowForm(true)} className="btn btn-primary mt-6" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Plus weight="bold" className="w-4 h-4" /> {t('vehicles.add', 'Add')}
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {vehicles.map((vehicle, index) => {
              const colorClass = vehicle.color ? (colorBgMap[vehicle.color] || 'bg-surface-400') : 'bg-surface-400';
              const evVehicle = isEvVehicle(vehicle);
              const vehicleStatus = isVehicleActive(vehicle) ? t('vehicles.activeLabel', 'Active') : t('vehicles.inactiveLabel', 'Inactive');
              const displayImage = vehicle.image_url || vehicle.photo_url || getBrandSticker(vehicle.make);
              const isLogo = !vehicle.image_url && !vehicle.photo_url && getBrandSticker(vehicle.make) !== PLACEHOLDER_CAR;

              return (
                <motion.div 
                  key={vehicle.id} 
                  variants={item} 
                  className={`group overflow-hidden rounded-3xl border bg-white shadow-lg transition-all hover:shadow-xl dark:bg-surface-950/80 ${
                    vehicle.is_default 
                      ? 'border-primary-500 ring-1 ring-primary-500/20' 
                      : 'border-surface-200 dark:border-surface-800'
                  }`}
                >
                  <div className={`relative h-40 w-full overflow-hidden ${isLogo ? 'bg-white' : 'bg-surface-50 dark:bg-surface-900/50'}`}>
                    <img 
                      src={displayImage} 
                      alt={vehicle.plate} 
                      className={`h-full w-full transition-transform duration-500 group-hover:scale-110 ${
                        isLogo ? 'object-contain p-6' : 'object-cover'
                      }`}
                    />
                    {!isLogo && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />}
                    
                    {vehicle.is_default && (
                      <div className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                        {t('vehicles.default', 'Default')}
                      </div>
                    )}
                    
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div className="min-w-0">
                        <p className="font-['DM_Mono',monospace] text-xl font-bold tracking-[0.15em] text-white drop-shadow-md">
                          {vehicle.plate}
                        </p>
                        <p className="text-xs font-medium text-white/80">
                          {[vehicle.make, vehicle.model].filter(Boolean).join(' ') || t('vehicles.unnamed', 'Unnamed vehicle')}
                        </p>
                      </div>
                      <div className={`h-8 w-8 rounded-full border-2 border-white/30 shadow-sm ${colorClass}`} />
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <VehicleInfoField label={t('vehicles.typeLabel', 'Type')} value={deriveVehicleType(vehicle)} />
                      <VehicleInfoField label={t('vehicles.statusLabel', 'Status')} value={vehicleStatus} accent />
                      <div className="hidden sm:block">
                        <VehicleInfoField label={t('vehicles.color', 'Color')} value={vehicle.color ? t(`vehicles.colors.${vehicle.color}`, vehicle.color) : '—'} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-100 pt-4 dark:border-surface-800">
                      <div className="flex gap-2">
                        {!vehicle.is_default && (
                          <button 
                            onClick={() => handleSetDefault(vehicle.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 px-3 py-2 text-xs font-semibold text-surface-600 transition-colors hover:border-amber-400 hover:text-amber-700 dark:border-surface-700 dark:text-surface-300 dark:hover:text-amber-300"
                          >
                            <Star weight="bold" className="h-3.5 w-3.5" />
                            {t('vehicles.setAsDefault', 'Set Default')}
                          </button>
                        )}
                        <a 
                          href={`/bookings?vehicle=${vehicle.plate}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 px-3 py-2 text-xs font-semibold text-surface-600 transition-colors hover:border-primary-400 hover:text-primary-700 dark:border-surface-700 dark:text-surface-300 dark:hover:text-primary-300"
                        >
                          <Clock weight="bold" className="h-3.5 w-3.5" />
                          {t('vehicles.history', 'History')}
                        </a>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(vehicle)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-50 text-surface-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:bg-surface-900/50 dark:hover:bg-blue-900/30"
                            title={t('common.edit', 'Edit')}
                          >
                            <Pencil weight="bold" className="h-4.5 w-4.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(vehicle.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-50 text-surface-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-surface-900/50 dark:hover:bg-red-900/30"
                            title={t('common.delete', 'Delete')}
                          >
                            <Trash weight="bold" className="h-4.5 w-4.5" />
                          </button>
                        </div>
                        <a href={`/book?vehicle_id=${vehicle.id}`} className="btn btn-primary btn-sm">
                          {t('vehicles.book', 'Book Now')}
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function VehicleHeroStat({
  label,
  value,
  meta,
  isVoid,
  isIndia,
  accent = false,
}) {
  return (
    <div className={`rounded-[22px] border px-4 py-4 ${
      isVoid
        ? accent
          ? 'border-cyan-500/20 bg-cyan-500/10'
          : 'border-white/10 bg-white/4'
        : isIndia
        ? accent
          ? 'border-[#FF9933]/30 bg-[#FF9933]/10'
          : 'border-[#FF9933]/10 bg-white/80 dark:bg-white/5'
        : accent
        ? 'border-emerald-200 bg-emerald-500/10 dark:border-emerald-900/60'
        : 'border-white/80 bg-white/85 dark:border-white/10 dark:bg-white/4'
    }`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isVoid ? (accent ? 'text-cyan-100' : 'text-white/45') : (accent ? 'text-emerald-700 dark:text-emerald-300' : 'text-surface-500 dark:text-white/45')}`}>{label}</p>
      <p className={`mt-3 text-3xl font-black tracking-tighter ${isVoid ? 'text-white' : 'text-surface-900 dark:text-white'}`}>{value}</p>
      <p className={`mt-1 text-xs ${isVoid ? 'text-slate-300' : 'text-surface-500 dark:text-surface-400'}`}>{meta}</p>
    </div>
  );
}

function PanelMetric({ label, value, isVoid, isIndia, mono = false }) {
  return (
    <div className={`rounded-2xl border px-4 py-4 ${
      isVoid 
        ? 'border-white/10 bg-slate-950/60' 
        : isIndia
        ? 'border-[#FF9933]/10 bg-white/80 dark:bg-surface-900/60'
        : 'border-surface-200 bg-surface-50/80 dark:border-surface-800 dark:bg-surface-900/60'
    }`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isVoid ? 'text-white/45' : 'text-surface-500 dark:text-surface-400'}`}>{label}</p>
      <p className={`mt-2 text-lg font-semibold ${mono ? "font-['DM_Mono',monospace]" : ''} ${isVoid ? 'text-white' : 'text-surface-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

function VehicleInfoField({ label, value, accent = false }) {
  return (
    <div className="rounded-[18px] border border-surface-200 bg-surface-50/80 px-4 py-3 dark:border-surface-800 dark:bg-surface-900/60">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-surface-400 dark:text-surface-500">{label}</p>
      <p className={`mt-1 text-sm font-medium ${accent ? 'text-primary-700 dark:text-primary-300' : 'text-surface-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

function isVehicleActive(vehicle) {
  return vehicle.status !== 'inactive';
}

function isEvVehicle(vehicle) {
  const haystack = `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.toLowerCase();
  return haystack.includes('tesla') || haystack.includes('ev') || haystack.includes('electric');
}

function deriveVehicleType(vehicle) {
  if (isEvVehicle(vehicle)) return 'Car (EV)';
  return 'Car';
}
