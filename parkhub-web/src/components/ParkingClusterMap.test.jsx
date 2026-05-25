import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// 1. Mock Leaflet and React Leaflet FIRST
vi.mock('leaflet', () => {
  const mockIcon = vi.fn(() => ({}));
  return {
    __esModule: true,
    default: {
      icon: mockIcon,
      divIcon: mockIcon,
    },
    icon: mockIcon,
    divIcon: mockIcon,
  };
});

vi.mock('react-leaflet', () => {
  const DummyMapContainer = ({ children }) => <div data-testid="leaflet-map">{children}</div>;
  const DummyTileLayer = () => <div data-testid="tile-layer" />;
  const DummyMarker = ({ children }) => <div data-testid="map-marker">{children}</div>;
  const DummyPopup = ({ children }) => <div data-testid="map-popup">{children}</div>;
  const dummyUseMap = () => ({
    setView: vi.fn(),
    fitBounds: vi.fn(),
  });
  return {
    __esModule: true,
    MapContainer: DummyMapContainer,
    TileLayer: DummyTileLayer,
    Marker: DummyMarker,
    Popup: DummyPopup,
    useMap: dummyUseMap,
  };
});

vi.mock('react-leaflet-cluster', () => {
  const DummyClusterGroup = ({ children }) => <div data-testid="marker-cluster-group">{children}</div>;
  return {
    __esModule: true,
    default: DummyClusterGroup,
  };
});

// Mock Phosphor Icons to keep tests clean and fast
vi.mock('@phosphor-icons/react', () => {
  const DummyIcon = (props) => <span data-testid={`icon-${props['data-testid'] || 'phosphor'}`} {...props} />;
  return {
    __esModule: true,
    MapPin: (p) => <DummyIcon data-testid="map-pin" {...p} />,
    CurrencyInr: (p) => <DummyIcon data-testid="currency-inr" {...p} />,
    Funnel: (p) => <DummyIcon data-testid="funnel" {...p} />,
    SpinnerGap: (p) => <DummyIcon data-testid="spinner" {...p} />,
    NavigationArrow: (p) => <DummyIcon data-testid="nav-arrow" {...p} />,
    CheckCircle: (p) => <DummyIcon data-testid="check" {...p} />,
    XCircle: (p) => <DummyIcon data-testid="x" {...p} />,
    MagnifyingGlass: (p) => <DummyIcon data-testid="search" {...p} />,
    ArrowClockwise: (p) => <DummyIcon data-testid="refresh" {...p} />,
  };
});

// 2. Import component AFTER mocks
import { ParkingClusterMap } from './ParkingClusterMap';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ParkingClusterMap Component', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      console.log('--- CAPTURED CONSOLE.ERROR ---', ...args);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly and falls back to dummy data when API fails', async () => {
    // Force API failure to trigger fallback loading
    global.fetch.mockRejectedValue(new Error('Network failure'));

    render(<ParkingClusterMap />);

    // Wait for fallback loading completion
    await waitFor(() => {
      expect(screen.getAllByText('Palika Bazaar Underground Garage')[0]).toBeInTheDocument();
    });

    // Check basic details are present
    expect(screen.getAllByText('Connaught Place Block A Parking')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Palika Bazaar Underground Garage/i)[0]).toBeInTheDocument();
    expect(screen.getByText('Total Hubs')).toBeInTheDocument();
    expect(screen.getByText('Free Spots')).toBeInTheDocument();
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument();
  });

  it('filters out full spots when "Only Show Available Spaces" is toggled', async () => {
    global.fetch.mockRejectedValue(new Error('Network failure'));

    render(<ParkingClusterMap />);

    await waitFor(() => {
      expect(screen.getAllByText('Palika Bazaar Underground Garage')[0]).toBeInTheDocument();
    });

    // Toggle the filter
    const toggleButton = screen.getByText(/Only Show Available Spaces/i);
    fireEvent.click(toggleButton);

    // Palika Bazaar has 0 slots, so it should be filtered out
    await waitFor(() => {
      expect(screen.queryAllByText('Palika Bazaar Underground Garage').length).toBe(0);
    });

    // Connaught Place has 24 slots, so it should still be in the document
    expect(screen.getAllByText('Connaught Place Block A Parking')[0]).toBeInTheDocument();
  });

  it('filters results by search query input text', async () => {
    global.fetch.mockRejectedValue(new Error('Network failure'));

    render(<ParkingClusterMap />);

    await waitFor(() => {
      expect(screen.getAllByText('Palika Bazaar Underground Garage')[0]).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search parking hub...');
    fireEvent.change(searchInput, { target: { value: 'Palika' } });

    await waitFor(() => {
      expect(screen.queryAllByText('Connaught Place Block A Parking').length).toBe(0);
    });
    expect(screen.getAllByText('Palika Bazaar Underground Garage')[0]).toBeInTheDocument();
  });
});
