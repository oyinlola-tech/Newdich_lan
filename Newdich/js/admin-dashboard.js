document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();

    // Check authentication
    const token = localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = 'admin-login.html';
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

            if (tabId === 'packages') loadPackagesList();
            if (tabId === 'merchants') loadMerchants();
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_id');
        window.location.href = 'admin-login.html';
    });

    // Package management
    document.getElementById('add-package-btn').addEventListener('click', () => showPackageForm());
    document.getElementById('cancel-package-btn').addEventListener('click', hidePackageForm);
    document.getElementById('package-form').addEventListener('submit', savePackage);

    // Load initial tab data
    loadPackagesList();
    loadMerchants();
});

// Packages
async function loadPackagesList() {
    try {
        const packages = await adminGetPackages(); // authenticated call
        const container = document.getElementById('package-list');
        container.innerHTML = packages.map(pkg => `
            <div class="plan-item">
                <span><strong>${pkg.name}</strong> - $${pkg.price}</span>
                <span>${pkg.benefits || ''}</span>
                <div class="actions">
                    <button class="btn btn-secondary" onclick="editPackage(${pkg.id})">Edit</button>
                    <button class="btn btn-secondary" onclick="deletePackage(${pkg.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load packages:', error);
    }
}

function showPackageForm(pkg = null) {
    document.getElementById('package-form-container').style.display = 'block';
    document.getElementById('package-form-title').textContent = pkg ? 'Edit Package' : 'Add Package';
    if (pkg) {
        document.getElementById('package-id').value = pkg.id;
        document.getElementById('package-name').value = pkg.name;
        document.getElementById('package-price').value = pkg.price;
        document.getElementById('package-benefits').value = pkg.benefits || '';
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
        name: document.getElementById('package-name').value,
        price: parseFloat(document.getElementById('package-price').value),
        benefits: document.getElementById('package-benefits').value
    };

    try {
        if (id) {
            await adminUpdatePackage(id, packageData);
        } else {
            await adminCreatePackage(packageData);
        }
        hidePackageForm();
        loadPackagesList();
    } catch (error) {
        alert('Failed to save package.');
    }
}

window.editPackage = async (id) => {
    const packages = await adminGetPackages();
    const pkg = packages.find(p => p.id == id);
    if (pkg) showPackageForm(pkg);
};

window.deletePackage = async (id) => {
    if (confirm('Are you sure?')) {
        try {
            await adminDeletePackage(id);
            loadPackagesList();
        } catch (error) {
            alert('Failed to delete package.');
        }
    }
};

// Merchants
async function loadMerchants() {
    try {
        const merchants = await adminGetMerchants();
        const tbody = document.querySelector('#merchants-table tbody');
        tbody.innerHTML = merchants.map(m => `
            <tr>
                <td>${m.merchant_id}</td>
                <td>${m.fullname}</td>
                <td>${m.email}</td>
                <td>${m.phone}</td>
                <td>${m.business_name || '-'}</td>
                <td>${m.city}, ${m.state}</td>
                <td>${m.status || 'pending'}</td>
                <td>${m.date_created}</td>
                <td>
                    <button class="btn btn-secondary" onclick="approveMerchant(${m.merchant_id})">Approve</button>
                    <button class="btn btn-secondary" onclick="rejectMerchant(${m.merchant_id})">Reject</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load merchants:', error);
    }
}

window.approveMerchant = async (id) => {
    if (confirm('Approve this merchant?')) {
        try {
            await adminUpdateMerchantStatus(id, 'approved');
            loadMerchants();
        } catch (error) {
            alert('Failed to update status.');
        }
    }
};

window.rejectMerchant = async (id) => {
    if (confirm('Reject this merchant?')) {
        try {
            await adminUpdateMerchantStatus(id, 'rejected');
            loadMerchants();
        } catch (error) {
            alert('Failed to update status.');
        }
    }
};