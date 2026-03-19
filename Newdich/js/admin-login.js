import { adminLogin } from '../api/index.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();

    const form = document.getElementById('admin-login-form');
    const messageDiv = document.getElementById('login-message');
    const submitBtn = form.querySelector('button[type="submit"]');
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('toggle-password');

    toggleBtn.addEventListener('click', () => {
        const isHidden = passwordInput.type === 'password';
        passwordInput.type = isHidden ? 'text' : 'password';
        toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            showMessage('Please enter both email and password.', 'error');
            return;
        }

        try {
            setLoading(true);
            const result = await adminLogin({ email, password });
            if (result.token) {
                localStorage.setItem('admin_token', result.token);
                localStorage.setItem('admin_id', result.admin_id);
                window.location.href = 'admin.html';
            } else {
                showMessage(result.message || 'Login failed.', 'error');
            }
        } catch (error) {
            showMessage(error.message || 'Network error. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    });

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtn.textContent = isLoading ? 'Signing in...' : 'Login';
    }
});
