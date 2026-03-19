# Newdich Merchant Portal

Frontend-only merchant portal for managing users, plans, payments, and profile data.

## Structure

- `Merchant/` main frontend app
- `Merchant/api/index.js` client API wrapper (`window.MerchantAPI`)
- `Merchant/js/` UI logic
- `Merchant/css/style.css` styling

## Quick Start

Open these files directly in a browser or serve the folder with any static server:

- `Merchant/login.html`
- `Merchant/admin.html`
- `Merchant/portal.html`

## Configure API Base URL

By default the app points to:

- `https://your-backend.com/api/merchant`

To override without editing JS, set this global before `api/index.js`:

```html
<script>
  window.MERCHANT_API_BASE_URL = 'https://api.example.com/api/merchant';
</script>
<script src="api/index.js"></script>
```

Or set it from JS:

```js
window.MerchantAPI.setApiBaseUrl('https://api.example.com/api/merchant');
```

## Client APIs Used

The UI uses the following methods from `window.MerchantAPI`:

- `login(credentials)`
- `getPlans()`, `createPlan()`, `updatePlan()`, `deletePlan()`
- `getUsers()`, `toggleUserActive(mac)`, `extendUser(mac, hours)`
- `getPaymentHistory()`, `verifyPayment(reference)`, `refundPayment(transactionId)`
- `getStats()`, `getRevenueSummary()`
- `getMerchantProfile()`, `updateMerchantProfile(data)`

Ensure your backend provides matching endpoints.

## Notes

- Auth token is stored in `localStorage` as `merchant_token`.
- Currency display is `NGN`.
