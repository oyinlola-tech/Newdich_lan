document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Load packages
    loadPackages();

    // Handle signup form submission
    const form = document.getElementById('merchant-form');
    const messageDiv = document.getElementById('form-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Basic validation
        const requiredFields = ['fullname', 'email', 'phone', 'address', 'city', 'state', 'country'];
        for (const field of requiredFields) {
            const input = document.getElementById(field);
            if (!input.value.trim()) {
                showMessage('Please fill in all required fields.', 'error');
                return;
            }
        }

        // Prepare data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Remove empty optional fields
        if (!data.business_name) delete data.business_name;
        if (!data.refer_code) delete data.refer_code;

        try {
            const result = await registerMerchant(data);
            if (result.success) {
                showMessage('Registration successful! We will contact you soon.', 'success');
                form.reset();
            } else {
                showMessage(result.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            showMessage('Network error. Please check your connection.', 'error');
        }
    });

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }
});

async function loadPackages() {
    try {
        const packages = await getPackages();
        const container = document.getElementById('package-list');
        container.innerHTML = packages.map(pkg => `
            <div class="package-card">
                <h3>${pkg.name}</h3>
                <div class="price">$${pkg.price}</div>
                <div class="benefits">${pkg.benefits || ''}</div>
                <a href="#signup" class="btn btn-primary">Choose</a>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load packages:', error);
    }
}