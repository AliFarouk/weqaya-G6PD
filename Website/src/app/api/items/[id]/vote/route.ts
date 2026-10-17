import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';
import { checkRateLimit } from '@/lib/rate-limit';
import { invalidateCachePrefix } from '@/lib/cache';

const voteSchema = z.object({
  vote_type: z.enum(['hemolysis', 'safe'], {
    errorMap: () => ({ message: 'نوع التصويت يجب أن يكون إما hemolysis أو safe' }),
  }),
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
        { success: false, error: { code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول للتصويت' } },
        { status: 401 }
      );
    }

    // Rate limit: 60 votes per minute per user per §7.4
    const rl = await checkRateLimit(`vote_user_${authUser.userId}`, 60, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'تجاوزت الحد المسموح من التصويتات، يرجى الانتظار قليلاً' } },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = voteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message || 'بيانات غير صالحة' } },
        { status: 400 }
      );
    }

    const { vote_type } = result.data;

    // Execute atomic vote transaction per §7.3
    const { item, stats } = await db.executeAtomicVote(authUser.userId, itemId, vote_type);

    // Invalidate public feed cache
    await invalidateCachePrefix('items_list_');

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل صوتك بنجاح',
      item_id: itemId,
      user_vote: vote_type,
      updated_stats: stats,
    });
  } catch (error: any) {
    console.error('[API Vote POST Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ أثناء تسجيل الصوت' } },
      { status: 500 }
    );
  }
}
