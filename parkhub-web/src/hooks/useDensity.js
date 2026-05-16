import { useCallback, useEffect, useState } from 'react';

export const DENSITY_KEY = 'parkhub.ui.density';
const DENSITY_EVENT = 'parkhub:density';
const ALLOWED = ['compact', 'cozy', 'comfortable'];

function read(fallback = 'cozy') {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = window.localStorage.getItem(DENSITY_KEY);
    return ALLOWED.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function write(value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DENSITY_KEY, value);
  } catch {
    /* quota / private mode — accept silently */
  }
}

function applyToRoot(value) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-density', value);
  }
}

export function useDensity() {
  const [density, setDensityState] = useState(() => {
    const initial = read();
    applyToRoot(initial);
    return initial;
  });

  useEffect(() => {
    applyToRoot(density);
  }, [density]);

  useEffect(() => {
    function handleCustom(e) {
      const detail = e.detail;
      if (detail && ALLOWED.includes(detail)) setDensityState(detail);
    }
    function handleStorage(e) {
      if (e.key !== DENSITY_KEY || !e.newValue) return;
      if (ALLOWED.includes(e.newValue)) setDensityState(e.newValue);
    }
    window.addEventListener(DENSITY_EVENT, handleCustom);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(DENSITY_EVENT, handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setDensity = useCallback((next) => {
    if (!ALLOWED.includes(next)) return;
    write(next);
    setDensityState(next);
    window.dispatchEvent(new CustomEvent(DENSITY_EVENT, { detail: next }));
  }, []);

  return [density, setDensity];
}
