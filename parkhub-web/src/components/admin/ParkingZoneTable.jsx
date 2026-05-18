import React from 'react';

export default function ParkingZoneTable({ zones, onEdit, onDelete }) {
  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="badge badge-success">Active</span>
    ) : (
      <span className="badge badge-warning">Inactive</span>
    );
  };

  return (
    <div className="zones-table-wrapper">
      <table className="zones-table">
        <thead>
          <tr>
            <th>Zone Name</th>
            <th>Location</th>
            <th>Pricing Multiplier</th>
            <th>Total Lots</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr key={zone.id} className="zone-row">
              <td className="zone-name">
                <strong>{zone.name}</strong>
              </td>
              <td className="zone-location">
                {zone.location || '-'}
              </td>
              <td className="zone-multiplier">
                <span className="multiplier-badge">
                  ×{parseFloat(zone.pricing_multiplier).toFixed(2)}
                </span>
              </td>
              <td className="zone-lots">
                {zone.parking_lots_count || 0}
              </td>
              <td className="zone-status">
                {getStatusBadge(zone.status)}
              </td>
              <td className="zone-actions">
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => onEdit(zone)}
                  title="Edit zone"
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => onDelete(zone.id)}
                  title="Delete zone"
                >
                  🗑️ Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
