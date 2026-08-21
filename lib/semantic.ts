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

function findArray(value: unknown, depth = 0): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object' || depth > 5) return [];
  for (const nested of Object.values(value as Record<string, unknown>)) {
    const found = findArray(nested, depth + 1);
    if (found.length) return found;
  }
  return [];
}

function resultArray(data: any) {
  return findArray(data?.query ?? data?.results ?? data?.result ?? data?.browse ?? data);
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

export type SemanticFact = {
  property: string;
  direction: 'direct' | 'inverse' | string;
  values: Array<{ type?: number; item: string }>;
};

export async function semanticSubject(title: string) {
  const subject = title.trim();
  if (!subject) throw new Error('missing_subject');
  const data = await smwBrowse('subject', { subject, ns: 0, iw: '' });
  const rawFacts = Array.isArray(data?.query?.data) ? data.query.data : [];
  const facts: SemanticFact[] = rawFacts.map((fact: any) => ({
    property: String(fact?.property || ''),
    direction: String(fact?.direction || 'direct'),
    values: (Array.isArray(fact?.dataitem) ? fact.dataitem : []).map((item: any) => ({ type: Number(item?.type) || undefined, item: String(item?.item || '') })).filter((item: any) => item.item),
  })).filter((fact: SemanticFact) => fact.property && fact.values.length);
  return { title: subject, facts, raw: data };
}
