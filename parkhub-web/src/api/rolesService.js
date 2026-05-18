/**
 * Roles & Permissions Service
 * Handles API calls for role and permission management
 */

import { API_BASE_URL } from '../constants';

const ROLES_ENDPOINT = `${API_BASE_URL}/admin/roles`;
const PERMISSIONS_ENDPOINT = `${API_BASE_URL}/admin/permissions`;

export const rolesService = {
  /**
   * Get all roles
   */
  async getRoles(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${ROLES_ENDPOINT}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch roles: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get a single role with details
   */
  async getRole(id) {
    const response = await fetch(`${ROLES_ENDPOINT}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch role: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create a new role
   */
  async createRole(data) {
    const response = await fetch(ROLES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create role');
    }

    return response.json();
  },

  /**
   * Update a role
   */
  async updateRole(id, data) {
    const response = await fetch(`${ROLES_ENDPOINT}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update role');
    }

    return response.json();
  },

  /**
   * Delete a role
   */
  async deleteRole(id) {
    const response = await fetch(`${ROLES_ENDPOINT}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete role');
    }

    return response.json();
  },

  /**
   * Get all permissions grouped by module
   */
  async getPermissions() {
    const response = await fetch(PERMISSIONS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch permissions');
    }

    return response.json();
  },

  /**
   * Assign permissions to a role
   */
  async assignPermissions(roleId, permissionIds) {
    const response = await fetch(`${ROLES_ENDPOINT}/${roleId}/assign-permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
      body: JSON.stringify({ permission_ids: permissionIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to assign permissions');
    }

    return response.json();
  },

  /**
   * Assign users to a role
   */
  async assignUsers(roleId, userIds) {
    const response = await fetch(`${ROLES_ENDPOINT}/${roleId}/assign-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
      body: JSON.stringify({ user_ids: userIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to assign users');
    }

    return response.json();
  },

  /**
   * Remove users from a role
   */
  async removeUsers(roleId, userIds) {
    const response = await fetch(`${ROLES_ENDPOINT}/${roleId}/remove-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
      body: JSON.stringify({ user_ids: userIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove users');
    }

    return response.json();
  },

  /**
   * Get users assigned to a role
   */
  async getRoleUsers(roleId, params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${ROLES_ENDPOINT}/${roleId}/users?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch role users');
    }

    return response.json();
  },

  /**
   * Get default system roles
   */
  async getDefaultRoles() {
    const response = await fetch(`${ROLES_ENDPOINT}/default/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sanctum_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch default roles');
    }

    return response.json();
  },
};
