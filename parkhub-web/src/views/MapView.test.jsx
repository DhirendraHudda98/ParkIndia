import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
// ── Mocks ──
const mockGetParkingLots = vi.fn();
vi.mock('../api/client', () => ({
    api: {
        getParkingLots: (...args) => mockGetParkingLots(...args),
        getMapMarkers: (...args) => mockGetParkingLots(...args),
    },
}));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => {
            const map = {
                'map.title': 'Parking Map',
                'map.subtitle': 'Find available parking lots near you',
                'map.bookNow': 'Book Now',
                'map.available': 'Available',
                'map.noLots': 'No parking locations available',
                'map.closed': 'Closed',
            };
            return map[key] || key;
        },
    }),
}));
vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({
        designTheme: 'marble',
    }),
}));
vi.mock('framer-motion', () => ({
    motion: {
        div: React.forwardRef(({ children, variants, initial, animate, exit, transition, ...props }, ref) => (<div ref={ref} {...props}>{children}</div>)),
    },
}));
vi.mock('@phosphor-icons/react', () => {
    const mockIcon = (name) => {
        const component = (props) => <span data-testid={`icon-${name}`} {...props}/>;
        component.displayName = name;
        return component;
    };
    return {
        MapPin: mockIcon('map-pin'),
        Lightning: mockIcon('lightning'),
        Wheelchair: mockIcon('wheelchair'),
        ArrowsClockwise: mockIcon('arrows-clockwise'),
        CaretDown: mockIcon('caret-down'),
        NavigationArrow: mockIcon('nav-arrow'),
        MagnifyingGlass: mockIcon('magnifying-glass'),
        X: mockIcon('x'),
    };
});
vi.mock('../constants/animations', () => ({
    staggerSlow: { hidden: {}, show: {} },
    fadeUp: { hidden: {}, show: {} },
}));
// Mock react-leaflet to avoid DOM issues in test environment
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children, ...props }) => (<div data-testid="leaflet-map" {...props}>{children}</div>),
    TileLayer: () => <div data-testid="tile-layer"/>,
    Marker: ({ children }) => <div data-testid="map-marker">{children}</div>,
    Popup: ({ children }) => <div data-testid="map-popup">{children}</div>,
    useMap: () => ({
        fitBounds: vi.fn(),
    }),
}));
vi.mock('leaflet', () => ({
    default: {
        Icon: {
            Default: {
                prototype: {},
                mergeOptions: vi.fn(),
            },
        },
        divIcon: vi.fn(() => ({})),
        latLngBounds: vi.fn(() => ({})),
    },
    divIcon: vi.fn(() => ({})),
    latLngBounds: vi.fn(() => ({})),
    Icon: {
        Default: {
            prototype: {},
            mergeOptions: vi.fn(),
        },
    },
}));
import { MapViewPage } from './MapView';
describe('MapViewPage', () => {
    beforeEach(() => {
        mockGetParkingLots.mockClear();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('shows loading skeleton initially', () => {
        mockGetParkingLots.mockReturnValue(new Promise(() => { }));
        render(<MapViewPage />);
        const skeletons = document.querySelectorAll('.skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
    });
    it('shows empty state when no lots have locations', async () => {
        mockGetParkingLots.mockResolvedValue({
            success: true,
            data: [],
        });
        render(<MapViewPage />);
        await waitFor(() => {
            expect(screen.getByText('No parking locations available')).toBeInTheDocument();
        });
    });
    it('renders map with markers when lots have coordinates', async () => {
        mockGetParkingLots.mockResolvedValue({
            success: true,
            data: [
                {
                    id: 'lot-1',
                    name: 'Central Parking',
                    address: '123 Main St',
                    latitude: 48.1351,
                    longitude: 11.582,
                    available_slots: 42,
                    total_slots: 100,
                    status: 'open',
                    color: 'green',
                },
                {
                    id: 'lot-2',
                    name: 'Airport Parking',
                    address: '456 Airport Rd',
                    latitude: 48.354,
                    longitude: 11.786,
                    available_slots: 5,
                    total_slots: 200,
                    status: 'open',
                    color: 'red',
                },
            ],
        });
        render(<MapViewPage />);
        await waitFor(() => {
            expect(screen.getByText('Find Parking Near You')).toBeInTheDocument();
        });
        expect(screen.getByTestId('leaflet-map')).toBeInTheDocument();
        expect(screen.getAllByText('Central Parking').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Airport Parking').length).toBeGreaterThan(0);
    });
    it('renders page title and subtitle', async () => {
        mockGetParkingLots.mockResolvedValue({
            success: true,
            data: [
                {
                    id: 'lot-1',
                    name: 'Test Lot',
                    address: 'Test Address',
                    latitude: 48.0,
                    longitude: 11.0,
                    available_slots: 10,
                    total_slots: 20,
                    status: 'open',
                    color: 'green',
                },
            ],
        });
        render(<MapViewPage />);
        await waitFor(() => {
            expect(screen.getByText('Find Parking Near You')).toBeInTheDocument();
        });
        expect(screen.getByText(/Real-time parking availability across India/i)).toBeInTheDocument();
    });
    it('shows sidebar lot list with details', async () => {
        mockGetParkingLots.mockResolvedValue({
            success: true,
            data: [
                {
                    id: 'lot-1',
                    name: 'Central Parking',
                    address: '123 Main St',
                    latitude: 48.1351,
                    longitude: 11.582,
                    available_slots: 42,
                    total_slots: 100,
                    status: 'open',
                    color: 'green',
                },
            ],
        });
        render(<MapViewPage />);
        await waitFor(() => {
            expect(screen.getAllByText('Central Parking').length).toBeGreaterThan(0);
        });
    });
    it('handles API failure gracefully', async () => {
        mockGetParkingLots.mockResolvedValue({
            success: false,
            data: null,
        });
        render(<MapViewPage />);
        await waitFor(() => {
            expect(screen.getByText('No parking locations available')).toBeInTheDocument();
        });
    });
});
