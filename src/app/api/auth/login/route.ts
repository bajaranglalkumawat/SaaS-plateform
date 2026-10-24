import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { SystemRole } from '@/lib/enums';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError('Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      return apiError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      return apiError('Your account has been deactivated. Please contact support.', 403);
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return apiError('Invalid email or password', 401);
    }

    const tokenPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role as SystemRole,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token + last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLoginAt: new Date(),
      },
    });

    return apiSuccess({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      tenant: user.tenant
        ? {
            id: user.tenant.id,
            businessName: user.tenant.businessName,
            businessLogo: user.tenant.businessLogo,
            subscriptionStatus: user.tenant.subscriptionStatus,
            invoicePrefix: user.tenant.invoicePrefix,
          }
        : null,
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (error: any) {
    console.error('Login Error:', error);
    return apiError('Internal server error during login', 500);
  }
}
