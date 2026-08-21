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
