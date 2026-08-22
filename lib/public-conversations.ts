import { HUB, stripHtml } from './federated';
import type { ContextCapsule } from './context';
import type { ConversationMessage, ConversationSummary } from './conversations';

type CoreCategory = { id: number; slug: string; name: string };

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

async function publicJson(path: string, revalidate = 45) {
  const response = await fetch(new URL(path, HUB), { next: { revalidate } } as RequestInit);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`hub_http_${response.status}`);
  return data;
}

async function coreCategory(): Promise<CoreCategory> {
  const data = await publicJson('/categories.json', 120);
  const rows = asArray(data?.category_list?.categories);
  const category = rows.find((item) => String(item?.name || '').toLowerCase() === 'cores');
  if (!category?.id) throw new Error('cores_category_not_found');
  return {
    id: Number(category.id),
    slug: String(category.slug || 'cores'),
    name: String(category.name || 'Cores'),
  };
}

function executorFromTitle(title: string) {
  const match = title.match(/^\[([^\]]+)\]\s*/);
  const raw = match?.[1]?.trim();
  if (!raw) return { label: 'CORE', id: 'core:unknown' };
  const label = /\bcore\b/i.test(raw) ? raw : `${raw} CORE`;
  return {
    label,
    id: `core:${raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
  };
}

function coreRunSummary(topic: any, category: CoreCategory): ConversationSummary | null {
  const topicId = Number(topic?.id);
  if (!Number.isInteger(topicId) || topicId <= 0) return null;
  const title = String(topic?.title || 'CORE run');
  if (/^about\b/i.test(title)) return null;

  const executor = executorFromTitle(title);
  const url = `${HUB}/t/${topic?.slug || 'topic'}/${topicId}`;
  const context: ContextCapsule = {
    id: `core-run:${topicId}`,
    kind: 'CORE run',
    origin: {
      plane: 'hub',
      substrate: 'CORE activation topic',
      api: `/t/${topicId}.json`,
      canonicalRef: `discourse:topic:${topicId}`,
      url,
    },
    identity: {
      executor: { kind: 'core', id: executor.id, label: executor.label },
    },
    authority: { visibility: 'public', mode: 'public-read' },
    provenance: [
      { relation: 'activates', targetId: executor.id, targetKind: 'CORE', label: executor.label },
      { relation: 'belongs-to', targetId: `discourse:category:${category.id}`, targetKind: 'Cores catalog' },
    ],
    capabilities: ['read', 'ask', 'research'],
    metadata: { topicId, categoryId: category.id, posts: Number(topic?.posts_count || 0), views: Number(topic?.views || 0) },
  };

  return {
    id: context.id,
    kind: 'core-run',
    title,
    excerpt: stripHtml(String(topic?.excerpt || '')).slice(0, 220) || `${Number(topic?.posts_count || 0)} posts · ${Number(topic?.views || 0)} views`,
    lastActivity: topic?.last_posted_at || topic?.bumped_at || topic?.created_at,
    url,
    topicId,
    context,
  };
}

export async function listPublicConversations() {
  const category = await coreCategory();
  const data = await publicJson(`/c/${encodeURIComponent(category.slug)}/${category.id}.json`);
  const conversations = asArray(data?.topic_list?.topics)
    .map((topic) => coreRunSummary(topic, category))
    .filter((item): item is ConversationSummary => Boolean(item))
    .sort((a, b) => Date.parse(b.lastActivity || '0') - Date.parse(a.lastActivity || '0'));

  return {
    conversations,
    sources: {
      core: { ok: true, count: conversations.length, error: null as string | null },
    },
  };
}

export async function readPublicCoreConversation(topicId: number) {
  const [category, data] = await Promise.all([coreCategory(), publicJson(`/t/${topicId}.json`, 20)]);
  if (Number(data?.category_id) !== category.id) throw new Error('not_a_core_run');
  const summary = coreRunSummary(data, category);
  if (!summary) throw new Error('not_a_core_run');

  const messages: ConversationMessage[] = asArray(data?.post_stream?.posts).map((post) => ({
    id: `post:${post?.id}`,
    username: String(post?.username || 'unknown'),
    displayName: post?.name ? String(post.name) : undefined,
    text: stripHtml(String(post?.cooked || post?.raw || '')),
    createdAt: typeof post?.created_at === 'string' ? post.created_at : undefined,
    url: `${HUB}/t/${data?.slug || 'topic'}/${topicId}/${post?.post_number || 1}`,
  }));

  const firstAuthor = messages[0]?.username && messages[0].username !== 'unknown' ? messages[0].username : undefined;
  const participants = Array.from(new Set(messages.map((message) => message.username).filter((username) => username && username !== 'unknown')));
  summary.context = {
    ...summary.context,
    identity: {
      ...summary.context.identity,
      author: firstAuthor,
      participants,
    },
    metadata: {
      ...summary.context.metadata,
      hydratedPosts: messages.length,
    },
  };

  return { summary, messages };
}