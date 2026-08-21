import { NextRequest, NextResponse } from 'next/server';
import type { Resource } from '@/lib/resources';

const HUB = process.env.BITHUB_URL ?? 'https://hub.bitwiki.org';
const WIKI = process.env.BITWIKI_URL ?? 'https://bitwiki.org';

function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function searchHub(query: string): Promise<Resource[]> {
  const url = new URL('/search.json', HUB);
  url.searchParams.set('q', query);
  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) return [];
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

async function searchWiki(query: string): Promise<Resource[]> {
  const url = new URL('/api.php', WIKI);
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'search');
  url.searchParams.set('srsearch', query);
  url.searchParams.set('srlimit', '12');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) return [];
  const data = await response.json();
  const results = Array.isArray(data?.query?.search) ? data.query.search : [];
  return results.map((page: any) => ({
    id: `wiki:${page.pageid}`,
    source: 'wiki',
    kind: 'wiki-page',
    title: page.title,
    excerpt: stripHtml(page.snippet ?? ''),
    url: `${WIKI}/wiki/${encodeURIComponent(String(page.title).replace(/ /g, '_'))}`,
    score: Number(page.size ?? 0),
    metadata: { pageId: page.pageid, wordCount: page.wordcount },
  }));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!query) return NextResponse.json({ query, resources: [] });

  const [hub, wiki] = await Promise.allSettled([searchHub(query), searchWiki(query)]);
  const resources = [
    ...(hub.status === 'fulfilled' ? hub.value : []),
    ...(wiki.status === 'fulfilled' ? wiki.value : []),
  ];

  return NextResponse.json({ query, resources });
}
