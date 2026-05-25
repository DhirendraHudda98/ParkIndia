import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
// ── Mocks ──
const mockAdminStats = vi.fn();
const mockGetBookings = vi.fn();
const mockGetLots = vi.fn();
vi.mock('../api/client', () => ({
    api: {
        adminStats: (...args) => mockAdminStats(...args),
        getBookings: (...args) => mockGetBookings(...args),
        getLots: (...args) => mockGetLots(...args),
    },
}));
vi.mock('framer-motion', () => ({
    motion: {
        div: React.forwardRef(({ children, initial, animate, exit, transition, ...props }, ref) => (<div ref={ref} {...props}>{children}</div>)),
    },
}));

vi.mock('../components/SimpleChart', () => ({
    BarChart: ({ data }) => <div data-testid="bar-chart">{data?.length} bars</div>,
    DonutChart: ({ slices }) => <div data-testid="donut-chart">{slices?.length} slices</div>,
}));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => {
            const map = {
                'common.loading': 'Loading',
                'admin.reports': 'Reports',
                'admin.totalUsers': 'Total Users',
                'admin.totalLots': 'Total Lots',
                'admin.totalBookings': 'Total Bookings',
                'admin.activeBookings': 'Active Bookings',
                'admin.overview': 'Overview',
                'admin.utilizationRate': 'Utilization Rate',
                'admin.avgBookingsPerUser': 'Avg. Bookings per User',
                'admin.activeBookingRate': 'Active Booking Rate',
                'admin.bookingsThisWeek': 'Bookings This Week',
                'admin.lotOccupancy': 'Lot Occupancy',
                'heatmap.title': 'Occupancy Heatmap',
                'heatmap.subtitle': 'Average hourly occupancy by day of week (last 30 days)',
                'reports.weekdays.mon': 'Mon',
                'reports.weekdays.tue': 'Tue',
                'reports.weekdays.wed': 'Wed',
                'reports.weekdays.thu': 'Thu',
                'reports.weekdays.fri': 'Fri',
                'reports.weekdays.sat': 'Sat',
                'reports.weekdays.sun': 'Sun',
            };
            return map[key] || key;
        },
    }),
}));
vi.mock('../components/ExportButton', () => ({
    ExportButton: () => <button data-testid="export-button">Export</button>,
}));
vi.mock('../components/OccupancyHeatmap', () => ({
    OccupancyHeatmap: ({ bookings, totalSlots }) => (<div data-testid="occupancy-heatmap">heatmap: {bookings?.length ?? 0} bookings, {totalSlots} slots</div>),
}));
import { AdminReportsPage } from './AdminReports';
describe('AdminReportsPage', () => {
    beforeEach(() => {
        mockAdminStats.mockClear();
        mockGetBookings.mockClear();
        mockGetLots.mockClear();
        mockGetBookings.mockResolvedValue({ success: true, data: [] });
        mockGetLots.mockResolvedValue({ success: true, data: [] });
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('shows loading spinner initially', () => {
        mockAdminStats.mockReturnValue(new Promise(() => { }));
        mockGetBookings.mockReturnValue(new Promise(() => { }));
        render(<AdminReportsPage />);
        expect(screen.getByTestId('icon-spinner')).toBeInTheDocument();
    });
    it('renders Reports heading after loading', async () => {
        mockAdminStats.mockResolvedValue({
            success: true,
            data: { total_users: 50, total_lots: 3, total_bookings: 200, active_bookings: 15 },
        });
        render(<AdminReportsPage />);
        await waitFor(() => {
            expect(screen.getByText('Reports')).toBeInTheDocument();
        });
    });
    it('renders stat cards with correct values', async () => {
        mockAdminStats.mockResolvedValue({
            success: true,
            data: { total_users: 50, total_lots: 3, total_bookings: 200, active_bookings: 15 },
        });
        render(<AdminReportsPage />);
        await waitFor(() => {
            expect(screen.getByText('Total Users')).toBeInTheDocument();
        });
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('Total Lots')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Total Bookings')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('Active Bookings')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
    });
    it('renders overview summary section', async () => {
        mockAdminStats.mockResolvedValue({
            success: true,
            data: { total_users: 50, total_lots: 3, total_bookings: 200, active_bookings: 15 },
        });
        render(<AdminReportsPage />);
        await waitFor(() => {
            expect(screen.getByText('Overview')).toBeInTheDocument();
        });
        expect(screen.getByText('Utilization Rate')).toBeInTheDocument();
        expect(screen.getByText('Avg. Bookings per User')).toBeInTheDocument();
        expect(screen.getByText('Active Booking Rate')).toBeInTheDocument();
    });
    it('renders bar chart component', async () => {
        mockAdminStats.mockResolvedValue({
            success: true,
            data: { total_users: 10, total_lots: 2, total_bookings: 50, active_bookings: 5 },
        });
        render(<AdminReportsPage />);
        await waitFor(() => {
            expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        });
    });
    it('renders donut chart when lots exist', async () => {
        mockAdminStats.mockResolvedValue({
            success: true,
            data: { total_users: 10, total_lots: 3, total_bookings: 50, active_bookings: 5 },
        });
        mockGetLots.mockResolvedValue({
            success: true,
            data: [
                { id: 'l1', name: 'Lot A', total_slots: 20, available_slots: 10, status: 'open' },
                { id: 'l2', name: 'Lot B', total_slots: 30, available_slots: 5, status: 'open' },
                { id: 'l3', name: 'Lot C', total_slots: 15, available_slots: 15, status: 'open' },
            ],
        });
        render(<AdminReportsPage />);
        await waitFor(() => {
            expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
        });
    });
    it('renders occupancy heatmap section', async () => {
        mockAdminStats.mockResolvedValue({
            success: true,
            data: { total_users: 10, total_lots: 2, total_bookings: 50, active_bookings: 5 },
        });
        render(<AdminReportsPage />);
        await waitFor(() => {
            expect(screen.getByTestId('occupancy-heatmap')).toBeInTheDocument();
        });
        expect(screen.getByText('Occupancy Heatmap')).toBeInTheDocument();
    });
    it('calculates correct utilization rate', async () => {
        mockAdminStats.mockResolvedValue({
            success: true,
            data: { total_users: 10, total_lots: 5, total_bookings: 100, active_bookings: 3 },
        });
        render(<AdminReportsPage />);
        await waitFor(() => {
            // 3 / 5 = 60%
            expect(screen.getByText('60%')).toBeInTheDocument();
        });
    });
});
