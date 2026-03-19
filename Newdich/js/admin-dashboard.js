import {
    adminGetStats,
    adminGetPackages,
    adminCreatePackage,
    adminUpdatePackage,
    adminDeletePackage,
    adminGetMerchants,
    adminSearchMerchants,
    adminUpdateMerchantStatus
} from '../api/index.js';

const state = {
    packages: [],
    merchants: [],
    filters: {
        packageSearch: '',
        merchantSearch: '',
        merchantStatus: 'all'
    },
    loading: {
        packages: false,
        merchants: false,
        stats: false
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();

    // Check authentication
    const token = localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    bindEvents();
    loadDashboard();
});

function bindEvents() {
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

            if (tabId === 'packages') loadPackages();
            if (tabId === 'merchants') loadMerchants();
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_id');
        window.location.href = 'admin-login.html';
    });

    // Dashboard refresh
    document.getElementById('refresh-dashboard').addEventListener('click', loadDashboard);

    // Package management
    document.getElementById('add-package-btn').addEventListener('click', () => showPackageForm());
    document.getElementById('cancel-package-btn').addEventListener('click', hidePackageForm);
    document.getElementById('package-form').addEventListener('submit', savePackage);
    document.getElementById('refresh-packages').addEventListener('click', loadPackages);
    document.getElementById('package-search').addEventListener('input', (e) => {
        state.filters.packageSearch = e.target.value.trim().toLowerCase();
        renderPackages();
    });
    document.getElementById('package-list').addEventListener('click', handlePackageActions);

    // Merchant management
    document.getElementById('refresh-merchants').addEventListener('click', loadMerchants);
    document.getElementById('merchant-search').addEventListener('input', (e) => {
        state.filters.merchantSearch = e.target.value.trim().toLowerCase();
        renderMerchants();
    });
    document.getElementById('merchant-status-filter').addEventListener('change', (e) => {
        state.filters.merchantStatus = e.target.value;
        renderMerchants();
    });
    document.querySelector('#merchants-table tbody').addEventListener('click', handleMerchantActions);
}

async function loadDashboard() {
    setMessage('');
    await Promise.all([loadStats(), loadPackages(), loadMerchants()]);
}

async function loadStats() {
    state.loading.stats = true;
    try {
        const stats = await adminGetStats();
        updateStats(stats);
    } catch (error) {
        // Fall back to computed stats after data loads.
        updateStats(computeStats());
    } finally {
        state.loading.stats = false;
    }
}

function updateStats(stats) {
    const safeStats = stats || computeStats();
    document.getElementById('stat-total-merchants').textContent = safeStats.totalMerchants ?? '--';
    document.getElementById('stat-pending-merchants').textContent = safeStats.pendingMerchants ?? '--';
    document.getElementById('stat-approved-merchants').textContent = safeStats.approvedMerchants ?? '--';
    document.getElementById('stat-packages').textContent = safeStats.totalPackages ?? '--';
}

function computeStats() {
    const totalMerchants = state.merchants.length;
    const pendingMerchants = state.merchants.filter(m => (m.status || 'pending') === 'pending').length;
    const approvedMerchants = state.merchants.filter(m => m.status === 'approved').length;
    const totalPackages = state.packages.length;
    return { totalMerchants, pendingMerchants, approvedMerchants, totalPackages };
}

// Packages
async function loadPackages() {
    state.loading.packages = true;
    try {
        const packages = await adminGetPackages();
        state.packages = Array.isArray(packages) ? packages : packages.data || [];
        renderPackages();
        updateStats(computeStats());
    } catch (error) {
        setMessage(error.message || 'Failed to load packages.', 'error');
    } finally {
        state.loading.packages = false;
    }
}

