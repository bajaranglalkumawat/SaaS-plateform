import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { SystemRole, SubscriptionStatus } from '@/lib/enums';

export const dynamic = 'force-dynamic';

function emptyToNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ownerName,
      email,
      password,
      businessName,
      mobileNumber,
      whatsapp,
      alternatePhone,
      address,
      city,
      state,
      country,
      pincode,
      designation,
    } = body;

    // Validation
    if (!ownerName || !email || !password || !businessName) {
      return apiError('Missing required registration fields (ownerName, email, password, businessName)', 400);
    }

    if (!mobileNumber || !String(mobileNumber).trim()) {
      return apiError('Mobile number is required', 400);
    }

    if (password.length < 6) {
      return apiError('Password must be at least 6 characters long', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const mobile = emptyToNull(mobileNumber) || '';
    const ownerAddress = emptyToNull(address);
    const ownerCity = emptyToNull(city);
    const ownerState = emptyToNull(state);
    const ownerCountry = emptyToNull(country) || 'India';
    const ownerPincode = emptyToNull(pincode);
    const ownerWhatsapp = emptyToNull(whatsapp) || mobile || null;
    const ownerAlternate = emptyToNull(alternatePhone);
    const ownerDesignation = emptyToNull(designation) || 'Owner';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return apiError('An account with this email address already exists.', 400);
    }

    // Find default Free Trial plan
    let freeTrialPlan = await prisma.plan.findUnique({
      where: { code: 'free_trial' },
    });

    // If database hasn't been seeded yet, fallback create Free Trial plan dynamically
    if (!freeTrialPlan) {
      freeTrialPlan = await prisma.plan.create({
        data: {
          name: 'Free Trial',
          code: 'free_trial',
          description: '14-Day Free Access',
          monthlyPrice: 0,
          yearlyPrice: 0,
          maxInvoices: 25,
          maxProducts: 50,
          maxUsers: 1,
          maxCustomers: 50,
        },
      });
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 Days trial

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Execute atomic creation of Tenant and Owner User
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          businessName: String(businessName).trim(),
          ownerName: String(ownerName).trim(),
          email: normalizedEmail,
          mobileNumber: mobile,
          // Business location seeded from owner address at signup (editable later on Company Profile)
          address: ownerAddress,
          city: ownerCity,
          state: ownerState,
          country: ownerCountry,
          pincode: ownerPincode,
          subscriptionStatus: SubscriptionStatus.TRIALING,
          trialEndsAt,
          planId: freeTrialPlan.id,
          invoicePrefix: 'INV',
          invoiceStartingNumber: 1001,
          termsAndConditions: 'Thank you for your business. Payment due upon receipt.',
          invoiceFooter: 'This is a computer generated invoice.',
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: String(ownerName).trim(),
          email: normalizedEmail,
          mobile,
          whatsapp: ownerWhatsapp,
          alternatePhone: ownerAlternate,
          address: ownerAddress,
          city: ownerCity,
          state: ownerState,
          country: ownerCountry,
          pincode: ownerPincode,
          designation: ownerDesignation,
          passwordHash: hashedPassword,
          role: SystemRole.TENANT_OWNER,
        },
      });

      return { tenant, user };
    });

    const tokenPayload = {
      userId: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      role: result.user.role as SystemRole,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update refresh token in DB
    await prisma.user.update({
      where: { id: result.user.id },
      data: { refreshToken },
    });

    return apiSuccess(
      {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          mobile: result.user.mobile,
          role: result.user.role,
        },
        tenant: {
          id: result.tenant.id,
          businessName: result.tenant.businessName,
          subscriptionStatus: result.tenant.subscriptionStatus,
          trialEndsAt: result.tenant.trialEndsAt,
        },
        accessToken,
        refreshToken,
      },
      'Business registered successfully! 14-Day Free Trial activated.',
      201
    );
  } catch (error: any) {
    console.error('Registration Error:', error);
    return apiError(error.message || 'Internal server error during registration', 500);
  }
}
