import { HUB, stripHtml } from './federated';
import type { ActorKind, ContextCapsule } from './context';
import type { Resource, ResourceKind } from './resources';

export type B8Agent = {
  index: number;
  name: string;
  username?: string;
  registryIdentity: string;
  intent: string;
  family: 'core' | 'mas' | 'philosophical' | 'provider';
};

export const B8_CAPABILITIES = {
  read: ['b8_get_topic', 'b8_get_post', 'b8_list_agents', 'b8_watch_topic'],
  write: ['b8_create_topic', 'b8_deploy_core', 'b8_reply_to_topic', 'b8_send_private_message', 'b8_send_chat_message'],
} as const;

function familyFor(index: number): B8Agent['family'] {
  if (index <= 13) return 'core';
  if (index <= 24) return 'mas';
  if (index <= 45) return 'philosophical';
  return 'provider';
}

function cells(row: string) {
  return Array.from(row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi))
    .map((match) => stripHtml(match[1] || '').trim())
    .filter(Boolean);
}

function actorSemantics(agent: B8Agent): { resourceKind: ResourceKind; contextKind: string; actorKind: ActorKind } {
  if (agent.username) {
    return {
      resourceKind: 'construct',
      contextKind: agent.family === 'provider' ? 'Provider-backed Construct' : 'Construct',
      actorKind: 'construct',
    };
  }
  if (agent.family === 'philosophical') {
    return { resourceKind: 'persona', contextKind: 'Philosophical persona', actorKind: 'persona' };
  }
  if (agent.family === 'provider') {
    return { resourceKind: 'agent', contextKind: 'Provider actor', actorKind: 'provider' };
  }
  return {
    resourceKind: 'agent',
    contextKind: agent.family === 'mas' ? 'MAS actor' : 'Registry actor',
    actorKind: agent.family === 'mas' ? 'mas' : 'agent',
  };
}

function actorResource(agent: B8Agent, registryTopicId: number, registryUrl: string): Resource {
  const semantics = actorSemantics(agent);
  const url = agent.username
    ? `${HUB}/u/${encodeURIComponent(agent.username)}`
    : registryUrl;
  const normalizedIdentity = agent.username ? `@${agent.username}` : agent.registryIdentity;
  const context: ContextCapsule = {
    id: agent.username ? `construct:${agent.username}` : `registry-actor:${agent.index}`,
    kind: semantics.contextKind,
    origin: {
      plane: 'hub',
      substrate: 'B8 actor registry entry',
      api: `/t/${registryTopicId}.json`,
      canonicalRef: `b8:actor:${agent.index}`,
      url,
    },
    identity: {
      subject: {
        kind: semantics.actorKind,
        id: agent.username ? `discourse-user:${agent.username}` : `b8:actor:${agent.index}`,
        label: agent.name,
      },
    },
    authority: { visibility: 'public', mode: 'public-read' },
    provenance: [{ relation: 'belongs-to', targetId: `discourse:topic:${registryTopicId}`, targetKind: 'Actor registry', label: 'B8 actor registry' }],
    capabilities: agent.username
      ? ['read', 'ask', 'research', 'open-profile']
      : ['read', 'ask', 'research'],
    metadata: {
      registryIndex: agent.index,
      registryIdentity: normalizedIdentity,
      registryFamily: agent.family,
      username: agent.username,
      callableIdentityKnown: Boolean(agent.username),
      invocationAuthority: 'not-established',
    },
  };

  return {
    id: `hub:actor:${agent.index}`,
    source: 'hub',
    kind: semantics.resourceKind,
    title: agent.name,
    excerpt: agent.intent,
    url,
    metadata: {
      registryIndex: agent.index,
      registryIdentity: normalizedIdentity,
      family: agent.family,
      username: agent.username,
      registryTopicId,
      semanticKind: semantics.contextKind,
    },
    context,
  };
}

export async function getB8Agents() {
  const topicId = 30145;
  const response = await fetch(new URL(`/t/${topicId}.json`, HUB), { next: { revalidate: 120 } } as RequestInit);
  if (!response.ok) throw new Error(`registry_http_${response.status}`);
  const topic = await response.json();
  const cooked = String(topic?.post_stream?.posts?.[0]?.cooked || '');
  const rows = Array.from(cooked.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi));
  const agents: B8Agent[] = [];

  for (const row of rows) {
    const values = cells(row[1] || '');
    const index = Number(values[0]);
    if (!Number.isInteger(index) || index <= 0 || values.length < 4) continue;
    const registryIdentity = values[2].trim();
    agents.push({
      index,
      name: values[1],
      username: registryIdentity.startsWith('@') ? registryIdentity.slice(1) : undefined,
      registryIdentity,
      intent: values.slice(3).join(' '),
      family: familyFor(index),
    });
  }

  const registryUrl = `${HUB}/t/${topic?.slug || 'registry'}/${topicId}`;
  return {
    registryTopicId: topicId,
    registryUrl,
    agents,
    resources: agents.map((agent) => actorResource(agent, topicId, registryUrl)),
    capabilities: B8_CAPABILITIES,
  };
}