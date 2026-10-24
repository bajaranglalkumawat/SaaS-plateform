import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-response';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const body = await req.json();
    const { planId, billingCycle } = body;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) return apiError('Selected plan not found', 404);

    const price = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;

    if (price <= 0) {
      return apiError('Free plan does not require Razorpay checkout', 400);
    }

    // Initialize Razorpay instance
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_demo123456';
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'demoSecretKey123456';

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const amountInPaisa = Math.round(price * 100);

    const orderOptions = {
      amount: amountInPaisa,
      currency: 'INR',
      receipt: `sub_${ctx.tenantId.substring(0, 8)}_${Date.now()}`,
      notes: {
        tenantId: ctx.tenantId,
        planId: plan.id,
        planCode: plan.code,
        billingCycle: billingCycle || 'MONTHLY',
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    return apiSuccess({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
      planName: plan.name,
      billingCycle: billingCycle || 'MONTHLY',
    });
  } catch (error: any) {
    console.error('Razorpay Checkout Error:', error);
    return apiError(error.message || 'Error creating Razorpay checkout session', 500);
  }
}
