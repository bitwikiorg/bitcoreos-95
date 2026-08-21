import { HUB, WIKI, stripHtml } from './federated';
import type { HydratedResource, Resource, ResourcePost } from './resources';

const MAX_HUB_POSTS = 60;
const MAX_RESOURCE_CHARS = 80_000;
const WIKI_UA = { 'user-agent': 'BITCOREOS-95/0.3 (+https://bitwiki.org)' };

type JsonObject = Record<string, any>;

async function fetchJson(url: URL | string, init?: RequestInit): Promise<JsonObject> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data?.error) throw new Error(data.error?.info || data.error?.message || data.error?.code || 'upstream API error');
  return data;
}

function tagNames(tags: unknown): Array<string | { id?: number; name?: string; slug?: string }> {
  return Array.isArray(tags) ? tags : [];
}

function hubPost(topicId: number, slug: string, post: any): ResourcePost | null {
  const id = Number(post?.id);
  const postNumber = Number(post?.post_number);
  if (!id || !postNumber) return null;
  return {
    id,
    postNumber,
    username: String(post?.username || 'unknown'),
    displayName: typeof post?.name === 'string' && post.name.trim() ? post.name.trim() : undefined,
    createdAt: typeof post?.created_at === 'string' ? post.created_at : undefined,
    updatedAt: typeof post?.updated_at === 'string' ? post.updated_at : undefined,
    text: stripHtml(String(post?.cooked || post?.raw || '')),
    url: `${HUB}/t/${slug || 'topic'}/${topicId}/${postNumber}`,
  };
}

async function fetchMissingHubPosts(topicId: number, ids: number[]): Promise<any[]> {
  const collected: any[] = [];
  for (let index = 0; index < ids.length; index += 20) {
    const chunk = ids.slice(index, index + 20);
    const url = new URL(`/t/${topicId}/posts.json`, HUB);
    for (const id of chunk) url.searchParams.append('post_ids[]', String(id));
    try {
      const data = await fetchJson(url, { next: { revalidate: 30 } } as RequestInit);
      const posts = Array.isArray(data?.post_stream?.posts) ? data.post_stream.posts : [];
      collected.push(...posts);
    } catch {
      // The initial topic payload remains useful if Discourse rejects chunk hydration.
    }
  }
  return collected;
}

export async function hydrateHubTopic(topicId: number): Promise<HydratedResource> {
  if (!Number.isInteger(topicId) || topicId <= 0) throw new Error('invalid_topic_id');

  const topic = await fetchJson(new URL(`/t/${topicId}.json`, HUB), {
    next: { revalidate: 30 },
  } as RequestInit);

  const slug = String(topic?.slug || 'topic');
  const stream = Array.isArray(topic?.post_stream?.stream)
    ? topic.post_stream.stream.filter((id: unknown): id is number => typeof id === 'number')
    : [];
  const initial = Array.isArray(topic?.post_stream?.posts) ? topic.post_stream.posts : [];
  const postMap = new Map<number, any>();
  for (const post of initial) if (Number(post?.id)) postMap.set(Number(post.id), post);

  const desiredIds = stream.slice(0, MAX_HUB_POSTS);
  const missing = desiredIds.filter((id: number) => !postMap.has(id));
  if (missing.length) {
    const extras = await fetchMissingHubPosts(topicId, missing);
    for (const post of extras) if (Number(post?.id)) postMap.set(Number(post.id), post);
  }

  const posts = Array.from(postMap.values())
    .map((post) => hubPost(topicId, slug, post))
    .filter((post): post is ResourcePost => Boolean(post))
    .sort((a, b) => a.postNumber - b.postNumber)
    .slice(0, MAX_HUB_POSTS);

  const fullContent = posts
    .map((post) => `@${post.username} · post ${post.postNumber}\n${post.text}`)
    .join('\n\n---\n\n');
  const content = fullContent.slice(0, MAX_RESOURCE_CHARS);

  const totalPosts = Number(topic?.posts_count || stream.length || posts.length);
  const title = String(topic?.title || `BIThub topic ${topicId}`);

  return {
    id: `hub:${topicId}`,
    source: 'hub',
    kind: 'topic',
    title,
    excerpt: posts[0]?.text?.slice(0, 420) || '',
    url: `${HUB}/t/${slug}/${topicId}`,
    tags: tagNames(topic?.tags),
    author: posts[0]?.username,
    score: Number(topic?.views || 0),
    content,
    complete: totalPosts <= posts.length && fullContent.length <= MAX_RESOURCE_CHARS,
    details: { posts },
    metadata: {
      topicId,
      categoryId: topic?.category_id,
      posts: totalPosts,
      hydratedPosts: posts.length,
      views: topic?.views,
      createdAt: topic?.created_at,
      lastPostedAt: topic?.last_posted_at,
      archetype: topic?.archetype,
    },
  };
}

