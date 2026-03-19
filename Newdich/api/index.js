const API_BASE_URL = (typeof window !== 'undefined' && window.NEWDICH_API_BASE_URL)
    ? window.NEWDICH_API_BASE_URL
    : 'https://your-backend.com/api';

export async function getPackages() {
    const response = await fetch(`${API_BASE_URL}/packages`);
    if (!response.ok) throw new Error('Failed to fetch packages');
    return response.json();
}

export async function registerMerchant(data) {
    const response = await fetch(`${API_BASE_URL}/merchants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}
