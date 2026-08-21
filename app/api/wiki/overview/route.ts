import { NextResponse } from 'next/server';
import { WIKI, stripHtml } from '@/lib/federated';

async function query(params: Record<string, string>) {
  const url = new URL('/w/api.php', WIKI);
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: { 'user-agent': 'BITCOREOS-95/0.2 (+https://bitwiki.org)' },
    next: { revalidate: 90 },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data?.error) throw new Error(data.error.info ?? data.error.code ?? 'MediaWiki API error');
  return data;
}

export async function GET() {
  const [recentResult, categoriesResult, statsResult] = await Promise.allSettled([
    query({ list: 'recentchanges', rclimit: '12', rcnamespace: '0', rcprop: 'title|timestamp|user|comment|ids|sizes|flags' }),
    query({ list: 'allcategories', aclimit: '100', acprop: 'size' }),
    query({ meta: 'siteinfo', siprop: 'statistics|general' }),
  ]);

  const recentData = recentResult.status === 'fulfilled' ? recentResult.value : null;
  const categoriesData = categoriesResult.status === 'fulfilled' ? categoriesResult.value : null;
  const statsData = statsResult.status === 'fulfilled' ? statsResult.value : null;

  const recent = (recentData?.query?.recentchanges ?? []).map((change: any) => ({
    id: change.rcid,
    pageId: change.pageid,
    revisionId: change.revid,
    oldRevisionId: change.old_revid,
    title: change.title,
    user: change.user,
    comment: stripHtml(change.comment ?? ''),
    timestamp: change.timestamp,
    oldLength: change.oldlen,
    newLength: change.newlen,
    url: `${WIKI}/${encodeURIComponent(String(change.title).replace(/ /g, '_'))}`,
  }));

  const categories = (categoriesData?.query?.allcategories ?? [])
    .map((category: any) => ({
      name: category.category ?? category['*'],
      pages: category.pages,
      files: category.files,
      subcats: category.subcats,
      size: category.size,
      url: `${WIKI}/Category:${encodeURIComponent(String(category.category ?? category['*']).replace(/ /g, '_'))}`,
    }))
    .filter((category: any) => category.name && !/^\.+$/.test(category.name))
    .sort((a: any, b: any) => Number(b.size ?? 0) - Number(a.size ?? 0))
    .slice(0, 32);

  const statistics = statsData?.query?.statistics ?? {};
  const general = statsData?.query?.general ?? {};

  return NextResponse.json({
    origin: WIKI,
    recent,
    categories,
    statistics: {
      articles: statistics.articles ?? 0,
      pages: statistics.pages ?? 0,
      edits: statistics.edits ?? 0,
      images: statistics.images ?? 0,
      users: statistics.users ?? 0,
      activeUsers: statistics.activeusers ?? 0,
    },
    sitename: general.sitename ?? 'BITwiki',
    health: {
      recent: recentResult.status === 'fulfilled',
      categories: categoriesResult.status === 'fulfilled',
      statistics: statsResult.status === 'fulfilled',
    },
  });
}
