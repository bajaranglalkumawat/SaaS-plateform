import { TokenPayload } from './auth';

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  email: string;
}

/**
 * Asserts that the authenticated user belongs to a valid tenant.
 * SUPER_ADMIN has no tenant — use admin APIs instead of tenant-scoped routes.
 */
export function requireTenantContext(user: TokenPayload | null): TenantContext {
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  if (!user.tenantId) {
    if (user.role === 'SUPER_ADMIN') {
      throw new Error('SUPER_ADMIN_NO_TENANT');
    }
    throw new Error('NO_TENANT_ASSOCIATED');
  }

  return {
    tenantId: user.tenantId,
    userId: user.userId,
    role: user.role,
    email: user.email,
  };
}

/**
 * Helper to build a tenant-scoped Prisma WHERE filter object.
 * Guaranteeing multi-tenant data isolation.
 */
export function tenantWhere<T extends object>(tenantId: string, additionalWhere?: T) {
  return {
    tenantId,
    ...(additionalWhere || {}),
  };
}
