import { NextRequest, NextResponse } from 'next/server';
import { semanticDirectory, semanticSubject } from '@/lib/semantic';

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title')?.trim();
  try {
    if (title) return NextResponse.json(await semanticSubject(title));
    const search = request.nextUrl.searchParams.get('q')?.trim() || '*';
    const limit = Number(request.nextUrl.searchParams.get('limit') || 40);
    return NextResponse.json(await semanticDirectory(search, Number.isFinite(limit) ? limit : 40));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'semantic_read_failed' }, { status: 502 });
  }
}
