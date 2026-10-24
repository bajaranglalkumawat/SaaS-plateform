# GitHub Copilot Instructions

## Repository context
This repository is BillFlow, a multi-tenant SaaS billing and business management platform built with Next.js, React, TypeScript, Prisma, and PostgreSQL.

## Important constraints
- Always enforce tenant isolation in API logic.
- Never trust client-submitted tenant IDs.
- Resolve the active tenant from the authenticated request context and apply `tenantId` filters to all business queries.
- Respect the current architecture in `src/app/api`, `src/lib`, and `prisma/schema.prisma`.
- If modifying billing, inventory, auth, subscriptions, or admin flows, validate tenant ownership and user role before making changes.

## Project conventions
- Use the App Router patterns already present in the repo.
- Keep database access validated through Prisma and existing tenant-scoped helpers.
- Maintain consistent response shapes and API behavior with surrounding handlers.
- Prefer small, targeted changes and avoid broad refactors.

## Validation
- Use `npm run lint` for lint verification when relevant.
- Use `npx tsc --noEmit` when type safety is relevant.
- Use `npx prisma generate` after Prisma schema changes.

## Production-minded guidance
- Preserve security-first auth flows and tenant boundaries.
- Avoid introducing cross-tenant access or leaking business data.
- Keep feature work aligned with the architecture documented in `docs/ARCHITECTURE.md`.
