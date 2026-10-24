import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireTenantContext, tenantWhere } from '@/lib/tenant';
import { apiSuccess, apiUnauthorized, apiForbidden, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

// GET tenant business profile
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    const business = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      include: {
        plan: true,
      },
    });

    if (!business) return apiError('Business profile not found', 404);
    return apiSuccess(business);
  } catch (error: any) {
    return apiError(error.message || 'Internal server error', 500);
  }
}

// PUT / Update tenant business profile
export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();
    const ctx = requireTenantContext(authUser);

    // Only TENANT_OWNER and SUPER_ADMIN can update business settings
    if (ctx.role !== 'TENANT_OWNER' && ctx.role !== 'SUPER_ADMIN') {
      return apiForbidden('Only business owner can update company profile');
    }

    const body = await req.json();
    const {
      businessName,
      businessLogo,
      ownerName,
      email,
      mobileNumber,
      address,
      city,
      state,
      country,
      pincode,
      gstin,
      pan,
      businessType,
      invoicePrefix,
      invoiceStartingNumber,
      bankName,
      bankAccountNumber,
      ifscCode,
      upiId,
      paymentQrCode,
      termsAndConditions,
      invoiceFooter,
    } = body;

    const updatedTenant = await prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        ...(businessName && { businessName }),
        ...(businessLogo !== undefined && { businessLogo }),
        ...(ownerName && { ownerName }),
        ...(email && { email }),
        ...(mobileNumber !== undefined && { mobileNumber }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(country !== undefined && { country }),
        ...(pincode !== undefined && { pincode }),
        ...(gstin !== undefined && { gstin }),
        ...(pan !== undefined && { pan }),
        ...(businessType && { businessType }),
        ...(invoicePrefix && { invoicePrefix }),
        ...(invoiceStartingNumber && { invoiceStartingNumber: parseInt(invoiceStartingNumber, 10) }),
        ...(bankName !== undefined && { bankName }),
        ...(bankAccountNumber !== undefined && { bankAccountNumber }),
        ...(ifscCode !== undefined && { ifscCode }),
        ...(upiId !== undefined && { upiId }),
        ...(paymentQrCode !== undefined && { paymentQrCode }),
        ...(termsAndConditions !== undefined && { termsAndConditions }),
        ...(invoiceFooter !== undefined && { invoiceFooter }),
      },
    });

    return apiSuccess(updatedTenant, 'Business details updated successfully');
  } catch (error: any) {
    console.error('Update Business Error:', error);
    return apiError(error.message || 'Internal server error updating business profile', 500);
  }
}
