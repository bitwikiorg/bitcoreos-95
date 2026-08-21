import { WIKI } from './federated';

const HEADERS = { 'user-agent': 'BITCOREOS-95/0.5 (+https://bitwiki.org)' };

async function api(params: Record<string, string>, revalidate = 120) {
  const url = new URL('/w/api.php', WIKI);
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: HEADERS, next: { revalidate } } as RequestInit);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`SMW HTTP ${response.status}`);
  if (data?.error) throw new Error(`SMW ${data.error.code || 'error'}: ${data.error.info || 'request failed'}`);
  return data;
}

export async function smwBrowse(browse: 'page' | 'subject' | 'property' | 'pvalue' | 'category' | 'concept', params: Record<string, unknown>) {
  return api({ action: 'smwbrowse', browse, params: JSON.stringify(params) });
}

export async function smwInfo() {
  try {
    const data = await api({ action: 'smwinfo', info: 'proppagecount|declaredpropcount|usedpropcount|propcount|errorcount|querycount|subobjectcount|conceptcount' });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'smwinfo_failed' };
  }
}

function resultArray(data: any) {
  const candidates = [data?.query, data?.results, data?.result, data?.browse];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') {
      for (const value of Object.values(candidate)) if (Array.isArray(value)) return value;
    }
  }
  return [];
}

export async function semanticDirectory(search = '*', limit = 40) {
  const bounded = Math.min(Math.max(limit, 1), 100);
  const [properties, concepts, categories, info] = await Promise.allSettled([
    smwBrowse('property', { limit: bounded, offset: 0, search, description: true, prefLabel: true, usageCount: true }),
    smwBrowse('concept', { limit: bounded, offset: 0, search }),
    smwBrowse('category', { limit: bounded, offset: 0, search }),
    smwInfo(),
  ]);
  return {
    properties: properties.status === 'fulfilled' ? resultArray(properties.value) : [],
    concepts: concepts.status === 'fulfilled' ? resultArray(concepts.value) : [],
    categories: categories.status === 'fulfilled' ? resultArray(categories.value) : [],
    info: info.status === 'fulfilled' ? info.value : { ok: false, error: String(info.reason || 'smwinfo_failed') },
    health: {
      properties: properties.status === 'fulfilled',
      concepts: concepts.status === 'fulfilled',
      categories: categories.status === 'fulfilled',
    },
  };
}

export async function semanticSubject(title: string) {
  const subject = title.trim();
  if (!subject) throw new Error('missing_subject');
  const data = await smwBrowse('subject', { subject, ns: 0, iw: '' });
  return { title: subject, raw: data };
}
