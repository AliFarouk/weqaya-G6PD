import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Ping DB
    const res = await db.searchItems({ limit: 1 });
    return NextResponse.json({
      status: 'ready',
      database: 'connected',
      items_count: res.total,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'not_ready',
        database: 'error',
        error: error.message,
      },
      { status: 503 }
    );
  }
}
