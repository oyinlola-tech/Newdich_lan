// Base URL – change to your actual backend API
const API_BASE_URL = 'https://your-backend.com/api';

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    let payload = null;
    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok) {
        const message = payload?.message || `Request failed (${response.status})`;
        const err = new Error(message);
        err.status = response.status;
        err.payload = payload;
        throw err;
    }
    return payload;
}

// Public endpoints
export function getPackages() {
    return requestJson(`${API_BASE_URL}/packages`);
}

export function registerMerchant(data) {
    return requestJson(`${API_BASE_URL}/merchants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

// Admin endpoints (require token)
function adminAuthHeaders() {
    const token = localStorage.getItem('admin_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

export function adminLogin(credentials) {
    return requestJson(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
}

export function adminGetStats() {
    return requestJson(`${API_BASE_URL}/admin/stats`, {
        headers: adminAuthHeaders()
    });
}

export function adminGetPackages() {
    return requestJson(`${API_BASE_URL}/admin/packages`, {
        headers: adminAuthHeaders()
    });
}

export function adminGetPackage(id) {
    return requestJson(`${API_BASE_URL}/admin/packages/${id}`, {
        headers: adminAuthHeaders()
    });
}

export function adminCreatePackage(packageData) {
    return requestJson(`${API_BASE_URL}/admin/packages`, {
        method: 'POST',
        headers: adminAuthHeaders(),
        body: JSON.stringify(packageData)
    });
}

export function adminUpdatePackage(id, packageData) {
    return requestJson(`${API_BASE_URL}/admin/packages/${id}`, {
        method: 'PUT',
        headers: adminAuthHeaders(),
        body: JSON.stringify(packageData)
    });
}

export function adminDeletePackage(id) {
    return requestJson(`${API_BASE_URL}/admin/packages/${id}`, {
        method: 'DELETE',
        headers: adminAuthHeaders()
    });
}

export function adminGetMerchants() {
    return requestJson(`${API_BASE_URL}/admin/merchants`, {
        headers: adminAuthHeaders()
    });
}

export function adminSearchMerchants({ query = '', status = '', limit = 50, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (status) params.set('status', status);
    params.set('limit', limit);
    params.set('offset', offset);
    return requestJson(`${API_BASE_URL}/admin/merchants?${params.toString()}`, {
        headers: adminAuthHeaders()
    });
}

export function adminGetMerchant(id) {
    return requestJson(`${API_BASE_URL}/admin/merchants/${id}`, {
        headers: adminAuthHeaders()
    });
}

export function adminUpdateMerchantStatus(id, status) {
    return requestJson(`${API_BASE_URL}/admin/merchants/${id}/status`, {
        method: 'PUT',
        headers: adminAuthHeaders(),
        body: JSON.stringify({ status })
    });
}
