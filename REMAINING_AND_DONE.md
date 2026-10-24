# BillFlow — Remaining & Done Checklist

## Completed in this session

- [x] **MongoDB Atlas configured** — Prisma provider switched to `mongodb`, `DATABASE_URL` points at Atlas DB `billflow` (password `@` URL-encoded), `prisma generate` + `db push` + seed succeeded
- [x] Full audit of multi-tenant SaaS + admin + Android path
- [x] TypeScript check clean (`tsc --noEmit`)
- [x] Production build clean (`npm run build`)
- [x] **SUPER_ADMIN auth edge cases**
  - No-tenant context rejected for tenant APIs (`src/lib/tenant.ts`)
    - AuthContext clears tenant when null; blocks deactivated users
    - Dashboard layout redirects SUPER_ADMIN away from tenant pages → `/admin`
    - Login routes SUPER_ADMIN → `/admin`, staff → `/customer-dashboard`
    - Settings page is platform-aware (no broken business/subscription links)
- [x] **Missing customer portal routes** (sidebar 404s fixed)
  - `/customer-invoices`
  - `/customer-payments`
  - `/customer-profile`
- [x] **Plan feature enforcement**
  - Inventory API gated by `hasInventory`
  - Customer reports API gated by `hasAdvancedReports`
  - Create limits already present for invoices / products / customers
- [x] Seed runner fixed for Windows: `npm run db:seed` → `node prisma/seed.js`
- [x] Prisma seed config added in `package.json`

## Already done earlier (verified, not re-done)

- [x] Prisma enum import fixes (`src/lib/enums.ts`)
- [x] Pages: payments, inventory, settings, admin
- [x] Capacitor Android project (`android/`, `capacitor.config.ts`, `PLAY_STORE.md`)
- [x] Admin APIs: `/api/admin/tenants`, `/api/admin/tenants/[id]`, `/api/admin/plans`, `/api/admin/plans/[id]`
- [x] Admin UI: Overview / Customers / Packages (create/edit packages, assign plan, status, suspend/activate, search/filter)
- [x] SUPER_ADMIN sidebar simplification
- [x] Privacy page at `/privacy`
- [x] Registration assigns Free Trial plan (14 days)
- [x] Razorpay subscription checkout/verify routes (need live keys)

---

## Still needs USER action

### 1) Database — DONE (MongoDB Atlas)

- Prisma uses MongoDB; Atlas URI configured in `.env` (DB name `billflow`)
- Collections/indexes pushed; plans + SUPER_ADMIN seeded
- If future connection errors occur, check Atlas Network Access IP allowlist (and that special chars in the password stay URL-encoded)

### 2) SUPER_ADMIN login

| Field | Value |
|--------|--------|
| Email | `admin@saasplatform.com` |
| Password | `AdminPass123!` |
| Opens | `/admin` Platform Admin Panel |

Change this password after first login in production. Rotate the Atlas DB password if it was shared in chat.

### 3) Razorpay (paid subscriptions)

- [ ] Create Razorpay account
- [ ] Put live/test keys in `.env`:
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
- [ ] Optionally map Razorpay plan IDs on Plan records

### 4) Hosting / public URL

- [ ] Deploy Next.js (Vercel / Railway / VPS) with HTTPS
- [ ] Set `NEXT_PUBLIC_APP_URL` (and related env) to live domain
- [ ] Point Capacitor at live URL:

```powershell
$env:CAPACITOR_SERVER_URL="https://YOUR-LIVE-DOMAIN.com"
npm run android:sync
```

### 5) Android / Play Store

Follow `PLAY_STORE.md`:

- [ ] Install Android Studio + SDK
- [ ] Create release keystore + `android/keystore.properties`
- [ ] Build signed AAB (`npm run android:open` or Gradle)
- [ ] Google Play Developer account ($25)
- [ ] Upload AAB, store listing, screenshots, feature graphic, data safety
- [ ] **Privacy Policy URL** (app already has `/privacy` — host it publicly)

### 6) Security / ops before production

- [ ] Replace JWT secrets in `.env` with strong unique values
- [ ] Rotate SUPER_ADMIN password
- [ ] Confirm CORS / HTTPS / cookie settings for your host
- [ ] Backups for MongoDB Atlas

---

## Quick verify

```powershell
npm run dev
# Login: admin@saasplatform.com / AdminPass123!
# Open: http://localhost:3000/admin
```

## Notes

- Admin panel can manage businesses (assign package, change status, suspend/activate logins) and packages (create/edit/deactivate).
- Plan limits block creating invoices/products/customers when capped or subscription expired/canceled.
- Android app is a Capacitor WebView shell around the hosted Next.js site — not a fully offline native rewrite.
