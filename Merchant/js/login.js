document.addEventListener('DOMContentLoaded', () => {
    const API = window.MerchantAPI;
    if (!API) {
        alert('API not loaded. Please check api/index.js');
        return;
    }

    document.getElementById('year').textContent = new Date().getFullYear();

    const form = document.getElementById('login-form');
    const messageDiv = document.getElementById('login-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            showMessage('Please enter both email and password.', 'error');
            return;
        }

        try {
            const result = await API.login({ email, password });
            if (result.token) {
                API.setAuthToken(result.token);
                if (result.merchant_id) localStorage.setItem('merchant_id', result.merchant_id);
                window.location.href = 'admin.html';
            } else {
                showMessage(result.message || 'Login failed.', 'error');
            }
        } catch (error) {
            showMessage(error.message || 'Network error. Please try again.', 'error');
        }
    });

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }
});
