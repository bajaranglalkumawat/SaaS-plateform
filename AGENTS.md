# BillFlow Agent Instructions

## Project Overview
This repository is the BillFlow SaaS platform, a multi-tenant billing and business management app built with Next.js App Router, React, TypeScript, Prisma, and PostgreSQL. The same backend serves the web app and the Android Capacitor wrapper.

## Core Architecture
- Frontend: Next.js 14, React 18, Tailwind CSS
- Backend: Route handlers under `src/app/api` using Node.js server runtime
- Data layer: Prisma ORM with PostgreSQL
- Auth: bcrypt + JWT access/refresh tokens
- Mobile shell: Capacitor Android app under `android/`
- Shared code: `src/lib`, `src/context`, `src/components`

## Mandatory Rules
1. Respect tenant isolation at all times.
   - Never trust client-submitted tenant IDs.
   - Resolve the tenant from the authenticated JWT/session context.
   - Always scope reads and writes by `tenantId`.
2. Prefer existing lib and API patterns.
   - Reuse helper functions in `src/lib` where possible.
   - Follow the current route structure and response conventions.
3. Use Prisma and the existing schema.
   - Do not invent schema fields without checking `prisma/schema.prisma`.
   - Keep queries tenant-scoped and safe.
4. Preserve the project’s App Router conventions.
   - Server actions and route handlers should live in `src/app` when appropriate.
   - Prefer routes and utility logic over ad hoc patterns.
5. Keep authentication and authorization consistent.
   - Validate JWT payloads and tenant access before mutating business data.
   - Treat admin-only actions separately from tenant-scoped actions.

## Working Conventions
- Prefer small, focused changes over broad rewrites.
- Update related types, API responses, and UI usage together when a behavior changes.
- For business logic, keep validation logic near the feature or route rather than burying it in UI components.
- When editing DB-related code, check the Prisma schema and existing tenant filters before making assumptions.
- If a change impacts invoices, payments, inventory, or tenant access, verify tenant scoping explicitly.

## Important Domain Rules
- Invoice numbers are unique per tenant.
- Product, customer, invoice, payment, stock, and expense queries must be filtered by the current tenant.
- Stock updates should not allow negative inventory without explicit validation.
- Payment and invoice actions must only operate on records owned by the active tenant.
- Business profile and subscription logic should respect the active tenant context.

## Useful Commands
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Prisma generate: `npx prisma generate`
- Type check: `npx tsc --noEmit`
- Android sync: `npm run cap:sync`
- Android open: `npm run cap:open`

## Verification Expectations
- Prefer the smallest relevant validation command for the change.
- If the repo lacks a targeted test suite, use TypeScript and lint checks to verify behavior.
- Do not claim a fix is complete without running a proof command.

## File Guidance
- App routes live under `src/app/`
- Shared logic lives under `src/lib/`
- Auth state and client-side auth helpers live under `src/context/` and `src/lib/auth.ts`
- Database schema and seed logic live in `prisma/`
- Android packaging lives under `android/`

## Default Behavior for Agents
When working on this repo:
- Search existing patterns before creating new abstractions.
- Maintain tenant-aware business logic.
- Avoid introducing insecure or cross-tenant access flow.
- Keep code consistent with the repo’s current Next.js conventions and multi-tenant architecture.
