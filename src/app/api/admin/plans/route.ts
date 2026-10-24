import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireSuperAdmin, isErrorResponse } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin(req);
    if (isErrorResponse(auth)) return auth;

    const plans = await prisma.plan.findMany({
      include: {
        _count: { select: { tenants: true, subscriptions: true } },
      },
      orderBy: { monthlyPrice: 'asc' },
    });

    return apiSuccess(plans);
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin(req);
    if (isErrorResponse(auth)) return auth;

    const body = await req.json();
    const {
      name,
      code,
      description,
      monthlyPrice,
      yearlyPrice,
      maxInvoices,
      maxProducts,
      maxUsers,
      maxCustomers,
      hasInventory,
      hasAdvancedReports,
      hasMultipleBranches,
      isActive,
    } = body;

    if (!name || !code) {
      return apiError('Package name and code are required', 400);
    }

    const existing = await prisma.plan.findFirst({
      where: { OR: [{ code: String(code).toLowerCase().trim() }, { name }] },
    });
    if (existing) {
      return apiError('A package with this name or code already exists', 400);
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        code: String(code).toLowerCase().trim().replace(/\s+/g, '_'),
        description: description || null,
        monthlyPrice: parseFloat(monthlyPrice || '0'),
        yearlyPrice: parseFloat(yearlyPrice || '0'),
        maxInvoices: parseInt(maxInvoices ?? '50', 10),
        maxProducts: parseInt(maxProducts ?? '100', 10),
        maxUsers: parseInt(maxUsers ?? '1', 10),
        maxCustomers: parseInt(maxCustomers ?? '100', 10),
        hasInventory: hasInventory !== false,
        hasAdvancedReports: !!hasAdvancedReports,
        hasMultipleBranches: !!hasMultipleBranches,
        isActive: isActive !== false,
      },
    });

    return apiSuccess(plan, 'Package created successfully', 201);
  } catch (error: any) {
    console.error('Admin plan create error:', error);
    return apiError(error.message || 'Failed to create package', 500);
  }
}
