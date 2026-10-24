import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiSuccess, apiUnauthorized, apiError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const USER_PROFILE_SELECT = {
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
} as const;

function emptyToNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: USER_PROFILE_SELECT,
    });

    if (!user) return apiUnauthorized('User no longer exists');
    if (!user.isActive) return apiUnauthorized('Your account has been deactivated');

    return apiSuccess(user);
  } catch (error: any) {
    console.error('Get Profile Error:', error);
    return apiError(error.message || 'Internal server error', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return apiUnauthorized();

    const existing = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, isActive: true },
    });

    if (!existing) return apiUnauthorized('User no longer exists');
    if (!existing.isActive) return apiUnauthorized('Your account has been deactivated');

    const body = await req.json();
    const {
      name,
      mobile,
      alternatePhone,
      whatsapp,
      address,
      city,
      state,
      country,
      pincode,
      profileImageUrl,
      dateOfBirth,
      gender,
      designation,
    } = body;

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return apiError('Name cannot be empty', 400);
    }

    const allowedGenders = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];
    if (gender !== undefined && gender !== null && gender !== '') {
      if (!allowedGenders.includes(String(gender).toUpperCase())) {
        return apiError('Invalid gender value', 400);
      }
    }

    let parsedDob: Date | null | undefined = undefined;
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === null || dateOfBirth === '') {
        parsedDob = null;
      } else {
        const d = new Date(dateOfBirth);
        if (Number.isNaN(d.getTime())) {
          return apiError('Invalid date of birth', 400);
        }
        parsedDob = d;
      }
    }

    const updated = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(mobile !== undefined && { mobile: emptyToNull(mobile) ?? '' }),
        ...(alternatePhone !== undefined && { alternatePhone: emptyToNull(alternatePhone) }),
        ...(whatsapp !== undefined && { whatsapp: emptyToNull(whatsapp) }),
        ...(address !== undefined && { address: emptyToNull(address) }),
        ...(city !== undefined && { city: emptyToNull(city) }),
        ...(state !== undefined && { state: emptyToNull(state) }),
        ...(country !== undefined && { country: emptyToNull(country) ?? 'India' }),
        ...(pincode !== undefined && { pincode: emptyToNull(pincode) }),
        ...(profileImageUrl !== undefined && { profileImageUrl: emptyToNull(profileImageUrl) }),
        ...(parsedDob !== undefined && { dateOfBirth: parsedDob }),
        ...(gender !== undefined && {
          gender:
            gender === null || gender === ''
              ? null
              : String(gender).toUpperCase(),
        }),
        ...(designation !== undefined && { designation: emptyToNull(designation) }),
      },
      select: USER_PROFILE_SELECT,
    });

    return apiSuccess(updated, 'Profile updated successfully');
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return apiError(error.message || 'Internal server error updating profile', 500);
  }
}
