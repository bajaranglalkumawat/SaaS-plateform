import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-response';
import { requireSuperAdmin, isErrorResponse } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSuperAdmin(req);
    if (isErrorResponse(auth)) return auth;

    const existing = await prisma.plan.findUnique({ where: { id: params.id } });
    if (!existing) return apiNotFound('Package not found');

    const body = await req.json();
    const {
      name,
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

    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(monthlyPrice !== undefined && { monthlyPrice: parseFloat(monthlyPrice) }),
        ...(yearlyPrice !== undefined && { yearlyPrice: parseFloat(yearlyPrice) }),
        ...(maxInvoices !== undefined && { maxInvoices: parseInt(maxInvoices, 10) }),
        ...(maxProducts !== undefined && { maxProducts: parseInt(maxProducts, 10) }),
        ...(maxUsers !== undefined && { maxUsers: parseInt(maxUsers, 10) }),
        ...(maxCustomers !== undefined && { maxCustomers: parseInt(maxCustomers, 10) }),
        ...(hasInventory !== undefined && { hasInventory: !!hasInventory }),
        ...(hasAdvancedReports !== undefined && { hasAdvancedReports: !!hasAdvancedReports }),
        ...(hasMultipleBranches !== undefined && { hasMultipleBranches: !!hasMultipleBranches }),
        ...(isActive !== undefined && { isActive: !!isActive }),
      },
    });

    return apiSuccess(plan, 'Package updated successfully');
  } catch (error: any) {
    return apiError(error.message || 'Failed to update package', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSuperAdmin(req);
    if (isErrorResponse(auth)) return auth;

    const existing = await prisma.plan.findUnique({
      where: { id: params.id },
      include: { _count: { select: { tenants: true } } },
    });
    if (!existing) return apiNotFound('Package not found');

    // Soft-delete: deactivate so existing tenants keep history
    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return apiSuccess(
      plan,
      existing._count.tenants > 0
        ? 'Package deactivated (still assigned to some businesses)'
        : 'Package deactivated'
    );
  } catch (error: any) {
    return apiError(error.message || 'Failed to deactivate package', 500);
  }
}
