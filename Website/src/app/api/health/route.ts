import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'weqaya-g6pd',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