async function wikiApi(action: string, params: Record<string, string>): Promise<JsonObject> {
  const url = new URL('/w/api.php', WIKI);
  url.searchParams.set('action', action);
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('origin', '*');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return fetchJson(url, {
    headers: WIKI_UA,
    next: { revalidate: 60 },
  } as RequestInit);
}

function renderedHtmlToText(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<\/(p|div|li|h[1-6]|tr|table|section|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function wikiRenderedPage(title: string) {
  const data = await wikiApi('parse', {
    page: title,
    prop: 'text|sections|revid|displaytitle',
    disablelimitreport: '1',
    disableeditsection: '1',
  });
  const html = typeof data?.parse?.text === 'string' ? data.parse.text : '';
  const sections = Array.isArray(data?.parse?.sections) ? data.parse.sections : [];
  return {
    text: renderedHtmlToText(html),
    sectionCount: sections.length,
  };
}

export async function hydrateWikiPage(title: string): Promise<HydratedResource> {
  const requestedTitle = title.trim();
  if (!requestedTitle) throw new Error('missing_title');

  const data = await wikiApi('query', {
    titles: requestedTitle,
    redirects: '1',
    prop: 'extracts|info|categories|revisions',
    explaintext: '1',
    exsectionformat: 'plain',
    cllimit: 'max',
    rvprop: 'ids|timestamp|user|comment',
    rvlimit: '1',
    inprop: 'url',
  });

  const pages = Array.isArray(data?.query?.pages) ? data.query.pages : [];
  const page = pages.find((candidate: any) => candidate?.pageid && candidate?.missing === undefined);
  if (!page) throw new Error('wiki_page_not_found');

  const canonicalTitle = String(page.title || requestedTitle);
  let fullContent = String(page.extract || '').trim();
  let contentSource = 'extracts';
  let sectionCount: number | undefined;

  if (!fullContent) {
    const rendered = await wikiRenderedPage(canonicalTitle);
    fullContent = rendered.text;
    sectionCount = rendered.sectionCount;
    contentSource = 'parse';
  }

  const content = fullContent.slice(0, MAX_RESOURCE_CHARS);
  const categories = Array.isArray(page.categories)
    ? page.categories
        .map((category: any) => String(category?.title || '').replace(/^Category:/, ''))
        .filter(Boolean)
    : [];
  const revision = Array.isArray(page.revisions) ? page.revisions[0] : undefined;
  const url = typeof page.fullurl === 'string'
    ? page.fullurl
    : `${WIKI}/${encodeURIComponent(canonicalTitle.replace(/ /g, '_'))}`;

  return {
    id: `wiki:${page.pageid}`,
    source: 'wiki',
    kind: 'wiki-page',
    title: canonicalTitle,
    excerpt: content.slice(0, 420),
    url,
    score: Number(page.length || content.length),
    content,
    complete: fullContent.length <= MAX_RESOURCE_CHARS,
    details: {
      categories,
      canonicalTitle,
      revision: revision ? {
        id: Number(revision.revid) || undefined,
        timestamp: typeof revision.timestamp === 'string' ? revision.timestamp : undefined,
        user: typeof revision.user === 'string' ? revision.user : undefined,
        comment: typeof revision.comment === 'string' ? revision.comment : undefined,
      } : undefined,
    },
    metadata: {
      pageId: page.pageid,
      namespace: page.ns,
      length: page.length,
      touched: page.touched,
      categories: categories.length,
      sections: sectionCount,
      contentSource,
      revisionId: revision?.revid,
      revisionTimestamp: revision?.timestamp,
      revisionUser: revision?.user,
    },
  };
}

export async function hydrateResource(resource: Resource): Promise<HydratedResource> {
  if (resource.source === 'hub') {
    const topicId = Number(resource.metadata?.topicId || resource.id.replace(/^hub:/, ''));
    return hydrateHubTopic(topicId);
  }
  return hydrateWikiPage(resource.title);
}

export async function hydrateResources(resources: Resource[], limit = 6): Promise<HydratedResource[]> {
  const subset = resources.slice(0, Math.max(0, limit));
  const settled = await Promise.allSettled(subset.map((resource) => hydrateResource(resource)));
  return settled.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    const resource = subset[index];
    const error = result.reason instanceof Error ? result.reason.message : 'resource_hydration_failed';
    return {
      ...resource,
      content: resource.excerpt || '',
      complete: false,
      details: { hydrationError: error },
    };
  });
}
