import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

// GET /api/admin/doctors — List pending doctor verification requests
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول' } },
        { status: 401 }
      );
    }

    if (authUser.role !== 'admin' && authUser.role !== 'supervisor') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'هذا القسم مخصص للإدارة والمشرفين فقط' } },
        { status: 403 }
      );
    }

    const pendingDoctors = await db.getPendingDoctors();

    return NextResponse.json({
      success: true,
      data: pendingDoctors,
      count: pendingDoctors.length,
    });
  } catch (error: any) {
    console.error('[API Admin Doctors Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ أثناء تحميل طلبات توثيق الأطباء' } },
      { status: 500 }
    );
  }
}
