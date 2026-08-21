import { NextRequest, NextResponse } from 'next/server';
import { hydrateHubTopic, hydrateWikiPage } from '@/lib/hydration';

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('source');

  try {
    if (source === 'hub') {
      const topicId = Number(request.nextUrl.searchParams.get('topicId'));
      if (!Number.isInteger(topicId) || topicId <= 0) {
        return NextResponse.json({ error: 'invalid_topic_id' }, { status: 400 });
      }
      return NextResponse.json(await hydrateHubTopic(topicId));
    }

    if (source === 'wiki') {
      const title = request.nextUrl.searchParams.get('title')?.trim() || '';
      if (!title) return NextResponse.json({ error: 'missing_title' }, { status: 400 });
      return NextResponse.json(await hydrateWikiPage(title));
    }

    return NextResponse.json({ error: 'invalid_source' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'resource_hydration_failed' },
      { status: 502 },
    );
  }
}
