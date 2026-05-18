import React, { useState, useEffect } from 'react';
import { rolesService } from '../../api/rolesService';
import RoleTable from './RoleTable';
import RoleForm from './RoleForm';
import './RolesPermissions.css';

export default function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
  });

  // Load roles
  const loadRoles = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        per_page: pagination.per_page,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== '') params.status = statusFilter;

      const response = await rolesService.getRoles(params);
      setRoles(response.data.data);
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
    loadRoles(1);
  }, [searchTerm, statusFilter]);

  const handleAddRole = () => {
    setEditingRole(null);
    setShowForm(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleDeleteRole = async (roleId) => {
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        await rolesService.deleteRole(roleId);
        loadRoles(pagination.current_page);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingRole) {
        await rolesService.updateRole(editingRole.id, formData);
      } else {
        await rolesService.createRole(formData);
      }

      setShowForm(false);
      setEditingRole(null);
      loadRoles(pagination.current_page);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="roles-permissions-container">
      <div className="roles-header">
        <div className="header-title">
          <h1>🔐 Roles & Permissions Management</h1>
          <p>Create and manage user roles with granular permissions</p>
        </div>

        <button className="btn btn-primary" onClick={handleAddRole}>
          + Create Role
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters-section">
        <input
          type="text"
          placeholder="Search roles by name or description..."
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
        <RoleForm
          role={editingRole}
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div className="loading-spinner">Loading roles...</div>
      ) : roles.length === 0 ? (
        <div className="empty-state">
          <p>No roles found. Create one to get started!</p>
        </div>
      ) : (
        <>
          <RoleTable
            roles={roles}
            onEdit={handleEditRole}
            onDelete={handleDeleteRole}
          />

          {pagination.last_page > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => loadRoles(pagination.current_page - 1)}
                className="btn-pagination"
              >
                Previous
              </button>

              <span className="pagination-info">
                Page {pagination.current_page} of {pagination.last_page}
              </span>

              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => loadRoles(pagination.current_page + 1)}
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
