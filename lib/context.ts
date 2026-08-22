export type OriginPlane = 'hub' | 'wiki' | 'local' | 'workflow' | 'external';

export type ObjectAuthority = {
  visibility: 'public' | 'private' | 'group' | 'local' | 'unknown';
  mode: 'public-read' | 'delegated-read' | 'user-write' | 'ai-invoke' | 'workflow-activate' | 'canonical-change' | 'privileged-admin';
  scopes?: string[];
};

export type ActorKind = 'human' | 'construct' | 'core' | 'node' | 'agent' | 'mas' | 'persona' | 'provider' | 'model' | 'system' | 'unknown';

export type ObjectIdentity = {
  viewer?: string;
  author?: string;
  participants?: string[];
  executor?: {
    kind: ActorKind;
    id?: string;
    label?: string;
  };
};

export type ProvenanceRelation = {
  relation: 'authored-by' | 'participant-in' | 'reply-to' | 'thread-of' | 'activates' | 'executed-by' | 'produces' | 'derived-from' | 'references' | 'discusses' | 'requests' | 'reviews' | 'revises' | 'canonicalizes' | 'projects' | 'belongs-to';
  targetId: string;
  targetKind?: string;
  label?: string;
};

export type ContextCapsule = {
  id: string;
  kind: string;
  origin: {
    plane: OriginPlane;
    substrate: string;
    api?: string;
    canonicalRef?: string;
    url?: string;
  };
  identity?: ObjectIdentity;
  authority: ObjectAuthority;
  state?: {
    unread?: boolean;
    starred?: boolean;
    bookmarked?: boolean;
    tracked?: boolean;
    watched?: boolean;
    lifecycle?: string;
    execution?: string;
    version?: string | number;
  };
  provenance?: ProvenanceRelation[];
  capabilities: string[];
  metadata?: Record<string, unknown>;
};

export function publicHubTopicContext(input: {
  topicId: number;
  url: string;
  author?: string;
  categoryId?: number;
  kind?: string;
  substrate?: string;
  executor?: ObjectIdentity['executor'];
  provenance?: ProvenanceRelation[];
}): ContextCapsule {
  return {
    id: `topic:${input.topicId}`,
    kind: input.kind || 'Discussion',
    origin: {
      plane: 'hub',
      substrate: input.substrate || 'forum topic',
      api: `/t/${input.topicId}.json`,
      canonicalRef: `discourse:topic:${input.topicId}`,
      url: input.url,
    },
    identity: { author: input.author, executor: input.executor },
    authority: { visibility: 'public', mode: 'public-read' },
    provenance: input.provenance,
    capabilities: ['read', 'ask', 'research'],
    metadata: { topicId: input.topicId, categoryId: input.categoryId },
  };
}

export function publicWikiPageContext(input: {
  id: string | number;
  title: string;
  url: string;
  author?: string;
  kind?: string;
  substrate?: string;
}): ContextCapsule {
  return {
    id: `wiki:${input.id}`,
    kind: input.kind || 'Knowledge page',
    origin: {
      plane: 'wiki',
      substrate: input.substrate || 'MediaWiki page',
      canonicalRef: `mediawiki:page:${input.id}`,
      url: input.url,
    },
    identity: { author: input.author },
    authority: { visibility: 'public', mode: 'public-read' },
    capabilities: ['read', 'ask', 'research', 'explore-relations'],
    metadata: { pageId: input.id, title: input.title },
  };
}

export function contextLabel(context: ContextCapsule) {
  const executor = context.identity?.executor?.label;
  const parts = [executor, context.kind, context.origin.substrate, context.authority.visibility].filter(Boolean);
  return parts.join(' · ');
}