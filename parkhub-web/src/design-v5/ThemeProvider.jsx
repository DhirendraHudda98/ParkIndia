import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
const MODES = ['marble_light', 'marble_dark', 'void'];
const STORAGE_KEY = 'ph-v5-mode';
const DEFAULT_MODE = 'marble_light';
const Ctx = createContext(null);
function readInitial() {
    if (typeof window === 'undefined')
        return DEFAULT_MODE;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && MODES.includes(stored))
        return stored;
    // First paint honors OS preference for marble; void is opt-in only.
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'marble_dark' : 'marble_light';
}
export function V5ThemeProvider({ children }) {
    const [mode, setModeState] = useState(readInitial);
    useEffect(() => {
        document.documentElement.setAttribute('data-ph-mode', mode);
        window.localStorage.setItem(STORAGE_KEY, mode);
        return () => {
            // Leave attribute in place — other pages outside the v5 shell may want
            // to inherit; cleanup would cause a flash on client-side nav back in.
        };
    }, [mode]);
    const setMode = useCallback((m) => setModeState(m), []);
    const value = useMemo(() => ({ mode, setMode, isVoid: mode === 'void', isDark: mode !== 'marble_light' }), [mode, setMode]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useV5Theme() {
    const ctx = useContext(Ctx);
    if (!ctx)
        throw new Error('useV5Theme must be used within <V5ThemeProvider>');
    return ctx;
}
export const V5_MODES = MODES;
export const V5_MODE_LABELS = {
    marble_light: '☀ Marble',
    marble_dark: '● Marble Dark',
    void: '◼ Void',
};
