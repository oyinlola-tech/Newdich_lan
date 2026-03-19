# Newdich Lan Frontends

This repo contains two separate frontend apps:

- `Newdich/` marketing + merchant onboarding site
- `Merchant/` merchant portal (admin + captive portal)

## Newdich (Marketing + Signup)

Entry point:

- `Newdich/index.html`

Key files:

- `Newdich/api/index.js` basic API client
- `Newdich/js/main.js` page logic
- `Newdich/css/style.css` styling

APIs used by `Newdich`:

- `GET /api/packages` via `getPackages()`
- `POST /api/merchants/register` via `registerMerchant(data)`

Default API base:

- `https://your-backend.com/api`

## Merchant (Portal + Admin)

Entry points:

- `Merchant/login.html`
- `Merchant/admin.html`
- `Merchant/portal.html`

Key files:

- `Merchant/api/index.js` client API wrapper (`window.MerchantAPI`)
- `Merchant/js/admin.js` admin UI
- `Merchant/js/login.js` login UI
- `Merchant/js/portal.js` captive portal UI
- `Merchant/css/style.css` styling

APIs used by `Merchant`:

- Auth: `login(credentials)`
- Plans: `getPlans()`, `createPlan()`, `updatePlan()`, `deletePlan()`
- Users: `getUsers()`, `toggleUserActive(mac)`, `extendUser(mac, hours)`
- Payments: `getPaymentHistory()`, `verifyPayment(reference)`, `refundPayment(transactionId)`
- Insights: `getStats()`, `getRevenueSummary()`
- Profile: `getMerchantProfile()`, `updateMerchantProfile(data)`

Default API base:

- `https://your-backend.com/api/merchant`

## Configure API Base URLs

You can override each app’s API base without editing JS by setting a global before the API script.

Newdich:

```html
<script>
  window.NEWDICH_API_BASE_URL = 'https://api.example.com/api';
</script>
<script src="api/index.js"></script>
```

Merchant:

```html
<script>
  window.MERCHANT_API_BASE_URL = 'https://api.example.com/api/merchant';
</script>
<script src="api/index.js"></script>
```

## Notes

- Auth token is stored in `localStorage` as `merchant_token`.
- Currency display is `NGN` in Merchant and `$` in Newdich packages (update as needed).
