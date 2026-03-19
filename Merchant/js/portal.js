let plansById = new Map();

document.addEventListener('DOMContentLoaded', () => {
    const API = window.MerchantAPI;
    if (!API) {
        alert('API not loaded. Please check api/index.js');
        return;
    }

    document.getElementById('year').textContent = new Date().getFullYear();

    // You can set network name from merchant settings (via API or URL param)
    // For now, fetch merchant details or use placeholder
    loadPlans();

    // Modal handling
    const modal = document.getElementById('payment-modal');
    const closeBtn = document.querySelector('.close');
    const paymentForm = document.getElementById('payment-form');

    let selectedPlan = null;

    window.openModal = function(plan) {
        selectedPlan = plan;
        document.getElementById('modal-plan-name').textContent = plan.name;
        document.getElementById('modal-plan-price').textContent = plan.price;
        modal.style.display = 'block';
    };

    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('payment-email').value.trim();
        const messageEl = document.getElementById('payment-message');
        messageEl.textContent = 'Processing...';

        try {
            const result = await API.initiatePayment({
                plan_id: selectedPlan.id,
                email: email || undefined
            });
            if (result.payment_reference) {
                messageEl.textContent = `Payment initiated. Reference: ${result.payment_reference}. Complete payment using the gateway.`;
                // In real implementation, you would redirect to payment gateway or show instructions
            } else {
                messageEl.textContent = 'Payment initiation failed.';
            }
        } catch (error) {
            messageEl.textContent = 'Error. Please try again.';
        }
    });

    document.getElementById('plan-list').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-plan-id]');
        if (!btn) return;
        const plan = plansById.get(btn.getAttribute('data-plan-id'));
        if (plan) window.openModal(plan);
    });
});

async function loadPlans() {
    try {
        const plans = await window.MerchantAPI.getPlans(); // public endpoint, no auth needed
        const container = document.getElementById('plan-list');
        if (!Array.isArray(plans) || plans.length === 0) {
            container.innerHTML = '<div class="plan-card">No plans available.</div>';
            return;
        }

        const safe = (value) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const byId = new Map();
        plans.forEach(p => byId.set(String(p.id), p));
        const html = plans.map(plan => `
            <div class="plan-card">
                <h3>${safe(plan.name)}</h3>
                <div class="price">NGN ${safe(plan.price)}</div>
                <div>${safe(plan.duration_hours)} hour(s)</div>
                <button class="btn btn-primary" data-plan-id="${safe(plan.id)}">Buy</button>
            </div>
        `).join('');
        container.innerHTML = html;
        plansById = byId;
    } catch (error) {
        console.error('Failed to load plans:', error);
    }
}