function renderPackages() {
    const container = document.getElementById('package-list');
    const query = state.filters.packageSearch;
    const filtered = state.packages.filter(pkg => {
        if (!query) return true;
        return (
            pkg.name?.toLowerCase().includes(query) ||
            pkg.benefits?.toLowerCase().includes(query)
        );
    });

    if (!filtered.length) {
        container.innerHTML = `
            <div class="empty-state">No packages found. Create the first one to get started.</div>
        `;
        return;
    }

    container.innerHTML = filtered.map(pkg => {
        const benefits = formatBenefits(pkg.benefits);
        return `
            <div class="plan-item">
                <div>
                    <div class="plan-title">${pkg.name || 'Untitled Package'}</div>
                    <div class="plan-meta">₦${Number(pkg.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    ${benefits}
                </div>
                <div class="actions">
                    <button class="btn btn-secondary" data-action="edit" data-id="${pkg.id}">Edit</button>
                    <button class="btn btn-secondary" data-action="delete" data-id="${pkg.id}">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function formatBenefits(benefits) {
    if (!benefits) return '<div class="muted">No benefits listed.</div>';
    const list = benefits.split(',').map(item => item.trim()).filter(Boolean);
    if (!list.length) return '<div class="muted">No benefits listed.</div>';
    return `<div class="benefit-tags">${list.map(item => `<span class="tag">${item}</span>`).join('')}</div>`;
}

function showPackageForm(pkg = null) {
    document.getElementById('package-form-container').style.display = 'block';
    document.getElementById('package-form-title').textContent = pkg ? 'Edit Package' : 'Add Package';
    if (pkg) {
        document.getElementById('package-id').value = pkg.id;
        document.getElementById('package-name').value = pkg.name || '';
        document.getElementById('package-price').value = pkg.price ?? '';
        document.getElementById('package-benefits').value = pkg.benefits || '';
        document.getElementById('package-notes').value = pkg.notes || '';
    } else {
        document.getElementById('package-id').value = '';
        document.getElementById('package-form').reset();
    }
}

function hidePackageForm() {
    document.getElementById('package-form-container').style.display = 'none';
}

async function savePackage(e) {
    e.preventDefault();
    const id = document.getElementById('package-id').value;
    const packageData = {
        name: document.getElementById('package-name').value.trim(),
        price: parseFloat(document.getElementById('package-price').value),
        benefits: document.getElementById('package-benefits').value.trim(),
        notes: document.getElementById('package-notes').value.trim()
    };

    try {
        if (id) {
            await adminUpdatePackage(id, packageData);
        } else {
            await adminCreatePackage(packageData);
        }
        hidePackageForm();
        setMessage('Package saved successfully.', 'success');
        loadPackages();
    } catch (error) {
        setMessage(error.message || 'Failed to save package.', 'error');
    }
}

async function handlePackageActions(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    const pkg = state.packages.find(p => String(p.id) === String(id));

    if (action === 'edit' && pkg) {
        showPackageForm(pkg);
    }

    if (action === 'delete') {
        if (!confirm('Delete this package?')) return;
        try {
            await adminDeletePackage(id);
            setMessage('Package deleted.', 'success');
            loadPackages();
        } catch (error) {
            setMessage(error.message || 'Failed to delete package.', 'error');
        }
    }
}

// Merchants
async function loadMerchants() {
    state.loading.merchants = true;
    try {
        const query = state.filters.merchantSearch;
        const status = state.filters.merchantStatus === 'all' ? '' : state.filters.merchantStatus;
        let merchants;

        if (query || status) {
            try {
                merchants = await adminSearchMerchants({ query, status, limit: 100, offset: 0 });
            } catch (error) {
                merchants = await adminGetMerchants();
            }
        } else {
            merchants = await adminGetMerchants();
        }

        state.merchants = Array.isArray(merchants) ? merchants : merchants.data || [];
        renderMerchants();
        updateStats(computeStats());
    } catch (error) {
        setMessage(error.message || 'Failed to load merchants.', 'error');
    } finally {
        state.loading.merchants = false;
    }
}

function renderMerchants() {
    const tbody = document.querySelector('#merchants-table tbody');
    const emptyState = document.getElementById('merchants-empty');
    const query = state.filters.merchantSearch;
    const statusFilter = state.filters.merchantStatus;

    const filtered = state.merchants.filter(m => {
        const status = (m.status || 'pending').toLowerCase();
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (!query) return true;
        const haystack = `${m.fullname || ''} ${m.email || ''} ${m.phone || ''} ${m.business_name || ''}`.toLowerCase();
        return haystack.includes(query);
    });

    if (!filtered.length) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    tbody.innerHTML = filtered.map(m => {
        const status = (m.status || 'pending').toLowerCase();
        const badgeClass = status === 'approved'
            ? 'badge-success'
            : status === 'rejected'
                ? 'badge-danger'
                : 'badge-warning';
        return `
            <tr>
                <td>${m.fullname || '-'}</td>
                <td>${m.email || '-'}</td>
                <td>${m.phone || '-'}</td>
                <td>${m.business_name || '-'}</td>
                <td>${formatLocation(m.city, m.state)}</td>
                <td><span class="badge ${badgeClass}">${status}</span></td>
                <td>${formatDate(m.date_created)}</td>
                <td>
                    <button class="btn btn-secondary" data-action="approve" data-id="${m.merchant_id}" ${status === 'approved' ? 'disabled' : ''}>Approve</button>
                    <button class="btn btn-secondary" data-action="reject" data-id="${m.merchant_id}" ${status === 'rejected' ? 'disabled' : ''}>Reject</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleMerchantActions(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === 'approve') {
        if (!confirm('Approve this merchant?')) return;
        await updateMerchantStatus(id, 'approved');
    }

    if (action === 'reject') {
        if (!confirm('Reject this merchant?')) return;
        await updateMerchantStatus(id, 'rejected');
    }
}

async function updateMerchantStatus(id, status) {
    try {
        await adminUpdateMerchantStatus(id, status);
        setMessage(`Merchant ${status}.`, 'success');
        loadMerchants();
    } catch (error) {
        setMessage(error.message || 'Failed to update status.', 'error');
    }
}

function formatLocation(city, stateName) {
    if (!city && !stateName) return '-';
    if (city && stateName) return `${city}, ${stateName}`;
    return city || stateName || '-';
}

function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

function setMessage(text, type = '') {
    const message = document.getElementById('admin-message');
    if (!message) return;
    if (!text) {
        message.textContent = '';
        message.className = 'message';
        message.style.display = 'none';
        return;
    }
    message.style.display = 'block';
    message.textContent = text;
    message.className = `message ${type}`;
}
