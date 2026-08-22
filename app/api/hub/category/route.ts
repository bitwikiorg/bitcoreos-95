import { NextRequest, NextResponse } from 'next/server';
import { HUB, stripHtml } from '@/lib/federated';
import type { Resource } from '@/lib/resources';

export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get('id'));
  const slug = request.nextUrl.searchParams.get('slug')?.trim() || '';
  if (!Number.isInteger(id) || id <= 0 || !slug) {
    return NextResponse.json({ error: 'missing_category' }, { status: 400 });
  }

  try {
    const url = new URL(`/c/${encodeURIComponent(slug)}/${id}.json`, HUB);
    const response = await fetch(url, { next: { revalidate: 45 } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: `hub_http_${response.status}` }, { status: 502 });

    const category = data?.category || {};
    const topics = Array.isArray(data?.topic_list?.topics) ? data.topic_list.topics : [];
    const resources: Resource[] = topics
      .filter((topic: any) => Number(topic?.id) > 0)
      .map((topic: any) => ({
        id: `hub:${topic.id}`,
        source: 'hub',
        kind: 'topic',
        title: String(topic.title || 'Untitled topic'),
        excerpt: stripHtml(String(topic.excerpt || topic.blurb || '')).slice(0, 360) || `${Number(topic.posts_count || 0)} posts · ${Number(topic.views || 0)} views`,
        url: `${HUB}/t/${topic.slug || 'topic'}/${topic.id}`,
        tags: Array.isArray(topic.tags) ? topic.tags.map((tag: any) => typeof tag === 'string' ? tag : String(tag?.name || '')).filter(Boolean) : [],
        author: topic?.last_poster_username || undefined,
        metadata: {
          topicId: Number(topic.id),
          categoryId: id,
          lastPostedAt: topic.last_posted_at || topic.bumped_at || topic.created_at,
          posts: Number(topic.posts_count || 0),
          views: Number(topic.views || 0),
        },
      }));

    return NextResponse.json({
      category: {
        id,
        slug,
        name: String(category.name || slug),
        description: stripHtml(String(category.description_text || category.description || '')),
        url: `${HUB}/c/${slug}/${id}`,
      },
      resources,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'category_read_failed' }, { status: 502 });
  }
}
