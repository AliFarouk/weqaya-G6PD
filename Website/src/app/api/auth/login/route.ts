import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { signToken, getCookieOptions } from '@/lib/auth/jwt';
import { normalizeIdentifier } from '@/lib/arabic-normalize';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const loginSchema = z.object({
  identifier: z.string().min(1, 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف'),
  password: z.string().min(1, 'يرجى إدخال كلمة المرور'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: 10 login attempts per minute per IP
    const rl = await checkRateLimit(`auth_login_${ip}`, 10, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'تجاوزت الحد المسموح من محاولات الدخول، يرجى الانتظار دقيقة' } },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'بيانات الدخول غير مكتملة' } },
        { status: 400 }
      );
    }

    const { identifier, password } = result.data;
    const norm = normalizeIdentifier(identifier);

    const user = await db.findUserByIdentifier(norm.canonical);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'البريد أو رقم الهاتف أو كلمة المرور غير صحيحة' } },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(user.password_hash, password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'البريد أو رقم الهاتف أو كلمة المرور غير صحيحة' } },
        { status: 401 }
      );
    }

    if (user.is_suspended) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message: user.suspended_reason
              ? `تم إيقاف هذا الحساب: ${user.suspended_reason}`
              : 'تم إيقاف هذا الحساب من قبل إدارة المنصة.',
          },
        },
        { status: 403 }
      );
    }

    const token = await signToken({
      userId: user.id,
      name: user.name,
      identifier: user.identifier,
      phone: user.phone || null,
      patientRelation: user.patient_relation || null,
      isDoctor: Boolean(user.is_doctor),
      role: user.role,
      doctorStatus: user.doctor_status,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        identifier: user.identifier,
        phone: user.phone || null,
        patient_relation: user.patient_relation || null,
        role: user.role,
        doctor_status: user.doctor_status,
        is_doctor: Boolean(user.is_doctor),
      },
    });

    const cookieOpts = getCookieOptions();
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (error: any) {
    console.error('[API Login Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ أثناء تسجيل الدخول' } },
      { status: 500 }
    );
  }
}
