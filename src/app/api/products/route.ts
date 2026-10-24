import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-response';
import { MovementType } from '@/lib/enums';
import { assertTenantCanCreate } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

async function validateCatalogReferences(tenantId: string, categoryId?: string | null, brandId?: string | null) {
  const [category, brand] = await Promise.all([
    categoryId
      ? prisma.category.findFirst({ where: tenantWhere(tenantId, { id: categoryId }) })
      : Promise.resolve(null),
    brandId
      ? prisma.brand.findFirst({ where: tenantWhere(tenantId, { id: brandId }) })
      : Promise.resolve(null),
  ]);

  if (categoryId && !category) {
    return 'Category not found for this business';
  }

  if (brandId && !brand) {
    return 'Brand not found for this business';
  }

  return null;
}

// GET /api/products - Search, filter & paginate products
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const isLowStock = searchParams.get('lowStock') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = tenantWhere(ctx.tenantId, {
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { barcode: { contains: search } },
        ],
      }),
    });

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Filter low stock client/server side if requested
    const filteredProducts = isLowStock
      ? products.filter((p) => p.currentStock <= p.minStockLevel)
      : products;

    return apiSuccess(filteredProducts, undefined, 200, {
      page,
      limit,
      total: isLowStock ? filteredProducts.length : total,
      totalPages: Math.ceil((isLowStock ? filteredProducts.length : total) / limit),
    });
  } catch (error: any) {
    return apiError(error.message || 'Error fetching products', 500);
  }
}

// POST /api/products - Add Product
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const body = await req.json();
    const {
      name,
      description,
      sku,
      barcode,
      categoryId,
      brandId,
      unit,
      purchasePrice,
      sellingPrice,
      mrp,
      discount,
      taxRate,
      openingStock,
      minStockLevel,
      productImage,
    } = body;

    if (!name) {
      return apiError('Product name is required', 400);
    }

    const subscriptionError = await assertTenantCanCreate(ctx.tenantId, 'products');
    if (subscriptionError) return apiError(subscriptionError, 403);

    const referenceError = await validateCatalogReferences(ctx.tenantId, categoryId, brandId);
    if (referenceError) return apiError(referenceError, 400);

    const initialStock = Number(openingStock || '0');
    if (!Number.isFinite(initialStock) || initialStock < 0) {
      return apiError('Opening stock must be zero or greater', 400);
    }

    // Create product & initial stock movement log inside transaction
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          tenantId: ctx.tenantId,
          name,
          description: description || null,
          sku: sku || null,
          barcode: barcode || null,
          categoryId: categoryId || null,
          brandId: brandId || null,
          unit: unit || 'PCS',
          purchasePrice: Number(purchasePrice || '0'),
          sellingPrice: Number(sellingPrice || '0'),
          mrp: Number(mrp || '0'),
          discount: Number(discount || '0'),
          taxRate: Number(taxRate || '0'),
          openingStock: initialStock,
          currentStock: initialStock,
          minStockLevel: Number(minStockLevel || '5'),
          productImage: productImage || null,
        },
      });

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            tenantId: ctx.tenantId,
            productId: p.id,
            quantity: initialStock,
            movementType: MovementType.STOCK_IN,
            notes: 'Initial opening stock setup',
            createdById: ctx.userId,
          },
        });
      }

      return p;
    });

    return apiSuccess(product, 'Product created successfully', 201);
  } catch (error: any) {
    console.error('Create Product Error:', error);
    return apiError(error.message || 'Error creating product', 500);
  }
}
