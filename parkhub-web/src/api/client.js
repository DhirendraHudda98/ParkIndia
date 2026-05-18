const BASE_URL = import.meta.env.VITE_API_URL || '';

// In-memory token storage (XSS-safe: not in localStorage).
let _inMemoryToken = null;

export function setInMemoryToken(token) {
  _inMemoryToken = token;
}

export function getInMemoryToken() {
  return _inMemoryToken;
}

const _inflightGets = new Map();
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 300;

function isTransientError(status) {
  return status === 502 || status === 503 || status === 504 || status === 429;
}

let _inflightRefresh = null;

async function attemptTokenRefresh() {
  if (_inflightRefresh) return _inflightRefresh;

  _inflightRefresh = (async () => {
    try {
      const token = _inMemoryToken;
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (!res.ok) return false;
      const body = await res.json().catch(() => null);
      const next = body?.data?.access_token;
      if (next) {
        _inMemoryToken = next;
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      _inflightRefresh = null;
    }
  })();

  return _inflightRefresh;
}

async function requestOnce(path, opts) {
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const isLoginPath = path.includes('/auth/login');
  const isRefreshPath = path.includes('/auth/refresh');
  
  if (res.status === 401 && !isLoginPath && !isRefreshPath) {
    return { success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Session expired' } };
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      success: false,
      data: null,
      error: json?.error || { code: `HTTP_${res.status}`, message: res.statusText },
    };
  }

  if (json && typeof json === 'object' && 'success' in json) {
    return json;
  }
  return { success: true, data: json };
}

async function request(path, opts = {}) {
  const { retries = MAX_RETRIES, signal, ...rest } = opts;
  const token = _inMemoryToken;
  const isFormData = rest.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers || {}),
  };

  const fetchOpts = {
    ...rest,
    headers,
    credentials: 'include',
    ...(signal ? { signal } : {}),
  };

  const method = (rest.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  if (isGet) {
    const existing = _inflightGets.get(path);
    if (existing) return existing;
  }

  const isAuthFlowPath = path.includes('/auth/login') || path.includes('/auth/refresh');

  const execute = async () => {
    let refreshedOnce = false;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await requestOnce(path, fetchOpts);

        if (!result.success && result.error?.code === 'UNAUTHORIZED' && !isAuthFlowPath && !refreshedOnce) {
          refreshedOnce = true;
          const refreshed = await attemptTokenRefresh();
          if (refreshed) {
            const refreshedToken = _inMemoryToken;
            if (refreshedToken) {
              fetchOpts.headers.Authorization = `Bearer ${refreshedToken}`;
            }
            continue;
          }
          _inMemoryToken = null;
          window.dispatchEvent(new Event('auth:unauthorized'));
          return result;
        }

        if (!result.success && result.error) {
          const status = parseInt(result.error.code.replace('HTTP_', ''), 10);
          if (isTransientError(status) && attempt < retries) {
            await new Promise(r => setTimeout(r, RETRY_BASE_MS * 2 ** attempt));
            continue;
          }
        }

        return result;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          return { success: false, data: null, error: { code: 'ABORTED', message: 'Request aborted' } };
        }
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, RETRY_BASE_MS * 2 ** attempt));
          continue;
        }
        return { success: false, data: null, error: { code: 'NETWORK', message: 'Network error' } };
      }
    }
    return { success: false, data: null, error: { code: 'NETWORK', message: 'Network error' } };
  };

  const promise = execute();
  if (isGet) {
    _inflightGets.set(path, promise);
    promise.finally(() => _inflightGets.delete(path));
  }
  return promise;
}

