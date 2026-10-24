import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiNotFound, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

function optionalNumber(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const product = await prisma.product.findFirst({
      where: tenantWhere(ctx.tenantId, { id: params.id }),
      include: {
        category: true,
        brand: true,
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) return apiNotFound('Product not found');
    return apiSuccess(product);
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
    const existing = await prisma.product.findFirst({
      where: tenantWhere(ctx.tenantId, { id: params.id }),
    });

    if (!existing) return apiNotFound('Product not found');

    const categoryId = body.categoryId ?? existing.categoryId;
    const brandId = body.brandId ?? existing.brandId;

    const [category, brand] = await Promise.all([
      categoryId
        ? prisma.category.findFirst({ where: tenantWhere(ctx.tenantId, { id: categoryId }) })
        : Promise.resolve(null),
      brandId
        ? prisma.brand.findFirst({ where: tenantWhere(ctx.tenantId, { id: brandId }) })
        : Promise.resolve(null),
    ]);

    if (categoryId && !category) return apiError('Category not found for this business', 400);
    if (brandId && !brand) return apiError('Brand not found for this business', 400);

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        sku: body.sku ?? existing.sku,
        barcode: body.barcode ?? existing.barcode,
        categoryId,
        brandId,
        unit: body.unit ?? existing.unit,
        purchasePrice: optionalNumber(body.purchasePrice, existing.purchasePrice),
        sellingPrice: optionalNumber(body.sellingPrice, existing.sellingPrice),
        mrp: optionalNumber(body.mrp, existing.mrp),
        discount: optionalNumber(body.discount, existing.discount),
        taxRate: optionalNumber(body.taxRate, existing.taxRate),
        minStockLevel: optionalNumber(body.minStockLevel, existing.minStockLevel),
        productImage: body.productImage ?? existing.productImage,
        isActive: body.isActive ?? existing.isActive,
      },
    });

    return apiSuccess(updated, 'Product updated successfully');
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const existing = await prisma.product.findFirst({
      where: tenantWhere(ctx.tenantId, { id: params.id }),
    });

    if (!existing) return apiNotFound('Product not found');

    // Soft delete product
    await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return apiSuccess(null, 'Product removed successfully');
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
