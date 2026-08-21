import { WIKI } from './federated';

export type ResearchIntent =
  | 'new-page'
  | 'revise-page'
  | 'category'
  | 'semantic-model'
  | 'lua-projection'
  | 'artifact'
  | 'coverage-audit';

export type KnowledgeStatus = 'requested' | 'researching' | 'drafting' | 'review' | 'satisfied' | 'declined';
export type RequestStoreSource = 'cargo' | 'wiki-content' | 'unavailable';

export type KnowledgeRequest = {
  request: string;
  reason?: string;
  candidateDomains?: string[];
  sourceLeads?: string;
  neededDepth?: string;
  status: KnowledgeStatus;
  canonicalPage?: string;
  notes?: string;
};

export type ResearchPreflight = {
  intent: ResearchIntent;
  targetTitle?: string;
  existingPage: null | { title: string; pageId: number; url: string };
  matchingRequests: KnowledgeRequest[];
  requestStore: { ok: boolean; count: number; source: RequestStoreSource; warning?: string; error?: string };
  recommendation: string;
};

const WIKI_UA = { 'user-agent': 'BITCOREOS-95/0.4 (+https://bitwiki.org)' };
const REQUEST_SOURCE = 'https://raw.githubusercontent.com/bitwikiorg/wiki-content/main/BITwiki/Requested%20knowledge.mediawiki';

