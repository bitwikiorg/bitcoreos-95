import { HUB, stripHtml } from './federated';

export type B8Agent = {
  index: number;
  name: string;
  username: string;
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
    agents.push({
      index,
      name: values[1],
      username: values[2].replace(/^@/, ''),
      intent: values.slice(3).join(' '),
      family: familyFor(index),
    });
  }

  return {
    registryTopicId: topicId,
    registryUrl: `${HUB}/t/${topic?.slug || 'registry'}/${topicId}`,
    agents,
    capabilities: B8_CAPABILITIES,
  };
}
