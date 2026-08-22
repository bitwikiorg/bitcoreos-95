import { NextRequest, NextResponse } from 'next/server';
import { federatedSearch } from '@/lib/federated';
import { hydrateResources } from '@/lib/hydration';
import { intentLabel, researchPreflight, type ResearchIntent } from '@/lib/research';
import { semanticSubject } from '@/lib/semantic';
import type { ContextCapsule } from '@/lib/context';

const INTENTS: ResearchIntent[] = ['new-page', 'revise-page', 'category', 'semantic-model', 'lua-projection', 'artifact', 'coverage-audit'];

function safeContext(value: unknown): ContextCapsule | null {
  if (!value || typeof value !== 'object') return null;
  try {
    const encoded = JSON.stringify(value);
    if (encoded.length > 12_000) return null;
    const parsed = JSON.parse(encoded) as ContextCapsule;
    if (!parsed?.id || !parsed?.kind || !parsed?.origin?.plane || !parsed?.origin?.substrate || !parsed?.authority?.visibility) return null;
    return parsed;
  } catch {
    return null;
  }
}

function fallbackPlan(request: string, evidence: any[], intent: ResearchIntent, targetTitle?: string, semanticFactCount = 0, sourceContext?: ContextCapsule | null) {
  const candidate = targetTitle || request.replace(/[^a-zA-Z0-9\s:&()-]/g, '').trim().slice(0, 90) || 'Research request';
  const sourceClause = sourceContext ? ` Starting from ${sourceContext.kind} on ${sourceContext.origin.substrate}.` : '';
  return {
    workingTitle: candidate,
    objective: `Develop an evidence-backed ${intentLabel(intent)} treatment for: ${request}.${sourceClause}`,
    researchQuestions: [
      'What is already established in BITwiki and what is only provisional?',
      'Which BIThub discussions, artifacts, conversations, or agent outputs contain reusable signal?',
      'Which claims require external or primary-source verification?',
      intent === 'semantic-model'
        ? `Which stable relationships need explicit SMW predicates or reusable Concepts${semanticFactCount ? `, given ${semanticFactCount} current semantic fact groups on the target` : ''}?`
        : 'What structure should survive as durable reusable knowledge?',
    ],
    wikiOutline: intent === 'coverage-audit'
      ? ['Coverage baseline', 'Missing or weak targets', 'Priority and dependency rationale', 'Proposed request records']
      : intent === 'lua-projection'
        ? ['Repeated computation/query need', 'Input contract', 'Transformation rules', 'Output projection', 'Validation and failure modes']
        : ['Scope', 'Established evidence', 'System relationships', 'Open questions', 'References and provenance'],
    evidenceGaps: evidence.length ? ['Validate material not supported by the current ecosystem corpus.'] : ['No relevant internal evidence was retrieved; broaden discovery before drafting.'],
    nextActions: ['Review source context, preflight, and internal evidence', 'Collect missing primary sources', 'Model the durable output', 'Validate claims/provenance', 'Move through the canonical review lifecycle'],
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const researchRequest = typeof body?.request === 'string' ? body.request.trim().slice(0, 8000) : '';
  const intent = INTENTS.includes(body?.intent) ? body.intent as ResearchIntent : 'new-page';
  const targetTitle = typeof body?.targetTitle === 'string' ? body.targetTitle.trim().slice(0, 240) : '';
  const sourceContext = safeContext(body?.context);
  if (!researchRequest) return NextResponse.json({ error: 'missing_request' }, { status: 400 });

  const [preflight, semanticResult] = await Promise.all([
    researchPreflight({ intent, targetTitle: targetTitle || undefined, request: researchRequest }),
    targetTitle ? semanticSubject(targetTitle).catch(() => null) : Promise.resolve(null),
  ]);
  const semanticFacts = semanticResult?.facts || [];
  const contextTerms = sourceContext
    ? [sourceContext.kind, sourceContext.identity?.executor?.label, sourceContext.origin.substrate].filter(Boolean).join(' ')
    : '';
  const searchQuery = [targetTitle, researchRequest, contextTerms].filter(Boolean).join(' ');
  const search = await federatedSearch(searchQuery, 8);
  const evidence = search.resources.slice(0, 8);
  const hydratedEvidence = await hydrateResources(evidence, 8);
  const credential = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  const model = process.env.BITHUB_RESEARCH_MODEL || process.env.BITHUB_PUBLIC_MODEL || 'google/gemini-3.6-flash';

  let plan = fallbackPlan(researchRequest, evidence, intent, targetTitle || undefined, semanticFacts.length, sourceContext);
  let aiPlanned = false;

  if (credential) {
    const sourceText = hydratedEvidence.map((item, index) => {
      const label = item.source === 'hub' ? `H${index + 1}` : `W${index + 1}`;
      return `[${label}] ${item.title}\n${item.url}\n${(item.content || item.excerpt || '').slice(0, 4_500)}`;
    }).join('\n\n');
    const upstream = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${credential}`, 'content-type': 'application/json', 'ai-reporting-tags': 'app:bitcoreos-95,feature:research-plan' },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `Design a rigorous BITwiki research packet for a ${intentLabel(intent)}. Internal ecosystem content and current SMW facts are context, not automatically proof. Preserve the supplied source object's provenance and authority. Respect the preflight recommendation and separate established evidence from gaps. Return JSON only.`,
          },
          {
            role: 'user',
            content: `REQUEST:\n${researchRequest}\nTARGET:\n${targetTitle || '(not fixed)'}\nSOURCE OBJECT:\n${sourceContext ? JSON.stringify(sourceContext) : '(free intent)'}\nPREFLIGHT:\n${JSON.stringify(preflight)}\nCURRENT SEMANTIC FACTS:\n${JSON.stringify(semanticFacts.slice(0, 24))}\n\nINTERNAL EVIDENCE:\n${sourceText}`,
          },
        ],
        stream: false,
        temperature: 0.2,
        max_tokens: 1400,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'research_packet',
            strict: true,
            schema: {
              type: 'object', additionalProperties: false,
              properties: {
                workingTitle: { type: 'string' }, objective: { type: 'string' },
                researchQuestions: { type: 'array', items: { type: 'string' } },
                wikiOutline: { type: 'array', items: { type: 'string' } },
                evidenceGaps: { type: 'array', items: { type: 'string' } },
                nextActions: { type: 'array', items: { type: 'string' } },
              },
              required: ['workingTitle', 'objective', 'researchQuestions', 'wikiOutline', 'evidenceGaps', 'nextActions'],
            },
          },
        },
      }),
    });
    if (upstream.ok) {
      const data = await upstream.json().catch(() => ({}));
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === 'string') {
        try { plan = JSON.parse(content); aiPlanned = true; } catch {}
      }
    }
  }

  const activeMatch = preflight.matchingRequests.find((item) => !['satisfied', 'declined'].includes(item.status));
  return NextResponse.json({
    id: `research-${Date.now().toString(36)}`,
    request: researchRequest,
    intent,
    targetTitle: targetTitle || null,
    sourceContext,
    knowledgeStatus: activeMatch?.status || 'requested',
    executionStatus: 'not-dispatched',
    preflight,
    semanticFacts,
    plan,
    evidence,
    sources: search.sources,
    hydratedCount: hydratedEvidence.filter((item) => !item.details?.hydrationError).length,
    aiPlanned,
  });
}
