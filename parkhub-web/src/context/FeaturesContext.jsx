import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUseCase } from './UseCaseContext';

export const FEATURE_REGISTRY = [
  { id: 'vehicles',          category: 'core',          defaultEnabled: true },
  { id: 'booking_types',     category: 'core',          defaultEnabled: true },
  { id: 'absences',          category: 'collaboration', defaultEnabled: true },
  { id: 'team_view',         category: 'collaboration', defaultEnabled: true },
  { id: 'credits',           category: 'billing',       defaultEnabled: true },
  { id: 'invoices',          category: 'billing',       defaultEnabled: false },
  { id: 'analytics',         category: 'admin',         defaultEnabled: true },
  { id: 'self_registration', category: 'admin',         defaultEnabled: false },
  { id: 'generative_bg',     category: 'experience',    defaultEnabled: true },
  { id: 'micro_animations',  category: 'experience',    defaultEnabled: true },
  { id: 'fab_quick_actions', category: 'experience',    defaultEnabled: true },
  { id: 'rich_empty_states', category: 'experience',    defaultEnabled: true },
  { id: 'onboarding_hints',  category: 'experience',    defaultEnabled: false },
  { id: 'themes',            category: 'experience',    defaultEnabled: true },
  { id: 'history',           category: 'core',          defaultEnabled: true },
  { id: 'geofence',          category: 'core',          defaultEnabled: true },
];

export const USE_CASE_PRESETS = {
  business: ['credits', 'absences', 'vehicles', 'analytics', 'team_view', 'booking_types', 'invoices', 'generative_bg', 'micro_animations', 'fab_quick_actions', 'rich_empty_states', 'onboarding_hints', 'themes', 'history', 'geofence'],
  residential: ['vehicles', 'booking_types', 'self_registration', 'generative_bg', 'micro_animations', 'rich_empty_states', 'themes', 'history', 'geofence'],
  personal: ['vehicles', 'booking_types', 'generative_bg', 'micro_animations', 'fab_quick_actions', 'themes', 'history', 'geofence'],
};

const STORAGE_KEY = 'parkhub_features';

const FeaturesContext = createContext(null);

export function FeaturesProvider({ children }) {
  const { useCase } = useUseCase();
  const [features, setFeaturesState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* fall through */ }
    }
    return USE_CASE_PRESETS[useCase] || USE_CASE_PRESETS.business;
  });
  const [configured, setConfigured] = useState(() => localStorage.getItem(STORAGE_KEY) !== null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const persist = useCallback((f) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
  }, []);

  const isEnabled = useCallback((feature) => features.includes(feature), [features]);

  const setFeature = useCallback((feature, enabled) => {
    setFeaturesState(prev => {
      const next = enabled
        ? [...new Set([...prev, feature])]
        : prev.filter(f => f !== feature);
      persist(next);
      return next;
    });
    setConfigured(true);
  }, [persist]);

  const setFeatures = useCallback((f) => {
    setFeaturesState(f);
    persist(f);
    setConfigured(true);
  }, [persist]);

  const applyPreset = useCallback((uc) => {
    const preset = USE_CASE_PRESETS[uc] || USE_CASE_PRESETS.business;
    setFeaturesState(preset);
    persist(preset);
    setConfigured(true);
  }, [persist]);

  return (
    <FeaturesContext.Provider value={{ features, isEnabled, setFeature, setFeatures, applyPreset, configured, loading }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  const ctx = useContext(FeaturesContext);
  if (!ctx) throw new Error('useFeatures must be used within FeaturesProvider');
  return ctx;
}
