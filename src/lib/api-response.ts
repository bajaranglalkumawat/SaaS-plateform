import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function apiSuccess<T>(data: T, message?: string, status = 200, pagination?: ApiResponse['pagination']) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      ...(pagination && { pagination }),
    },
    { status }
  );
}

export function apiError(message: string, status = 400, errorDetails?: any) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(errorDetails && { details: errorDetails }),
    },
    { status }
  );
}

export function apiUnauthorized(message = 'Unauthorized access') {
  return apiError(message, 401);
}

export function apiForbidden(message = 'Forbidden action for current role/tenant') {
  return apiError(message, 403);
}

export function apiNotFound(message = 'Resource not found') {
  return apiError(message, 404);
}
