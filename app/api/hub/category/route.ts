import { NextRequest, NextResponse } from 'next/server';
import { HUB, stripHtml } from '@/lib/federated';
import { publicHubTopicContext } from '@/lib/context';
import type { Resource } from '@/lib/resources';

function coreExecutor(title: string) {
  const match = title.match(/^\[([^\]]+)\]\s*/);
  const raw = match?.[1]?.trim();
  if (!raw) return undefined;
  const label = /\bcore\b/i.test(raw) ? raw : `${raw} CORE`;
  return { kind: 'core' as const, id: `core:${raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, label };
}

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
    const categoryName = String(category.name || slug);
    const isCores = categoryName.toLowerCase() === 'cores' || slug.toLowerCase() === 'cores';
    const topics = Array.isArray(data?.topic_list?.topics) ? data.topic_list.topics : [];
    const resources: Resource[] = topics
      .filter((topic: any) => Number(topic?.id) > 0)
      .map((topic: any) => {
        const topicId = Number(topic.id);
        const title = String(topic.title || 'Untitled topic');
        const topicUrl = `${HUB}/t/${topic.slug || 'topic'}/${topicId}`;
        const definition = isCores && /^about\b/i.test(title);
        const executor = isCores && !definition ? coreExecutor(title) : undefined;
        const context = publicHubTopicContext({
          topicId,
          url: topicUrl,
          author: topic?.last_poster_username || undefined,
          categoryId: id,
          kind: definition ? 'CORE definition' : isCores ? 'CORE run' : 'Discussion',
          substrate: definition ? 'CORE catalog topic' : isCores ? 'CORE activation topic' : 'forum topic',
          executor,
          provenance: isCores && !definition
            ? [{ relation: 'activates', targetId: executor?.id || 'core:unknown', targetKind: 'CORE', label: executor?.label || 'CORE' }]
            : undefined,
        });

        return {
          id: `hub:${topicId}`,
          source: 'hub' as const,
          kind: definition ? 'core' as const : 'topic' as const,
          title,
          excerpt: stripHtml(String(topic.excerpt || topic.blurb || '')).slice(0, 360) || `${Number(topic.posts_count || 0)} posts · ${Number(topic.views || 0)} views`,
          url: topicUrl,
          tags: Array.isArray(topic.tags) ? topic.tags.map((tag: any) => typeof tag === 'string' ? tag : String(tag?.name || '')).filter(Boolean) : [],
          author: topic?.last_poster_username || undefined,
          context,
          metadata: {
            topicId,
            categoryId: id,
            semanticKind: context.kind,
            lastPostedAt: topic.last_posted_at || topic.bumped_at || topic.created_at,
            posts: Number(topic.posts_count || 0),
            views: Number(topic.views || 0),
          },
        };
      });

    return NextResponse.json({
      category: {
        id,
        slug,
        name: categoryName,
        semanticRole: isCores ? 'CORE catalog + activation index' : 'category',
        description: stripHtml(String(category.description_text || category.description || '')),
        url: `${HUB}/c/${slug}/${id}`,
      },
      resources,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'category_read_failed' }, { status: 502 });
  }
}
