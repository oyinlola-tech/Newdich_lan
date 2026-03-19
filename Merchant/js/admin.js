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
            if (tabId === 'overview') loadOverview();
            if (tabId === 'users') loadUsers();
            if (tabId === 'history') loadHistory();
            if (tabId === 'plans') loadPlansList();
            if (tabId === 'profile') loadProfile();
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        window.MerchantAPI.clearAuthToken();
        window.location.href = 'login.html';
    });

    // Refresh
    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadOverview();
        loadUsers();
        loadHistory();
        loadPlansList();
        loadProfile();
    });

    // Plan management
    document.getElementById('add-plan-btn').addEventListener('click', () => showPlanForm());
    document.getElementById('cancel-plan-btn').addEventListener('click', hidePlanForm);
    document.getElementById('plan-form').addEventListener('submit', savePlan);

    // Profile
    document.getElementById('profile-form').addEventListener('submit', saveProfile);

    // Users actions
    document.querySelector('#users-table tbody').addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-action="toggle"]');
        const extendBtn = e.target.closest('[data-action="extend"]');
        if (toggleBtn) {
            toggleActive(toggleBtn.getAttribute('data-mac'));
        }
        if (extendBtn) {
            extendUserHours(extendBtn.getAttribute('data-mac'));
        }
    });

    // History actions
    document.querySelector('#history-table tbody').addEventListener('click', (e) => {
        const verifyBtn = e.target.closest('[data-action="verify"]');
        const refundBtn = e.target.closest('[data-action="refund"]');
        if (verifyBtn) {
            verifyTransaction(verifyBtn.getAttribute('data-reference'));
        }
        if (refundBtn) {
            refundTransaction(refundBtn.getAttribute('data-transaction'));
        }
    });

    // Load initial tab data
    loadOverview();
    loadUsers();
    loadHistory();
    loadPlansList();
    loadProfile();
    loadHeaderProfile();
});

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function handleAuthError(error) {
    if (error && error.status === 401) {
        window.MerchantAPI.clearAuthToken();
        window.location.href = 'login.html';
        return true;
    }
    return false;
}

