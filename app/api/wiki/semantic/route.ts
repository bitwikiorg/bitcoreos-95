import { NextRequest, NextResponse } from 'next/server';
import { semanticDirectory, semanticSubject, smwBrowse } from '@/lib/semantic';

const BROWSE = new Set(['page', 'subject', 'property', 'pvalue', 'category', 'concept']);

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title')?.trim();
  try {
    if (title) return NextResponse.json(await semanticSubject(title));

    const browse = request.nextUrl.searchParams.get('browse')?.trim();
    if (browse && BROWSE.has(browse)) {
      const search = request.nextUrl.searchParams.get('q')?.trim();
      const params: Record<string, unknown> = { limit: 25, offset: 0 };
      if (search) params.search = search;
      if (browse === 'property') Object.assign(params, { description: true, prefLabel: true, usageCount: true });
      return NextResponse.json(await smwBrowse(browse as 'page' | 'subject' | 'property' | 'pvalue' | 'category' | 'concept', params));
    }

    const search = request.nextUrl.searchParams.get('q')?.trim() || '*';
    const limit = Number(request.nextUrl.searchParams.get('limit') || 40);
    return NextResponse.json(await semanticDirectory(search, Number.isFinite(limit) ? limit : 40));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'semantic_read_failed' }, { status: 502 });
  }
}
