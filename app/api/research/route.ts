import { NextRequest, NextResponse } from 'next/server';
import { federatedSearch } from '@/lib/federated';

function fallbackPlan(request: string, evidence: any[]) {
  const candidate = request.replace(/[^a-zA-Z0-9\s:&-]/g, '').trim().slice(0, 90) || 'Research request';
  return {
    workingTitle: candidate,
    objective: `Develop a durable, evidence-backed BITwiki treatment of: ${request}`,
    researchQuestions: [
      'What is already established in BITwiki?',
      'What active BIThub discussions or artifacts add current context?',
      'Which claims require external or primary-source verification?',
      'What semantic relationships should be encoded for future reuse?',
    ],
    wikiOutline: ['Definition and scope', 'Current evidence', 'System relationships', 'Open questions', 'References and provenance'],
    evidenceGaps: evidence.length ? ['Validate claims that are not supported by the current Hub/Wiki corpus.'] : ['No relevant Hub/Wiki evidence was retrieved; discovery must begin from a broader source set.'],
    nextActions: ['Review retrieved internal evidence', 'Collect missing primary sources', 'Draft structured article', 'Validate claims and provenance', 'Publish only after review'],
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const researchRequest = typeof body?.request === 'string' ? body.request.trim().slice(0, 8000) : '';
  if (!researchRequest) return NextResponse.json({ error: 'missing_request' }, { status: 400 });

  const search = await federatedSearch(researchRequest, 8);
  const evidence = search.resources.slice(0, 12);
  const credential = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  const model = process.env.BITHUB_RESEARCH_MODEL || process.env.BITHUB_PUBLIC_MODEL || 'google/gemini-3.6-flash';

  let plan = fallbackPlan(researchRequest, evidence);
  let aiPlanned = false;

  if (credential) {
    const sourceText = evidence.map((item, index) => `${index + 1}. [${item.source.toUpperCase()}] ${item.title}\n${item.excerpt || ''}\n${item.url}`).join('\n\n');
    const upstream = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${credential}`,
        'content-type': 'application/json',
        'ai-reporting-tags': 'app:bitcoreos-95,feature:research-plan',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Design a rigorous research packet for a future BITwiki page. Internal BIThub/BITwiki evidence is context, not automatically proof. Separate established evidence from gaps. Return JSON only.',
          },
          {
            role: 'user',
            content: `REQUEST:\n${researchRequest}\n\nINTERNAL EVIDENCE:\n${sourceText}`,
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
              type: 'object',
              additionalProperties: false,
              properties: {
                workingTitle: { type: 'string' },
                objective: { type: 'string' },
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
        try {
          plan = JSON.parse(content);
          aiPlanned = true;
        } catch {
          // Deterministic plan remains available.
        }
      }
    }
  }

  return NextResponse.json({
    id: `research-${Date.now().toString(36)}`,
    status: 'planned',
    request: researchRequest,
    plan,
    evidence,
    sources: search.sources,
    aiPlanned,
    execution: 'unassigned',
  });
}
