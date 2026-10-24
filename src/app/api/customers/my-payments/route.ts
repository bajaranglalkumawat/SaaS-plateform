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

    // Find customer by email matching the logged-in user
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: authUser.tenantId,
        email: authUser.email,
      },
    });

    if (!customer) {
      return apiSuccess([]);
    }

    // Fetch customer's payments
    const payments = await prisma.payment.findMany({
      where: {
        tenantId: authUser.tenantId,
        customerId: customer.id,
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    // Format response
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      invoiceId: payment.invoice.invoiceNumber,
      referenceNo: payment.referenceNo,
    }));

    return apiSuccess(formattedPayments);
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    return apiError('Failed to fetch payments');
  }
}