async function requestBlob(path, signal) {
  const token = _inMemoryToken;
  const headers = {
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { headers, credentials: 'include', ...(signal ? { signal } : {}) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

export const api = {
  request: request,
  login: (username, password, two_factor_code) =>
    request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, ...(two_factor_code ? { two_factor_code } : {}) }),
    }),

  refresh: () => request('/api/v1/auth/refresh', { method: 'POST' }),

  register: (data) => request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  forgotPassword: (email) => request('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (token, password) => request('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

  logout: () => request('/api/v1/auth/logout', { method: 'POST' }),

  me: () => request('/api/v1/users/me'),

  updateMe: (data) => request('/api/v1/users/me', { method: 'PUT', body: JSON.stringify(data) }),

  getSettings: () => request('/api/v1/me/settings'),

  updateSettings: (settings) => request('/api/v1/me/settings', { method: 'PUT', body: JSON.stringify({ settings }) }),

  setAccessibilityNeeds: (accessibility_needs) =>
    request('/api/v1/users/me/accessibility-needs', { method: 'PUT', body: JSON.stringify({ accessibility_needs }) }),

  getBookingRecommendations: () => request('/api/v1/bookings/recommendations'),

  changePassword: (current_password, password, password_confirmation) =>
    request('/api/v1/users/me/password', {
      method: 'PUT', body: JSON.stringify({ current_password, password, password_confirmation }),
    }),

  exportMyData: () => requestBlob('/api/v1/user/export'),

  deleteMyAccount: () => request('/api/v1/users/me/delete', { method: 'DELETE' }),

  getSetupStatus: () => request('/api/v1/setup/status'),
  
  getPredictions: (lotId) => request(`/api/v1/predictions${lotId ? `?lot_id=${lotId}` : ''}`),
  
  completeSetup: (data) => request('/api/v1/setup/complete', { method: 'POST', body: JSON.stringify(data) }),

  getLots: (lat, lng) => {
    const params = new URLSearchParams();
    if (lat) params.set('lat', String(lat));
    if (lng) params.set('lng', String(lng));
    return request(`/api/v1/lots${params.toString() ? `?${params.toString()}` : ''}`);
  },
  
  getLot: (id) => request(`/api/v1/lots/${id}`),
  
  getLotSlots: (lotId) => request(`/api/v1/lots/${lotId}/slots`),
  getLotZones: (lotId) => request(`/api/v1/lots/${lotId}/zones`),
  
  createSlot: (lotId, data) => request(`/api/v1/lots/${lotId}/slots`, { method: 'POST', body: JSON.stringify(data) }),
  
  updateSlot: (lotId, slotId, data) => request(`/api/v1/lots/${lotId}/slots/${slotId}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteSlot: (lotId, slotId) => request(`/api/v1/lots/${lotId}/slots/${slotId}`, { method: 'DELETE' }),
  
  createLot: (data) => request('/api/v1/lots', { method: 'POST', body: JSON.stringify(data) }),
  
  updateLot: (id, data) => request(`/api/v1/lots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteLot: (id) => request(`/api/v1/lots/${id}`, { method: 'DELETE' }),

  getDynamicPrice: (lotId) => request(`/api/v1/lots/${lotId}/pricing/dynamic`),
  
  getAdminDynamicPricing: (lotId) => request(`/api/v1/admin/lots/${lotId}/pricing/dynamic`),
  
  updateAdminDynamicPricing: (lotId, data) =>
    request(`/api/v1/admin/lots/${lotId}/pricing/dynamic`, { method: 'PUT', body: JSON.stringify(data) }),

  getLotHours: (lotId) => request(`/api/v1/lots/${lotId}/hours`),
  
  updateAdminLotHours: (lotId, data) =>
    request(`/api/v1/admin/lots/${lotId}/hours`, { method: 'PUT', body: JSON.stringify(data) }),

  getBookings: () => request('/api/v1/bookings'),
  
  createBooking: (data) => request('/api/v1/bookings', { method: 'POST', body: JSON.stringify(data) }),
  
  cancelBooking: (id) => request(`/api/v1/bookings/${id}`, { method: 'DELETE' }),

  getBookingInvoicePdf: (id) => requestBlob(`/api/v1/bookings/${id}/invoice/pdf`),

  getVehicles: () => request('/api/v1/vehicles'),
  
  createVehicle: (data) => request('/api/v1/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  
  deleteVehicle: (id) => request(`/api/v1/vehicles/${id}`, { method: 'DELETE' }),
  
  updateVehicle: (id, data) => request(`/api/v1/vehicles/${id}`, { method: 'POST', body: data }), // Using POST for FormData compatibility in Laravel
  
  setVehicleDefault: (id) => request(`/api/v1/vehicles/${id}`, { method: 'PUT', body: JSON.stringify({ is_default: true }) }),

  listAbsences: () => request('/api/v1/absences'),
  
  createAbsence: (type, start, end, note) =>
    request('/api/v1/absences', { method: 'POST', body: JSON.stringify({ absence_type: type, start_date: start, end_date: end, note }) }),
  
  deleteAbsence: (id) => request(`/api/v1/absences/${id}`, { method: 'DELETE' }),
  
  teamAbsences: () => request('/api/v1/absences/team'),
  
  getAbsencePattern: () => request('/api/v1/absences/pattern'),
  
  setAbsencePattern: (type, weekdays) =>
    request('/api/v1/absences/pattern', { method: 'POST', body: JSON.stringify({ absence_type: type, weekdays }) }),

  getUserCredits: async () => {
    const [balanceRes, historyRes] = await Promise.all([
      request('/api/user/wallet/balance'),
      request('/api/user/wallet/transactions')
    ]);
    if (!balanceRes.success || !historyRes.success) {
      return { success: false, error: balanceRes.error || historyRes.error };
    }
    return {
      success: true,
      data: {
        balance: balanceRes.balance,
        monthly_quota: 10,
        last_refilled: new Date().toISOString(),
        transactions: historyRes.data || []
      }
    };
  },
  
  addWalletCredits: (amount) => request('/api/user/wallet/add', { method: 'POST', body: JSON.stringify({ amount }) }),
  
  getUserStats: () => request('/api/v1/user/stats'),

  getCo2Summary: (from, to, lotId) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (lotId) params.set('lot_id', lotId);
    return request(`/api/v1/bookings/co2-summary${params.toString() ? `?${params.toString()}` : ''}`);
  },

  adminStats: () => request('/api/v1/admin/stats'),
  
  adminUsers: () => request('/api/v1/admin/users'),
  
  adminUpdateUser: (id, data) => request(`/api/v1/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  adminDeleteUser: (id) => request(`/api/v1/admin/users/${id}`, { method: 'DELETE' }),
  
  adminUpdateUserRole: (id, role) =>
    request(`/api/v1/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  
  adminGrantCredits: (userId, amount, description) =>
    request(`/api/v1/admin/users/${userId}/credits`, { method: 'POST', body: JSON.stringify({ amount, description }) }),
  
  adminRefillAll: (amount) =>
    request('/api/v1/admin/credits/refill-all', { method: 'POST', body: JSON.stringify(amount ? { amount } : {}) }),
  
  adminUpdateUserQuota: (userId, monthlyQuota) =>
    request(`/api/v1/admin/users/${userId}/quota`, { method: 'PUT', body: JSON.stringify({ monthly_quota: monthlyQuota }) }),
  
  adminGetSettings: () => request('/api/v1/admin/settings'),
  
  adminUpdateSettings: (data) => request('/api/v1/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),

  adminBillingByCostCenter: () => request('/api/v1/admin/billing/by-cost-center'),
  
  adminBillingByDepartment: () => request('/api/v1/admin/billing/by-department'),

  adminBillingExport: () => requestBlob('/api/v1/admin/billing/export'),

  patchModule: (name, runtime_enabled) =>
    request(`/api/v1/admin/modules/${encodeURIComponent(name)}`, {
      method: 'PATCH',
      body: JSON.stringify({ runtime_enabled }),
    }),

  getModuleConfig: (name) => request(`/api/v1/admin/modules/${encodeURIComponent(name)}/config`),
  
  patchModuleConfig: (name, values) =>
    request(`/api/v1/admin/modules/${encodeURIComponent(name)}/config`, {
      method: 'PATCH',
      body: JSON.stringify(values),
    }),

  adminListAnnouncements: () => request('/api/v1/admin/announcements'),
  
  adminCreateAnnouncement: (data) => request('/api/v1/admin/announcements', { method: 'POST', body: JSON.stringify(data) }),
  
  adminUpdateAnnouncement: (id, data) => request(`/api/v1/admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  adminDeleteAnnouncement: (id) => request(`/api/v1/admin/announcements/${id}`, { method: 'DELETE' }),

  getNotifications: () => request('/api/v1/notifications'),
  
  markNotificationRead: (id) => request(`/api/v1/notifications/${id}/read`, { method: 'POST' }),
  
  markAllNotificationsRead: () => request('/api/v1/notifications/read-all', { method: 'POST' }),

  getNotificationUnreadCount: () => request('/api/v1/notifications/unread-count'),
  
  getNotificationCenter: (filter = 'all', perPage = 50) =>
    request(`/api/v1/notifications/center?filter=${filter}&per_page=${perPage}`),
  
  markAllNotificationCenterRead: () => request('/api/v1/notifications/center/read-all', { method: 'PUT' }),
  
  markNotificationCenterRead: (id) => request(`/api/v1/notifications/${id}/read`, { method: 'PUT' }),
  
  deleteNotificationCenter: (id) => request(`/api/v1/notifications/center/${id}`, { method: 'DELETE' }),

  calendarEvents: (from, to) => {
    const params = new URLSearchParams();
    params.set('from', from);
    params.set('to', /^\d{4}-\d{2}-\d{2}$/.test(to) ? `${to} 23:59:59` : to);
    return request(`/api/v1/calendar/events?${params.toString()}`);
  },
  
  generateCalendarToken: () => request('/api/v1/calendar/token', { method: 'POST' }),

  getDemoConfig: () => request('/api/v1/demo/config'),
  
  getDemoStatus: async () => {
    const res = await request('/api/v1/demo/status');
    if (res.success && res.data) {
      return { ...res, data: normalizeDemoStatus(res.data) };
    }
    return res;
  },
  
  voteDemoReset: () => request('/api/v1/demo/vote', { method: 'POST' }),

  getTranslationOverrides: () => request('/api/v1/translations/overrides'),

  getTranslationProposals: (status) => request(`/api/v1/translations/proposals${status ? `?status=${status}` : ''}`),

  getTranslationProposal: (id) => request(`/api/v1/translations/proposals/${id}`),

  createTranslationProposal: (data) => request('/api/v1/translations/proposals', { method: 'POST', body: JSON.stringify(data) }),

  voteOnProposal: (id, vote) => request(`/api/v1/translations/proposals/${id}/vote`, { method: 'POST', body: JSON.stringify({ vote }) }),

  reviewProposal: (id, data) => request(`/api/v1/translations/proposals/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),

  getFavorites: () => request('/api/v1/user/favorites'),
  
  addFavorite: (slot_id, lot_id) => request('/api/v1/user/favorites', { method: 'POST', body: JSON.stringify({ slot_id, lot_id }) }),
  
  removeFavorite: (slotId) => request(`/api/v1/user/favorites/${slotId}`, { method: 'DELETE' }),

  setup2FA: () => request('/api/v1/auth/2fa/setup', { method: 'POST' }),
  
  verify2FA: (code) => request('/api/v1/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ code }) }),
  
  disable2FA: (current_password) => request('/api/v1/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ current_password }) }),
  
  get2FAStatus: () => request('/api/v1/auth/2fa/status'),

  getLoginHistory: () => request('/api/v1/auth/login-history'),

  getSessions: () => request('/api/v1/auth/sessions'),
  
  revokeSession: (id) => request(`/api/v1/auth/sessions/${id}`, { method: 'DELETE' }),

  getNotificationPreferences: () => request('/api/v1/preferences/notifications'),
  
  updateNotificationPreferences: (prefs) => request('/api/v1/preferences/notifications', { method: 'PUT', body: JSON.stringify(prefs) }),

  getDesignThemePreference: () => request('/api/v1/preferences/theme'),
  
  updateDesignThemePreference: (design_theme) => request('/api/v1/preferences/theme', { method: 'PUT', body: JSON.stringify({ design_theme }) }),

  adminBulkUpdate: (user_ids, action, role) =>
    request('/api/v1/admin/users/bulk-update', { method: 'POST', body: JSON.stringify({ user_ids, action, role }) }),
  
  adminBulkDelete: (user_ids) => request('/api/v1/admin/users/bulk-delete', { method: 'POST', body: JSON.stringify({ user_ids }) }),

  getMapMarkers: () => request('/api/v1/lots/map'),
  
  setLotLocation: (lotId, latitude, longitude) =>
    request(`/api/v1/admin/lots/${lotId}/location`, { method: 'PUT', body: JSON.stringify({ latitude, longitude }) }),

  createCheckout: (credits, pricePerCredit) =>
    request('/api/v1/payments/create-checkout', { method: 'POST', body: JSON.stringify({ credits, price_per_credit: pricePerCredit }) }),
  
  getPaymentHistory: () => request('/api/v1/payments/history'),
  
  getStripeConfig: () => request('/api/v1/payments/config'),

  getRateLimitStats: () => request('/api/v1/admin/rate-limits'),
  
  getRateLimitHistory: () => request('/api/v1/admin/rate-limits/history'),

  getAuditLog: (params) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    if (params?.action) qs.set('action', params.action);
    if (params?.user) qs.set('user', params.user);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return request(`/api/v1/admin/audit-log${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  listTenants: () => request('/api/v1/admin/tenants'),
  
  createTenant: (data) => request('/api/v1/admin/tenants', { method: 'POST', body: JSON.stringify(data) }),
  
  updateTenant: (id, data) => request(`/api/v1/admin/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getBookingHistory: (params) => {
    const qs = new URLSearchParams();
    if (params?.lot_id) qs.set('lot_id', params.lot_id);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    return request(`/api/v1/bookings/history${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  
  getBookingStats: () => request('/api/v1/bookings/stats'),

  geofenceCheckIn: (latitude, longitude) =>
    request('/api/v1/geofence/check-in', { method: 'POST', body: JSON.stringify({ latitude, longitude }) }),
  
  getLotGeofence: (lotId) => request(`/api/v1/lots/${lotId}/geofence`),
  
  adminSetGeofence: (lotId, data) => request(`/api/v1/admin/lots/${lotId}/geofence`, { method: 'PUT', body: JSON.stringify(data) }),

  rescheduleBooking: (id, newStart, newEnd) =>
    request(`/api/v1/bookings/${id}/reschedule`, { method: 'PUT', body: JSON.stringify({ new_start: newStart, new_end: newEnd }) }),

  submitAbsenceRequest: (data) => request('/api/v1/absences/requests', { method: 'POST', body: JSON.stringify(data) }),
  
  myAbsenceRequests: () => request('/api/v1/absences/my'),
  
  pendingAbsenceRequests: () => request('/api/v1/admin/absences/pending'),
  
  approveAbsenceRequest: (id, comment) => request(`/api/v1/admin/absences/${id}/approve`, { method: 'PUT', body: JSON.stringify({ comment }) }),
  
  rejectAbsenceRequest: (id, reason) => request(`/api/v1/admin/absences/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),

  getWidgetLayout: () => request('/api/v1/admin/widgets'),
  
  saveWidgetLayout: (widgets) => request('/api/v1/admin/widgets', { method: 'PUT', body: JSON.stringify({ widgets }) }),
  
  getWidgetData: (widgetId) => request(`/api/v1/admin/widgets/data/${widgetId}`),

  getTeam: () => request('/api/v1/team'),
  
  getAdminStatsExtended: () => request('/api/v1/admin/stats'),

  getLotChargers: (lotId) => request(`/api/v1/lots/${lotId}/chargers`),
  
  getChargerSessions: () => request('/api/v1/chargers/sessions'),
  
  startCharging: (chargerId) => request(`/api/v1/chargers/${chargerId}/start`, { method: 'POST' }),
  
  stopCharging: (chargerId) => request(`/api/v1/chargers/${chargerId}/stop`, { method: 'POST' }),

  getSwapRequests: () => request('/api/v1/swap-requests'),
  
  acceptSwap: (id) => request(`/api/v1/swap-requests/${id}/accept`, { method: 'POST' }),
  
  declineSwap: (id) => request(`/api/v1/swap-requests/${id}/decline`, { method: 'POST' }),
  
  createSwapRequest: (sourceBookingId, targetBookingId, message) =>
    request(`/api/v1/bookings/${sourceBookingId}/swap-request`, {
      method: 'POST',
      body: JSON.stringify({ target_booking_id: targetBookingId, message }),
    }),

  getCheckInStatus: (bookingId) => request(`/api/v1/bookings/${bookingId}/check-in`),
  
  checkIn: (bookingId) => request(`/api/v1/bookings/${bookingId}/check-in`, { method: 'POST' }),

  checkInDirect: () => request('/api/v1/check-in', { method: 'POST' }),
  
  checkOut: (bookingId) => request(`/api/v1/bookings/${bookingId}/check-out`, { method: 'POST' }),

  getGuestBookings: () => request('/api/v1/bookings/guest'),
  
  createGuestBooking: (data) => request('/api/v1/bookings/guest', { method: 'POST', body: JSON.stringify(data) }),
  
  cancelGuestBooking: (id) => request(`/api/v1/bookings/guest/${id}`, { method: 'DELETE' }),

  getApiKeys: () => request('/api/v1/admin/api-keys'),
  
  createApiKey: (label) => request('/api/v1/admin/api-keys', { method: 'POST', body: JSON.stringify({ label }) }),
  
  rotateApiKey: (id) => request(`/api/v1/admin/api-keys/${id}/rotate`, { method: 'POST' }),
  
  revokeApiKey: (id) => request(`/api/v1/admin/api-keys/${id}`, { method: 'DELETE' }),

  getIntegrations: () => request('/api/v1/admin/integrations'),
  
  connectIntegration: (id) => request(`/api/v1/admin/integrations/${id}/connect`, { method: 'POST' }),
  
  disconnectIntegration: (id) => request(`/api/v1/admin/integrations/${id}/disconnect`, { method: 'POST' }),

  getPolicies: () => request('/api/v1/admin/policies'),
  
  updatePolicy: (id, body) => request(`/api/v1/admin/policies/${id}`, { method: 'PUT', body: JSON.stringify({ body }) }),

  getLobbyConfig: () => request('/api/v1/admin/lobby'),
  
  updateLobbyConfig: (data) => request('/api/v1/admin/lobby', { method: 'PUT', body: JSON.stringify(data) }),
};

function normalizeDemoStatus(raw) {
  return {
    timer_seconds: raw.timer?.remaining ?? raw.timer_seconds ?? 0,
    votes: typeof raw.votes === 'object' ? raw.votes.current : (raw.votes ?? 0),
    vote_threshold: typeof raw.votes === 'object' ? raw.votes.threshold : (raw.vote_threshold ?? 3),
    has_voted: typeof raw.votes === 'object' ? raw.votes.has_voted : (raw.has_voted ?? false),
    viewers: raw.viewers ?? 0,
    reset: raw.reset,
    last_reset_at: raw.last_reset_at,
    next_scheduled_reset: raw.next_scheduled_reset,
    reset_in_progress: raw.reset_in_progress ?? false,
  };
}
