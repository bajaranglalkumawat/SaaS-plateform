import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !authUser.tenantId) {
      return apiError('Unauthorized', 401);
    }

    // Fetch customer data
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: authUser.tenantId,
        email: authUser.email,
      },
      include: {
        invoices: {
          include: { items: true, payments: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!customer) {
      return apiError('Customer profile not found', 404);
    }

    // Calculate totals
    const totalInvoices = customer.invoices.length;
    const totalPaid = customer.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = customer.invoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      return sum + (inv.grandTotal - paid);
    }, 0);

    return apiSuccess({
      name: customer.name,
      email: customer.email,
      mobileNumber: customer.mobileNumber,
      address: customer.address,
      openingBalance: customer.openingBalance,
      totalInvoices,
      totalPaid,
      totalDue,
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return apiError('Failed to fetch profile');
  }
}
