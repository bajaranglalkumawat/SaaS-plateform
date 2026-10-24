import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-response';
import { requireSuperAdmin, isErrorResponse } from '@/lib/admin-auth';
import { SubscriptionStatus } from '@/lib/enums';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSuperAdmin(req);
    if (isErrorResponse(auth)) return auth;

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            mobile: true,
            alternatePhone: true,
            whatsapp: true,
            address: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            designation: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { invoices: true, customers: true, products: true, expenses: true },
        },
      },
    });

    if (!tenant) return apiNotFound('Business not found');
    return apiSuccess(tenant);
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSuperAdmin(req);
    if (isErrorResponse(auth)) return auth;

    const body = await req.json();
    const {
      planId,
      subscriptionStatus,
      trialEndsAt,
      subscriptionEndsAt,
      businessName,
      ownerName,
      email,
      mobileNumber,
      address,
      city,
      state,
      notes,
      deactivateUsers,
      activateUsers,
    } = body;

    const existing = await prisma.tenant.findUnique({ where: { id: params.id } });
    if (!existing) return apiNotFound('Business not found');

    if (planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) return apiError('Selected package/plan not found', 400);
    }

    if (email && typeof email === 'string' && email.trim() !== '') {
      const existingEmailUser = await prisma.tenant.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          NOT: { id: params.id },
        },
      });
      if (existingEmailUser) {
        return apiError('Another business account already uses this email', 400);
      }
    }

    if (
      subscriptionStatus &&
      !Object.values(SubscriptionStatus).includes(subscriptionStatus)
    ) {
      return apiError('Invalid subscription status', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.update({
        where: { id: params.id },
        data: {
          ...(planId !== undefined && { planId: planId || null }),
          ...(subscriptionStatus && { subscriptionStatus }),
          ...(trialEndsAt !== undefined && {
            trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
          }),
          ...(subscriptionEndsAt !== undefined && {
            subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt) : null,
          }),
          ...(businessName && { businessName }),
          ...(ownerName && { ownerName }),
          ...(email && { email: email.toLowerCase().trim() }),
          ...(mobileNumber !== undefined && { mobileNumber: mobileNumber || '' }),
          ...(address !== undefined && { address: address || null }),
          ...(city !== undefined && { city: city || null }),
          ...(state !== undefined && { state: state || null }),
        },
        include: { plan: true },
      });

      // Manual plan assignment history (admin grant)
      if (planId && planId !== existing.planId) {
        const plan = await tx.plan.findUnique({ where: { id: planId } });
        if (plan) {
          const end = subscriptionEndsAt
            ? new Date(subscriptionEndsAt)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await tx.subscriptionHistory.create({
            data: {
              tenantId: params.id,
              planId,
              billingCycle: 'MONTHLY',
              amount: 0,
              status: subscriptionStatus || 'ACTIVE',
              startDate: new Date(),
              endDate: end,
              razorpayPaymentId: notes || 'ADMIN_ASSIGNED',
            },
          });
        }
      }

      if (deactivateUsers === true) {
        await tx.user.updateMany({
          where: { tenantId: params.id, role: { not: 'SUPER_ADMIN' } },
          data: { isActive: false },
        });
      }

      if (activateUsers === true) {
        await tx.user.updateMany({
          where: { tenantId: params.id },
          data: { isActive: true },
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId: params.id,
          userId: auth.userId,
          action: 'ADMIN_TENANT_UPDATE',
          details: JSON.stringify(body),
        },
      });

      return tenant;
    });

    return apiSuccess(updated, 'Business updated successfully');
  } catch (error: any) {
    console.error('Admin tenant PATCH error:', error);
    return apiError(error.message || 'Failed to update business', 500);
  }
}
