import { NextRequest, NextResponse } from 'next/server';
import { WIKI, stripHtml } from '@/lib/federated';
import type { ContextCapsule } from '@/lib/context';
import type { Resource, ResourceKind } from '@/lib/resources';

const WIKI_UA = { 'user-agent': 'BITCOREOS-95/0.6 (+https://bitwiki.org)' };
const KINDS = ['categories', 'templates', 'modules', 'properties'] as const;
type DirectoryKind = typeof KINDS[number];

const definitions: Record<DirectoryKind, { namespace: string; resourceKind: ResourceKind; contextKind: string; substrate: string }> = {
  categories: { namespace: 'Category', resourceKind: 'category', contextKind: 'Wiki category', substrate: 'MediaWiki category page' },
  templates: { namespace: 'Template', resourceKind: 'template', contextKind: 'Wiki template', substrate: 'MediaWiki template page' },
  modules: { namespace: 'Module', resourceKind: 'lua-module', contextKind: 'Lua module', substrate: 'Scribunto Lua module' },
  properties: { namespace: 'Property', resourceKind: 'property', contextKind: 'SMW Property page', substrate: 'Semantic MediaWiki Property page' },
};

async function wiki(params: Record<string, string>) {
  const url = new URL('/w/api.php', WIKI);
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: WIKI_UA, next: { revalidate: 120 } } as RequestInit);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`wiki_http_${response.status}`);
  if (data?.error) throw new Error(`wiki_${data.error.code || 'error'}:${data.error.info || 'request_failed'}`);
  return data;
}

function namespaceId(namespaces: Record<string, any>, target: string) {
  const expected = target.toLowerCase();
  for (const [id, namespace] of Object.entries(namespaces || {})) {
    const names = [namespace?.canonical, namespace?.name, namespace?.['*']]
      .filter((value) => typeof value === 'string')
      .map((value) => String(value).toLowerCase());
    if (names.includes(expected)) return Number(id);
  }
  return null;
}

function pageUrl(title: string) {
  return `${WIKI}/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

function pageResource(page: any, kind: DirectoryKind, namespace: number): Resource {
  const definition = definitions[kind];
  const pageId = Number(page?.pageid || 0);
  const title = String(page?.title || 'Untitled');
  const url = pageUrl(title);
  const context: ContextCapsule = {
    id: `wiki:${pageId || title}`,
    kind: definition.contextKind,
    origin: {
      plane: 'wiki',
      substrate: definition.substrate,
      api: '/w/api.php',
      canonicalRef: pageId ? `mediawiki:page:${pageId}` : `mediawiki:title:${title}`,
      url,
    },
    authority: { visibility: 'public', mode: 'public-read' },
    capabilities: ['read', 'ask', 'research', 'explore-relations'],
    metadata: { pageId: pageId || undefined, namespace, directoryKind: kind },
  };
  return {
    id: `wiki:${pageId || title}`,
    source: 'wiki',
    kind: definition.resourceKind,
    title,
    excerpt: stripHtml(String(page?.description || '')) || definition.contextKind,
    url,
    metadata: { pageId: pageId || undefined, namespace, directoryKind: kind },
    context,
  };
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('kind')?.trim() as DirectoryKind | undefined;
  const kind = raw && KINDS.includes(raw) ? raw : null;
  if (!kind) return NextResponse.json({ error: 'invalid_directory_kind', kinds: KINDS }, { status: 400 });

  try {
    const site = await wiki({ action: 'query', meta: 'siteinfo', siprop: 'namespaces' });
    const namespaces = site?.query?.namespaces || {};
    const targetNamespace = namespaceId(namespaces, definitions[kind].namespace);
    if (!Number.isInteger(targetNamespace)) {
      return NextResponse.json({ kind, available: false, namespace: definitions[kind].namespace, resources: [] });
    }

    const data = await wiki({
      action: 'query',
      list: 'allpages',
      apnamespace: String(targetNamespace),
      aplimit: '100',
      apfilterredir: 'nonredirects',
    });
    const pages = Array.isArray(data?.query?.allpages) ? data.query.allpages : [];
    const resources = pages.map((page: any) => pageResource(page, kind, targetNamespace));

    return NextResponse.json({
      kind,
      available: true,
      namespace: definitions[kind].namespace,
      namespaceId: targetNamespace,
      count: resources.length,
      resources,
      continuation: data?.continue || null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'wiki_directory_failed', kind, resources: [] }, { status: 502 });
  }
}