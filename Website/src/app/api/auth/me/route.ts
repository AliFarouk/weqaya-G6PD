import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'غير مسجل دخول' } },
        { status: 401 }
      );
    }

    const user = await db.findUserById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
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
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ في استرجاع بيانات المستخدم' } },
      { status: 500 }
    );
  }
}
