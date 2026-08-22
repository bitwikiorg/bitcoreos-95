import type { Resource, SearchResponse, SourceHealth } from './resources';
import type { ContextCapsule } from './context';
import { publicHubTopicContext, publicWikiPageContext } from './context';

export const HUB = 'https://hub.bitwiki.org';
export const WIKI = 'https://bitwiki.org';
const WIKI_UA = { 'user-agent': 'BITCOREOS-95/0.6 (+https://bitwiki.org)' };

export function stripHtml(value = '') {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#x27;/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function failure(result: PromiseSettledResult<Resource[]>, origin: string): SourceHealth {
  if (result.status === 'fulfilled') return { ok: true, count: result.value.length, error: null, origin };
  const error = result.reason instanceof Error ? result.reason.message : 'upstream request failed';
  return { ok: false, count: 0, error, origin };
}

async function fetchJson(url: URL | string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function simpleHubContext(input: {
  id: string;
  kind: string;
  substrate: string;
  canonicalRef: string;
  url: string;
  subject?: ContextCapsule['identity'] extends infer I ? any : never;
  metadata?: Record<string, unknown>;
  capabilities?: string[];
}): ContextCapsule {
  return {
    id: input.id,
    kind: input.kind,
    origin: {
      plane: 'hub',
      substrate: input.substrate,
      canonicalRef: input.canonicalRef,
      url: input.url,
    },
    identity: input.subject ? { subject: input.subject } : undefined,
    authority: { visibility: 'public', mode: 'public-read' },
    capabilities: input.capabilities || ['read', 'ask', 'research'],
    metadata: input.metadata,
  };
}

function userResource(user: any): Resource | null {
  const username = String(user?.username || '').trim();
  if (!username) return null;
  const url = `${HUB}/u/${encodeURIComponent(username)}`;
  const label = String(user?.name || '').trim();
  const context = simpleHubContext({
    id: `user:${username}`,
    kind: 'User identity',
    substrate: 'Discourse user profile',
    canonicalRef: `discourse:user:${username}`,
    url,
    subject: { kind: 'human', id: `discourse-user:${username}`, label: `@${username}` },
    capabilities: ['read', 'ask', 'research', 'explore-activity'],
    metadata: { username },
  });
  return {
    id: `hub:user:${username}`,
    source: 'hub',
    kind: 'user',
    title: label || `@${username}`,
    excerpt: label ? `@${username}` : 'Discourse user profile',
    url,
    metadata: { username, name: label || undefined },
    context,
  };
}

function categoryResource(category: any): Resource | null {
  const id = Number(category?.id);
  const slug = String(category?.slug || '').trim();
  const name = String(category?.name || '').trim();
  if (!Number.isInteger(id) || id <= 0 || !slug || !name) return null;
  const url = `${HUB}/c/${encodeURIComponent(slug)}/${id}`;
  return {
    id: `hub:category:${id}`,
    source: 'hub',
    kind: 'category',
    title: name,
    excerpt: stripHtml(String(category?.description_text || category?.description || '')) || 'Discussion category',
    url,
    metadata: { categoryId: id, slug, topicCount: category?.topic_count },
    context: simpleHubContext({
      id: `category:${id}`,
      kind: 'Discussion category',
      substrate: 'Discourse category',
      canonicalRef: `discourse:category:${id}`,
      url,
      capabilities: ['read', 'ask', 'research', 'explore-topics'],
      metadata: { categoryId: id, slug },
    }),
  };
}

function tagResource(tag: any): Resource | null {
  const raw = typeof tag === 'string' ? tag : tag?.name || tag?.text || tag?.slug;
  const name = String(raw || '').replace(/^#/, '').trim();
  if (!name) return null;
  const slug = String((typeof tag === 'object' && tag?.slug) || name).trim();
  const url = `${HUB}/tag/${encodeURIComponent(slug)}`;
  return {
    id: `hub:tag:${slug}`,
    source: 'hub',
    kind: 'tag',
    title: `#${name}`,
    excerpt: typeof tag === 'object' && Number.isFinite(Number(tag?.count)) ? `${Number(tag.count)} tagged topics` : 'Topic tag',
    url,
    metadata: { tag: name, slug, count: typeof tag === 'object' ? tag?.count : undefined },
    context: simpleHubContext({
      id: `tag:${slug}`,
      kind: 'Tag',
      substrate: 'Discourse tag',
      canonicalRef: `discourse:tag:${slug}`,
      url,
      capabilities: ['read', 'ask', 'research', 'explore-topics'],
      metadata: { tag: name, slug },
    }),
  };
}

function groupResource(group: any): Resource | null {
  const name = String(group?.name || '').trim();
  if (!name) return null;
  const url = `${HUB}/g/${encodeURIComponent(name)}`;
  const fullName = String(group?.full_name || '').trim();
  return {
    id: `hub:group:${name}`,
    source: 'hub',
    kind: 'group',
    title: fullName || name,
    excerpt: fullName ? `${name} · ${Number(group?.user_count || 0)} members` : `${Number(group?.user_count || 0)} members`,
    url,
    metadata: { groupId: group?.id, name, fullName: fullName || undefined, userCount: group?.user_count },
    context: simpleHubContext({
      id: `group:${name}`,
      kind: 'Group',
      substrate: 'Discourse group',
      canonicalRef: `discourse:group:${name}`,
      url,
      capabilities: ['read', 'ask', 'research', 'explore-members'],
      metadata: { groupId: group?.id, name },
    }),
  };
}

function dedupe(resources: Resource[], limit: number) {
  return Array.from(new Map(resources.map((resource) => [resource.id, resource])).values()).slice(0, limit);
}

export async function searchHub(query: string, limit = 12): Promise<Resource[]> {
  const url = new URL('/search.json', HUB);
  url.searchParams.set('q', query);
  const data = await fetchJson(url, { next: { revalidate: 45 } } as RequestInit);
  const topics = Array.isArray(data?.topics) ? data.topics : [];
  const posts = Array.isArray(data?.posts) ? data.posts : [];
  const bestPostByTopic = new Map<number, any>();
  for (const post of posts) {
    const topicId = Number(post?.topic_id);
    if (topicId && !bestPostByTopic.has(topicId)) bestPostByTopic.set(topicId, post);
  }

  const topicResources: Resource[] = topics.map((topic: any) => {
    const topicId = Number(topic.id);
    const hit = bestPostByTopic.get(topicId);
    const topicUrl = `${HUB}/t/${topic.slug}/${topicId}`;
    return {
      id: `hub:${topicId}`,
      source: 'hub',
      kind: 'topic',
      title: topic.title ?? 'Untitled topic',
      excerpt: stripHtml(hit?.blurb ?? topic.blurb ?? ''),
      url: topicUrl,
      tags: Array.isArray(topic.tags) ? topic.tags : [],
      score: Number(topic.posts_count ?? 0),
      context: publicHubTopicContext({
        topicId,
        url: topicUrl,
        categoryId: Number(topic.category_id) || undefined,
      }),
      metadata: {
        topicId,
        categoryId: topic.category_id,
        posts: topic.posts_count,
        views: topic.views,
        lastPostedAt: topic.last_posted_at,
        matchedPostId: hit?.id,
        matchedPostNumber: hit?.post_number,
        matchedPostAuthor: hit?.username,
      },
    };
  });

  const entityResources = [
    ...(Array.isArray(data?.users) ? data.users.map(userResource) : []),
    ...(Array.isArray(data?.categories) ? data.categories.map(categoryResource) : []),
    ...(Array.isArray(data?.tags) ? data.tags.map(tagResource) : []),
    ...(Array.isArray(data?.groups) ? data.groups.map(groupResource) : []),
  ].filter((resource): resource is Resource => Boolean(resource));

  const reserve = Math.min(Math.max(0, Math.floor(limit / 3)), entityResources.length);
  const topicSlots = Math.max(0, limit - reserve);
  return dedupe([
    ...topicResources.slice(0, topicSlots),
    ...entityResources,
    ...topicResources.slice(topicSlots),
  ], limit);
}

async function wikiAction(params: Record<string, string>) {
  const url = new URL('/w/api.php', WIKI);
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const data = await fetchJson(url, { headers: WIKI_UA, next: { revalidate: 60 } } as RequestInit);
  if (data?.error) throw new Error(`MediaWiki ${data.error.code ?? 'error'}: ${data.error.info ?? 'request failed'}`);
  return data;
}

function wikiUrl(title: string) {
  return `${WIKI}/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

function wikiResource(page: any, mode: string): Resource {
  const title = String(page.title ?? page.key ?? 'Untitled');
  const pageId = page.pageid ?? page.id ?? title;
  const url = wikiUrl(title);
  return {
    id: `wiki:${pageId}`,
    source: 'wiki',
    kind: 'wiki-page',
    title,
    excerpt: stripHtml(page.excerpt ?? page.snippet ?? page.description ?? ''),
    url,
    score: Number(page.size ?? 0),
    context: publicWikiPageContext({ id: pageId, title, url }),
    metadata: {
      pageId: page.pageid ?? page.id,
      wordCount: page.wordcount,
      description: page.description,
      thumbnail: page.thumbnail?.url,
      searchMode: mode,
    },
  };
}

export async function searchWiki(query: string, limit = 12): Promise<Resource[]> {
  const found: Resource[] = [];

  try {
    const rest = new URL('/w/rest.php/v1/search/page', WIKI);
    rest.searchParams.set('q', query);
    rest.searchParams.set('limit', String(Math.min(limit, 20)));
    const data = await fetchJson(rest, { headers: WIKI_UA, next: { revalidate: 60 } } as RequestInit);
    const pages = Array.isArray(data?.pages) ? data.pages : [];
    found.push(...pages.map((page: any) => wikiResource(page, 'rest')));
  } catch {
    // Action API below remains the fallback.
  }

  const exact = await wikiAction({ titles: query, redirects: '1', prop: 'info|extracts', exintro: '1', explaintext: '1', exchars: '420' });
  const exactPages = Array.isArray(exact?.query?.pages) ? exact.query.pages : [];
  found.push(...exactPages
    .filter((page: any) => page?.pageid && page.missing === undefined && page.invalid === undefined)
    .map((page: any) => wikiResource(page, 'exact')));

  if (found.length < limit) {
    const fulltext = await wikiAction({ list: 'search', srsearch: query, srlimit: String(limit) });
    const results = Array.isArray(fulltext?.query?.search) ? fulltext.query.search : [];
    found.push(...results.map((page: any) => wikiResource(page, 'fulltext')));
  }

  if (found.length === 0) {
    const allpages = await wikiAction({ list: 'allpages', apprefix: query, aplimit: String(limit), apnamespace: '0' });
    const results = Array.isArray(allpages?.query?.allpages) ? allpages.query.allpages : [];
    found.push(...results.map((page: any) => wikiResource(page, 'allpages')));
  }

  return dedupe(found, limit);
}

export async function federatedSearch(query: string, limitPerSource = 12): Promise<SearchResponse> {
  const q = query.trim();
  if (!q) {
    return {
      query: q,
      resources: [],
      sources: {
        hub: { ok: true, count: 0, error: null, origin: HUB },
        wiki: { ok: true, count: 0, error: null, origin: WIKI },
      },
    };
  }

  const [hub, wiki] = await Promise.allSettled([
    searchHub(q, limitPerSource),
    searchWiki(q, limitPerSource),
  ]);

  return {
    query: q,
    resources: [
      ...(hub.status === 'fulfilled' ? hub.value : []),
      ...(wiki.status === 'fulfilled' ? wiki.value : []),
    ],
    sources: {
      hub: failure(hub, HUB),
      wiki: failure(wiki, WIKI),
    },
  };
}