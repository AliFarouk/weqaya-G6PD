import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/users/[id] — Update user suspension or role
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, error: { code: 'FORBIDDEN', message: 'غير مصرح لك بتعديل المستخدمين' } },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'معرف المستخدم غير صحيح' } },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Prevent modifying main admin (id: 1) suspension
    if (userId === 1 && typeof body.is_suspended === 'boolean' && body.is_suspended) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'لا يمكن تجميد حساب المدير الرئيسي للنظام' } },
        { status: 403 }
      );
    }

    // 1. Suspension toggle
    if (typeof body.is_suspended === 'boolean') {
      const ok = await db.setUserSuspension(userId, body.is_suspended, body.reason);
      return NextResponse.json({ success: ok, message: body.is_suspended ? 'تم تجميد الحساب بنجاح' : 'تم تنشيط الحساب بنجاح' });
    }

    // 2. Role / Doctor status update (Admin only)
    if (body.role) {
      if (authUser.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'تغيير الأدوار متاح للمدير العام فقط' } },
          { status: 403 }
        );
      }

      const isDoctor = body.role === 'doctor' || Boolean(body.is_doctor);
      const doctorStatus = isDoctor ? 'approved' : (body.doctor_status || 'none');
      const ok = await db.updateUserRoleAndDoctor(userId, body.role, isDoctor, doctorStatus);
      return NextResponse.json({ success: ok, message: 'تم تحديث صلاحيات المستخدم بنجاح' });
    }

    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'لم يتم تحديد أي إجراء للتعديل' } },
      { status: 400 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'تعذر تعديل المستخدم';
    console.error('[API Admin Update User Error]:', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: errorMsg } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] — Delete user permanently
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول' } },
        { status: 401 }
      );
    }

    // Only Admin can delete users
    if (authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'حذف المستخدمين متاح للمدير العام فقط' } },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'معرف المستخدم غير صحيح' } },
        { status: 400 }
      );
    }

    if (userId === authUser.userId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'لا يمكنك حذف حسابك الحالي' } },
        { status: 400 }
      );
    }

    const ok = await db.deleteUser(userId);
    return NextResponse.json({ success: ok, message: 'تم حذف المستخدم بنجاح' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'تعذر حذف المستخدم';
    console.error('[API Admin Delete User Error]:', err);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: errorMsg } },
      { status: 500 }
    );
  }
}
