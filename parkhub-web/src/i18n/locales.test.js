import { describe, it, expect } from 'vitest';
import en from './locales/en';
const ALL_LOCALES = {
    en,
};
const REQUIRED_SECTIONS = [
    'nav',
    'auth',
    'bookings',
    'guestBooking',
    'swap',
    'dashboard',
    'credits',
    'vehicles',
    'absences',
    'admin',
    'common',
    'welcome',
    'notifications',
    'profile',
    'features',
    'useCase',
    'translations',
    'app',
];
const REQUIRED_HEATMAP_SCALAR_KEYS = [
    'title',
    'subtitle',
    'allLots',
    'peakHour',
    'avgOccupancy',
    'busiestDay',
    'loadError',
    'avgBookings',
    'empty',
    'low',
    'medium',
    'high',
    'full',
];
function getTopLevelKeys(locale) {
    return Object.keys(locale.translation);
}
// Recursively collect all leaf string values
function collectValues(obj, path = '') {
    const results = [];
    if (typeof obj === 'string') {
        results.push({ path, value: obj });
    }
    else if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        for (const [key, val] of Object.entries(obj)) {
            results.push(...collectValues(val, path ? `${path}.${key}` : key));
        }
    }
    return results;
}
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        if (typeof current !== 'object' || current === null || Array.isArray(current)) {
            return undefined;
        }
        return current[key];
    }, obj);
}
describe('i18n locales', () => {
    const enKeys = getTopLevelKeys(en);
    it('all 10 locale files are importable', () => {
        expect(Object.keys(ALL_LOCALES)).toHaveLength(10);
        for (const [code, locale] of Object.entries(ALL_LOCALES)) {
            expect(locale.translation, `${code} should have translation key`).toBeDefined();
        }
    });
    describe.each(Object.entries(ALL_LOCALES))('%s locale', (code, locale) => {
        it('has the same top-level keys as en.ts', () => {
            const localeKeys = getTopLevelKeys(locale);
            const missing = enKeys.filter(k => !localeKeys.includes(k));
            const extra = localeKeys.filter(k => !enKeys.includes(k));
            expect(missing, `${code} is missing keys: ${missing.join(', ')}`).toEqual([]);
            expect(extra, `${code} has extra keys: ${extra.join(', ')}`).toEqual([]);
        });
        it('has no empty string values', () => {
            const values = collectValues(locale.translation);
            const empties = values.filter(v => v.value === '');
            expect(empties.map(e => e.path), `${code} has empty strings at: ${empties.map(e => e.path).join(', ')}`).toEqual([]);
        });
        it('contains all required sections', () => {
            const topKeys = getTopLevelKeys(locale);
            for (const section of REQUIRED_SECTIONS) {
                expect(topKeys, `${code} missing required section: ${section}`).toContain(section);
            }
        });
        it('translation key is an object with content', () => {
            expect(typeof locale.translation).toBe('object');
            expect(Object.keys(locale.translation).length).toBeGreaterThan(0);
        });
        it('has scalar strings for OccupancyHeatmap translation keys', () => {
            for (const key of REQUIRED_HEATMAP_SCALAR_KEYS) {
                const path = `heatmap.${key}`;
                const value = getNestedValue(locale.translation, path);
                expect(value, `${code}.${path} should exist`).toBeDefined();
                expect(typeof value, `${code}.${path} should be a scalar string`).toBe('string');
                expect(value, `${code}.${path} should not be empty`).not.toBe('');
            }
        });
    });
    it('en locale has the most content (reference locale)', () => {
        const enValues = collectValues(en.translation);
        expect(enValues.length).toBeGreaterThan(100);
    });
});
