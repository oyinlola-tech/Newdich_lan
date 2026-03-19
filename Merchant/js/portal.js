document.addEventListener('DOMContentLoaded', () => {
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
            const result = await initiatePayment({
                plan_id: selectedPlan.id,
                email: email || undefined
            });
            if (result.payment_reference) {
                messageEl.innerHTML = `Payment initiated. Reference: ${result.payment_reference}<br>Complete payment using the gateway.`;
                // In real implementation, you would redirect to payment gateway or show instructions
            } else {
                messageEl.textContent = 'Payment initiation failed.';
            }
        } catch (error) {
            messageEl.textContent = 'Error. Please try again.';
        }
    });
});

async function loadPlans() {
    try {
        const plans = await getPlans(); // public endpoint, no auth needed
        const container = document.getElementById('plan-list');
        container.innerHTML = plans.map(plan => `
            <div class="plan-card">
                <h3>${plan.name}</h3>
                <div class="price">$${plan.price}</div>
                <div>${plan.duration_hours} hour(s)</div>
                <button class="btn btn-primary" onclick='openModal(${JSON.stringify(plan)})'>Buy</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load plans:', error);
    }
}