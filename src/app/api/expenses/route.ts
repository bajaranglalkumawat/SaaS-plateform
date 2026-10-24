import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-response';
import { PaymentMethod } from '@/lib/enums';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');

    const expenses = await prisma.expense.findMany({
      where: tenantWhere(ctx.tenantId, {
        ...(categoryId && { categoryId }),
        ...(search && {
          title: { contains: search },
        }),
      }),
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });

    return apiSuccess(expenses);
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
    const { title, categoryId, amount, expenseDate, paymentMethod, description, attachmentUrl } = body;

    if (!title || !amount) {
      return apiError('Expense title and amount are required', 400);
    }

    const expense = await prisma.expense.create({
      data: {
        tenantId: ctx.tenantId,
        title,
        categoryId: categoryId || null,
        amount: parseFloat(amount),
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        paymentMethod: paymentMethod || PaymentMethod.CASH,
        description: description || null,
        attachmentUrl: attachmentUrl || null,
        createdById: ctx.userId,
      },
    });

    return apiSuccess(expense, 'Expense recorded successfully', 201);
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
