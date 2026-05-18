/**
 * Parking Zones Admin Service
 * Handles API calls for parking zone management
 */

import { API_BASE_URL } from '../constants';

const ZONES_ENDPOINT = `${API_BASE_URL}/admin/parking-zones`;

export const parkingZonesService = {
  /**
   * Get all parking zones
   */
  async getZones(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${ZONES_ENDPOINT}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch zones: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get a single parking zone with details
   */
  async getZone(id) {
    const response = await fetch(`${ZONES_ENDPOINT}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch zone: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create a new parking zone
   */
  async createZone(data) {
    const response = await fetch(ZONES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create zone');
    }

    return response.json();
  },

  /**
   * Update a parking zone
   */
  async updateZone(id, data) {
    const response = await fetch(`${ZONES_ENDPOINT}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update zone');
    }

    return response.json();
  },

  /**
   * Delete a parking zone
   */
  async deleteZone(id) {
    const response = await fetch(`${ZONES_ENDPOINT}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete zone');
    }

    return response.json();
  },

  /**
   * Attach parking lots to a zone
   */
  async attachLots(zoneId, parkingLotIds) {
    const response = await fetch(`${ZONES_ENDPOINT}/${zoneId}/attach-lots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
      body: JSON.stringify({ parking_lot_ids: parkingLotIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to attach lots');
    }

    return response.json();
  },

  /**
   * Detach parking lots from a zone
   */
  async detachLots(zoneId, parkingLotIds) {
    const response = await fetch(`${ZONES_ENDPOINT}/${zoneId}/detach-lots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
      body: JSON.stringify({ parking_lot_ids: parkingLotIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to detach lots');
    }

    return response.json();
  },

  /**
   * Get available lots that can be added to a zone
   */
  async getAvailableLots(zoneId) {
    const response = await fetch(`${ZONES_ENDPOINT}/${zoneId}/available-lots`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch available lots');
    }

    return response.json();
  },

  /**
   * Get statistics for a parking zone
   */
  async getZoneStats(zoneId) {
    const response = await fetch(`${ZONES_ENDPOINT}/${zoneId}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch zone stats');
    }

    return response.json();
  },
};
