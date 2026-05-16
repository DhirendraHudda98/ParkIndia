import { useCallback, useEffect, useState } from 'react';

export const NAV_LAYOUT_KEY = 'parkhub.nav.layout';
const NAV_LAYOUT_EVENT = 'parkhub:nav-layout';
const ALLOWED = ['classic', 'rail', 'top', 'dock', 'focus'];

function read(fallback = 'classic') {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = window.localStorage.getItem(NAV_LAYOUT_KEY);
    return ALLOWED.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function write(value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NAV_LAYOUT_KEY, value);
  } catch {
    /* quota / private mode — accept silently */
  }
}

export function useNavLayout() {
  const [layout, setLayoutState] = useState(() => read());

  useEffect(() => {
    function handleCustom(e) {
      const detail = e.detail;
      if (detail && ALLOWED.includes(detail)) setLayoutState(detail);
    }
    function handleStorage(e) {
      if (e.key !== NAV_LAYOUT_KEY || !e.newValue) return;
      if (ALLOWED.includes(e.newValue)) {
        setLayoutState(e.newValue);
      }
    }
    window.addEventListener(NAV_LAYOUT_EVENT, handleCustom);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(NAV_LAYOUT_EVENT, handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setLayout = useCallback((next) => {
    if (!ALLOWED.includes(next)) return;
    write(next);
    setLayoutState(next);
    window.dispatchEvent(new CustomEvent(NAV_LAYOUT_EVENT, { detail: next }));
  }, []);

  return [layout, setLayout];
}
