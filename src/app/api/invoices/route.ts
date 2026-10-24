import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-response';
import { PaymentStatus, PaymentMethod, MovementType } from '@/lib/enums';
import { assertTenantCanCreate } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

function toMoney(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

class InputError extends Error {}

// GET /api/invoices - Invoice Listing & Search System
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as PaymentStatus | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = tenantWhere(ctx.tenantId, {
      isCancelled: false,
      ...(status && { paymentStatus: status }),
      ...(customerId && { customerId }),
      ...(startDate && endDate && {
        invoiceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search } },
          { customer: { name: { contains: search } } },
          { customer: { mobileNumber: { contains: search } } },
        ],
      }),
    });

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, mobileNumber: true, email: true },
          },
          items: true,
          payments: true,
        },
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return apiSuccess(invoices, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

// POST /api/invoices - Create Invoice & deduct stock automatically
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const body = await req.json();
    const {
      customerId,
      invoiceDate,
      dueDate,
      items,
      discountType,
      discountAmount,
      paidAmount,
      paymentMethod,
      notes,
      terms,
    } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return apiError('Customer and at least one item are required', 400);
    }

    const subscriptionError = await assertTenantCanCreate(ctx.tenantId, 'invoices');
    if (subscriptionError) return apiError(subscriptionError, 403);

    const [tenant, customer] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
      }),
      prisma.customer.findFirst({
        where: tenantWhere(ctx.tenantId, { id: customerId, status: 'ACTIVE' }),
      }),
    ]);

    if (!tenant) return apiError('Tenant not found', 404);
    if (!customer) return apiError('Customer not found for this business', 404);

    const productIds = Array.from(
      new Set(items.map((item: any) => item.productId).filter(Boolean))
    ) as string[];

    const products = productIds.length
      ? await prisma.product.findMany({
          where: tenantWhere(ctx.tenantId, {
            id: { in: productIds },
            isActive: true,
          }),
        })
      : [];
    const productsById = new Map(products.map((product) => [product.id, product]));

    if (products.length !== productIds.length) {
      return apiError('One or more products do not belong to this business', 400);
    }

    // Compute line items, subtotal, taxes, grand total
    let calculatedSubtotal = 0;
    let calculatedTaxAmount = 0;

    const invoiceItemsData = items.map((item: any) => {
      const product = item.productId ? productsById.get(item.productId) : null;
      const qty = toMoney(item.quantity, 1);
      const unitPrice = toMoney(item.unitPrice, product?.sellingPrice ?? 0);
      const itemDiscount = toMoney(item.discount, product?.discount ?? 0);
      const taxRate = toMoney(item.taxRate, product?.taxRate ?? 0);

      if (qty <= 0) {
        throw new InputError('Item quantity must be greater than zero');
      }

      if (unitPrice < 0 || itemDiscount < 0 || taxRate < 0) {
        throw new InputError('Price, discount and tax values cannot be negative');
      }

      if (product && product.currentStock < qty) {
        throw new InputError(`Insufficient stock for ${product.name}`);
      }

      const itemSubtotal = qty * unitPrice - itemDiscount;
      if (itemSubtotal < 0) {
        throw new InputError('Item discount cannot exceed item subtotal');
      }

      const itemTax = itemSubtotal * (taxRate / 100);
      const itemTotal = itemSubtotal + itemTax;

      calculatedSubtotal += itemSubtotal;
      calculatedTaxAmount += itemTax;

      return {
        productId: item.productId || null,
        productName: product?.name || item.productName || 'Custom Service/Item',
        sku: product?.sku || item.sku || null,
        unit: product?.unit || item.unit || 'PCS',
        quantity: qty,
        unitPrice,
        discount: itemDiscount,
        taxRate,
        taxAmount: itemTax,
        totalAmount: itemTotal,
      };
    });

    // Invoice level discount calculation
    const extraDiscount = toMoney(discountAmount, 0);
    let finalDiscount = extraDiscount;
    if (discountType === 'PERCENTAGE') {
      finalDiscount = (calculatedSubtotal * extraDiscount) / 100;
    }

    const grandTotal = Math.max(0, calculatedSubtotal + calculatedTaxAmount - finalDiscount);
    const initialPaid = Math.min(grandTotal, toMoney(paidAmount, 0));
    const pendingAmount = grandTotal - initialPaid;

    let paymentStatus: PaymentStatus = PaymentStatus.UNPAID;
    if (initialPaid >= grandTotal && grandTotal > 0) {
      paymentStatus = PaymentStatus.PAID;
    } else if (initialPaid > 0) {
      paymentStatus = PaymentStatus.PARTIALLY_PAID;
    }

    // Execute atomic transaction for Invoice creation + Stock reduction + Payment record + Sequence update
    const resultInvoice = await prisma.$transaction(async (tx) => {
      const updatedTenant = await tx.tenant.update({
        where: { id: ctx.tenantId },
        data: { invoiceStartingNumber: { increment: 1 } },
      });

      const invoiceSequence = updatedTenant.invoiceStartingNumber - 1;
      const currentYear = new Date().getFullYear();
      const invoiceNumber = `${updatedTenant.invoicePrefix}-${currentYear}-${invoiceSequence
        .toString()
        .padStart(5, '0')}`;

      // 1. Create Invoice
      const inv = await tx.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          invoiceNumber,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          customerId,
          subtotal: calculatedSubtotal,
          discountType: discountType || 'FIXED',
          discountAmount: finalDiscount,
          taxAmount: calculatedTaxAmount,
          grandTotal,
          paidAmount: initialPaid,
          pendingAmount,
          paymentStatus,
          paymentMethod: paymentMethod || PaymentMethod.CASH,
          notes: notes || null,
          terms: terms || updatedTenant.termsAndConditions,
          footer: updatedTenant.invoiceFooter,
          createdById: ctx.userId,
          items: {
            create: invoiceItemsData,
          },
        },
      });

      // 2. Deduct stock for products & record movement
      for (const item of items) {
        if (item.productId) {
          const qty = toMoney(item.quantity, 1);
          const stockUpdate = await tx.product.updateMany({
            where: {
              id: item.productId,
              tenantId: ctx.tenantId,
              currentStock: { gte: qty },
            },
            data: {
              currentStock: { decrement: qty },
            },
          });

          if (stockUpdate.count !== 1) {
            throw new Error('Product stock changed while creating invoice. Please retry.');
          }

          await tx.stockMovement.create({
            data: {
              tenantId: ctx.tenantId,
              productId: item.productId,
              quantity: -qty, // Negative for stock out
              movementType: MovementType.SALE_DEDUCTION,
              referenceId: inv.id,
              notes: `Auto deduction for Invoice #${invoiceNumber}`,
              createdById: ctx.userId,
            },
          });
        }
      }

      // 3. Record payment if initial paid amount > 0
      if (initialPaid > 0) {
        await tx.payment.create({
          data: {
            tenantId: ctx.tenantId,
            invoiceId: inv.id,
            customerId,
            amount: initialPaid,
            paymentMethod: paymentMethod || PaymentMethod.CASH,
            notes: `Initial payment at invoice creation for #${invoiceNumber}`,
            createdById: ctx.userId,
          },
        });
      }

      return inv;
    });

    return apiSuccess(resultInvoice, 'Invoice generated successfully!', 201);
  } catch (error: any) {
    console.error('Create Invoice Error:', error);
    if (error instanceof InputError) {
      return apiError(error.message, 400);
    }
    return apiError(error.message || 'Error generating invoice', 500);
  }
}
