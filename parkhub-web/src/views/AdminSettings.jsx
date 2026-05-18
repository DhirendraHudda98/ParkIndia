import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SpinnerGap, Check } from '@phosphor-icons/react';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const defaultSettings = {
  company_name: 'ParkIndia',
  use_case: 'company',
  self_registration: 'true',
  license_plate_mode: 'optional',
  max_bookings_per_day: '3',
  allow_guest_bookings: 'false',
  auto_release_minutes: '30',
  require_vehicle: 'false',
  waitlist_enabled: 'true',
  credits_enabled: 'false',
  credits_per_booking: '1',
};

function ToggleRow({ label, description, checked, onChange, isIndia }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>{label}</p>
        {description && <p className={`text-xs mt-0.5 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          checked 
            ? isIndia ? 'bg-[#FF9933] focus:ring-[#FF9933]' : 'bg-primary-600 focus:ring-primary-500' 
            : 'bg-surface-300 dark:bg-surface-600'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

export function AdminSettingsPage() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminGetSettings();
      if (res.success && res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      } else {
        setError(res.error?.message || t('admin.settingsLoadFailed'));
      }
    } catch (err) {
      setError(err?.message || t('admin.settingsLoadFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await api.adminUpdateSettings(settings);
      if (res.success) {
        toast.success(t('admin.settingsSaved'));
      } else {
        toast.error(res.error?.message || t('admin.settingsSaveFailed'));
      }
    } catch {
      toast.error(t('admin.settingsSaveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function update(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function toBool(v) { return v === 'true' || v === '1'; }
  function fromBool(v) { return v ? 'true' : 'false'; }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label={t('common.loading')}>
        <SpinnerGap weight="bold" className={`w-8 h-8 animate-spin ${isIndia ? 'text-[#FF9933]' : 'text-primary-600'}`} aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-[2rem] border p-8 text-center transition-all ${isVoid ? 'bg-slate-900 border-slate-800' : isIndia ? 'bg-white border-[#FF9933]/15 shadow-sm shadow-[#FF9933]/5' : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'}`}>
        <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isIndia ? 'bg-[#FF9933]/10 text-[#FF9933]' : 'bg-red-50 dark:bg-red-950/20 text-red-500'}`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className={`text-lg font-black mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
          {isIndia ? 'System Settings Offline' : t('admin.errorTitle', 'Error Occurred')}
        </h3>
        <p className={`text-sm max-w-md mx-auto mb-6 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
          {error}
        </p>
        <button
          onClick={loadSettings}
          className={`px-5 py-2.5 rounded-xl font-bold transition-all ${isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00] text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
        >
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  const cardClass = `border p-6 space-y-4 rounded-2xl transition-colors ${
    isVoid 
      ? 'bg-slate-900 border-slate-800' 
      : isIndia 
      ? 'bg-white border-[#FF9933]/20 shadow-sm' 
      : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
  }`;

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm transition-colors ${
    isVoid 
      ? 'bg-slate-950 border-slate-700 text-white' 
      : isIndia 
      ? 'bg-white border-[#FF9933]/20 text-[#000080] focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933]' 
      : 'bg-white dark:bg-surface-950 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white'
  }`;

  const labelClass = `block text-sm font-medium mb-2 ${isIndia ? 'text-[#000080]' : 'text-surface-700 dark:text-surface-300'}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <h2 className={`text-xl font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
        {t('admin.systemSettings')}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* General */}
          <div className={cardClass}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${isIndia ? 'text-[#FF9933]' : 'text-surface-900 dark:text-white'}`}>
              {t('admin.general')}
            </h3>

            <div>
              <label htmlFor="setting-company-name" className={labelClass}>
                {t('admin.companyName')}
              </label>
              <input
                id="setting-company-name"
                type="text"
                value={settings.company_name}
                onChange={e => update('company_name', e.target.value)}
                className={inputClass}
                placeholder={t('admin.companyName')}
              />
            </div>

            <div>
              <label htmlFor="setting-use-case" className={labelClass}>
                {t('admin.useCaseLabel')}
              </label>
              <select id="setting-use-case" value={settings.use_case} onChange={e => update('use_case', e.target.value)} className={inputClass}>
                <option value="company">{t('admin.useCaseCompany')}</option>
                <option value="residential">{t('admin.useCaseResidential')}</option>
                <option value="shared">{t('admin.useCaseShared')}</option>
                <option value="rental">{t('admin.useCaseRental')}</option>
                <option value="personal">{t('admin.useCasePersonal')}</option>
              </select>
            </div>

            <ToggleRow
              label={t('admin.selfRegistration')}
              description={t('admin.selfRegistrationDesc')}
              checked={toBool(settings.self_registration)}
              onChange={v => update('self_registration', fromBool(v))}
              isIndia={isIndia}
            />
          </div>

          {/* Booking Rules */}
          <div className={cardClass}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${isIndia ? 'text-[#FF9933]' : 'text-surface-900 dark:text-white'}`}>
              {t('admin.bookingRules')}
            </h3>

            <div>
              <label htmlFor="setting-max-bookings" className={labelClass}>
                {t('admin.maxBookingsPerDay')}
              </label>
              <input
                id="setting-max-bookings"
                type="number"
                min={0}
                max={50}
                value={settings.max_bookings_per_day}
                onChange={e => update('max_bookings_per_day', e.target.value)}
                className={inputClass}
              />
              <p className={`text-xs mt-1 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>{t('admin.maxBookingsUnlimited')}</p>
            </div>

            <ToggleRow
              label={t('admin.allowGuestBookings')}
              description={t('admin.allowGuestBookingsDesc')}
              checked={toBool(settings.allow_guest_bookings)}
              onChange={v => update('allow_guest_bookings', fromBool(v))}
              isIndia={isIndia}
            />

            <ToggleRow
              label={t('admin.requireVehicle')}
              description={t('admin.requireVehicleDesc')}
              checked={toBool(settings.require_vehicle)}
              onChange={v => update('require_vehicle', fromBool(v))}
              isIndia={isIndia}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white transition disabled:opacity-50 ${
              isIndia ? 'bg-[#FF9933] hover:bg-[#E68A00]' : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {saving ? <SpinnerGap weight="bold" className="w-4 h-4 animate-spin" /> : <Check weight="bold" className="w-4 h-4" />}
            {t('admin.saveSettings')}
          </button>
        </div>

        <div className="space-y-6">
          {/* Auto-Release */}
          <div className={cardClass}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${isIndia ? 'text-[#FF9933]' : 'text-surface-900 dark:text-white'}`}>
              {t('admin.autoRelease')}
            </h3>

            <div>
              <label htmlFor="setting-auto-release" className={labelClass}>
                {t('admin.autoReleaseMinutes')}
              </label>
              <input
                id="setting-auto-release"
                type="number"
                min={0}
                max={480}
                value={settings.auto_release_minutes}
                onChange={e => update('auto_release_minutes', e.target.value)}
                className={inputClass}
              />
              <p className={`text-xs mt-1 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
                {t('admin.autoReleaseDesc')}
              </p>
            </div>
          </div>

          {/* Waitlist */}
          <div className={cardClass}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${isIndia ? 'text-[#FF9933]' : 'text-surface-900 dark:text-white'}`}>
              {t('admin.waitlist')}
            </h3>

            <ToggleRow
              label={t('admin.enableWaitlist')}
              description={t('admin.enableWaitlistDesc')}
              checked={toBool(settings.waitlist_enabled)}
              onChange={v => update('waitlist_enabled', fromBool(v))}
              isIndia={isIndia}
            />
          </div>

          {/* Credits System */}
          <div className={cardClass}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${isIndia ? 'text-[#FF9933]' : 'text-surface-900 dark:text-white'}`}>
              {t('admin.creditsSystem')}
            </h3>

            <ToggleRow
              label={t('admin.enableCredits')}
              description={t('admin.enableCreditsDesc')}
              checked={toBool(settings.credits_enabled)}
              onChange={v => update('credits_enabled', fromBool(v))}
              isIndia={isIndia}
            />

            {toBool(settings.credits_enabled) && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label htmlFor="setting-credits-per-booking" className={labelClass}>
                  {t('admin.creditsPerBooking')}
                </label>
                <input
                  id="setting-credits-per-booking"
                  type="number"
                  min={1}
                  max={100}
                  value={settings.credits_per_booking}
                  onChange={e => update('credits_per_booking', e.target.value)}
                  className={inputClass}
                />
              </motion.div>
            )}
          </div>

          {/* License Plate Mode */}
          <div className={cardClass}>
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${isIndia ? 'text-[#FF9933]' : 'text-surface-900 dark:text-white'}`}>
              {t('admin.licensePlate')}
            </h3>

            <div>
              <label htmlFor="setting-license-plate" className={labelClass}>
                {t('admin.licensePlateMode')}
              </label>
              <select id="setting-license-plate" value={settings.license_plate_mode} onChange={e => update('license_plate_mode', e.target.value)} className={inputClass}>
                <option value="required">{t('admin.licensePlateLabelRequired')}</option>
                <option value="optional">{t('admin.licensePlateLabelOptional')}</option>
                <option value="disabled">{t('admin.licensePlateLabelDisabled')}</option>
              </select>
              <p className={`text-xs mt-1 ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
                {settings.license_plate_mode === 'required' && t('admin.licensePlateModeRequired')}
                {settings.license_plate_mode === 'optional' && t('admin.licensePlateModeOptional')}
                {settings.license_plate_mode === 'disabled' && t('admin.licensePlateModeDisabled')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
