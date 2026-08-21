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
  | 'workspace';

export type Resource = {
  id: string;
  source: ResourceSource;
  kind: ResourceKind;
  title: string;
  excerpt?: string;
  url: string;
  tags?: string[];
  author?: string;
  score?: number;
  metadata?: Record<string, unknown>;
};

export type SearchResponse = {
  query: string;
  resources: Resource[];
};
