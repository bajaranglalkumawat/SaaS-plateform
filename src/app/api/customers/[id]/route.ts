import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiNotFound, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const customer = await prisma.customer.findFirst({
      where: tenantWhere(ctx.tenantId, { id: params.id }),
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!customer) return apiNotFound('Customer not found');

    const totalPurchases = customer.invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
    const totalPaid = customer.invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
    const totalPending = customer.invoices.reduce((acc, inv) => acc + inv.pendingAmount, 0) + customer.openingBalance;

    return apiSuccess({
      ...customer,
      totalPurchases,
      totalPaid,
      totalPending,
    });
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const body = await req.json();
    const existing = await prisma.customer.findFirst({
      where: tenantWhere(ctx.tenantId, { id: params.id }),
    });

    if (!existing) return apiNotFound('Customer not found');

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: body.name ?? existing.name,
        mobileNumber: body.mobileNumber ?? existing.mobileNumber,
        email: body.email ?? existing.email,
        address: body.address ?? existing.address,
        city: body.city ?? existing.city,
        state: body.state ?? existing.state,
        pincode: body.pincode ?? existing.pincode,
        gstin: body.gstin ?? existing.gstin,
        openingBalance: body.openingBalance !== undefined ? parseFloat(body.openingBalance) : existing.openingBalance,
        notes: body.notes ?? existing.notes,
        status: body.status ?? existing.status,
        blockedReason: body.blockedReason ?? existing.blockedReason,
        blockedAt: body.blockedAt ?? existing.blockedAt,
      },
    });

    return apiSuccess(updated, 'Customer updated successfully');
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const existing = await prisma.customer.findFirst({
      where: tenantWhere(ctx.tenantId, { id: params.id }),
    });

    if (!existing) return apiNotFound('Customer not found');

    await prisma.customer.delete({
      where: { id: params.id },
    });

    return apiSuccess(null, 'Customer deleted');
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
