import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

// GET /api/admin/users — List all platform users with filtering
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
        { success: false, error: { code: 'FORBIDDEN', message: 'غير مصرح لك بإدارة المستخدمين' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const role = searchParams.get('role') || 'all';
    const status = searchParams.get('status') || 'all';

    const users = await db.getAllUsers(q, role, status);
    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    console.error('[API Admin Users Error]:', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'تعذر جلب قائمة المستخدمين' } },
      { status: 500 }
    );
  }
}