function formatAmount(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '--';
    return `NGN ${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function loadHeaderProfile() {
    try {
        const profile = await window.MerchantAPI.getMerchantProfile();
        const name = profile?.name || profile?.business_name || 'Merchant Dashboard';
        const id = profile?.id || localStorage.getItem('merchant_id') || '--';
        document.getElementById('merchant-name').textContent = name;
        document.getElementById('merchant-id').textContent = `ID: ${id}`;
    } catch (error) {
        if (handleAuthError(error)) return;
        const id = localStorage.getItem('merchant_id') || '--';
        document.getElementById('merchant-id').textContent = `ID: ${id}`;
    }
}

async function loadOverview() {
    try {
        const [stats, revenue] = await Promise.all([
            window.MerchantAPI.getStats(),
            window.MerchantAPI.getRevenueSummary()
        ]);

        const active = stats?.active_users ?? stats?.active ?? '--';
        const total = stats?.total_users ?? stats?.total ?? '--';
        const revenueToday = stats?.revenue_today ?? stats?.today_revenue ?? '--';
        const txToday = stats?.transactions_today ?? stats?.today_transactions ?? '--';

        document.getElementById('stat-active').textContent = active;
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-revenue-today').textContent = formatAmount(revenueToday);
        document.getElementById('stat-tx-today').textContent = txToday;

        const gross = revenue?.gross ?? revenue?.total_gross ?? '--';
        const refunds = revenue?.refunds ?? revenue?.total_refunds ?? '--';
        const net = revenue?.net ?? revenue?.total_net ?? '--';
        document.getElementById('kpi-gross').textContent = formatAmount(gross);
        document.getElementById('kpi-refunds').textContent = formatAmount(refunds);
        document.getElementById('kpi-net').textContent = formatAmount(net);

        const breakdown = revenue?.breakdown || revenue?.daily || [];
        const container = document.getElementById('revenue-breakdown');
        if (!Array.isArray(breakdown) || breakdown.length === 0) {
            container.textContent = 'No breakdown data.';
            return;
        }

        const rows = breakdown.map(item => `
            <div class="mini-row">
                <span>${escapeHTML(item.date || item.label || '')}</span>
                <span>${formatAmount(item.amount ?? item.value)}</span>
            </div>
        `).join('');
        container.innerHTML = rows;
    } catch (error) {
        if (handleAuthError(error)) return;
        console.error('Failed to load overview:', error);
    }
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
                <td>
                    <button class="btn btn-secondary" data-action="toggle" data-mac="${escapeHTML(user.mac)}">Toggle</button>
                    <button class="btn btn-ghost" data-action="extend" data-mac="${escapeHTML(user.mac)}">Extend</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        if (handleAuthError(error)) return;
        console.error('Failed to load users:', error);
    }
}

// Payment History
async function loadHistory() {
    try {
        const history = await window.MerchantAPI.getPaymentHistory();
        const tbody = document.querySelector('#history-table tbody');
        if (!Array.isArray(history) || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No payments found.</td></tr>';
            return;
        }
        tbody.innerHTML = history.map(item => `
            <tr>
                <td>${escapeHTML(item.email)}</td>
                <td>${formatAmount(item.amount)}</td>
                <td>${escapeHTML(item.status)}</td>
                <td>${escapeHTML(item.transaction_id)}</td>
                <td>${escapeHTML(item.date_started || item.date_completed)}</td>
                <td>${escapeHTML(item.plan)}</td>
                <td>${escapeHTML(item.hours_paid_for)}</td>
                <td>
                    <button class="btn btn-ghost" data-action="verify" data-reference="${escapeHTML(item.payment_reference || item.reference || '')}">Verify</button>
                    <button class="btn btn-secondary" data-action="refund" data-transaction="${escapeHTML(item.transaction_id || '')}">Refund</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        if (handleAuthError(error)) return;
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
        if (handleAuthError(error)) return;
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

async function extendUserHours(mac) {
    const input = prompt('Extend by how many hours?', '1');
    if (!input) return;
    const hours = Number(input);
    if (!Number.isFinite(hours) || hours <= 0) {
        alert('Please enter a valid number of hours.');
        return;
    }
    try {
        await window.MerchantAPI.extendUser(mac, hours);
        loadUsers();
    } catch (error) {
        alert(error.message || 'Failed to extend user.');
    }
}

async function verifyTransaction(reference) {
    if (!reference) {
        alert('No payment reference found.');
        return;
    }
    try {
        await window.MerchantAPI.verifyPayment(reference);
        loadHistory();
    } catch (error) {
        alert(error.message || 'Failed to verify payment.');
    }
}

async function refundTransaction(transactionId) {
    if (!transactionId) {
        alert('No transaction ID found.');
        return;
    }
    if (!confirm('Refund this transaction?')) return;
    try {
        await window.MerchantAPI.refundPayment(transactionId);
        loadHistory();
    } catch (error) {
        alert(error.message || 'Refund failed.');
    }
}

async function loadProfile() {
    try {
        const profile = await window.MerchantAPI.getMerchantProfile();
        document.getElementById('profile-name').value = profile?.name || profile?.business_name || '';
        document.getElementById('profile-contact').value = profile?.contact_email || profile?.email || '';
        document.getElementById('profile-phone').value = profile?.phone || '';
        document.getElementById('profile-location').value = profile?.location || '';
        document.getElementById('profile-network').value = profile?.network_name || '';
        document.getElementById('profile-timezone').value = profile?.timezone || '';
    } catch (error) {
        if (handleAuthError(error)) return;
        console.error('Failed to load profile:', error);
    }
}

async function saveProfile(e) {
    e.preventDefault();
    const messageEl = document.getElementById('profile-message');
    messageEl.textContent = 'Saving...';
    try {
        await window.MerchantAPI.updateMerchantProfile({
            name: document.getElementById('profile-name').value.trim(),
            contact_email: document.getElementById('profile-contact').value.trim(),
            phone: document.getElementById('profile-phone').value.trim(),
            location: document.getElementById('profile-location').value.trim(),
            network_name: document.getElementById('profile-network').value.trim(),
            timezone: document.getElementById('profile-timezone').value.trim()
        });
        messageEl.textContent = 'Saved.';
        loadHeaderProfile();
    } catch (error) {
        messageEl.textContent = error.message || 'Save failed.';
    }
}
