import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';
import { invalidateCachePrefix } from '@/lib/cache';

const reviewActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'claim']),
  name: z.string().min(2).optional(),
  category: z.enum(['food', 'medication']).optional(),
  origin: z.enum(['supermarket', 'restaurant', 'pharmacy', 'home', 'general']).optional(),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'معرف الصنف غير صالح' } },
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

    const isAuthorized =
      authUser.role === 'admin' ||
      authUser.role === 'supervisor' ||
      (authUser.isDoctor && authUser.doctorStatus === 'approved');

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'ليس لديك صلاحية مراجعة الأصناف' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = reviewActionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'بيانات المراجعة غير صالحة' } },
        { status: 400 }
      );
    }

    const { action, name, category, origin } = result.data;

    if (action === 'claim') {
      const claimRes = await db.claimDoctorItem(itemId, authUser.userId);
      if (!claimRes.success) {
        return NextResponse.json(
          { success: false, error: { code: 'LOCKED_BY_ANOTHER_DOCTOR', message: claimRes.error || 'هذا الصنف مقفل حالياً بواسطة طبيب آخر' } },
          { status: 409 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'تم قفل الصنف وبدء المراجعة باسمك بنجاح 🔒',
      });
    }

    if (action === 'approve') {
      const updated = await db.approveDoctorItem(itemId, authUser.userId, {
        name,
        category,
        origin,
      });

      if (!updated) {
        return NextResponse.json(
          { success: false, error: { code: 'ITEM_NOT_FOUND', message: 'الصنف غير موجود' } },
          { status: 404 }
        );
      }

      await invalidateCachePrefix('items_list_');

      return NextResponse.json({
        success: true,
        message: `تم اعتماد ونشر «${updated.name}» في الدليل بنجاح 🚀`,
        data: updated,
      });
    } else {
      const success = await db.rejectDoctorItem(itemId, authUser.userId);
      if (!success) {
        return NextResponse.json(
          { success: false, error: { code: 'ITEM_NOT_FOUND', message: 'الصنف غير موجود' } },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'تم رفض الصنف واستبعاده من طابور النشر',
      });
    }
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ قرار المراجعة';
    console.error('[API Doctor Item Review Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'LOCKED_BY_ANOTHER_DOCTOR', message: errorMsg } },
      { status: 409 }
    );
  }
}
