import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-response';

import { assertTenantHasFeature } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const featureError = await assertTenantHasFeature(ctx.tenantId, 'hasAdvancedReports');
    if (featureError) return apiError(featureError, 403);

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get customer statistics
    const customers = await prisma.customer.findMany({
      where: tenantWhere(ctx.tenantId),
      include: {
        invoices: {
          where: {
            createdAt: { gte: startDate },
          },
          select: {
            grandTotal: true,
            paidAmount: true,
            pendingAmount: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        payments: {
          where: {
            createdAt: { gte: startDate },
          },
          select: {
            amount: true,
            createdAt: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length;
    const blockedCustomers = customers.filter(c => c.status === 'BLOCKED').length;

    const totalRevenue = customers.reduce((sum, c) => {
      return sum + c.invoices.reduce((invSum, inv) => invSum + inv.grandTotal, 0);
    }, 0);

    const totalPaid = customers.reduce((sum, c) => {
      return sum + c.invoices.reduce((invSum, inv) => invSum + inv.paidAmount, 0);
    }, 0);

    const totalPending = customers.reduce((sum, c) => {
      return sum + c.invoices.reduce((invSum, inv) => invSum + inv.pendingAmount, 0);
    }, 0);

    const totalPayments = customers.reduce((sum, c) => {
      return sum + c.payments.reduce((paySum, pay) => paySum + pay.amount, 0);
    }, 0);

    // Customer status breakdown
    const statusBreakdown = {
      ACTIVE: activeCustomers,
      BLOCKED: blockedCustomers,
    };

    // Top customers by revenue
    const topCustomers = customers
      .map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        revenue: c.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
        paid: c.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
        pending: c.invoices.reduce((sum, inv) => sum + inv.pendingAmount, 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Revenue trend (daily)
    const revenueTrend: Record<string, number> = {};
    customers.forEach(c => {
      c.invoices.forEach(inv => {
        const date = inv.createdAt.toISOString().split('T')[0];
        revenueTrend[date] = (revenueTrend[date] || 0) + inv.grandTotal;
      });
    });

    return apiSuccess({
      metrics: {
        totalCustomers,
        activeCustomers,
        blockedCustomers,
        totalRevenue,
        totalPaid,
        totalPending,
        totalPayments,
        avgCustomerValue: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
      },
      statusBreakdown,
      topCustomers,
      revenueTrend: Object.entries(revenueTrend)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .reduce((acc, [date, amount]) => {
          acc[date] = amount;
          return acc;
        }, {} as Record<string, number>),
      period: periodDays,
    });
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
