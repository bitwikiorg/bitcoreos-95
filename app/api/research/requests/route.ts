import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeRequests } from '@/lib/research';

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get('limit') || 100);
  const result = await getKnowledgeRequests(Number.isFinite(limit) ? limit : 100);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
