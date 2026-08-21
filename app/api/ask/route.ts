import { NextRequest, NextResponse } from 'next/server';
import { federatedSearch } from '@/lib/federated';
import { hydrateResources } from '@/lib/hydration';
import type { HydratedResource } from '@/lib/resources';

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 12;
const buckets = new Map<string, { started: number; count: number }>();

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function limited(request: NextRequest) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'anonymous';
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now - current.started > WINDOW_MS) {
    buckets.set(key, { started: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

function evidenceText(resources: HydratedResource[]) {
  return resources.map((resource, index) => {
    const prefix = resource.source === 'hub' ? 'H' : 'W';
    const body = (resource.content || resource.excerpt || '(no readable body)').slice(0, 4_800);
    const state = resource.details?.hydrationError
      ? `HYDRATION: fallback (${resource.details.hydrationError})`
      : `HYDRATION: ${resource.complete ? 'complete' : 'bounded'}`;
    return `[${prefix}${index + 1}] ${resource.title}\nURL: ${resource.url}\nTYPE: ${resource.kind}\n${state}\nSOURCE CONTENT:\n${body}`;
  }).join('\n\n');
}

export async function POST(request: NextRequest) {
  if (limited(request)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body?.messages) ? body.messages as ChatMessage[] : [];
  const clean = messages
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
    .slice(-12)
    .map((message) => ({ role: message.role, content: message.content.slice(0, 6000) }));
  const question = [...clean].reverse().find((message) => message.role === 'user')?.content?.trim();
  if (!question) return NextResponse.json({ error: 'missing_question' }, { status: 400 });

  const search = await federatedSearch(question, 6);
  const evidence = search.resources.slice(0, 6);
  const hydratedEvidence = await hydrateResources(evidence, 6);
  const credential = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  const model = process.env.BITHUB_PUBLIC_MODEL || 'google/gemini-3.6-flash';

  if (!credential) {
    return NextResponse.json({
      error: 'ai_gateway_not_configured',
      evidence,
      sources: search.sources,
      hydratedCount: hydratedEvidence.filter((item) => !item.details?.hydrationError).length,
      model: null,
    }, { status: 503 });
  }

  const system = [
    'You are the public BIThub + BITwiki research guide inside BITCOREOS-95.',
    'Answer using the supplied public source content as the authority for claims about BIThub and BITwiki.',
    'Search snippets are discovery signals; hydrated source content is stronger evidence.',
    'Do not invent private content, permissions, user data, platform features, or source facts.',
    'If evidence is insufficient, say what is missing and suggest a narrower search.',
    'Cite evidence inline with bracket labels such as [H1] and [W2].',
    'Prefer concise operational explanations and direct navigation guidance.',
    '',
    'PUBLIC EVIDENCE:',
    evidenceText(hydratedEvidence),
  ].join('\n');

  const upstream = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${credential}`,
      'content-type': 'application/json',
      'ai-reporting-tags': 'app:bitcoreos-95,feature:public-ask',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, ...clean],
      stream: false,
      temperature: 0.25,
      max_tokens: 1100,
    }),
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json({
      error: 'ai_gateway_failed',
      status: upstream.status,
      detail: data?.error?.message ?? data?.error ?? 'upstream failure',
      evidence,
      sources: search.sources,
      hydratedCount: hydratedEvidence.filter((item) => !item.details?.hydrationError).length,
      model,
    }, { status: 502 });
  }

  const answer = data?.choices?.[0]?.message?.content;
  return NextResponse.json({
    answer: typeof answer === 'string' ? answer : 'No answer returned.',
    evidence,
    sources: search.sources,
    hydratedCount: hydratedEvidence.filter((item) => !item.details?.hydrationError).length,
    model: data?.model ?? model,
  });
}
