import type { Resource, SearchResponse, SourceHealth } from './resources';

export const HUB = 'https://hub.bitwiki.org';
export const WIKI = 'https://bitwiki.org';
const WIKI_UA = { 'user-agent': 'BITCOREOS-95/0.2 (+https://bitwiki.org)' };

export function stripHtml(value = '') {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#x27;/g, "'")
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

  return topics.slice(0, limit).map((topic: any) => {
    const hit = bestPostByTopic.get(Number(topic.id));
    return {
      id: `hub:${topic.id}`,
      source: 'hub' as const,
      kind: 'topic' as const,
      title: topic.title ?? 'Untitled topic',
      excerpt: stripHtml(hit?.blurb ?? topic.blurb ?? ''),
      url: `${HUB}/t/${topic.slug}/${topic.id}`,
      tags: Array.isArray(topic.tags) ? topic.tags : [],
      author: hit?.username,
      score: Number(topic.posts_count ?? 0),
      metadata: {
        topicId: topic.id,
        categoryId: topic.category_id,
        posts: topic.posts_count,
        views: topic.views,
        lastPostedAt: topic.last_posted_at,
        matchedPostNumber: hit?.post_number,
      },
    };
  });
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
  return {
    id: `wiki:${page.pageid ?? page.id ?? title}`,
    source: 'wiki',
    kind: 'wiki-page',
    title,
    excerpt: stripHtml(page.excerpt ?? page.snippet ?? page.description ?? ''),
    url: wikiUrl(title),
    score: Number(page.size ?? 0),
    metadata: {
      pageId: page.pageid ?? page.id,
      wordCount: page.wordcount,
      description: page.description,
      thumbnail: page.thumbnail?.url,
      searchMode: mode,
    },
  };
}

function dedupe(resources: Resource[], limit: number) {
  return Array.from(new Map(resources.map((resource) => [resource.id, resource])).values()).slice(0, limit);
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
