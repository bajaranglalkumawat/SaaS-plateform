import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireSuperAdmin, isErrorResponse } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin(req);
    if (isErrorResponse(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const tenants = await prisma.tenant.findMany({
      where: {
        ...(status && { subscriptionStatus: status }),
        ...(search && {
          OR: [
            { businessName: { contains: search } },
            { ownerName: { contains: search } },
            { email: { contains: search } },
            { mobileNumber: { contains: search } },
          ],
        }),
      },
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            whatsapp: true,
            city: true,
            state: true,
            designation: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: { users: true, invoices: true, customers: true, products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const [totalUsers, totalRevenue, plansCount] = await Promise.all([
      prisma.user.count(),
      prisma.subscriptionHistory.aggregate({ _sum: { amount: true } }),
      prisma.plan.count(),
    ]);

    const metrics = {
      totalBusinesses: await prisma.tenant.count(),
      activeBusinesses: await prisma.tenant.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      trialingBusinesses: await prisma.tenant.count({ where: { subscriptionStatus: 'TRIALING' } }),
      expiredBusinesses: await prisma.tenant.count({ where: { subscriptionStatus: 'EXPIRED' } }),
      canceledBusinesses: await prisma.tenant.count({ where: { subscriptionStatus: 'CANCELED' } }),
      totalUsers,
      plansCount,
      platformRevenue: totalRevenue._sum.amount || 0,
    };

    return apiSuccess({ metrics, tenants });
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
