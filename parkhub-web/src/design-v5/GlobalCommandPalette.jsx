import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { V5CommandPalette } from './CommandPalette';
import './fonts';
import './tokens.css';
/**
 * Legacy-route map — v5 nav ids → existing v4 paths. Used when the palette
 * is mounted inside the main app (not /v5), where navigation is real routing,
 * not in-memory screen switching.
 */
const LEGACY_ROUTE = {
    dashboard: '/',
    bookings: '/bookings',
    book: '/book',
    vehicles: '/vehicles',
    calendar: '/calendar',
    map: '/map',
    credits: '/credits',
    team: '/team',
    leaderboard: '/leaderboard',
    ev: '/ev-charging',
    swap: '/swap',
    checkin: '/checkin',
    predictions: '/predictions',
    guestpass: '/guest-pass',
    analytics: '/admin/analytics',
    users: '/admin/users',
    billing: '/admin/billing',
    lobby: '/lobby',
    notifications: '/notifications',
    settings: '/settings',
    lots: '/admin/lots',
    integrations: '/admin/integrations',
    apikeys: '/admin/api-keys',
    audit: '/admin/audit',
    policies: '/admin/policies',
    profile: '/profile',
};
/**
 * Mounts the v5 palette at the main app root so ⌘K works on every page.
 * The palette reads v5 tokens via tokens.css, so its look is consistent
 * whether the user is on /v5 or /anywhere-else. Mode isn't read here —
 * the palette just reads --v5-* which cascade from the app's theme shim
 * (see main-app-v5-bridge.ts).
 */
export function GlobalCommandPalette() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const h = (e) => {
            const mod = e.metaKey || e.ctrlKey;
            if (mod && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);
    const handleNavigate = useCallback((id) => {
        const path = LEGACY_ROUTE[id];
        if (path)
            navigate(path);
        setOpen(false);
    }, [navigate]);
    return <V5CommandPalette open={open} onClose={() => setOpen(false)} onNavigate={handleNavigate}/>;
}
