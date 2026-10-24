import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-response';
import { assertTenantCanCreate } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const customers = await prisma.customer.findMany({
      where: tenantWhere(ctx.tenantId, {
        ...(search && {
          OR: [
            { name: { contains: search } },
            { mobileNumber: { contains: search } },
            { email: { contains: search } },
          ],
        }),
      }),
      include: {
        _count: {
          select: { invoices: true },
        },
        invoices: {
          select: { grandTotal: true, paidAmount: true, pendingAmount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = customers.map((c) => {
      const totalPurchases = c.invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
      const totalPaid = c.invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
      const totalPending = c.invoices.reduce((acc, inv) => acc + inv.pendingAmount, 0) + c.openingBalance;

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
        totalPurchases,
        totalPaid,
        totalPending,
        createdAt: c.createdAt,
      };
    });

    return apiSuccess(formatted);
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const body = await req.json();
    const { name, mobileNumber, email, address, city, state, pincode, gstin, openingBalance, notes } = body;

    if (!name) {
      return apiError('Customer name is required', 400);
    }

    const subscriptionError = await assertTenantCanCreate(ctx.tenantId, 'customers');
    if (subscriptionError) return apiError(subscriptionError, 403);

    const customer = await prisma.customer.create({
      data: {
        tenantId: ctx.tenantId,
        name,
        mobileNumber: mobileNumber || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        gstin: gstin || null,
        openingBalance: parseFloat(openingBalance || '0'),
        notes: notes || null,
        status: 'ACTIVE',
      },
    });

    return apiSuccess(customer, 'Customer added successfully', 201);
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