function list(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function normalizeStatus(value: unknown): KnowledgeStatus {
  const status = String(value || '').trim().toLowerCase();
  if (['requested', 'researching', 'drafting', 'review', 'satisfied', 'declined'].includes(status)) return status as KnowledgeStatus;
  return 'requested';
}

function requestFromFields(source: Record<string, unknown>): KnowledgeRequest | null {
  const request = String(source.Request ?? source.request ?? '').trim();
  if (!request) return null;
  return {
    request,
    reason: String(source.Reason ?? source.reason ?? '').trim() || undefined,
    candidateDomains: list(source.Candidate_domains ?? source.candidate_domains),
    sourceLeads: String(source.Source_leads ?? source.source_leads ?? '').trim() || undefined,
    neededDepth: String(source.Needed_depth ?? source.needed_depth ?? '').trim() || undefined,
    status: normalizeStatus(source.Status ?? source.status),
    canonicalPage: String(source.Canonical_page ?? source.canonical_page ?? '').trim() || undefined,
    notes: String(source.Notes ?? source.notes ?? '').trim() || undefined,
  };
}

function unpackCargoRow(row: any): KnowledgeRequest | null {
  const source = row?.title && typeof row.title === 'object' ? row.title : row;
  return requestFromFields(source || {});
}

function parseRequestSource(source: string): KnowledgeRequest[] {
  const rows: KnowledgeRequest[] = [];
  const blocks = source.matchAll(/\{\{Knowledge request\s*([\s\S]*?)\n\}\}/gi);
  for (const block of blocks) {
    const fields: Record<string, string> = {};
    for (const line of String(block[1] || '').split('\n')) {
      const match = line.match(/^\s*\|\s*([^=]+?)\s*=\s*(.*)$/);
      if (!match) continue;
      fields[match[1].trim()] = match[2].trim();
    }
    const row = requestFromFields(fields);
    if (row) rows.push(row);
  }
  return rows;
}

async function sourceControlledRequests(limit: number) {
  const response = await fetch(REQUEST_SOURCE, { next: { revalidate: 120 } } as RequestInit);
  if (!response.ok) throw new Error(`wiki_content_http_${response.status}`);
  const source = await response.text();
  return parseRequestSource(source).slice(0, limit);
}

export async function getKnowledgeRequests(limit = 100): Promise<{ ok: boolean; requests: KnowledgeRequest[]; source: RequestStoreSource; warning?: string; error?: string }> {
  const boundedLimit = Math.min(Math.max(limit, 1), 500);
  const url = new URL('/w/api.php', WIKI);
  url.searchParams.set('action', 'cargoquery');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('tables', 'Knowledge_requests');
  url.searchParams.set('fields', 'Request,Reason,Candidate_domains,Source_leads,Needed_depth,Status,Canonical_page,Notes');
  url.searchParams.set('limit', String(boundedLimit));
  url.searchParams.set('order_by', 'Status,Request');

  let cargoError = '';
  try {
    const response = await fetch(url, { headers: WIKI_UA, next: { revalidate: 60 } } as RequestInit);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (data?.error) throw new Error(data.error?.info || data.error?.code || 'cargo_query_failed');
    const rows = Array.isArray(data?.cargoquery) ? data.cargoquery : [];
    const requests = rows.map(unpackCargoRow).filter((row: KnowledgeRequest | null): row is KnowledgeRequest => Boolean(row));
    return { ok: true, requests, source: 'cargo' };
  } catch (error) {
    cargoError = error instanceof Error ? error.message : 'cargo_query_failed';
  }

  try {
    const requests = await sourceControlledRequests(boundedLimit);
    return {
      ok: true,
      requests,
      source: 'wiki-content',
      warning: `Live Cargo Knowledge_requests is unavailable; using canonical wiki-content source. Cargo error: ${cargoError}`,
    };
  } catch (error) {
    return {
      ok: false,
      requests: [],
      source: 'unavailable',
      error: `${cargoError}; fallback: ${error instanceof Error ? error.message : 'wiki_content_failed'}`,
    };
  }
}

export async function findWikiPage(title: string) {
  const target = title.trim();
  if (!target) return null;
  const url = new URL('/w/api.php', WIKI);
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('titles', target);
  url.searchParams.set('redirects', '1');
  url.searchParams.set('prop', 'info');
  url.searchParams.set('inprop', 'url');
  try {
    const response = await fetch(url, { headers: WIKI_UA, next: { revalidate: 60 } } as RequestInit);
    const data = await response.json();
    const page = Array.isArray(data?.query?.pages) ? data.query.pages.find((item: any) => item?.pageid && item?.missing === undefined) : null;
    if (!page) return null;
    return {
      title: String(page.title || target),
      pageId: Number(page.pageid),
      url: typeof page.fullurl === 'string' ? page.fullurl : `${WIKI}/${encodeURIComponent(String(page.title || target).replace(/ /g, '_'))}`,
    };
  } catch {
    return null;
  }
}

function norm(value: string) {
  return value.trim().toLowerCase().replace(/[_\s]+/g, ' ');
}

export function intentLabel(intent: ResearchIntent) {
  return {
    'new-page': 'new canonical page',
    'revise-page': 'revision of an existing page',
    category: 'category / navigation object',
    'semantic-model': 'SMW property / concept / semantic model',
    'lua-projection': 'Lua / template / computed projection',
    artifact: 'reusable research artifact',
    'coverage-audit': 'coverage audit / request set',
  }[intent];
}

export async function researchPreflight(input: { intent: ResearchIntent; targetTitle?: string; request: string }): Promise<ResearchPreflight> {
  const targetTitle = input.targetTitle?.trim() || undefined;
  const [existingPage, store] = await Promise.all([
    targetTitle ? findWikiPage(targetTitle) : Promise.resolve(null),
    getKnowledgeRequests(200),
  ]);

  const needles = [targetTitle, input.request].filter((value): value is string => Boolean(value)).map(norm);
  const matchingRequests = store.requests.filter((item) => {
    const hay = norm(item.request);
    return needles.some((needle) => hay === needle || (needle.length > 8 && (hay.includes(needle) || needle.includes(hay))));
  }).slice(0, 8);

  let recommendation = `Prepare a ${intentLabel(input.intent)} research packet.`;
  if (input.intent === 'new-page' && existingPage) recommendation = 'The target page already exists; treat this as a revision or justify a distinct title before creating new canonical content.';
  else if (input.intent === 'revise-page' && !existingPage && targetTitle) recommendation = 'The requested revision target does not currently resolve; verify the title or reclassify as a new-page request.';
  else if (matchingRequests.some((item) => !['satisfied', 'declined'].includes(item.status))) recommendation = 'An active knowledge request already overlaps this work; continue or refine that request instead of creating a duplicate.';
  else if (input.intent === 'coverage-audit') recommendation = 'Return a prioritized set of missing/weak targets; do not manufacture canonical pages merely to close counts.';
  else if (input.intent === 'semantic-model') recommendation = 'Model stable relationships first; prefer SMW Property/Concept only when the relation or computed set has a real consumer.';
  else if (input.intent === 'lua-projection') recommendation = 'Specify the repeated transformation/query need before proposing Lua or template code; derived output is not automatically a canonical assertion.';

  return {
    intent: input.intent,
    targetTitle,
    existingPage,
    matchingRequests,
    requestStore: { ok: store.ok, count: store.requests.length, source: store.source, warning: store.warning, error: store.error },
    recommendation,
  };
}
