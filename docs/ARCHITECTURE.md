# BillFlow SaaS Architecture

## Product Scope

BillFlow is a commercial multi-tenant SaaS billing and business management platform for business owners and sellers. The same backend is used by the web app and the Capacitor Android shell prepared for Google Play distribution.

## Technology Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: Next.js REST-style route handlers on Node.js
- Database: PostgreSQL with Prisma ORM
- Authentication: bcrypt password hashing, JWT access tokens, refresh tokens
- Payments: Razorpay subscription checkout and verification routes
- PDF: jsPDF invoice generation utilities
- Mobile: Capacitor Android WebView shell pointed at the deployed HTTPS app

## Folder Structure

- `src/app/(auth)`: login and registration screens
- `src/app/(dashboard)`: tenant dashboard, billing, inventory, reports, settings and admin UI
- `src/app/api`: REST API route handlers
- `src/components`: shared UI and layout components
- `src/context`: client authentication context
- `src/lib`: Prisma client, auth helpers, tenant helpers, API responses, PDF generation
- `prisma`: schema and seed data
- `android`: Capacitor Android project
- `docs`: product architecture and delivery notes

## Database Model

Core entities are tenant scoped with a required `tenantId` wherever business data is stored:

- `Tenant`: company profile, invoice settings, bank details, subscription state
- `User`: platform users with `SUPER_ADMIN`, `TENANT_OWNER`, `TENANT_MANAGER`, `TENANT_STAFF`
- `Plan`, `SubscriptionHistory`: SaaS plans and billing history
- `Product`, `Category`, `Brand`, `StockMovement`: catalog and inventory tracking
- `Customer`: customer CRM data and balances
- `Invoice`, `InvoiceItem`, `Payment`: billing engine and payment history
- `Expense`, `ExpenseCategory`: business expense tracking
- `SupportTicket`, `AuditLog`: admin/support foundations

Important constraints:

- Invoice numbers are unique per tenant with `@@unique([tenantId, invoiceNumber])`
- Search-heavy tables include tenant-prefixed indexes
- Product, customer, invoice, payment, stock and expense queries must always filter by `tenantId`

## Multi-Tenant Strategy

Every authenticated request resolves a `TokenPayload` from JWT, then uses `requireTenantContext` to get the active `tenantId`. API queries use tenant-scoped filters through `tenantWhere`. Routes must never trust client-submitted tenant IDs.

Tenant isolation rules:

- Customers must be fetched by current tenant before invoice creation
- Product IDs must be validated against the current tenant before billing or inventory updates
- Stock updates use tenant-scoped conditions and prevent negative stock
- Payments are recorded only against invoices owned by the current tenant

## Authentication Flow

1. Business owner registers with owner, email, password, business name and mobile.
2. Password is hashed with bcrypt.
3. A tenant and owner user are created in one transaction.
4. A free trial plan is assigned.
5. Access and refresh JWTs are issued.
6. Protected APIs read the token from `Authorization: Bearer` or `accessToken` cookie.

Production requirements:

- Replace default local secrets with strong environment secrets.
- Store refresh tokens securely.
- Add rate limiting before public auth endpoints go live.
- Serve only over HTTPS.

## API Structure

- `/api/auth/*`: registration, login, current user
- `/api/business`: tenant company profile
- `/api/dashboard`: dashboard metrics
- `/api/products`, `/api/products/[id]`: catalog CRUD
- `/api/customers`, `/api/customers/[id]`: customer CRUD and summaries
- `/api/invoices`, `/api/invoices/[id]`: invoice creation, search, detail and cancel
- `/api/payments`: payment history and recording
- `/api/inventory`: stock movement history and adjustments
- `/api/expenses`, `/api/expenses/[id]`: expense CRUD
- `/api/subscription/*`: plan listing, Razorpay checkout and verification
- `/api/admin/*`: platform tenant and plan management

## Subscription Strategy

Seeded plans:

- Free Trial: short trial with limited records
- Basic: billing, customers, basic reports
- Professional: inventory, advanced reports, payment tracking, PDF invoices
- Business: multiple users, multiple branches and advanced analytics foundation

Routes should enforce plan limits before creating invoices, users, customers or products. Razorpay IDs must be configured in production seed or admin plan management.

## Android And Play Store

The Android project is a Capacitor wrapper around the deployed web app. For Play Store:

1. Deploy the Next.js app to a public HTTPS domain.
2. Set `CAPACITOR_SERVER_URL` to that HTTPS URL.
3. Run `npx cap sync android`.
4. Build a signed Android App Bundle.
5. Upload `android/app/build/outputs/bundle/release/app-release.aab`.

The app must have a privacy policy URL, screenshots, feature graphic, data safety form, content rating, and production payment configuration before release.

## Delivery Roadmap

1. Project architecture and production configuration.
2. PostgreSQL Prisma schema, tenant indexes and seed data.
3. Authentication, JWT and refresh token flow.
4. Business profile and tenant isolation.
5. Product and customer management.
6. Invoice creation, stock deduction and PDF generation.
7. Billing history, search and payment recording.
8. Inventory stock in/out/adjustment with movement history.
9. Expense management and reports.
10. Razorpay subscriptions and plan restrictions.
11. Super admin panel and owner admin capabilities.
12. Testing, security hardening, production deployment and Play Store release.
