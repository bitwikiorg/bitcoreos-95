export type OriginPlane = 'hub' | 'wiki' | 'local' | 'workflow' | 'external';

export type ObjectAuthority = {
  visibility: 'public' | 'private' | 'group' | 'local' | 'unknown';
  mode: 'public-read' | 'delegated-read' | 'user-write' | 'ai-invoke' | 'workflow-activate' | 'canonical-change' | 'privileged-admin';
  scopes?: string[];
};

export type ObjectIdentity = {
  viewer?: string;
  author?: string;
  participants?: string[];
  executor?: {
    kind: 'human' | 'construct' | 'core' | 'node' | 'agent' | 'mas' | 'model' | 'system' | 'unknown';
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

export function contextLabel(context: ContextCapsule) {
  const executor = context.identity?.executor?.label;
  const parts = [executor, context.kind, context.origin.substrate, context.authority.visibility].filter(Boolean);
  return parts.join(' · ');
}
