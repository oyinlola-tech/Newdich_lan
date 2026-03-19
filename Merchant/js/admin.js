document.addEventListener('DOMContentLoaded', () => {
    const API = window.MerchantAPI;
    if (!API) {
        alert('API not loaded. Please check api/index.js');
        return;
    }

    document.getElementById('year').textContent = new Date().getFullYear();

    // Check authentication
    const token = API.getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Tab switching
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.dataset.tab;
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Load data for the tab if needed
            if (tabId === 'users') loadUsers();
            if (tabId === 'history') loadHistory();
            if (tabId === 'plans') loadPlansList();
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('merchant_token');
        localStorage.removeItem('merchant_id');
        window.location.href = 'login.html';
    });

    // Plan management
    document.getElementById('add-plan-btn').addEventListener('click', () => showPlanForm());
    document.getElementById('cancel-plan-btn').addEventListener('click', hidePlanForm);
    document.getElementById('plan-form').addEventListener('submit', savePlan);

    // Load initial tab data
    loadUsers();
    loadHistory();
    loadPlansList();
});

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Users
async function loadUsers() {
    try {
        const users = await window.MerchantAPI.getUsers();
        const tbody = document.querySelector('#users-table tbody');
        if (!Array.isArray(users) || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No users found.</td></tr>';
            return;
        }
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${escapeHTML(user.mac)}</td>
                <td>${escapeHTML(user.ip)}</td>
                <td>${escapeHTML(user.email)}</td>
                <td>${escapeHTML(user.plan)}</td>
                <td>${escapeHTML(user.hours_paid_for)}</td>
                <td>${escapeHTML(user.expires_at)}</td>
                <td>${user.active ? 'Active' : 'Inactive'}</td>
                <td><button class="btn btn-secondary" onclick="toggleActive('${escapeHTML(user.mac)}')">Toggle</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

// Payment History
async function loadHistory() {
    try {
        const history = await window.MerchantAPI.getPaymentHistory();
        const tbody = document.querySelector('#history-table tbody');
        if (!Array.isArray(history) || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No payments found.</td></tr>';
            return;
        }
        tbody.innerHTML = history.map(item => `
            <tr>
                <td>${escapeHTML(item.email)}</td>
                <td>NGN ${escapeHTML(item.amount)}</td>
                <td>${escapeHTML(item.status)}</td>
                <td>${escapeHTML(item.transaction_id)}</td>
                <td>${escapeHTML(item.date_started || item.date_completed)}</td>
                <td>${escapeHTML(item.plan)}</td>
                <td>${escapeHTML(item.hours_paid_for)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

// Plans list
async function loadPlansList() {
    try {
        const plans = await window.MerchantAPI.getPlans();
        const container = document.getElementById('plan-list');
        if (!Array.isArray(plans) || plans.length === 0) {
            container.innerHTML = '<div class="plan-item">No plans found.</div>';
            return;
        }
        container.innerHTML = plans.map(plan => `
            <div class="plan-item">
                <span><strong>${escapeHTML(plan.name)}</strong> - ${escapeHTML(plan.duration_hours)} hours - NGN ${escapeHTML(plan.price)}</span>
                <div class="actions">
                    <button class="btn btn-secondary" onclick="editPlan(${plan.id})">Edit</button>
                    <button class="btn btn-secondary" onclick="deletePlan(${plan.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load plans:', error);
    }
}

// Plan form
function showPlanForm(plan = null) {
    document.getElementById('plan-form-container').style.display = 'block';
    document.getElementById('plan-form-title').textContent = plan ? 'Edit Plan' : 'Add Plan';
    if (plan) {
        document.getElementById('plan-id').value = plan.id;
        document.getElementById('plan-name').value = plan.name;
        document.getElementById('plan-duration').value = plan.duration_hours;
        document.getElementById('plan-price').value = plan.price;
    } else {
        document.getElementById('plan-id').value = '';
        document.getElementById('plan-form').reset();
    }
}

function hidePlanForm() {
    document.getElementById('plan-form-container').style.display = 'none';
}

async function savePlan(e) {
    e.preventDefault();
    const id = document.getElementById('plan-id').value;
    const planData = {
        name: document.getElementById('plan-name').value,
        duration_hours: parseInt(document.getElementById('plan-duration').value),
        price: parseFloat(document.getElementById('plan-price').value)
    };

    try {
        if (id) {
            await window.MerchantAPI.updatePlan(id, planData);
        } else {
            await window.MerchantAPI.createPlan(planData);
        }
        hidePlanForm();
        loadPlansList();
    } catch (error) {
        alert(error.message || 'Failed to save plan.');
    }
}

// Edit/Delete functions (called from inline buttons)
window.editPlan = async (id) => {
    const plans = await window.MerchantAPI.getPlans();
    const plan = plans.find(p => p.id == id);
    if (plan) showPlanForm(plan);
};

window.deletePlan = async (id) => {
    if (confirm('Are you sure?')) {
        try {
            await window.MerchantAPI.deletePlan(id);
            loadPlansList();
        } catch (error) {
            alert(error.message || 'Failed to delete plan.');
        }
    }
};

// Toggle active status
window.toggleActive = async (mac) => {
    try {
        await window.MerchantAPI.toggleUserActive(mac);
        loadUsers();
    } catch (error) {
        alert(error.message || 'Failed to toggle user status.');
    }
};
