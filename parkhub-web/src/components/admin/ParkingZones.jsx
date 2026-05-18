import React, { useState, useEffect } from 'react';
import { parkingZonesService } from '../../api/parkingZonesService';
import ParkingZoneTable from './ParkingZoneTable';
import ParkingZoneForm from './ParkingZoneForm';
import './ParkingZones.css';

export default function ParkingZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
  });

  // Load zones
  const loadZones = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        per_page: pagination.per_page,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;

      const response = await parkingZonesService.getZones(params);
      setZones(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones(1);
  }, [searchTerm, statusFilter]);

  const handleAddZone = () => {
    setEditingZone(null);
    setShowForm(true);
  };

  const handleEditZone = (zone) => {
    setEditingZone(zone);
    setShowForm(true);
  };

  const handleDeleteZone = async (zoneId) => {
    if (confirm('Are you sure you want to delete this zone?')) {
      try {
        await parkingZonesService.deleteZone(zoneId);
        loadZones(pagination.current_page);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingZone) {
        await parkingZonesService.updateZone(editingZone.id, formData);
      } else {
        await parkingZonesService.createZone(formData);
      }

      setShowForm(false);
      setEditingZone(null);
      loadZones(pagination.current_page);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="parking-zones-container">
      <div className="zones-header">
        <div className="header-title">
          <h1>🚗 Parking Zones Management</h1>
          <p>Create and manage parking zones with pricing multipliers</p>
        </div>

        <button className="btn btn-primary" onClick={handleAddZone}>
          + Add Zone
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters-section">
        <input
          type="text"
          placeholder="Search zones by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-select"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {showForm && (
        <ParkingZoneForm
          zone={editingZone}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div className="loading-spinner">Loading zones...</div>
      ) : zones.length === 0 ? (
        <div className="empty-state">
          <p>No parking zones found. Create one to get started!</p>
        </div>
      ) : (
        <>
          <ParkingZoneTable
            zones={zones}
            onEdit={handleEditZone}
            onDelete={handleDeleteZone}
          />

          {pagination.last_page > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => loadZones(pagination.current_page - 1)}
                className="btn-pagination"
              >
                Previous
              </button>

              <span className="pagination-info">
                Page {pagination.current_page} of {pagination.last_page}
              </span>

              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => loadZones(pagination.current_page + 1)}
                className="btn-pagination"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
