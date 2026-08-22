import { NextRequest, NextResponse } from 'next/server';
import { HUB, stripHtml } from '@/lib/federated';
import { publicHubTopicContext } from '@/lib/context';
import type { Resource, ResourceKind } from '@/lib/resources';

function coreExecutor(title: string) {
  const match = title.match(/^\[([^\]]+)\]\s*/);
  const raw = match?.[1]?.trim();
  if (!raw) return undefined;
  const label = /\bcore\b/i.test(raw) ? raw : `${raw} CORE`;
  return { kind: 'core' as const, id: `core:${raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, label };
}

function categorySemantics(categoryName: string, slug: string, title: string) {
  const normalized = categoryName.toLowerCase();
  const slugged = slug.toLowerCase();
  const isCores = normalized === 'cores' || slugged === 'cores';
  const isNodes = normalized === 'nodes' || slugged === 'nodes';
  const isWorkspaces = normalized === 'workspaces' || slugged === 'workspaces';

  if (isCores) {
    const catalog = /^about the cores category$/i.test(title.trim());
    const definition = !catalog && /^about\b/i.test(title);
    if (catalog) return { resourceKind: 'guide' as ResourceKind, contextKind: 'CORE catalog', substrate: 'CORE catalog guide', semanticRole: 'CORE catalog + activation index' };
    if (definition) return { resourceKind: 'core' as ResourceKind, contextKind: 'CORE definition', substrate: 'CORE definition topic', semanticRole: 'CORE catalog + activation index' };
    return { resourceKind: 'core-run' as ResourceKind, contextKind: 'CORE run', substrate: 'CORE activation topic', semanticRole: 'CORE catalog + activation index' };
  }

  if (isNodes) {
    const catalog = /^about the nodes category$/i.test(title.trim());
    if (catalog) return { resourceKind: 'guide' as ResourceKind, contextKind: 'Node catalog', substrate: 'Node catalog guide', semanticRole: 'Node catalog' };
    return { resourceKind: 'node' as ResourceKind, contextKind: 'Node definition', substrate: 'Node catalog topic', semanticRole: 'Node catalog' };
  }

  if (isWorkspaces) {
    const catalog = /^about the workspaces category$/i.test(title.trim());
    if (catalog) return { resourceKind: 'guide' as ResourceKind, contextKind: 'Workspace catalog', substrate: 'Workspace catalog guide', semanticRole: 'Workspace catalog' };
    return { resourceKind: 'workspace' as ResourceKind, contextKind: 'Workspace', substrate: 'Workspace definition topic', semanticRole: 'Workspace catalog' };
  }

  return { resourceKind: 'topic' as ResourceKind, contextKind: 'Discussion', substrate: 'forum topic', semanticRole: 'category' };
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
    const topics = Array.isArray(data?.topic_list?.topics) ? data.topic_list.topics : [];
    let semanticRole = 'category';

    const resources: Resource[] = topics
      .filter((topic: any) => Number(topic?.id) > 0)
      .map((topic: any) => {
        const topicId = Number(topic.id);
        const title = String(topic.title || 'Untitled topic');
        const topicUrl = `${HUB}/t/${topic.slug || 'topic'}/${topicId}`;
        const semantics = categorySemantics(categoryName, slug, title);
        semanticRole = semantics.semanticRole;
        const executor = semantics.contextKind === 'CORE run' ? coreExecutor(title) : undefined;
        const context = publicHubTopicContext({
          topicId,
          url: topicUrl,
          categoryId: id,
          kind: semantics.contextKind,
          substrate: semantics.substrate,
          executor,
          provenance: semantics.contextKind === 'CORE run'
            ? [{ relation: 'activates', targetId: executor?.id || 'core:unknown', targetKind: 'CORE', label: executor?.label || 'CORE' }]
            : undefined,
        });

        return {
          id: `hub:${topicId}`,
          source: 'hub' as const,
          kind: semantics.resourceKind,
          title,
          excerpt: stripHtml(String(topic.excerpt || topic.blurb || '')).slice(0, 360) || `${Number(topic.posts_count || 0)} posts · ${Number(topic.views || 0)} views`,
          url: topicUrl,
          tags: Array.isArray(topic.tags) ? topic.tags.map((tag: any) => typeof tag === 'string' ? tag : String(tag?.name || '')).filter(Boolean) : [],
          context,
          metadata: {
            topicId,
            categoryId: id,
            semanticKind: context.kind,
            lastPostedAt: topic.last_posted_at || topic.bumped_at || topic.created_at,
            lastPosterUsername: topic?.last_poster_username || undefined,
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
        semanticRole,
        description: stripHtml(String(category.description_text || category.description || '')),
        url: `${HUB}/c/${slug}/${id}`,
      },
      resources,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'category_read_failed' }, { status: 502 });
  }
}