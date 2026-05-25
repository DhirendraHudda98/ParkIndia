import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockGetLots = vi.fn();
const mockGetLotSlots = vi.fn();
const mockGetVehicles = vi.fn();
const mockGetFavorites = vi.fn();
const mockAddFavorite = vi.fn();
const mockRemoveFavorite = vi.fn();

vi.mock('../api/client', () => ({
  api: {
    getLots: (...args) => mockGetLots(...args),
    getLotSlots: (...args) => mockGetLotSlots(...args),
    getVehicles: (...args) => mockGetVehicles(...args),
    getFavorites: (...args) => mockGetFavorites(...args),
    addFavorite: (...args) => mockAddFavorite(...args),
    removeFavorite: (...args) => mockRemoveFavorite(...args),
  },
}));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k, o) => k.includes('slot') ? `Slot ${o?.slot ?? ''}` : k }) }));
vi.mock('../hooks/useNavLayout', () => ({ useNavLayout: () => [null] }));
vi.mock('../components/ParkingMap', () => ({ default: () => <div /> }));
vi.mock('../lib/echo', () => ({ echo: { channel: () => ({ listen: () => {}, stopListening: () => {}, }), leaveChannel: () => {} } }));
vi.mock('@phosphor-icons/react', () => {
  const Icon = (props) => {
    return /* @__PURE__ */ React.createElement('svg', props);
  };
  return {
    ArrowLeft: Icon,
    MapPin: Icon,
    Clock: Icon,
    Car: Icon,
    SpinnerGap: Icon,
    Check: Icon,
    Lightning: Icon,
    Wheelchair: Icon,
    Motorcycle: Icon,
    Star: Icon,
    TrendUp: Icon,
    TrendDown: Icon,
  };
});

import { BookPage } from './Book';

describe('BookPage favorites', () => {
  beforeEach(() => {
    mockGetLots.mockClear();
    mockGetLotSlots.mockClear();
    mockGetVehicles.mockClear();
    mockGetFavorites.mockClear();
    mockAddFavorite.mockClear();
    mockRemoveFavorite.mockClear();
    mockGetLots.mockResolvedValue({ success: true, data: [{ id: 'l1', name: 'Lot 1', status: 'open' }] });
    mockGetVehicles.mockResolvedValue({ success: true, data: [] });
    mockGetLotSlots.mockResolvedValue({ success: true, data: [{ id: 's1', slot_number: 'A1', status: 'available', lot_id: 'l1' }] });
    mockGetFavorites.mockResolvedValue({ success: true, data: [] });
    mockAddFavorite.mockResolvedValue({ success: true, data: { slot_id: 's1' } });
    mockRemoveFavorite.mockResolvedValue({ success: true });
  });

  afterEach(() => vi.restoreAllMocks());

  it('adds a favorite when star clicked', async () => {
    const user = userEvent.setup();
    render(<BookPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId('buchen-slot').length).toBeGreaterThan(0);
    });

    const starButton = screen.getByLabelText('Add A1 to favorites');
    await user.click(starButton);

    await waitFor(() => {
      expect(mockAddFavorite).toHaveBeenCalledWith('s1', 'l1');
    });
  });
});
