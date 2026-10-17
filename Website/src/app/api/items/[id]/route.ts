import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'معرف الصنف غير صالح' } },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser(req);
    const item = await db.getItemById(id, authUser?.userId);

    if (!item || item.is_hidden) {
      return NextResponse.json(
        { success: false, error: { code: 'ITEM_NOT_FOUND', message: 'الصنف المطلوب غير موجود' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error('[API Item Details Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ في استرجاع تفاصيل الصنف' } },
      { status: 500 }
    );
  }
}
