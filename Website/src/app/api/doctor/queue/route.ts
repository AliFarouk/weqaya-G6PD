import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

// GET /api/doctor/queue — Fetch pending items waiting for doctor review
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول' } },
        { status: 401 }
      );
    }

    const isStaffOrDoctor =
      authUser.role === 'admin' ||
      authUser.role === 'supervisor' ||
      (authUser.isDoctor && authUser.doctorStatus === 'approved');

    if (!isStaffOrDoctor) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'هذا القسم مخصص للأطباء المعتمدين والمشرفين فقط' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'pending';

    if (type === 'reviewed') {
      const reviewedItems = await db.getReviewedDoctorItems(30);
      return NextResponse.json({
        success: true,
        data: reviewedItems,
        count: reviewedItems.length,
      });
    }

    const pendingItems = await db.getPendingDoctorItems();

    return NextResponse.json({
      success: true,
      data: pendingItems,
      count: pendingItems.length,
    });
  } catch (error: any) {
    console.error('[API Doctor Queue Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ أثناء تحميل طابور المراجعة' } },
      { status: 500 }
    );
  }
}
