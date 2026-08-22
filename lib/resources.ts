import type { ContextCapsule } from './context';

export type ResourceSource = 'hub' | 'wiki';

export type ResourceKind =
  | 'topic'
  | 'post'
  | 'guide'
  | 'category'
  | 'user'
  | 'wiki-page'
  | 'artifact'
  | 'construct'
  | 'core'
  | 'node'
  | 'workspace'
  | 'change';

export type Resource = {
  id: string;
  source: ResourceSource;
  kind: ResourceKind;
  title: string;
  excerpt?: string;
  url: string;
  tags?: Array<string | { id?: number; name?: string; slug?: string }>;
  author?: string;
  score?: number;
  metadata?: Record<string, unknown>;
  context?: ContextCapsule;
};

export type ResourcePost = {
  id: number;
  postNumber: number;
  username: string;
  displayName?: string;
  createdAt?: string;
  updatedAt?: string;
  text: string;
  url?: string;
};

export type HydratedResourceDetails = {
  posts?: ResourcePost[];
  categories?: string[];
  canonicalTitle?: string;
  revision?: {
    id?: number;
    timestamp?: string;
    user?: string;
    comment?: string;
  };
  hydrationError?: string;
};

export type HydratedResource = Resource & {
  content: string;
  complete: boolean;
  details?: HydratedResourceDetails;
};

export type SourceHealth = {
  ok: boolean;
  count: number;
  error: string | null;
  origin: string;
};

export type SearchResponse = {
  query: string;
  resources: Resource[];
  sources: {
    hub: SourceHealth;
    wiki: SourceHealth;
  };
};
