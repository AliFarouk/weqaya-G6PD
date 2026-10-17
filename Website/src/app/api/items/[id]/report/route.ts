import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';
import { checkRateLimit } from '@/lib/rate-limit';
import { invalidateCachePrefix } from '@/lib/cache';

const reportSchema = z.object({
  reason: z.string().max(255).optional(),
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
        { success: false, error: { code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول للإبلاغ عن صنف' } },
        { status: 401 }
      );
    }

    // Rate limit: 10 reports per hour per user
    const rl = await checkRateLimit(`report_user_${authUser.userId}`, 10, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'تجاوزت الحد المسموح من البلاغات' } },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const result = reportSchema.safeParse(body);
    const reason = result.success ? result.data.reason : undefined;

    const { reported, is_hidden } = await db.reportItem(authUser.userId, itemId, reason);

    if (is_hidden) {
      await invalidateCachePrefix('items_list_');
    }

    return NextResponse.json({
      success: true,
      message: 'شكراً لمساعدتك في حماية المجتمع، تم استلام البلاغ',
      reported,
      is_hidden,
    });
  } catch (error: any) {
    console.error('[API Report POST Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ أثناء تسجيل البلاغ' } },
      { status: 500 }
    );
  }
}
