/**
 * v5 user-settings — typed schema, defaults, and version migration.
 *
 * The shape is the single source of truth for both client persistence
 * (`localStorage['ph-v5-settings']`) and the backend `/api/v1/me/settings`
 * round-trip. Versioned so future shape changes don't trip clients still
 * holding on to older payloads — `migrate()` upgrades any older record to
 * the current schema before we use it.
 *
 * Persistence rules:
 *   - immediate localStorage write on every change (no save button)
 *   - debounced sync to backend (caller orchestrates — see SettingsProvider)
 *   - graceful degrade when storage / backend is unavailable
 *
 * Adding a new field?
 *   1. Bump `SETTINGS_VERSION`
 *   2. Add to `UserSettings` + a default in `DEFAULT_SETTINGS`
 *   3. Extend `migrate()` with the v(N-1) → v(N) hop
 */
export const SETTINGS_VERSION = 1;
export const DEFAULT_SETTINGS = {
    version: SETTINGS_VERSION,
    appearance: {
        mode: 'marble_light',
        sidebar: 'marble',
        density: 'comfortable',
        font: 'inter',
        reducedMotion: false,
        highContrast: false,
        fontScale: 1.0,
    },
    features: {
        smartSuggestions: true,
        optimisticUI: true,
        viewTransitions: true,
        voiceCommands: false,
        qrCheckin: true,
        deepLinking: true,
        predictiveCard: true,
        swAutoUpdate: true,
        plateScan: false,
        semanticSearch: false,
        fleetSSE: true,
    },
    notifications: {
        pushEnabled: false,
        emailEnabled: true,
        soundEnabled: true,
    },
    privacy: {
        analyticsOptIn: false,
        crashReportsOptIn: false,
    },
};
export const STORAGE_KEY = 'ph-v5-settings';
const FONT_SCALES = [0.875, 1.0, 1.125, 1.25];
const APPEARANCE_MODES = ['marble_light', 'marble_dark', 'void'];
const SIDEBAR_VARIANTS = ['marble', 'columns', 'minimal'];
const DENSITIES = ['compact', 'comfortable', 'spacious'];
const FONT_VARIANTS = ['inter', 'dmmono', 'system', 'plex', 'atkinson'];
function isPlainObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function pickEnum(value, allowed, fallback) {
    return typeof value === 'string' && allowed.includes(value)
        ? value
        : fallback;
}
function pickBool(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
function pickFontScale(value) {
    if (typeof value === 'number' && FONT_SCALES.includes(value)) {
        return value;
    }
    return 1.0;
}
/**
 * Coerce any unknown value into a fully-shaped `UserSettings`.
 *
 * Treats the input as untrusted (e.g. cross-origin localStorage, stale
 * server payload, hand-edited JSON). Unknown fields are dropped, missing
 * fields fall back to defaults, type-mismatches fall back to defaults —
 * we never throw.
 */
export function migrate(input) {
    if (!isPlainObject(input))
        return { ...DEFAULT_SETTINGS };
    const appearanceRaw = isPlainObject(input.appearance) ? input.appearance : {};
    const featuresRaw = isPlainObject(input.features) ? input.features : {};
    const notificationsRaw = isPlainObject(input.notifications) ? input.notifications : {};
    const privacyRaw = isPlainObject(input.privacy) ? input.privacy : {};
    return {
        version: SETTINGS_VERSION,
        appearance: {
            mode: pickEnum(appearanceRaw.mode, APPEARANCE_MODES, DEFAULT_SETTINGS.appearance.mode),
            sidebar: pickEnum(appearanceRaw.sidebar, SIDEBAR_VARIANTS, DEFAULT_SETTINGS.appearance.sidebar),
            density: pickEnum(appearanceRaw.density, DENSITIES, DEFAULT_SETTINGS.appearance.density),
            font: pickEnum(appearanceRaw.font, FONT_VARIANTS, DEFAULT_SETTINGS.appearance.font),
            reducedMotion: pickBool(appearanceRaw.reducedMotion, DEFAULT_SETTINGS.appearance.reducedMotion),
            highContrast: pickBool(appearanceRaw.highContrast, DEFAULT_SETTINGS.appearance.highContrast),
            fontScale: pickFontScale(appearanceRaw.fontScale),
        },
        features: {
            smartSuggestions: pickBool(featuresRaw.smartSuggestions, DEFAULT_SETTINGS.features.smartSuggestions),
            optimisticUI: pickBool(featuresRaw.optimisticUI, DEFAULT_SETTINGS.features.optimisticUI),
            viewTransitions: pickBool(featuresRaw.viewTransitions, DEFAULT_SETTINGS.features.viewTransitions),
            voiceCommands: pickBool(featuresRaw.voiceCommands, DEFAULT_SETTINGS.features.voiceCommands),
            qrCheckin: pickBool(featuresRaw.qrCheckin, DEFAULT_SETTINGS.features.qrCheckin),
            deepLinking: pickBool(featuresRaw.deepLinking, DEFAULT_SETTINGS.features.deepLinking),
            predictiveCard: pickBool(featuresRaw.predictiveCard, DEFAULT_SETTINGS.features.predictiveCard),
            swAutoUpdate: pickBool(featuresRaw.swAutoUpdate, DEFAULT_SETTINGS.features.swAutoUpdate),
            plateScan: pickBool(featuresRaw.plateScan, DEFAULT_SETTINGS.features.plateScan),
            semanticSearch: pickBool(featuresRaw.semanticSearch, DEFAULT_SETTINGS.features.semanticSearch),
            fleetSSE: pickBool(featuresRaw.fleetSSE, DEFAULT_SETTINGS.features.fleetSSE),
        },
        notifications: {
            pushEnabled: pickBool(notificationsRaw.pushEnabled, DEFAULT_SETTINGS.notifications.pushEnabled),
            emailEnabled: pickBool(notificationsRaw.emailEnabled, DEFAULT_SETTINGS.notifications.emailEnabled),
            soundEnabled: pickBool(notificationsRaw.soundEnabled, DEFAULT_SETTINGS.notifications.soundEnabled),
        },
        privacy: {
            analyticsOptIn: pickBool(privacyRaw.analyticsOptIn, DEFAULT_SETTINGS.privacy.analyticsOptIn),
            crashReportsOptIn: pickBool(privacyRaw.crashReportsOptIn, DEFAULT_SETTINGS.privacy.crashReportsOptIn),
        },
    };
}
/** Read settings from localStorage, falling back to defaults on any error. */
export function readStoredSettings() {
    if (typeof window === 'undefined')
        return { ...DEFAULT_SETTINGS };
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return { ...DEFAULT_SETTINGS };
        return migrate(JSON.parse(raw));
    }
    catch {
        return { ...DEFAULT_SETTINGS };
    }
}
/** Write settings to localStorage, swallowing quota / serialization errors. */
export function writeStoredSettings(settings) {
    if (typeof window === 'undefined')
        return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
    catch {
        /* noop — quota / private mode */
    }
}
export const V5_FONT_SCALES = FONT_SCALES;
export const V5_APPEARANCE_MODES = APPEARANCE_MODES;
export const V5_SIDEBAR_VARIANTS = SIDEBAR_VARIANTS;
export const V5_DENSITIES = DENSITIES;
export const V5_FONT_VARIANTS = FONT_VARIANTS;
