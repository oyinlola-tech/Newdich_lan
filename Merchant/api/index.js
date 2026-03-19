const API_BASE_URL = 'https://your-backend.com/api/merchant';

// Helper to include auth token
function authHeaders() {
    const token = localStorage.getItem('merchant_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

// Public endpoints (no auth)
export async function login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    return response.json();
}

export async function getPlans() {  // public for portal, authenticated for admin
    const response = await fetch(`${API_BASE_URL}/plans`, {
        headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch plans');
    return response.json();
}

export async function initiatePayment(data) {
    const response = await fetch(`${API_BASE_URL}/payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

// Authenticated endpoints
export async function getUsers() {
    const response = await fetch(`${API_BASE_URL}/users`, {
        headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
}

export async function getPaymentHistory() {
    const response = await fetch(`${API_BASE_URL}/history`, {
        headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
}

export async function createPlan(planData) {
    const response = await fetch(`${API_BASE_URL}/plans`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(planData)
    });
    return response.json();
}

export async function updatePlan(id, planData) {
    const response = await fetch(`${API_BASE_URL}/plans/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(planData)
    });
    return response.json();
}

export async function deletePlan(id) {
    const response = await fetch(`${API_BASE_URL}/plans/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
    return response.json();
}