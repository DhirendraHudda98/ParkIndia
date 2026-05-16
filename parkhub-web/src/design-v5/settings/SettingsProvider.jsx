import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, } from 'react';
import { DEFAULT_SETTINGS, STORAGE_KEY, migrate, readStoredSettings, writeStoredSettings, } from './settings';
const Ctx = createContext(null);
function applyDocumentAttributes(settings) {
    if (typeof document === 'undefined')
        return;
    const root = document.documentElement;
    root.setAttribute('data-ph-mode', settings.appearance.mode);
    root.setAttribute('data-ph-density', settings.appearance.density);
    root.setAttribute('data-ph-font', settings.appearance.font);
    root.setAttribute('data-ph-reduced-motion', settings.appearance.reducedMotion ? 'true' : 'false');
    root.setAttribute('data-ph-high-contrast', settings.appearance.highContrast ? 'true' : 'false');
    root.style.setProperty('--v5-font-scale', String(settings.appearance.fontScale));
}
export function V5SettingsProvider({ children, syncToServer, syncDebounceMs = 600, initialOverride, }) {
    const [settings, setSettings] = useState(() => initialOverride ?? readStoredSettings());
    const [syncState, setSyncState] = useState('idle');
    const syncTimer = useRef(null);
    const syncSeq = useRef(0); // stale-callback guard
    // Race guard: don't push the initial (default/local) state to the server
    // before either remote hydration or an explicit user action. Otherwise a
    // fresh browser would overwrite previously saved server settings with
    // defaults on first paint. Flips true once user-action setters or
    // `hydrateRemote` run.
    const syncArmed = useRef(false);
    // Apply document attributes immediately on every change so the UI
    // reflects the new tokens without an extra render pass.
    useEffect(() => {
        applyDocumentAttributes(settings);
        writeStoredSettings(settings);
    }, [settings]);
    // Debounced backend sync (disabled when no syncToServer provided).
    useEffect(() => {
        if (!syncToServer)
            return;
        // Skip sync until we have either hydrated from the server or seen a
        // user-driven change — see `syncArmed` above.
        if (!syncArmed.current)
            return;
        if (syncTimer.current)
            clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => {
            const seq = ++syncSeq.current;
            setSyncState('saving');
            syncToServer(settings)
                .then(() => {
                if (seq === syncSeq.current)
                    setSyncState('saved');
            })
                .catch(() => {
                if (seq === syncSeq.current)
                    setSyncState('error');
            });
        }, syncDebounceMs);
        return () => {
            if (syncTimer.current)
                clearTimeout(syncTimer.current);
        };
    }, [settings, syncToServer, syncDebounceMs]);
    // Cross-tab sync: another tab writes localStorage → we pick it up.
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const handler = (e) => {
            if (e.key !== STORAGE_KEY || e.newValue == null)
                return;
            try {
                setSettings(migrate(JSON.parse(e.newValue)));
            }
            catch {
                /* noop */
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);
    const updateSection = useCallback((section, patch) => {
        syncArmed.current = true;
        setSettings((prev) => ({
            ...prev,
            [section]: { ...prev[section], ...patch },
        }));
    }, []);
    const updateSetting = useCallback((section, key, value) => {
        syncArmed.current = true;
        setSettings((prev) => ({
            ...prev,
            [section]: { ...prev[section], [key]: value },
        }));
    }, []);
    const resetSettings = useCallback(() => {
        syncArmed.current = true;
        setSettings({ ...DEFAULT_SETTINGS });
    }, []);
    const hydrateRemote = useCallback((remote) => {
        if (remote == null)
            return;
        // Server is canonical; arm the sync loop so subsequent local changes
        // get persisted. The hydrate itself does not need to round-trip back.
        syncArmed.current = true;
        setSettings((prev) => {
            const incoming = migrate(remote);
            // Don't overwrite locally-changed appearance with stale server data
            // if the user just changed something this session — but for the
            // initial hydrate (when state still matches DEFAULT or stored), the
            // server is canonical. We accept the server value unconditionally
            // because the debounce cycle keeps server in sync.
            void prev;
            return incoming;
        });
    }, []);
    const value = useMemo(() => ({ settings, updateSection, updateSetting, resetSettings, hydrateRemote, syncState }), [settings, updateSection, updateSetting, resetSettings, hydrateRemote, syncState]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useV5Settings() {
    const ctx = useContext(Ctx);
    if (!ctx)
        throw new Error('useV5Settings must be used within <V5SettingsProvider>');
    return ctx;
}
/**
 * Non-throwing variant — returns null when used outside the provider.
 * Use sparingly; this is meant for opt-in widgets (e.g. variant-switching
 * sidebar) that need to render even when no provider exists.
 */
export function useV5SettingsOptional() {
    return useContext(Ctx);
}
/**
 * Convenience: subscribe to a single feature flag. Returns `false` when
 * the provider is unavailable so the caller can be rendered outside the
 * v5 shell without throwing.
 */
export function useV5Feature(key) {
    const ctx = useContext(Ctx);
    if (!ctx)
        return DEFAULT_SETTINGS.features[key];
    return ctx.settings.features[key];
}
