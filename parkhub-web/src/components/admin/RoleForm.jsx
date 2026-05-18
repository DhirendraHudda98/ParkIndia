import React, { useState, useEffect } from 'react';
import { rolesService } from '../../api/rolesService';

export default function RoleForm({ role, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    permission_ids: [],
  });

  const [permissions, setPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Initialize form with existing role data
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        is_active: role.is_active !== false,
        permission_ids: [],
      });

      loadRoleDetails(role.id);
    }

    // Load all permissions
    loadPermissions();
  }, [role]);

  const loadPermissions = async () => {
    try {
      const response = await rolesService.getPermissions();
      setPermissions(response.data);

      // Initialize expanded modules
      const modules = Object.keys(response.data || {});
      const initialExpanded = {};
      modules.forEach((module) => {
        initialExpanded[module] = true;
      });
      setExpandedModules(initialExpanded);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadRoleDetails = async (roleId) => {
    try {
      const response = await rolesService.getRole(roleId);
      const permissionIds = response.data.role.permissions?.map((p) => p.id) || [];
      setSelectedPermissions(permissionIds);
      setFormData((prev) => ({
        ...prev,
        permission_ids: permissionIds,
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : value,
    }));
  };

  const handlePermissionChange = (permissionId, isChecked) => {
    if (isChecked) {
      setSelectedPermissions((prev) => [...prev, permissionId]);
      setFormData((prev) => ({
        ...prev,
        permission_ids: [...prev.permission_ids, permissionId],
      }));
    } else {
      setSelectedPermissions((prev) => prev.filter((id) => id !== permissionId));
      setFormData((prev) => ({
        ...prev,
        permission_ids: prev.permission_ids.filter((id) => id !== permissionId),
      }));
    }
  };

  const toggleModule = (module) => {
    setExpandedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const selectAllInModule = (module, isChecked) => {
    const modulePermissions = permissions[module] || [];
    if (isChecked) {
      const newPermissions = modulePermissions.map((p) => p.id);
      setSelectedPermissions((prev) => [...new Set([...prev, ...newPermissions])]);
      setFormData((prev) => ({
        ...prev,
        permission_ids: [...new Set([...prev.permission_ids, ...newPermissions])],
      }));
    } else {
      const modulePermissionIds = modulePermissions.map((p) => p.id);
      setSelectedPermissions((prev) => prev.filter((id) => !modulePermissionIds.includes(id)));
      setFormData((prev) => ({
        ...prev,
        permission_ids: prev.permission_ids.filter((id) => !modulePermissionIds.includes(id)),
      }));
    }
  };

  const isModuleFullySelected = (module) => {
    const modulePermissions = permissions[module] || [];
    return modulePermissions.every((p) => selectedPermissions.includes(p.id));
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
      <div className="modal-content role-form">
        <div className="modal-header">
          <h2>{role ? 'Edit Role' : 'Create New Role'}</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Role Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Manager, Support Staff"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Role description..."
              rows="2"
            />
          </div>

          <div className="form-group checkbox-group">
            <label htmlFor="is_active">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <span>Active</span>
            </label>
          </div>

          {/* Permissions Selection */}
          <div className="form-group permissions-selection">
            <label>Assign Permissions</label>
            <div className="permissions-list">
              {Object.entries(permissions).length > 0 ? (
                Object.entries(permissions).map(([module, modulePermissions]) => (
                  <div key={module} className="permission-module">
                    <div className="module-header">
                      <button
                        type="button"
                        className="module-toggle"
                        onClick={() => toggleModule(module)}
                      >
                        {expandedModules[module] ? '▼' : '▶'}
                      </button>
                      <label className="module-checkbox">
                        <input
                          type="checkbox"
                          checked={isModuleFullySelected(module)}
                          onChange={(e) => selectAllInModule(module, e.target.checked)}
                        />
                        <strong>{module.toUpperCase()}</strong>
                      </label>
                    </div>

                    {expandedModules[module] && (
                      <div className="module-permissions">
                        {modulePermissions.map((permission) => (
                          <label key={permission.id} className="permission-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.id)}
                              onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            />
                            <span className="permission-name">{permission.name}</span>
                            {permission.description && <span className="permission-desc">{permission.description}</span>}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="empty-message">Loading permissions...</p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
