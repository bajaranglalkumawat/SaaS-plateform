import { NextRequest } from 'next/server';
import { getAuthUser, TokenPayload } from '@/lib/auth';
import { apiForbidden, apiUnauthorized } from '@/lib/api-response';

export async function requireSuperAdmin(req: NextRequest): Promise<TokenPayload | Response> {
  const authUser = await getAuthUser(req);
  if (!authUser) return apiUnauthorized();
  if (authUser.role !== 'SUPER_ADMIN') {
    return apiForbidden('Only Super Admin can access this');
  }
  return authUser;
}

export function isErrorResponse(value: TokenPayload | Response): value is Response {
  return value instanceof Response;
}
