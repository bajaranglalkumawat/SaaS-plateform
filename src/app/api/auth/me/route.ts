import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return apiUnauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        alternatePhone: true,
        whatsapp: true,
        address: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
        profileImageUrl: true,
        dateOfBirth: true,
        gender: true,
        designation: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            businessName: true,
            businessLogo: true,
            ownerName: true,
            email: true,
            mobileNumber: true,
            address: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            gstin: true,
            pan: true,
            businessType: true,
            invoicePrefix: true,
            invoiceStartingNumber: true,
            bankName: true,
            bankAccountNumber: true,
            ifscCode: true,
            upiId: true,
            paymentQrCode: true,
            termsAndConditions: true,
            invoiceFooter: true,
            subscriptionStatus: true,
            trialEndsAt: true,
            subscriptionEndsAt: true,
            plan: true,
          },
        },
      },
    });

    if (!user) {
      return apiUnauthorized('User no longer exists');
    }

    if (!user.isActive) {
      return apiUnauthorized('Your account has been deactivated');
    }

    return apiSuccess(user);
  } catch (error: any) {
    console.error('Me Auth Endpoint Error:', error);
    return apiError('Internal server error', 500);
  }
}
