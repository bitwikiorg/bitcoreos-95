import { NextRequest, NextResponse } from 'next/server';
import type { Resource } from '@/lib/resources';

// Current product scope is deliberately only these two canonical public systems.
const HUB = 'https://hub.bitwiki.org';
const WIKI = 'https://bitwiki.org';
const WIKI_HEADERS = { 'user-agent': 'BITCOREOS-95/0.1 (+https://bitwiki.org)' };

function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function searchHub(query: string): Promise<Resource[]> {
  const url = new URL('/search.json', HUB);
  url.searchParams.set('q', query);
  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error(`BIThub search failed: ${response.status}`);
  const data = await response.json();
  const topics = Array.isArray(data.topics) ? data.topics : [];
  return topics.slice(0, 12).map((topic: any) => ({
    id: `hub:${topic.id}`,
    source: 'hub',
    kind: 'topic',
    title: topic.title ?? 'Untitled topic',
    excerpt: stripHtml(topic.blurb ?? ''),
    url: `${HUB}/t/${topic.slug}/${topic.id}`,
    tags: Array.isArray(topic.tags) ? topic.tags : [],
    score: Number(topic.posts_count ?? 0),
    metadata: { topicId: topic.id, categoryId: topic.category_id },
  }));
}

function wikiResource(page: any, mode: 'exact' | 'fulltext' | 'allpages'): Resource {
  return {
    id: `wiki:${page.pageid}`,
    source: 'wiki',
    kind: 'wiki-page',
    title: page.title,
    excerpt: stripHtml(page.snippet ?? page.extract ?? ''),
    url: `${WIKI}/${encodeURIComponent(String(page.title).replace(/ /g, '_'))}`,
    score: Number(page.size ?? 0),
    metadata: { pageId: page.pageid, wordCount: page.wordcount, searchMode: mode },
  };
}

async function wikiApi(params: Record<string, string>) {
  const url = new URL('/w/api.php', WIKI);
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: WIKI_HEADERS,
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`BITwiki API failed: HTTP ${response.status}`);

  const data = await response.json();
  if (data?.error) {
    const code = String(data.error.code ?? 'unknown');
    const info = String(data.error.info ?? 'MediaWiki API error');
    throw new Error(`BITwiki API ${code}: ${info}`);
  }
  return data;
}

function dedupeWiki(resources: Resource[]) {
  return Array.from(new Map(resources.map((resource) => [resource.id, resource])).values()).slice(0, 12);
}

async function searchWiki(query: string): Promise<Resource[]> {
  // Exact title lookup is independent of MediaWiki's search index and gives direct navigation
  // for known concepts/pages even if full-text indexing is stale.
  const exactData = await wikiApi({ titles: query, redirects: '1' });
  const exactPages = Array.isArray(exactData?.query?.pages) ? exactData.query.pages : [];
  const exact = exactPages
    .filter((page: any) => page && page.pageid && page.missing === undefined && page.invalid === undefined)
    .map((page: any) => wikiResource(page, 'exact'));

  const fulltext = await wikiApi({ list: 'search', srsearch: query, srlimit: '12' });
  const fulltextResults = Array.isArray(fulltext?.query?.search) ? fulltext.query.search : [];
  if (fulltextResults.length) {
    return dedupeWiki([
      ...exact,
      ...fulltextResults.map((page: any) => wikiResource(page, 'fulltext')),
    ]);
  }

  // Database-backed title fallback when the search index has no matches.
  const allpages = await wikiApi({ list: 'allpages', apprefix: query, aplimit: '12', apnamespace: '0' });
  const titleResults = Array.isArray(allpages?.query?.allpages) ? allpages.query.allpages : [];
  return dedupeWiki([
    ...exact,
    ...titleResults.map((page: any) => wikiResource(page, 'allpages')),
  ]);
}

function failureMessage(result: PromiseSettledResult<Resource[]>) {
  if (result.status === 'fulfilled') return null;
  return result.reason instanceof Error ? result.reason.message : 'upstream request failed';
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!query) return NextResponse.json({ query, resources: [], sources: {} });

  const [hub, wiki] = await Promise.allSettled([searchHub(query), searchWiki(query)]);

  const resources = [
    ...(hub.status === 'fulfilled' ? hub.value : []),
    ...(wiki.status === 'fulfilled' ? wiki.value : []),
  ];

  return NextResponse.json({
    query,
    resources,
    sources: {
      hub: {
        ok: hub.status === 'fulfilled',
        count: hub.status === 'fulfilled' ? hub.value.length : 0,
        error: failureMessage(hub),
        origin: HUB,
      },
      wiki: {
        ok: wiki.status === 'fulfilled',
        count: wiki.status === 'fulfilled' ? wiki.value.length : 0,
        error: failureMessage(wiki),
        origin: WIKI,
      },
    },
  });
}
