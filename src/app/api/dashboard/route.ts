import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Concurrent DB aggregation queries
    const [
      todayInvoices,
      monthlyInvoices,
      totalExpenses,
      allInvoices,
      totalCustomers,
      products,
      recentInvoices,
      recentPayments,
    ] = await Promise.all([
      // Today's Sales
      prisma.invoice.aggregate({
        where: tenantWhere(ctx.tenantId, {
          isCancelled: false,
          invoiceDate: { gte: todayStart },
        }),
        _sum: { grandTotal: true },
        _count: { id: true },
      }),
      // Monthly Sales
      prisma.invoice.aggregate({
        where: tenantWhere(ctx.tenantId, {
          isCancelled: false,
          invoiceDate: { gte: monthStart },
        }),
        _sum: { grandTotal: true, paidAmount: true, pendingAmount: true, taxAmount: true },
        _count: { id: true },
      }),
      // Total Expenses
      prisma.expense.aggregate({
        where: tenantWhere(ctx.tenantId),
        _sum: { amount: true },
      }),
      // Aggregate Pending & Overdue
      prisma.invoice.findMany({
        where: tenantWhere(ctx.tenantId, { isCancelled: false }),
        select: { grandTotal: true, paidAmount: true, pendingAmount: true, paymentStatus: true, dueDate: true },
      }),
      // Customer count
      prisma.customer.count({ where: tenantWhere(ctx.tenantId) }),
      // Product Stock levels
      prisma.product.findMany({
        where: tenantWhere(ctx.tenantId, { isActive: true }),
        select: { id: true, name: true, currentStock: true, minStockLevel: true, sellingPrice: true, purchasePrice: true },
      }),
      // Recent Invoices
      prisma.invoice.findMany({
        where: tenantWhere(ctx.tenantId, { isCancelled: false }),
        include: { customer: { select: { name: true } } },
        orderBy: { invoiceDate: 'desc' },
        take: 5,
      }),
      // Recent Payments
      prisma.payment.findMany({
        where: tenantWhere(ctx.tenantId),
        include: { customer: { select: { name: true } }, invoice: { select: { invoiceNumber: true } } },
        orderBy: { paymentDate: 'desc' },
        take: 5,
      }),
    ]);

    const totalRevenue = allInvoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
    const totalPending = allInvoices.reduce((acc, inv) => acc + inv.pendingAmount, 0);
    const overduePayments = allInvoices
      .filter((inv) => inv.dueDate && new Date(inv.dueDate) < now && inv.pendingAmount > 0)
      .reduce((acc, inv) => acc + inv.pendingAmount, 0);

    const expenseSum = totalExpenses._sum.amount || 0;
    const estimatedProfit = totalRevenue - expenseSum;

    const lowStockCount = products.filter((p) => p.currentStock <= p.minStockLevel).length;

    return apiSuccess({
      metrics: {
        todaySales: todayInvoices._sum.grandTotal || 0,
        todayInvoiceCount: todayInvoices._count.id || 0,
        monthlySales: monthlyInvoices._sum.grandTotal || 0,
        totalRevenue,
        totalExpenses: expenseSum,
        estimatedProfit,
        pendingPayments: totalPending,
        overduePayments,
        totalCustomers,
        totalProducts: products.length,
        lowStockProducts: lowStockCount,
      },
      recentInvoices,
      recentPayments,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return apiError(error.message, 500);
  }
}
