/* global window, localStorage, fetch */
(function () {
    'use strict';

    let API_BASE_URL = 'https://your-backend.com/api/merchant';
    const DEFAULT_TIMEOUT_MS = 15000;

    function getAuthToken() {
        return localStorage.getItem('merchant_token');
    }

    function setAuthToken(token) {
        if (token) localStorage.setItem('merchant_token', token);
    }

    function clearAuthToken() {
        localStorage.removeItem('merchant_token');
        localStorage.removeItem('merchant_id');
    }

    function authHeaders() {
        const token = getAuthToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    async function request(path, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: options.headers || authHeaders(),
            signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));

        let data = null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            data = await response.json().catch(() => null);
        } else {
            data = await response.text().catch(() => null);
        }

        if (!response.ok) {
            const message = (data && data.message) || response.statusText || 'Request failed';
            const error = new Error(message);
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return data;
    }

    function setApiBaseUrl(url) {
        if (typeof url === 'string' && url.trim()) {
            API_BASE_URL = url.trim().replace(/\/+$/, '');
        }
    }

    function getApiBaseUrl() {
        return API_BASE_URL;
    }

    // Public endpoints (no auth)
    async function login(credentials) {
        return request('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
    }

    async function getPlans() { // public for portal, authenticated for admin
        return request('/plans');
    }

    async function getPlan(id) {
        return request(`/plans/${id}`);
    }

    async function initiatePayment(data) {
        return request('/payment/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    async function verifyPayment(reference) {
        return request(`/payment/verify/${encodeURIComponent(reference)}`);
    }

    // Authenticated endpoints
    async function getUsers() {
        return request('/users');
    }

    async function getUser(mac) {
        return request(`/users/${encodeURIComponent(mac)}`);
    }

    async function toggleUserActive(mac) {
        return request(`/users/${encodeURIComponent(mac)}/toggle`, { method: 'PUT' });
    }

    async function extendUser(mac, hours) {
        return request(`/users/${encodeURIComponent(mac)}/extend`, {
            method: 'POST',
            body: JSON.stringify({ hours })
        });
    }

    async function getPaymentHistory() {
        return request('/history');
    }

    async function refundPayment(transactionId) {
        return request(`/payment/refund/${encodeURIComponent(transactionId)}`, { method: 'POST' });
    }

    async function getStats() {
        return request('/stats');
    }

    async function getRevenueSummary() {
        return request('/revenue/summary');
    }

    async function getMerchantProfile() {
        return request('/profile');
    }

    async function updateMerchantProfile(data) {
        return request('/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async function createPlan(planData) {
        return request('/plans', {
            method: 'POST',
            body: JSON.stringify(planData)
        });
    }

    async function updatePlan(id, planData) {
        return request(`/plans/${id}`, {
            method: 'PUT',
            body: JSON.stringify(planData)
        });
    }

    async function deletePlan(id) {
        return request(`/plans/${id}`, {
            method: 'DELETE'
        });
    }

    window.MerchantAPI = {
        // config & auth
        setApiBaseUrl,
        getApiBaseUrl,
        getAuthToken,
        setAuthToken,
        clearAuthToken,

        // public
        login,
        getPlans,
        getPlan,
        initiatePayment,
        verifyPayment,

        // auth
        getUsers,
        getUser,
        toggleUserActive,
        extendUser,
        getPaymentHistory,
        refundPayment,
        getStats,
        getRevenueSummary,
        getMerchantProfile,
        updateMerchantProfile,
        createPlan,
        updatePlan,
        deletePlan
    };
})();
