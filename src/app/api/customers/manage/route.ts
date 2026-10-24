import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiError, apiForbidden } from '@/lib/api-response';

// GET: Fetch all customers with advanced filters for owner admin panel
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const customers = await prisma.customer.findMany({
      where: tenantWhere(ctx.tenantId, {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { mobileNumber: { contains: search } },
            { email: { contains: search, mode: 'insensitive' } },
            { gstin: { contains: search } },
          ],
        }),
        ...(status && { status }),
      }),
      include: {
        _count: {
          select: { invoices: true, payments: true },
        },
        invoices: {
          select: { grandTotal: true, paidAmount: true, pendingAmount: true, paymentStatus: true },
        },
        payments: {
          select: { amount: true, paymentDate: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
    });

    const formatted = customers.map((c) => {
      const totalPurchases = c.invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
      const totalPaid = c.invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
      const totalPending = c.invoices.reduce((acc, inv) => acc + inv.pendingAmount, 0) + c.openingBalance;
      const lastPaymentDate = c.payments.length > 0 
        ? new Date(Math.max(...c.payments.map(p => new Date(p.paymentDate).getTime())))
        : null;

      return {
        id: c.id,
        name: c.name,
        mobileNumber: c.mobileNumber,
        email: c.email,
        address: c.address,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        gstin: c.gstin,
        openingBalance: c.openingBalance,
        notes: c.notes,
        status: c.status,
        blockedReason: c.blockedReason,
        blockedAt: c.blockedAt,
        totalInvoices: c._count.invoices,
        totalPayments: c._count.payments,
        totalPurchases,
        totalPaid,
        totalPending,
        lastPaymentDate,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    // Calculate summary metrics
    const metrics = {
      total: formatted.length,
      active: formatted.filter(c => c.status === 'ACTIVE').length,
      blocked: formatted.filter(c => c.status === 'BLOCKED').length,
      totalRevenue: formatted.reduce((acc, c) => acc + c.totalPurchases, 0),
      totalPending: formatted.reduce((acc, c) => acc + c.totalPending, 0),
      totalPaid: formatted.reduce((acc, c) => acc + c.totalPaid, 0),
    };

    return apiSuccess({ customers: formatted, metrics });
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

// POST: Block/Unblock customer or perform other actions
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const body = await req.json();
    const { customerId, action, reason } = body;

    if (!customerId || !action) {
      return apiError('customerId and action are required', 400);
    }

    // Verify customer belongs to tenant
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.tenantId !== ctx.tenantId) {
      return apiForbidden('Customer not found or access denied');
    }

    if (action === 'BLOCK') {
      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: {
          status: 'BLOCKED',
          blockedReason: reason || 'Blocked by owner',
          blockedAt: new Date(),
        },
      });
      return apiSuccess(updated, 'Customer blocked successfully');
    }

    if (action === 'UNBLOCK') {
      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: {
          status: 'ACTIVE',
          blockedReason: null,
          blockedAt: null,
        },
      });
      return apiSuccess(updated, 'Customer unblocked successfully');
    }

    return apiError('Invalid action', 400);
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

// DELETE: Delete customer
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return apiError('customerId is required', 400);
    }

    // Verify customer belongs to tenant
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { invoices: true, payments: true },
    });

    if (!customer || customer.tenantId !== ctx.tenantId) {
      return apiForbidden('Customer not found or access denied');
    }

    // Check if customer has transactions
    if (customer.invoices.length > 0 || customer.payments.length > 0) {
      return apiError('Cannot delete customer with existing transactions', 400);
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    return apiSuccess(null, 'Customer deleted successfully');
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
