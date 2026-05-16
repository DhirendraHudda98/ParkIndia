export const NAV = [
    { id: 'dashboard', icon: 'home', label: 'Dashboard', section: 'main', n: '01' },
    { id: 'bookings', icon: 'list', label: 'Bookings', section: 'main', n: '02' },
    { id: 'book', icon: 'plus', label: 'Book a Spot', section: 'main', n: '03' },
    { id: 'vehicles', icon: 'car', label: 'Vehicles', section: 'main', n: '04' },
    { id: 'calendar', icon: 'cal', label: 'Calendar', section: 'main', n: '05' },
    { id: 'map', icon: 'map', label: 'Map', section: 'main', n: '06' },
    { id: 'credits', icon: 'credit', label: 'Credits', section: 'main', n: '07' },
    { id: 'team', icon: 'users', label: 'Team', section: 'fleet', n: '08' },
    { id: 'leaderboard', icon: 'rank', label: 'Leaderboard', section: 'fleet', n: '09' },
    { id: 'ev', icon: 'bolt', label: 'EV Charging', section: 'fleet', n: '10' },
    { id: 'swap', icon: 'swap', label: 'Swap', section: 'fleet', n: '11' },
    { id: 'checkin', icon: 'check', label: 'Check-in', section: 'fleet', n: '12' },
    { id: 'predictions', icon: 'predict', label: 'Predictions', section: 'fleet', n: '13' },
    { id: 'guestpass', icon: 'guest', label: 'Guest Pass', section: 'fleet', n: '14' },
    { id: 'analytics', icon: 'analytics', label: 'Analytics', section: 'admin', n: '15' },
    { id: 'users', icon: 'users', label: 'Users', section: 'admin', n: '16' },
    { id: 'billing', icon: 'billing', label: 'Billing', section: 'admin', n: '17' },
    { id: 'lobby', icon: 'monitor', label: 'Lobby Display', section: 'admin', n: '18' },
    { id: 'notifications', icon: 'bell', label: 'Notifications', section: 'admin', n: '19' },
    { id: 'settings', icon: 'gear', label: 'Settings', section: 'admin', n: '20' },
    { id: 'lots', icon: 'map', label: 'Lots', section: 'admin', n: '21' },
    { id: 'integrations', icon: 'key', label: 'Integrations', section: 'admin', n: '22' },
    { id: 'apikeys', icon: 'key', label: 'API Keys', section: 'admin', n: '23' },
    { id: 'audit', icon: 'shield', label: 'Audit Log', section: 'admin', n: '24' },
    { id: 'policies', icon: 'shield', label: 'Policies', section: 'admin', n: '25' },
    { id: 'profile', icon: 'users', label: 'My Profile', section: 'main', n: '26' },
];
export const SECTION_HEADINGS = {
    main: 'Essentials',
    fleet: 'Fleet',
    admin: 'Admin',
};
export const byId = new Map(NAV.map((n) => [n.id, n]));
export function breadcrumbFor(id) {
    const n = byId.get(id);
    if (!n)
        return '';
    return `${SECTION_HEADINGS[n.section]} / ${n.label}`;
}
