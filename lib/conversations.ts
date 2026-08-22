import { HUB, stripHtml } from './federated';
import { discourseAsUser, type DelegatedCredential } from './delegated';
import type { ContextCapsule } from './context';

export type ConversationKind =
  | 'pm'
  | 'construct'
  | 'chat-dm'
  | 'chat-channel'
  | 'chat-thread'
  | 'topic'
  | 'core-run'
  | 'node-run'
  | 'mas'
  | 'local-ai';

export type ExecutorKind = 'human' | 'construct' | 'core' | 'node' | 'agent' | 'mas' | 'model' | 'system' | 'unknown';

export type ConversationSummary = {
  id: string;
  kind: ConversationKind;
  title: string;
  excerpt?: string;
  lastActivity?: string;
  unread?: boolean;
  url?: string;
  topicId?: number;
  channelId?: number;
  threadId?: number;
  context: ContextCapsule;
};

export type ConversationMessage = {
  id: string;
  username: string;
  displayName?: string;
  text: string;
  createdAt?: string;
  url?: string;
};

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function dateValue(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function topicContext(
  topic: any,
  viewer: string,
  kind: ConversationKind,
  executor?: { kind: ExecutorKind; label?: string },
): ContextCapsule {
  const topicId = Number(topic?.id);
  const privateTopic = topic?.archetype === 'private_message' || kind === 'pm' || kind === 'construct';
  return {
    id: `${kind}:${topicId}`,
    kind: kind === 'construct' ? 'Construct conversation' : kind === 'pm' ? 'Private message' : kind,
    origin: {
      plane: 'hub',
      substrate: privateTopic ? 'private-message topic' : 'topic',
      api: `/t/${topicId}.json`,
      canonicalRef: `discourse:topic:${topicId}`,
      url: `${HUB}/t/${topic?.slug || '-'}/${topicId}`,
    },
    identity: {
      viewer,
      participants: asArray(topic?.participants).map((item) => String(item?.username || item?.name || '')).filter(Boolean),
      executor,
    },
    authority: {
      visibility: privateTopic ? 'private' : 'public',
      mode: 'delegated-read',
      scopes: ['read'],
    },
    state: {
      unread: Number(topic?.unread_posts || 0) > 0 || Boolean(topic?.unseen),
      starred: Boolean(topic?.ai_conversation_starred),
    },
    capabilities: privateTopic ? ['read', 'ask', 'research', 'reply'] : ['read', 'ask', 'research', 'reply', 'bookmark', 'watch'],
    metadata: { topicId },
  };
}

function normalizeTopic(topic: any, viewer: string, kind: ConversationKind, executorLabel?: string): ConversationSummary | null {
  const topicId = Number(topic?.id);
  if (!Number.isInteger(topicId) || topicId <= 0) return null;
  const context = topicContext(
    topic,
    viewer,
    kind,
    executorLabel ? { kind: kind === 'construct' ? 'construct' : 'unknown', label: executorLabel } : undefined,
  );
  return {
    id: context.id,
    kind,
    title: String(topic?.title || (kind === 'construct' ? 'AI conversation' : 'Private message')),
    excerpt: stripHtml(String(topic?.excerpt || '')).slice(0, 220) || undefined,
    lastActivity: dateValue(topic?.last_posted_at || topic?.bumped_at || topic?.created_at),
    unread: context.state?.unread,
    url: context.origin.url,
    topicId,
    context,
  };
}

function channelLabel(channel: any, direct: boolean) {
  if (channel?.title) return String(channel.title);
  if (channel?.name) return String(channel.name);
  if (channel?.chatable?.name) return String(channel.chatable.name);
  if (channel?.chatable?.title) return String(channel.chatable.title);
  const users = asArray(channel?.users || channel?.memberships)
    .map((item) => item?.user?.username || item?.username)
    .filter(Boolean);
  return users.length ? users.map((name) => `@${name}`).join(', ') : direct ? 'Direct message' : 'Chat channel';
}

function normalizeChannel(channel: any, viewer: string, direct: boolean): ConversationSummary | null {
  const channelId = Number(channel?.id);
  if (!Number.isInteger(channelId) || channelId <= 0) return null;
  const kind: ConversationKind = direct ? 'chat-dm' : 'chat-channel';
  const membership = channel?.current_user_membership || channel?.membership;
  const unread = Number(membership?.unread_count || channel?.unread_count || 0) > 0 || Boolean(channel?.has_unread_messages);
  const title = channelLabel(channel, direct);
  const context: ContextCapsule = {
    id: `${kind}:${channelId}`,
    kind: direct ? 'Chat direct message' : 'Chat channel',
    origin: {
      plane: 'hub',
      substrate: direct ? 'chat direct-message channel' : 'chat channel',
      api: `/chat/api/channels/${channelId}/messages`,
      canonicalRef: `discourse:chat-channel:${channelId}`,
      url: `${HUB}/chat/c/-/${channelId}`,
    },
    identity: { viewer },
    authority: { visibility: direct ? 'private' : 'group', mode: 'delegated-read', scopes: ['read'] },
    state: { unread },
    capabilities: ['read', 'ask', 'research', 'reply'],
    metadata: { channelId },
  };
  return {
    id: context.id,
    kind,
    title,
    excerpt: stripHtml(String(channel?.description || channel?.last_message?.message || '')).slice(0, 220) || undefined,
    lastActivity: dateValue(channel?.last_message?.created_at || channel?.updated_at || channel?.created_at),
    unread,
    url: context.origin.url,
    channelId,
    context,
  };
}

function normalizeThread(thread: any, viewer: string): ConversationSummary | null {
  const threadId = Number(thread?.id);
  const channelId = Number(thread?.channel_id || thread?.chat_channel_id || thread?.channel?.id);
  if (!Number.isInteger(threadId) || threadId <= 0 || !Number.isInteger(channelId) || channelId <= 0) return null;
  const title = String(thread?.title || thread?.original_message?.message || `Thread ${threadId}`);
  const context: ContextCapsule = {
    id: `chat-thread:${threadId}`,
    kind: 'Chat thread',
    origin: {
      plane: 'hub',
      substrate: 'chat thread',
      api: `/chat/api/channels/${channelId}/threads/${threadId}/messages`,
      canonicalRef: `discourse:chat-thread:${threadId}`,
      url: `${HUB}/chat/c/-/${channelId}/t/${threadId}`,
    },
    identity: { viewer },
    authority: { visibility: 'group', mode: 'delegated-read', scopes: ['read'] },
    state: { unread: Boolean(thread?.unread) || Number(thread?.unread_count || 0) > 0 },
    provenance: [{ relation: 'thread-of', targetId: `chat-channel:${channelId}`, targetKind: 'Chat channel' }],
    capabilities: ['read', 'ask', 'research', 'reply'],
    metadata: { channelId, threadId },
  };
  return {
    id: context.id,
    kind: 'chat-thread',
    title: stripHtml(title).slice(0, 120),
    excerpt: stripHtml(String(thread?.original_message?.message || '')).slice(0, 220) || undefined,
    lastActivity: dateValue(thread?.last_message?.created_at || thread?.updated_at || thread?.created_at),
    unread: context.state?.unread,
    url: context.origin.url,
    channelId,
    threadId,
    context,
  };
}

async function safeRead(path: string, credential: DelegatedCredential) {
  try {
    return { ok: true, data: await discourseAsUser(path, credential), error: null as string | null };
  } catch (error) {
    return { ok: false, data: null as any, error: error instanceof Error ? error.message : 'read_failed' };
  }
}

export async function listDelegatedConversations(viewer: string, credential: DelegatedCredential) {
  const [ai, inbox, sent, chat, threads] = await Promise.all([
    safeRead('/discourse-ai/ai-bot/conversations', credential),
    safeRead(`/topics/private-messages/${encodeURIComponent(viewer)}.json`, credential),
    safeRead(`/topics/private-messages-sent/${encodeURIComponent(viewer)}.json`, credential),
    safeRead('/chat/api/me/channels', credential),
    safeRead('/chat/api/me/threads', credential),
  ]);

  const summaries: ConversationSummary[] = [];
  const seen = new Set<string>();
  const aiTopics = asArray(ai.data?.conversations);
  const aiIds = new Set<number>();

  for (const topic of aiTopics) {
    const id = Number(topic?.id);
    if (Number.isInteger(id)) aiIds.add(id);
    const participant = asArray(topic?.participants).find((item) => item?.username && item.username !== viewer);
    const executor = participant?.username ? `@${participant.username}` : 'Construct';
    const normalized = normalizeTopic(topic, viewer, 'construct', executor);
    if (normalized && !seen.has(normalized.id)) {
      seen.add(normalized.id);
      summaries.push(normalized);
    }
  }

  const pmTopics = [...asArray(inbox.data?.topic_list?.topics), ...asArray(sent.data?.topic_list?.topics)];
  const pmByTopic = new Map<number, any>();
  for (const topic of pmTopics) {
    const id = Number(topic?.id);
    if (Number.isInteger(id) && !aiIds.has(id) && !pmByTopic.has(id)) pmByTopic.set(id, topic);
  }
  for (const topic of pmByTopic.values()) {
    const normalized = normalizeTopic(topic, viewer, 'pm');
    if (normalized && !seen.has(normalized.id)) {
      seen.add(normalized.id);
      summaries.push(normalized);
    }
  }

  const directChannels = asArray(chat.data?.direct_message_channels);
  const publicChannels = asArray(chat.data?.public_channels);
  for (const channel of directChannels) {
    const normalized = normalizeChannel(channel, viewer, true);
    if (normalized && !seen.has(normalized.id)) {
      seen.add(normalized.id);
      summaries.push(normalized);
    }
  }
  for (const channel of publicChannels) {
    const normalized = normalizeChannel(channel, viewer, false);
    if (normalized && !seen.has(normalized.id)) {
      seen.add(normalized.id);
      summaries.push(normalized);
    }
  }

  const threadRows = asArray(threads.data?.threads || threads.data?.channel_threads || threads.data);
  for (const thread of threadRows) {
    const normalized = normalizeThread(thread, viewer);
    if (normalized && !seen.has(normalized.id)) {
      seen.add(normalized.id);
      summaries.push(normalized);
    }
  }

  summaries.sort((a, b) => Date.parse(b.lastActivity || '0') - Date.parse(a.lastActivity || '0'));

  return {
    conversations: summaries,
    sources: {
      ai: { ok: ai.ok, count: aiTopics.length, error: ai.error },
      pm: { ok: inbox.ok && sent.ok, count: pmByTopic.size, error: inbox.error || sent.error },
      chat: { ok: chat.ok, count: directChannels.length + publicChannels.length, error: chat.error },
      threads: { ok: threads.ok, count: threadRows.length, error: threads.error },
    },
  };
}

function topicMessages(data: any): ConversationMessage[] {
  return asArray(data?.post_stream?.posts).map((post) => ({
    id: `post:${post.id}`,
    username: String(post?.username || 'unknown'),
    displayName: post?.name ? String(post.name) : undefined,
    text: stripHtml(String(post?.cooked || post?.raw || '')),
    createdAt: dateValue(post?.created_at),
    url: post?.topic_slug && post?.topic_id && post?.post_number
      ? `${HUB}/t/${post.topic_slug}/${post.topic_id}/${post.post_number}`
      : undefined,
  }));
}

function chatMessages(data: any): ConversationMessage[] {
  const rows = asArray(data?.messages || data?.chat_messages || data);
  return rows.map((message, index) => ({
    id: `chat-message:${message?.id ?? index}`,
    username: String(message?.user?.username || message?.username || 'unknown'),
    displayName: message?.user?.name || message?.name || undefined,
    text: stripHtml(String(message?.message || message?.cooked || message?.raw || '')),
    createdAt: dateValue(message?.created_at),
  }));
}

export async function readDelegatedConversation(
  input: { kind: ConversationKind; id: number; channelId?: number },
  viewer: string,
  credential: DelegatedCredential,
) {
  if (['pm', 'construct', 'topic', 'core-run', 'node-run', 'mas'].includes(input.kind)) {
    const data = await discourseAsUser(`/t/${input.id}.json`, credential);
    const executor = input.kind === 'construct'
      ? asArray(data?.post_stream?.posts).find((post) => post?.username && post.username !== viewer)?.username
      : undefined;
    return {
      summary: normalizeTopic(data, viewer, input.kind, executor ? `@${executor}` : undefined),
      messages: topicMessages(data),
    };
  }

  if (input.kind === 'chat-thread') {
    if (!input.channelId) throw new Error('channel_id_required');
    const data = await discourseAsUser(`/chat/api/channels/${input.channelId}/threads/${input.id}/messages`, credential);
    return { summary: null, messages: chatMessages(data) };
  }

  if (input.kind === 'chat-dm' || input.kind === 'chat-channel') {
    const data = await discourseAsUser(`/chat/api/channels/${input.id}/messages`, credential);
    return { summary: null, messages: chatMessages(data) };
  }

  throw new Error('unsupported_conversation_kind');
}
