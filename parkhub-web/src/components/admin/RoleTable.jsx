import React from 'react';

export default function RoleTable({ roles, onEdit, onDelete }) {
  const getStatusBadge = (status) => {
    return status ? (
      <span className="badge badge-success">Active</span>
    ) : (
      <span className="badge badge-warning">Inactive</span>
    );
  };

  const getRoleTypeBadge = (roleType) => {
    const badgeClass = {
      super_admin: 'badge-danger',
      admin: 'badge-primary',
      manager: 'badge-info',
      staff: 'badge-secondary',
      custom: 'badge-default',
    };

    const labels = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      manager: 'Manager',
      staff: 'Staff',
      custom: 'Custom',
    };

    return <span className={`badge ${badgeClass[roleType] || 'badge-default'}`}>{labels[roleType] || roleType}</span>;
  };

  return (
    <div className="roles-table-wrapper">
      <table className="roles-table">
        <thead>
          <tr>
            <th>Role Name</th>
            <th>Type</th>
            <th>Users</th>
            <th>Permissions</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="role-row">
              <td className="role-name">
                <strong>{role.name}</strong>
                <small>{role.description}</small>
              </td>
              <td className="role-type">
                {getRoleTypeBadge(role.role_type)}
              </td>
              <td className="role-users">
                {role.users_count || 0} users
              </td>
              <td className="role-permissions">
                <span className="permission-count">
                  {role.permissions_count || 0} perms
                </span>
              </td>
              <td className="role-status">
                {getStatusBadge(role.is_active)}
              </td>
              <td className="role-actions">
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => onEdit(role)}
                  title="Edit role"
                >
                  ✏️ Edit
                </button>
                {!['super_admin', 'admin', 'manager', 'staff'].includes(role.role_type) && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onDelete(role.id)}
                    title="Delete role"
                  >
                    🗑️ Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
