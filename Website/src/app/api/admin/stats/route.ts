import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

// GET /api/admin/stats — Detailed platform analytics and counts for graphs
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
        { success: false, error: { code: 'FORBIDDEN', message: 'غير مصرح لك بالاطلاع على الإحصائيات' } },
        { status: 403 }
      );
    }

    const stats = await db.getAdminAnalytics();
    return NextResponse.json({ success: true, data: stats });
  } catch (err) {
    console.error('[API Admin Stats Error]:', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'تعذر جلب الإحصائيات' } },
      { status: 500 }
    );
  }
}
