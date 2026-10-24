import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-response';
import { PaymentStatus, PaymentMethod } from '@/lib/enums';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const payments = await prisma.payment.findMany({
      where: tenantWhere(ctx.tenantId),
      include: {
        customer: { select: { id: true, name: true, mobileNumber: true } },
        invoice: { select: { id: true, invoiceNumber: true, grandTotal: true, pendingAmount: true } },
      },
      orderBy: { paymentDate: 'desc' },
      take: 100,
    });

    return apiSuccess(payments);
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
    const { invoiceId, amount, paymentMethod, referenceNo, notes } = body;

    const paymentAmount = Number(amount);

    if (!invoiceId || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return apiError('Valid Invoice ID and positive payment amount are required', 400);
    }

    const invoice = await prisma.invoice.findFirst({
      where: tenantWhere(ctx.tenantId, { id: invoiceId }),
    });

    if (!invoice) return apiError('Invoice not found', 404);
    if (invoice.isCancelled) return apiError('Cannot record payment for cancelled invoice', 400);
    if (invoice.pendingAmount <= 0) return apiError('Invoice is already fully paid', 400);
    if (paymentAmount > invoice.pendingAmount) {
      return apiError('Payment amount cannot exceed invoice pending amount', 400);
    }

    const newPaidAmount = invoice.paidAmount + paymentAmount;
    const newPendingAmount = Math.max(0, invoice.grandTotal - newPaidAmount);

    let newStatus: PaymentStatus = invoice.paymentStatus as PaymentStatus;
    if (newPendingAmount === 0) {
      newStatus = PaymentStatus.PAID;
    } else if (newPaidAmount > 0) {
      newStatus = PaymentStatus.PARTIALLY_PAID;
    }

    const paymentResult = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const pay = await tx.payment.create({
        data: {
          tenantId: ctx.tenantId,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: paymentAmount,
          paymentMethod: paymentMethod || PaymentMethod.CASH,
          referenceNo: referenceNo || null,
          notes: notes || null,
          createdById: ctx.userId,
        },
      });

      // 2. Update Invoice totals
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          pendingAmount: newPendingAmount,
          paymentStatus: newStatus,
        },
      });

      return pay;
    });

    return apiSuccess(paymentResult, 'Payment recorded successfully!', 201);
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
