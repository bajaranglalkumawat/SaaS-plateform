import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-response';
import { MovementType } from '@/lib/enums';
import { assertTenantHasFeature } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

// GET inventory movement history and low stock list
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const featureError = await assertTenantHasFeature(ctx.tenantId, 'hasInventory');
    if (featureError) return apiError(featureError, 403);

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const type = searchParams.get('type') as MovementType | null;

    const movements = await prisma.stockMovement.findMany({
      where: tenantWhere(ctx.tenantId, {
        ...(productId && { productId }),
        ...(type && { movementType: type }),
      }),
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true, currentStock: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return apiSuccess(movements);
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

// POST stock adjustment (Stock In / Stock Out / Manual Adjustment)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const featureError = await assertTenantHasFeature(ctx.tenantId, 'hasInventory');
    if (featureError) return apiError(featureError, 403);

    const body = await req.json();
    const { productId, quantity, movementType, notes } = body;

    if (!productId || quantity === undefined || !movementType) {
      return apiError('Product ID, quantity and movement type are required', 400);
    }

    const product = await prisma.product.findFirst({
      where: tenantWhere(ctx.tenantId, { id: productId }),
    });

    if (!product) return apiError('Product not found', 404);

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return apiError('Quantity must be a positive number', 400);
    }

    let stockDelta = qty;

    if (movementType === 'STOCK_OUT' || movementType === 'SALE_DEDUCTION') {
      stockDelta = -Math.abs(qty);
    } else if (movementType === 'STOCK_IN') {
      stockDelta = Math.abs(qty);
    }

    if (product.currentStock + stockDelta < 0) {
      return apiError('Stock cannot go below zero', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Log movement
      const movement = await tx.stockMovement.create({
        data: {
          tenantId: ctx.tenantId,
          productId,
          quantity: stockDelta,
          movementType: movementType as MovementType,
          notes: notes || 'Manual inventory adjustment',
          createdById: ctx.userId,
        },
      });

      // 2. Update current stock level
      const stockUpdate = await tx.product.updateMany({
        where: {
          id: product.id,
          tenantId: ctx.tenantId,
          ...(stockDelta < 0 && { currentStock: { gte: Math.abs(stockDelta) } }),
        },
        data: {
          currentStock: { increment: stockDelta },
        },
      });

      if (stockUpdate.count !== 1) {
        throw new Error('Stock changed while adjusting inventory. Please retry.');
      }

      const updatedProduct = await tx.product.findUniqueOrThrow({
        where: { id: product.id },
        select: { currentStock: true },
      });

      return { movement, currentStock: updatedProduct.currentStock };
    });

    return apiSuccess(result, 'Stock adjusted successfully');
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
