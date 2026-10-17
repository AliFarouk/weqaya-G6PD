import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';

const verifySchema = z.object({
  approved: z.boolean(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUserId = parseInt(params.id, 10);
    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'معرف المستخدم غير صالح' } },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول' } },
        { status: 401 }
      );
    }

    if (authUser.role !== 'admin' && authUser.role !== 'supervisor') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'صلاحية التحقق من الأطباء للمشرفين والمديرين فقط' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = verifySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'يرجى تحديد حالة الموافقة (قبول أو رفض)' } },
        { status: 400 }
      );
    }

    const { approved } = result.data;
    const success = await db.verifyDoctor(targetUserId, approved);

    if (!success) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: approved
        ? 'تم اعتماد الطبيب رسمياً ومنحه شارة المهنة وصلاحيات المراجعة الطبية 🩺'
        : 'تم رفض طلب توثيق الطبيب وإبقاؤه كعضو عادي',
    });
  } catch (error: any) {
    console.error('[API Admin Doctor Verify Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ أثناء حفظ القرار' } },
      { status: 500 }
    );
  }
}
