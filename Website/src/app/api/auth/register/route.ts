import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { signToken, getCookieOptions } from '@/lib/auth/jwt';
import { normalizeIdentifier } from '@/lib/arabic-normalize';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const registerSchema = z.object({
  name: z.string().min(2, 'الاسم يجب ألا يقل عن حرفين').max(100, 'الاسم طويل جداً'),
  identifier: z.string().min(5, 'يرجى إدخال بريد إلكتروني صحيح أو رقم هاتف مصري'),
  phone: z.string().optional().nullable(),
  patient_relation: z.string().optional().nullable(),
  password: z.string().min(8, 'كلمة المرور يجب ألا تقل عن 8 أحرف'),
  is_doctor: z.boolean().optional().default(false),
  syndicate_card_url: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: 10 registrations per minute per IP
    const rl = await checkRateLimit(`auth_reg_${ip}`, 10, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'تجاوزت الحد المسموح من المحاولات، يرجى الانتظار قليلاً' } },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message || 'بيانات التسجيل غير صالحة';
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: firstError } },
        { status: 400 }
      );
    }

    const { name, identifier, phone, patient_relation, password, is_doctor, syndicate_card_url } = result.data;
    const norm = normalizeIdentifier(identifier);

    if (norm.type === 'invalid') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_IDENTIFIER', message: 'صيغة البريد الإلكتروني أو رقم الهاتف غير صحيحة' } },
        { status: 400 }
      );
    }

    // If claiming to be a doctor, require syndicate card
    if (is_doctor && (!syndicate_card_url || syndicate_card_url.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: { code: 'CARD_REQUIRED', message: 'يرجى إرفاق صورة كارنيه النقابة للتحقق من صفتك الطبية واعتماد حسابك' } },
        { status: 400 }
      );
    }

    // Check existing user
    const existing = await db.findUserByIdentifier(norm.canonical);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_EXISTS', message: 'هذا الحساب أو رقم الهاتف مسجل بالفعل مسبقاً' } },
        { status: 409 }
      );
    }

    // Hash password with argon2id
    const passwordHash = await hashPassword(password);

    // Create user (if doctor: doctor_status = 'pending', is_doctor = 0 until verified)
    const newUser = await db.createUser({
      name: name.trim(),
      identifier: norm.canonical,
      phone: phone?.trim() || null,
      patient_relation: patient_relation || null,
      password_hash: passwordHash,
      is_doctor,
      syndicate_card_url: syndicate_card_url?.trim() || null,
    });

    // Generate JWT token
    const token = await signToken({
      userId: newUser.id,
      name: newUser.name,
      identifier: newUser.identifier,
      phone: newUser.phone || null,
      patientRelation: newUser.patient_relation || null,
      isDoctor: Boolean(newUser.is_doctor),
      role: newUser.role,
      doctorStatus: newUser.doctor_status,
    });

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          identifier: newUser.identifier,
          phone: newUser.phone,
          patient_relation: newUser.patient_relation,
          role: newUser.role,
          doctor_status: newUser.doctor_status,
          is_doctor: Boolean(newUser.is_doctor),
        },
      },
      { status: 201 }
    );

    // Set secure httpOnly cookie
    const cookieOpts = getCookieOptions();
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (error: any) {
    console.error('[API Register Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ أثناء إنشاء الحساب' } },
      { status: 500 }
    );
  }
}
