document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();

    const form = document.getElementById('admin-login-form');
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
            const result = await adminLogin({ email, password });
            if (result.token) {
                localStorage.setItem('admin_token', result.token);
                localStorage.setItem('admin_id', result.admin_id);
                window.location.href = 'admin.html';
            } else {
                showMessage(result.message || 'Login failed.', 'error');
            }
        } catch (error) {
            showMessage('Network error. Please try again.', 'error');
        }
    });

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }
});