import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
// ── Mocks ──
vi.mock('react-router-dom', () => ({
    Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
    useLocation: () => ({ pathname: '/admin' }),
}));
vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({ designTheme: 'marble' }),
}));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => {
            const map = {
                'admin.title': 'Administration',
                'admin.subtitle': 'Manage your ParkHub instance',
                'admin.overview': 'Overview',
                'admin.settings': 'Settings',
                'admin.users': 'Users',
                'admin.lots': 'Parking Lots',
                'admin.announcements': 'Announcements',
                'admin.reports': 'Reports',
                'admin.translations': 'Translations',
                'admin.rateLimits': 'Rate Limits',
                'admin.maintenance': 'Maintenance',
                'admin.billing': 'Billing',
                'admin.tenants': 'Tenants',
                'admin.modules.title': 'Modules',
            };
            return map[key] || key;
        },
    }),
}));
vi.mock('framer-motion', () => ({
    motion: {
        div: React.forwardRef(({ children, ...props }, ref) => (<div ref={ref} {...props}>{children}</div>)),
    },
}));

import { AdminPage } from './Admin';
describe('AdminPage', () => {
    it('renders Admin heading', () => {
        render(<AdminPage />);
        expect(screen.getByText('Administration')).toBeInTheDocument();
    });
    it('renders the subtitle', () => {
        render(<AdminPage />);
        expect(screen.getByText('Manage your ParkHub instance')).toBeInTheDocument();
    });
    it('renders all tab navigation links', () => {
        render(<AdminPage />);
        const nav = screen.getByRole('navigation', { name: 'Admin navigation' });
        expect(within(nav).getByText('Overview')).toBeInTheDocument();
        expect(within(nav).getByText('Users')).toBeInTheDocument();
        expect(within(nav).getByText('Parking Lots')).toBeInTheDocument();
        expect(within(nav).getByText('Announcements')).toBeInTheDocument();
        expect(within(nav).getByText('Maintenance')).toBeInTheDocument();
        expect(within(nav).getByText('Rate Limits')).toBeInTheDocument();
        expect(within(nav).getByText('Billing')).toBeInTheDocument();
        expect(within(nav).getByText('Reports')).toBeInTheDocument();
        expect(within(nav).getByText('Analytics')).toBeInTheDocument();
    });
    it('renders tab links with correct paths', () => {
        render(<AdminPage />);
        const nav = screen.getByRole('navigation', { name: 'Admin navigation' });
        expect(within(nav).getByText('Overview').closest('a')).toHaveAttribute('href', '/admin');
        expect(within(nav).getByText('Users').closest('a')).toHaveAttribute('href', '/admin/users');
        expect(within(nav).getByText('Parking Lots').closest('a')).toHaveAttribute('href', '/admin/lots');
        expect(within(nav).getByText('Announcements').closest('a')).toHaveAttribute('href', '/admin/announcements');
        expect(within(nav).getByText('Maintenance').closest('a')).toHaveAttribute('href', '/admin/maintenance');
        expect(within(nav).getByText('Rate Limits').closest('a')).toHaveAttribute('href', '/admin/rate-limits');
        expect(within(nav).getByText('Billing').closest('a')).toHaveAttribute('href', '/admin/billing');
        expect(within(nav).getByText('Reports').closest('a')).toHaveAttribute('href', '/admin/reports');
        expect(within(nav).getByText('Analytics').closest('a')).toHaveAttribute('href', '/admin/analytics');
    });
    it('renders the outlet for child routes', () => {
        render(<AdminPage />);
        expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });
});
