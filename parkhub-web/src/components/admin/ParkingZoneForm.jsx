import React, { useState, useEffect } from 'react';
import { parkingZonesService } from '../../api/parkingZonesService';

export default function ParkingZoneForm({ zone, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    pricing_multiplier: 1.0,
    occupancy_limit: null,
    status: 'active',
    parking_lot_ids: [],
  });

  const [availableLots, setAvailableLots] = useState([]);
  const [selectedLots, setSelectedLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form with existing zone data
  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name || '',
        location: zone.location || '',
        description: zone.description || '',
        pricing_multiplier: zone.pricing_multiplier || 1.0,
        occupancy_limit: zone.occupancy_limit || null,
        status: zone.status || 'active',
        parking_lot_ids: [],
      });

      // Load zone details and parking lots
      loadZoneDetails(zone.id);
    }
  }, [zone]);

  const loadZoneDetails = async (zoneId) => {
    try {
      const response = await parkingZonesService.getZone(zoneId);
      const zoneData = response.data.zone;
      const lotIds = zoneData.parking_lots?.map((lot) => lot.id) || [];
      setSelectedLots(lotIds);
      setFormData((prev) => ({
        ...prev,
        parking_lot_ids: lotIds,
      }));

      // Load available lots
      const availableResponse = await parkingZonesService.getAvailableLots(
        zoneId
      );
      setAvailableLots(availableResponse.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number' ? (value === '' ? null : parseFloat(value)) : value,
    }));
  };

  const handleLotSelection = (lotId, isChecked) => {
    if (isChecked) {
      setSelectedLots((prev) => [...prev, lotId]);
      setFormData((prev) => ({
        ...prev,
        parking_lot_ids: [...prev.parking_lot_ids, lotId],
      }));
    } else {
      setSelectedLots((prev) => prev.filter((id) => id !== lotId));
      setFormData((prev) => ({
        ...prev,
        parking_lot_ids: prev.parking_lot_ids.filter((id) => id !== lotId),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content parking-zone-form">
        <div className="modal-header">
          <h2>{zone ? 'Edit Parking Zone' : 'Create New Parking Zone'}</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Zone Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., City Center, Mall Area"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Downtown"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pricing_multiplier">Pricing Multiplier *</label>
              <input
                type="number"
                id="pricing_multiplier"
                name="pricing_multiplier"
                value={formData.pricing_multiplier}
                onChange={handleInputChange}
                step="0.1"
                min="0.1"
                max="10"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Zone description..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="occupancy_limit">Occupancy Limit</label>
              <input
                type="number"
                id="occupancy_limit"
                name="occupancy_limit"
                value={formData.occupancy_limit || ''}
                onChange={handleInputChange}
                placeholder="Leave empty for no limit"
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Parking Lots Selection */}
          <div className="form-group lots-selection">
            <label>Assign Parking Lots</label>
            <div className="lots-list">
              {availableLots.length > 0 ? (
                availableLots.map((lot) => (
                  <div key={lot.id} className="lot-checkbox">
                    <input
                      type="checkbox"
                      id={`lot-${lot.id}`}
                      checked={selectedLots.includes(lot.id)}
                      onChange={(e) =>
                        handleLotSelection(lot.id, e.target.checked)
                      }
                    />
                    <label htmlFor={`lot-${lot.id}`}>
                      <strong>{lot.name}</strong>
                      <small>{lot.address || lot.city}</small>
                    </label>
                  </div>
                ))
              ) : (
                <p className="empty-message">No available lots</p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? 'Saving...'
                : zone
                  ? 'Update Zone'
                  : 'Create Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
