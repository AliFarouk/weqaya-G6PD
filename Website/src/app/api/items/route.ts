import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getCached, setCached, invalidateCachePrefix } from '@/lib/cache';

const createItemSchema = z.object({
  name: z.string().min(2, 'اسم الصنف يجب ألا يقل عن حرفين').max(200, 'الاسم طويل جداً'),
  category: z.enum(['food', 'medication'], {
    errorMap: () => ({ message: 'الفئة يجب أن تكون إما أكل أو دواء' }),
  }),
  origin: z.enum(['supermarket', 'restaurant', 'pharmacy', 'home', 'general']).optional().default('general'),
  image_url: z.string().nullable().optional(),
  initial_vote: z.enum(['hemolysis', 'safe']).nullable().optional(),
});

// GET /api/items — List and Search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'all';
    const origin = searchParams.get('origin') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const authUser = await getAuthUser(req);
    const isAnonymous = !authUser;

    // Cache key for anonymous traffic
    const cacheKey = `items_list_${category}_${origin}_${q}_${page}_${limit}`;
    if (isAnonymous) {
      const cached = await getCached<any>(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          headers: {
            'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
          },
        });
      }
    }

    const result = await db.searchItems({
      q,
      category,
      origin,
      page,
      limit,
      userId: authUser?.userId,
    });

    const responsePayload = {
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total_records: result.total,
        total_pages: result.totalPages,
      },
    };

    if (isAnonymous) {
      await setCached(cacheKey, responsePayload, 20);
    }

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': isAnonymous
          ? 'public, s-maxage=15, stale-while-revalidate=60'
          : 'no-store, private',
      },
    });
  } catch (error: any) {
    console.error('[API Items GET Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ أثناء تحميل الأصناف' } },
      { status: 500 }
    );
  }
}

// POST /api/items — Add New Item
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول لإضافة صنف جديد' } },
        { status: 401 }
      );
    }

    // Rate limit: 5 new items per hour per user per §6.3 & doc 07
    const rl = await checkRateLimit(`add_item_user_${authUser.userId}`, 5, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `تجاوزت الحد المسموح لإضافة الأصناف (5 أصناف في الساعة). يرجى الانتظار ${Math.ceil(rl.resetSeconds / 60)} دقيقة`,
          },
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = createItemSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message || 'بيانات الصنف غير صحيحة';
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: firstError } },
        { status: 400 }
      );
    }

    const { name, category, origin, image_url, initial_vote } = result.data;

    // Duplicate Check (§6.3 & User Request)
    const existingDuplicate = await db.findDuplicateItem(name);
    if (existingDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ITEM',
            message: `الصنف «${existingDuplicate.name}» مسجل بالفعل في الدليل (${existingDuplicate.total_votes} أصوات). لا يمكن تكرار إضافة نفس الصنف.`,
          },
        },
        { status: 409 }
      );
    }

    // Determine status: Doctors (approved), Supervisors, and Admins publish immediately. Regular users go to review.
    const isApprovedStaff =
      authUser.role === 'admin' ||
      authUser.role === 'supervisor' ||
      (authUser.isDoctor && authUser.doctorStatus === 'approved');

    const status = isApprovedStaff ? 'published' : 'pending_doctor_review';

    const newItem = await db.createItem({
      name,
      category,
      origin: origin || (category === 'medication' ? 'pharmacy' : 'general'),
      image_url: image_url || null,
      created_by: authUser.userId,
      initial_vote: initial_vote || null,
      status,
    });

    // Invalidate public feed cache
    await invalidateCachePrefix('items_list_');

    const userMessage =
      status === 'published'
        ? `تم نشر الصنف «${newItem.name}» في الدليل فوراً 🚀`
        : `تم إرسال «${newItem.name}» للمراجعة الطبية، سيظهر بالدليل فور اعتماده من الأطباء المتطوعين 🩺`;

    return NextResponse.json(
      {
        success: true,
        data: newItem,
        is_pending: status === 'pending_doctor_review',
        message: userMessage,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API Items POST Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ أثناء إضافة الصنف' } },
      { status: 500 }
    );
  }
}
