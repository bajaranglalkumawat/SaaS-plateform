import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiNotFound, apiError } from '@/lib/api-response';
import { MovementType, PaymentStatus } from '@/lib/enums';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const invoice = await prisma.invoice.findFirst({
      where: tenantWhere(ctx.tenantId, { id: params.id }),
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        tenant: true,
      },
    });

    if (!invoice) return apiNotFound('Invoice not found');
    return apiSuccess(invoice);
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

// DELETE / Cancel Invoice (Restores Stock)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const invoice = await prisma.invoice.findFirst({
      where: tenantWhere(ctx.tenantId, { id: params.id }),
      include: { items: true },
    });

    if (!invoice) return apiNotFound('Invoice not found');
    if (invoice.isCancelled) return apiError('Invoice is already cancelled', 400);

    await prisma.$transaction(async (tx) => {
      // 1. Mark cancelled
      await tx.invoice.update({
        where: { id: params.id },
        data: {
          isCancelled: true,
          paymentStatus: PaymentStatus.CANCELLED,
        },
      });

      // 2. Return stock to inventory
      for (const item of invoice.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              tenantId: ctx.tenantId,
              productId: item.productId,
              quantity: item.quantity,
              movementType: MovementType.CANCEL_RETURN,
              referenceId: invoice.id,
              notes: `Stock restored from cancelled Invoice #${invoice.invoiceNumber}`,
              createdById: ctx.userId,
            },
          });
        }
      }
    });

    return apiSuccess(null, 'Invoice cancelled and stock restored');
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
