import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth/jwt';
import { invalidateCachePrefix } from '@/lib/cache';

// GET /api/admin/csv-import — Download CSV Template with Arabic UTF-8 BOM
export async function GET() {
  const csvHeaders = 'اسم الصنف,نوع الصنف (أكل أو دواء),المصدر (سوبرماركت أو مطعم أو صيدلية أو بيتي),أصوات التكسير الأولية,أصوات الأمان الأولية,ملاحظات\r\n';
  const csvRows = [
    'سناكس بروتين بافس بالعدس أبو عوف,أكل,سوبرماركت,25,0,يحتوي على دقيق العدس المسبب لتحلل الدم لمرضى الفوال',
    'لانشون حلواني سادة بقري,أكل,سوبرماركت,150,40,يحتوي في بعض التشغيلات على بروتين الصويا',
    'أقراص أسبيرين ريفو 320 مجم,دواء,صيدلية,310,4,أسبيرين غير آمن لمصابي نقص إنزيم G6PD',
    'طعمية مقلية سخنة,أكل,مطعم,820,10,فول مدمس مقلي',
    'كتافلام 50 مجم أقراص,دواء,صيدلية,5,280,ديكلوفيناك مسكن آمن مع متابعة الطبيب',
    'شيبسي بطاطس ملح سادة,أكل,سوبرماركت,0,150,بطاطس وزيت وملح خالية من البقوليات',
  ].join('\r\n');

  // UTF-8 BOM for proper Arabic display in MS Excel
  const bom = '\uFEFF';
  const fullContent = bom + csvHeaders + csvRows;

  return new NextResponse(fullContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="weqaya_items_template.csv"',
    },
  });
}

// Helper to parse CSV line handling quotes
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

// POST /api/admin/csv-import — Upload & Process CSV File
export async function POST(req: NextRequest) {
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
        { success: false, error: { code: 'FORBIDDEN', message: 'صلاحية رفع ملفات CSV للإدارة فقط' } },
        { status: 403 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let csvText = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: { code: 'NO_FILE', message: 'يرجى اختيار ملف CSV لرفعه' } },
          { status: 400 }
        );
      }
      csvText = await file.text();
    } else {
      const json = await req.json();
      csvText = json.csvText || '';
    }

    // Strip BOM if present
    if (csvText.charCodeAt(0) === 0xfeff) {
      csvText = csvText.substring(1);
    }

    const rawLines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (rawLines.length <= 1) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_CSV', message: 'الملف فارغ أو لا يحتوي على صفوف بيانات' } },
        { status: 400 }
      );
    }

    // Parse header
    const headers = parseCsvLine(rawLines[0]);
    const itemsToInsert: Array<{
      name: string;
      category: 'food' | 'medication';
      origin: string;
      hemolysis_votes: number;
      safe_votes: number;
      created_by: number;
    }> = [];

    // Parse data rows
    for (let i = 1; i < rawLines.length; i++) {
      const parts = parseCsvLine(rawLines[i]);
      if (parts.length < 2) continue;

      const name = parts[0]?.trim();
      const categoryRaw = parts[1]?.trim().toLowerCase();
      const originRaw = parts[2]?.trim().toLowerCase() || '';
      const hVotes = parseInt(parts[3] || '0', 10) || 0;
      const sVotes = parseInt(parts[4] || '0', 10) || 0;

      if (!name || name.length < 2) continue;

      const isMed =
        categoryRaw.includes('دوا') ||
        categoryRaw.includes('علاج') ||
        categoryRaw.includes('med') ||
        categoryRaw.includes('صيدل');
      const category: 'food' | 'medication' = isMed ? 'medication' : 'food';

      let origin = 'general';
      if (originRaw.includes('سوبر') || originRaw.includes('ماركت') || originRaw.includes('market')) {
        origin = 'supermarket';
      } else if (originRaw.includes('مطعم') || originRaw.includes('restaurant')) {
        origin = 'restaurant';
      } else if (originRaw.includes('صيدل') || isMed) {
        origin = 'pharmacy';
      } else if (originRaw.includes('بيت') || originRaw.includes('منزل') || originRaw.includes('home')) {
        origin = 'home';
      }

      itemsToInsert.push({
        name,
        category,
        origin,
        hemolysis_votes: Math.max(0, hVotes),
        safe_votes: Math.max(0, sVotes),
        created_by: authUser.userId,
      });
    }

    if (itemsToInsert.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_VALID_ROWS', message: 'لم يتم العثور على أي أصناف صالحة للإضافة بالملف' } },
        { status: 400 }
      );
    }

    const { inserted, skipped } = await db.bulkInsertCsvItems(itemsToInsert);
    await invalidateCachePrefix('items_list_');

    return NextResponse.json({
      success: true,
      message: `تمت معالجة الملف بنجاح! تمت إضافة ${inserted} صنف جديد إلى الدليل (تم تخطي ${skipped} صنف مكرر).`,
      inserted,
      skipped,
      total_rows: itemsToInsert.length,
    });
  } catch (error: any) {
    console.error('[API CSV Import Error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'حدث خطأ أثناء معالجة ملف CSV' } },
      { status: 500 }
    );
  }
}
