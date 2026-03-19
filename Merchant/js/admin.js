document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();

    // Check authentication
    const token = localStorage.getItem('merchant_token');
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

// Users
async function loadUsers() {
    try {
        const users = await getUsers();
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.mac}</td>
                <td>${user.ip}</td>
                <td>${user.email}</td>
                <td>${user.plan}</td>
                <td>${user.hours_paid_for}</td>
                <td>${user.expires_at}</td>
                <td>${user.active}</td>
                <td><button class="btn btn-secondary" onclick="toggleActive('${user.mac}')">Toggle</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

// Payment History
async function loadHistory() {
    try {
        const history = await getPaymentHistory();
        const tbody = document.querySelector('#history-table tbody');
        tbody.innerHTML = history.map(item => `
            <tr>
                <td>${item.email}</td>
                <td>$${item.amount}</td>
                <td>${item.status}</td>
                <td>${item.transaction_id}</td>
                <td>${item.date_started || item.date_completed}</td>
                <td>${item.plan}</td>
                <td>${item.hours_paid_for}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

// Plans list
async function loadPlansList() {
    try {
        const plans = await getPlans();
        const container = document.getElementById('plan-list');
        container.innerHTML = plans.map(plan => `
            <div class="plan-item">
                <span><strong>${plan.name}</strong> - ${plan.duration_hours} hours - $${plan.price}</span>
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
            await updatePlan(id, planData);
        } else {
            await createPlan(planData);
        }
        hidePlanForm();
        loadPlansList();
    } catch (error) {
        alert('Failed to save plan.');
    }
}

// Edit/Delete functions (called from inline buttons)
window.editPlan = async (id) => {
    const plans = await getPlans();
    const plan = plans.find(p => p.id == id);
    if (plan) showPlanForm(plan);
};

window.deletePlan = async (id) => {
    if (confirm('Are you sure?')) {
        try {
            await deletePlan(id);
            loadPlansList();
        } catch (error) {
            alert('Failed to delete plan.');
        }
    }
};

// Toggle active status
window.toggleActive = async (mac) => {
    // Not implemented in API spec, but you can call a PUT /users/{mac}/toggle if available
    alert('Toggle active not implemented in this demo.');
};