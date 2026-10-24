import { prisma } from '@/lib/prisma';

export type LimitedFeature = 'invoices' | 'products' | 'customers' | 'users';

const limitFieldByFeature: Record<LimitedFeature, 'maxInvoices' | 'maxProducts' | 'maxCustomers' | 'maxUsers'> = {
  invoices: 'maxInvoices',
  products: 'maxProducts',
  customers: 'maxCustomers',
  users: 'maxUsers',
};

async function getTenantWithPlan(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });
}

function assertSubscriptionActive(tenant: NonNullable<Awaited<ReturnType<typeof getTenantWithPlan>>>) {
  if (tenant.subscriptionStatus === 'EXPIRED' || tenant.subscriptionStatus === 'CANCELED') {
    return 'Subscription is not active. Please renew to continue.';
  }

  if (tenant.trialEndsAt && tenant.subscriptionStatus === 'TRIALING' && tenant.trialEndsAt < new Date()) {
    return 'Free trial has expired. Please subscribe to continue.';
  }

  if (!tenant.plan) {
    return 'No subscription plan is assigned to this business';
  }

  return null;
}

export async function assertTenantCanCreate(tenantId: string, feature: LimitedFeature) {
  const tenant = await getTenantWithPlan(tenantId);

  if (!tenant) {
    return 'Business profile not found';
  }

  const subError = assertSubscriptionActive(tenant);
  if (subError) return subError;

  const plan = tenant.plan!;
  const limit = plan[limitFieldByFeature[feature]];
  if (limit < 0) return null;

  const currentCount = await countFeature(tenantId, feature);
  if (currentCount >= limit) {
    return `Your current plan limit for ${feature} has been reached`;
  }

  return null;
}

/** Gate plan features such as inventory / advanced reports. */
export async function assertTenantHasFeature(
  tenantId: string,
  feature: 'hasInventory' | 'hasAdvancedReports' | 'hasMultipleBranches'
) {
  const tenant = await getTenantWithPlan(tenantId);
  if (!tenant) return 'Business profile not found';

  const subError = assertSubscriptionActive(tenant);
  if (subError) return subError;

  if (!tenant.plan![feature]) {
    const labels = {
      hasInventory: 'Inventory',
      hasAdvancedReports: 'Advanced Reports',
      hasMultipleBranches: 'Multiple Branches',
    } as const;
    return `${labels[feature]} is not included in your current plan. Please upgrade.`;
  }

  return null;
}

async function countFeature(tenantId: string, feature: LimitedFeature) {
  switch (feature) {
    case 'invoices':
      return prisma.invoice.count({ where: { tenantId, isCancelled: false } });
    case 'products':
      return prisma.product.count({ where: { tenantId, isActive: true } });
    case 'customers':
      return prisma.customer.count({ where: { tenantId } });
    case 'users':
      return prisma.user.count({ where: { tenantId, isActive: true } });
  }
}
