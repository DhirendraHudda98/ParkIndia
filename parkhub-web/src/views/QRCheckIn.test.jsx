import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
// ── matchMedia mock ──
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
// ── Mocks ──
const mockGetBookings = vi.fn();
const mockUseTheme = vi.fn();
vi.mock('../api/client', () => ({
    api: {
        getBookings: (...args) => mockGetBookings(...args),
    },
    getInMemoryToken: () => 'test-token',
}));
vi.mock('../context/ThemeContext', () => ({
    useTheme: () => mockUseTheme(),
}));
vi.mock('react-router-dom', () => ({
    Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, opts) => {
            const map = {
                'checkin.title': 'Check In',
                'checkin.subtitle': 'Scan your QR code or check in manually',
                'checkin.noBooking': 'No active booking',
                'checkin.noBookingHint': 'Book a parking spot first',
                'checkin.bookNow': 'Book Now',
                'checkin.checkInBtn': 'Check In',
                'checkin.checkOutBtn': 'Check Out',
                'checkin.checkedIn': 'Checked in successfully',
                'checkin.checkedOut': 'Checked out successfully',
                'checkin.elapsed': 'Elapsed Time',
                'checkin.since': `Since ${opts?.time || ''}`,
                'checkin.date': 'Date',
                'checkin.startTime': 'Start',
                'checkin.endTime': 'End',
                'checkin.qrAlt': 'QR Code for check-in',
                'checkin.scanQr': 'Show this QR code at the entrance',
                'dashboard.slot': 'Slot',
                'common.error': 'Error',
            };
            return map[key] || key;
        },
        i18n: { language: 'en' },
    }),
}));
vi.mock('framer-motion', () => ({
    motion: {
        div: React.forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, variants, ...props }, ref) => (<div ref={ref} {...props}>{children}</div>)),
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('@phosphor-icons/react', () => ({
    QrCode: (props) => <span data-testid="icon-qrcode" {...props}/>,
    SignIn: (props) => <span data-testid="icon-signin" {...props}/>,
    SignOut: (props) => <span data-testid="icon-signout" {...props}/>,
    SpinnerGap: (props) => <span data-testid="icon-spinner" {...props}/>,
    Clock: (props) => <span data-testid="icon-clock" {...props}/>,
    MapPin: (props) => <span data-testid="icon-mappin" {...props}/>,
    CalendarBlank: (props) => <span data-testid="icon-calendar" {...props}/>,
    ArrowClockwise: (props) => <span data-testid="icon-refresh" {...props}/>,
}));
vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));
import { QRCheckInPage } from './QRCheckIn';
function makeActiveBooking(overrides = {}) {
    const now = Date.now();
    return {
        id: 'b1',
        user_id: 'u1',
        lot_id: 'l1',
        slot_id: 's1',
        lot_name: 'Garage Central',
        slot_number: 'C5',
        start_time: new Date(now - 3600000).toISOString(),
        end_time: new Date(now + 3600000).toISOString(),
        status: 'active',
        ...overrides,
    };
}
// Helper to create a blob response for QR
function mockQrBlob() {
    return new Blob(['fake-png'], { type: 'image/png' });
}
describe('QRCheckInPage', () => {
    beforeEach(() => {
        mockGetBookings.mockClear();
        mockUseTheme.mockReset();
        mockUseTheme.mockReturnValue({ designTheme: 'marble' });
        // Mock URL.createObjectURL / revokeObjectURL
        global.URL.createObjectURL = vi.fn(() => 'blob:mock-qr-url');
        global.URL.revokeObjectURL = vi.fn();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('renders title', async () => {
        mockGetBookings.mockResolvedValue({ success: true, data: [] });
        render(<QRCheckInPage />);
        await waitFor(() => {
            expect(screen.getAllByText('Check In').length).toBeGreaterThan(0);
            expect(screen.getByTestId('checkin-shell')).toHaveAttribute('data-surface', 'marble');
        });
    });
    it('switches to the void surface when the void theme is active', async () => {
        mockUseTheme.mockReturnValue({ designTheme: 'void' });
        mockGetBookings.mockResolvedValue({ success: true, data: [] });
        render(<QRCheckInPage />);
        await waitFor(() => {
            expect(screen.getByTestId('checkin-shell')).toHaveAttribute('data-surface', 'void');
        });
    });
    it('shows no-booking state when no active bookings', async () => {
        mockGetBookings.mockResolvedValue({ success: true, data: [] });
        render(<QRCheckInPage />);
        await waitFor(() => {
            expect(screen.getAllByText('No active booking').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Book a parking spot first').length).toBeGreaterThan(0);
        });
        expect(screen.getAllByText('Book Now').find((node) => node.closest('a'))?.closest('a')).toHaveAttribute('href', '/book');
    });
    it('shows booking details with lot name and slot', async () => {
        const booking = makeActiveBooking();
        mockGetBookings.mockResolvedValue({ success: true, data: [booking] });
        global.fetch = vi.fn((url) => {
            if (typeof url === 'string' && url.includes('/check-in') && !url.includes('POST')) {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        success: true,
                        data: { checked_in: false, checked_in_at: null, checked_out_at: null },
                    }),
                });
            }
            if (typeof url === 'string' && url.includes('/qr')) {
                return Promise.resolve({
                    ok: true,
                    blob: () => Promise.resolve(mockQrBlob()),
                });
            }
            return Promise.resolve({
                json: () => Promise.resolve({ success: true, data: {} }),
            });
        });
        render(<QRCheckInPage />);
        await waitFor(() => {
            expect(screen.getAllByText('Garage Central').length).toBeGreaterThan(0);
            expect(screen.getAllByText('C5').length).toBeGreaterThan(0);
        });
    });
    it('shows QR code and check-in button when not checked in', async () => {
        const booking = makeActiveBooking();
        mockGetBookings.mockResolvedValue({ success: true, data: [booking] });
        global.fetch = vi.fn((url) => {
            if (typeof url === 'string' && url.includes('/check-in')) {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        success: true,
                        data: { checked_in: false, checked_in_at: null, checked_out_at: null },
                    }),
                });
            }
            if (typeof url === 'string' && url.includes('/qr')) {
                return Promise.resolve({
                    ok: true,
                    blob: () => Promise.resolve(mockQrBlob()),
                });
            }
            return Promise.resolve({
                json: () => Promise.resolve({ success: true, data: {} }),
            });
        });
        render(<QRCheckInPage />);
        await waitFor(() => {
            expect(screen.getByTestId('qr-code')).toBeInTheDocument();
            expect(screen.getByTestId('checkin-btn')).toBeInTheDocument();
        });
    });
    it('shows elapsed timer and check-out button when checked in', async () => {
        const booking = makeActiveBooking();
        mockGetBookings.mockResolvedValue({ success: true, data: [booking] });
        const checkedInAt = new Date(Date.now() - 1800000).toISOString(); // 30 min ago
        global.fetch = vi.fn((url) => {
            if (typeof url === 'string' && url.includes('/check-in')) {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        success: true,
                        data: { checked_in: true, checked_in_at: checkedInAt, checked_out_at: null },
                    }),
                });
            }
            if (typeof url === 'string' && url.includes('/qr')) {
                return Promise.resolve({
                    ok: true,
                    blob: () => Promise.resolve(mockQrBlob()),
                });
            }
            return Promise.resolve({
                json: () => Promise.resolve({ success: true, data: {} }),
            });
        });
        render(<QRCheckInPage />);
        await waitFor(() => {
            expect(screen.getAllByText('Elapsed Time').length).toBeGreaterThan(0);
            expect(screen.getByTestId('elapsed-timer')).toBeInTheDocument();
            expect(screen.getByTestId('checkout-btn')).toBeInTheDocument();
        });
    });
    it('calls check-in endpoint when check-in button is clicked', async () => {
        const booking = makeActiveBooking();
        mockGetBookings.mockResolvedValue({ success: true, data: [booking] });
        const fetchMock = vi.fn((url, opts) => {
            if (typeof url === 'string' && url.includes('/check-in') && opts?.method === 'POST') {
                return Promise.resolve({
                    json: () => Promise.resolve({ success: true, data: {} }),
                });
            }
            if (typeof url === 'string' && url.includes('/check-in')) {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        success: true,
                        data: { checked_in: false, checked_in_at: null, checked_out_at: null },
                    }),
                });
            }
            if (typeof url === 'string' && url.includes('/qr')) {
                return Promise.resolve({
                    ok: true,
                    blob: () => Promise.resolve(mockQrBlob()),
                });
            }
            return Promise.resolve({
                json: () => Promise.resolve({ success: true, data: {} }),
            });
        });
        global.fetch = fetchMock;
        render(<QRCheckInPage />);
        await waitFor(() => {
            expect(screen.getByTestId('checkin-btn')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId('checkin-btn'));
        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(`/api/v1/bookings/${booking.id}/check-in`, expect.objectContaining({ method: 'POST' }));
        });
    });
    it('calls check-out endpoint when check-out button is clicked', async () => {
        const booking = makeActiveBooking();
        mockGetBookings.mockResolvedValue({ success: true, data: [booking] });
        const checkedInAt = new Date(Date.now() - 600000).toISOString();
        const fetchMock = vi.fn((url, opts) => {
            if (typeof url === 'string' && url.includes('/check-out') && opts?.method === 'POST') {
                return Promise.resolve({
                    json: () => Promise.resolve({ success: true, data: {} }),
                });
            }
            if (typeof url === 'string' && url.includes('/check-in')) {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        success: true,
                        data: { checked_in: true, checked_in_at: checkedInAt, checked_out_at: null },
                    }),
                });
            }
            if (typeof url === 'string' && url.includes('/qr')) {
                return Promise.resolve({
                    ok: true,
                    blob: () => Promise.resolve(mockQrBlob()),
                });
            }
            return Promise.resolve({
                json: () => Promise.resolve({ success: true, data: {} }),
            });
        });
        global.fetch = fetchMock;
        render(<QRCheckInPage />);
        await waitFor(() => {
            expect(screen.getByTestId('checkout-btn')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId('checkout-btn'));
        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(`/api/v1/bookings/${booking.id}/check-out`, expect.objectContaining({ method: 'POST' }));
        });
    });
    it('ignores past and future bookings, shows no-booking state', async () => {
        const now = Date.now();
        const futureBooking = {
            id: 'b2',
            user_id: 'u1',
            lot_id: 'l1',
            slot_id: 's1',
            lot_name: 'Future Lot',
            slot_number: 'F1',
            start_time: new Date(now + 7200000).toISOString(),
            end_time: new Date(now + 10800000).toISOString(),
            status: 'confirmed',
        };
        mockGetBookings.mockResolvedValue({ success: true, data: [futureBooking] });
        render(<QRCheckInPage />);
        await waitFor(() => {
            expect(screen.getAllByText('No active booking').length).toBeGreaterThan(0);
        });
    });
    it('falls back to empty check-in status when status API returns not-success', async () => {
        const booking = makeActiveBooking();
        mockGetBookings.mockResolvedValue({ success: true, data: [booking] });
        global.fetch = vi.fn((url) => {
            if (typeof url === 'string' && url.includes('check-in')) {
                return Promise.resolve({ json: () => Promise.resolve({ success: false }) });
            }
            return Promise.resolve({ ok: false });
        });
        render(<QRCheckInPage />);
        await waitFor(() => expect(screen.getAllByText(booking.lot_name).length).toBeGreaterThan(0));
    });
    it('getBookings rejection is handled gracefully', async () => {
        mockGetBookings.mockRejectedValue(new Error('server down'));
        render(<QRCheckInPage />);
        await waitFor(() => {
            expect(screen.getAllByText('No active booking').length).toBeGreaterThan(0);
        });
    });
});
