const HUB = 'https://hub.bitwiki.org';
const WIKI = 'https://bitwiki.org';

function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function searchHub(q) {
  const response = await fetch(`${HUB}/search.json?q=${encodeURIComponent(q)}`, {
    headers: { accept: 'application/json' },
    next: { revalidate: 60 }
  });
  if (!response.ok) throw new Error(`BIThub search failed: ${response.status}`);
  const data = await response.json();
  return (data.topics || []).slice(0, 12).map(topic => ({
    id: `hub:topic:${topic.id}`,
    source: 'hub',
    kind: 'topic',
    title: topic.title,
    excerpt: stripHtml(topic.blurb || ''),
    url: `${HUB}/t/${topic.slug}/${topic.id}`,
    tags: topic.tags || []
  }));
}

async function searchWiki(q) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: q,
    srlimit: '12',
    srprop: 'snippet|timestamp',
    format: 'json'
  });
  const response = await fetch(`${WIKI}/api.php?${params}`, {
    headers: { accept: 'application/json' },
    next: { revalidate: 300 }
  });
  if (!response.ok) throw new Error(`BITwiki search failed: ${response.status}`);
  const data = await response.json();
  return (data.query?.search || []).map(page => ({
    id: `wiki:page:${page.pageid}`,
    source: 'wiki',
    kind: 'wiki-page',
    title: page.title,
    excerpt: stripHtml(page.snippet || ''),
    url: `${WIKI}/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`,
    timestamp: page.timestamp
  }));
}

export async function GET(request) {
  const q = new URL(request.url).searchParams.get('q')?.trim();
  if (!q) return Response.json({ query: '', results: [], errors: [] });

  const [hub, wiki] = await Promise.allSettled([searchHub(q), searchWiki(q)]);
  const results = [
    ...(hub.status === 'fulfilled' ? hub.value : []),
    ...(wiki.status === 'fulfilled' ? wiki.value : [])
  ];
  const errors = [
    ...(hub.status === 'rejected' ? [{ source: 'hub', message: hub.reason.message }] : []),
    ...(wiki.status === 'rejected' ? [{ source: 'wiki', message: wiki.reason.message }] : [])
  ];

  return Response.json({ query: q, results, errors });
}
