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

    // Fetch customer's invoices with related data
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: authUser.tenantId,
        customerId: customer.id,
      },
      include: {
        items: {
          select: {
            productName: true,
            quantity: true,
            unitPrice: true,
            discount: true,
          },
        },
        payments: {
          select: {
            amount: true,
            paymentDate: true,
          },
        },
        createdBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format response
    const formattedInvoices = invoices.map((inv) => {
      const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        totalAmount: inv.grandTotal,
        paidAmount,
        dueDate: inv.dueDate,
        invoiceDate: inv.createdAt,
        status: paidAmount >= inv.grandTotal ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING',
        items: inv.items,
      };
    });

    return apiSuccess(formattedInvoices);
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    return apiError('Failed to fetch invoices');
  }
}
