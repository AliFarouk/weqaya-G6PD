import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'fallback_secret_must_be_overridden_in_production_123456';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = 'weqaya_session';

export interface TokenPayload {
  userId: number;
  name: string;
  identifier: string;
  phone?: string | null;
  patientRelation?: string | null;
  isDoctor: boolean;
  role: 'user' | 'doctor' | 'supervisor' | 'admin';
  doctorStatus: 'none' | 'pending' | 'approved' | 'rejected';
}

/**
 * Sign JWT token for user
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verify JWT token string
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return {
      userId: payload.userId as number,
      name: payload.name as string,
      identifier: payload.identifier as string,
      phone: (payload.phone as string) || null,
      patientRelation: (payload.patientRelation as string) || null,
      isDoctor: Boolean(payload.isDoctor),
      role: (payload.role as TokenPayload['role']) || (payload.isDoctor ? 'doctor' : 'user'),
      doctorStatus: (payload.doctorStatus as TokenPayload['doctorStatus']) || (payload.isDoctor ? 'approved' : 'none'),
    };
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user from Request (cookie OR Authorization header)
 * Ensures dual support for web browser and Capacitor mobile wrapper (§3)
 */
export async function getAuthUser(req?: Request | NextRequest): Promise<TokenPayload | null> {
  let token: string | null = null;

  // 1. Check Authorization: Bearer header
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // 2. Fallback to httpOnly cookie
  if (!token) {
    try {
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get(COOKIE_NAME);
      if (sessionCookie?.value) {
        token = sessionCookie.value;
      }
    } catch {
      // Cookies might not be available in some contexts
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  };
}
