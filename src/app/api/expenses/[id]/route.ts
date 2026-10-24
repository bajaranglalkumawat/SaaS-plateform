import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiNotFound, apiError } from '@/lib/api-response';
import { PaymentMethod } from '@/lib/enums';

export const dynamic = 'force-dynamic';

function parseAmount(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const expense = await prisma.expense.findFirst({
      where: tenantWhere(ctx.tenantId, { id: params.id }),
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    if (!expense) return apiNotFound('Expense not found');
    return apiSuccess(expense);
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
    const existing = await prisma.expense.findFirst({
      where: tenantWhere(ctx.tenantId, { id: params.id }),
    });

    if (!existing) return apiNotFound('Expense not found');

    const categoryId = body.categoryId ?? existing.categoryId;
    if (categoryId) {
      const category = await prisma.expenseCategory.findFirst({
        where: tenantWhere(ctx.tenantId, { id: categoryId }),
      });
      if (!category) return apiError('Expense category not found for this business', 400);
    }

    const amount = parseAmount(body.amount, existing.amount);
    if (amount <= 0) return apiError('Expense amount must be greater than zero', 400);

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        title: body.title ?? existing.title,
        categoryId,
        amount,
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : existing.expenseDate,
        paymentMethod: body.paymentMethod || existing.paymentMethod || PaymentMethod.CASH,
        description: body.description ?? existing.description,
        attachmentUrl: body.attachmentUrl ?? existing.attachmentUrl,
      },
    });

    return apiSuccess(updated, 'Expense updated successfully');
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const existing = await prisma.expense.findFirst({
      where: tenantWhere(ctx.tenantId, { id: params.id }),
    });

    if (!existing) return apiNotFound('Expense not found');

    await prisma.expense.delete({
      where: { id: params.id },
    });

    return apiSuccess(null, 'Expense deleted successfully');
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
