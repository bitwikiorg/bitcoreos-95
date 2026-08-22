'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Resource } from '@/lib/resources';
import type { ContextCapsule } from '@/lib/context';
import { contextLabel } from '@/lib/context';
import type { KnowledgeRequest, ResearchIntent, ResearchPreflight, RequestStoreSource } from '@/lib/research';
import { SemanticFacts, type SemanticFact } from './SemanticFacts';

type ResearchPlan = {
  workingTitle: string;
  objective: string;
  researchQuestions: string[];
  wikiOutline: string[];
  evidenceGaps: string[];
  nextActions: string[];
};

type Packet = {
  id: string;
  request: string;
  intent: ResearchIntent;
  targetTitle?: string | null;
  sourceContext?: ContextCapsule | null;
  knowledgeStatus: string;
  executionStatus: string;
  preflight: ResearchPreflight;
  semanticFacts: SemanticFact[];
  plan: ResearchPlan;
  evidence: Resource[];
  aiPlanned: boolean;
};

const intentOptions: Array<{ value: ResearchIntent; label: string; hint: string }> = [
  { value: 'new-page', label: 'New page', hint: 'Research a missing durable knowledge object.' },
  { value: 'revise-page', label: 'Revise page', hint: 'Strengthen, correct, or extend an existing page.' },
  { value: 'category', label: 'Category / navigation', hint: 'Research scope, boundaries, and navigation structure.' },
  { value: 'semantic-model', label: 'SMW semantic model', hint: 'Model reusable properties, relationships, or Concepts.' },
  { value: 'lua-projection', label: 'Lua / computed projection', hint: 'Research a repeated computation, query, or presentation layer.' },
  { value: 'artifact', label: 'Reusable artifact', hint: 'Distill a reusable method, dataset, prompt, report, or workflow artifact.' },
  { value: 'coverage-audit', label: 'Coverage audit', hint: 'Identify a prioritized set of missing or weak knowledge targets.' },
];

export function ResearchWorkspace() {
  const [request, setRequest] = useState('');
  const [intent, setIntent] = useState<ResearchIntent>('new-page');
  const [targetTitle, setTargetTitle] = useState('');
  const [sourceContext, setSourceContext] = useState<ContextCapsule | null>(null);
  const [packet, setPacket] = useState<Packet | null>(null);
  const [queue, setQueue] = useState<KnowledgeRequest[]>([]);
  const [queueSource, setQueueSource] = useState<RequestStoreSource | 'loading'>('loading');
  const [queueWarning, setQueueWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [broker, setBroker] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [dispatchState, setDispatchState] = useState('');

  useEffect(() => {
    try {
      const seed = sessionStorage.getItem('bitcoreos-research-seed');
      const target = sessionStorage.getItem('bitcoreos-research-target');
      const context = sessionStorage.getItem('bitcoreos-context-object');
      if (seed) { sessionStorage.removeItem('bitcoreos-research-seed'); setRequest(seed); }
      if (target) { sessionStorage.removeItem('bitcoreos-research-target'); setTargetTitle(target); setIntent('revise-page'); }
      if (context) {
        sessionStorage.removeItem('bitcoreos-context-object');
        const parsed = JSON.parse(context) as ContextCapsule;
        if (parsed?.id && parsed?.origin?.substrate) setSourceContext(parsed);
      }
    } catch {}
    void fetch('/api/research/requests?limit=120').then((r) => r.json()).then((data) => {
      setQueue(Array.isArray(data?.requests) ? data.requests : []);
      setQueueSource(data?.ok ? (data?.source || 'unavailable') : 'unavailable');
      setQueueWarning(String(data?.warning || data?.error || ''));
    }).catch(() => setQueueSource('unavailable'));
    void fetch('/api/actions/status').then((r) => r.json()).then((data) => setBroker(Boolean(data?.configured))).catch(() => setBroker(false));
    void fetch('/api/auth/me', { credentials: 'include' }).then((r) => r.json()).then((data) => setAuthenticated(Boolean(data?.user))).catch(() => setAuthenticated(false));
  }, []);

  async function plan(event: FormEvent) {
    event.preventDefault();
    const value = request.trim();
    if (!value || loading) return;
    setLoading(true);
    setDispatchState('');
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ request: value, intent, targetTitle: targetTitle.trim() || undefined, context: sourceContext || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? 'research_failed');
      setPacket(data);
    } finally { setLoading(false); }
  }

  async function dispatch() {
    if (!packet || !broker || !authenticated) return;
    setDispatchState('sending');
    const resourceRefs = [packet.sourceContext?.id, ...packet.evidence.map((item) => item.id)].filter(Boolean) as string[];
    const response = await fetch('/api/actions/dispatch', {
      method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'research.deploy',
        target: { resource: packet.targetTitle || packet.plan.workingTitle },
        payload: { request: packet.request, intent: packet.intent, targetTitle: packet.targetTitle, sourceContext: packet.sourceContext, preflight: packet.preflight, semanticFacts: packet.semanticFacts, plan: packet.plan },
        context: { resourceRefs, hubRefs: packet.evidence.filter((item) => item.source === 'hub').map((item) => item.url), wikiRefs: packet.evidence.filter((item) => item.source === 'wiki').map((item) => item.url) },
      }),
    });
    const data = await response.json().catch(() => ({}));
    setDispatchState(response.ok ? `queued · ${data?.envelope?.correlationId || 'accepted'}` : `not queued · ${data?.error || response.status}`);
  }

  const selectedIntent = intentOptions.find((item) => item.value === intent) || intentOptions[0];
  const activeQueue = queue.filter((item) => !['satisfied', 'declined'].includes(item.status));
  const sourceLabel = queueSource === 'cargo' ? 'CARGO' : queueSource === 'wiki-content' ? 'SOURCE' : queueSource.toUpperCase();

  return (
    <div className="research-simple">
      <section className="research-main-simple win-panel raised">
        <div className="panel-heading simple-heading"><div>RESEARCH</div><small>request → evidence → durable knowledge</small></div>
        <form className="research-form simple-research-form" onSubmit={plan}>
          {sourceContext && (
            <div className="preflight-callout source-context-callout">
              <b>Starting from {sourceContext.kind}</b>
              <span>{contextLabel(sourceContext)} · <button type="button" onClick={() => setSourceContext(null)}>clear</button></span>
            </div>
          )}
          <div className="research-form-grid">
            <label><span>What kind of change?</span><select value={intent} onChange={(event) => setIntent(event.target.value as ResearchIntent)}>{intentOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><small>{selectedIntent.hint}</small></label>
            <label><span>Target title / object <i>optional</i></span><input value={targetTitle} onChange={(event) => setTargetTitle(event.target.value)} placeholder={intent === 'new-page' ? 'Likely BITwiki title' : 'Existing page, category, property, or module'} /></label>
          </div>
          <label><span>Research request</span><textarea value={request} onChange={(event) => setRequest(event.target.value)} rows={5} placeholder="What is missing, weak, disputed, reusable, or worth distilling?" /></label>
          <div className="research-form-footer"><span>Planning is read-only. It checks current knowledge, work, semantics, and the request queue first.</span><button className="spectral-button" disabled={loading || !request.trim()} type="submit">{loading ? 'Checking…' : 'Plan research'}</button></div>
        </form>

        {!packet && <div className="research-quiet"><b>Research should answer the right structural question first.</b><span>New page? Revision? Category? Semantic property? Lua projection? Reusable artifact? Coverage gap?</span></div>}

        {packet && (
          <article className="packet-simple">
            <header><div className="mini-title">PREFLIGHT // {packet.knowledgeStatus.toUpperCase()}</div><h1>{packet.plan.workingTitle}</h1><p>{packet.plan.objective}</p></header>
            {packet.sourceContext && <div className="preflight-callout"><b>Source object preserved</b><span>{contextLabel(packet.sourceContext)}</span></div>}
            <div className="preflight-callout"><b>{packet.preflight.recommendation}</b><span>{packet.preflight.existingPage ? `Existing page: ${packet.preflight.existingPage.title}` : 'No exact target page resolved.'}{packet.preflight.matchingRequests.length ? ` · ${packet.preflight.matchingRequests.length} overlapping request(s).` : ''}</span></div>

            <details open><summary>Proposed durable structure</summary><ol>{packet.plan.wikiOutline.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol></details>
            {!!packet.semanticFacts?.length && <details><summary>Current semantic relations ({packet.semanticFacts.length})</summary><SemanticFacts facts={packet.semanticFacts} /></details>}
            <details><summary>Research questions ({packet.plan.researchQuestions.length})</summary><ol>{packet.plan.researchQuestions.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol></details>
            <details><summary>Evidence gaps ({packet.plan.evidenceGaps.length})</summary><ul>{packet.plan.evidenceGaps.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></details>
            <details><summary>Internal evidence ({packet.evidence.length})</summary><div className="packet-evidence-compact">{packet.evidence.map((resource) => <a href={resource.url} target="_blank" rel="noreferrer" key={resource.id}><span className={`source-chip ${resource.source}`}>{resource.source === 'hub' ? 'HUB' : 'WIKI'}</span><b>{resource.title}</b></a>)}</div></details>

            {broker && authenticated && <div className="dispatch-row"><button className="spectral-button" onClick={dispatch} type="button">Send to guarded research queue</button><span>{dispatchState || 'Guarded execution owns sensitive writes, dispatch, and verification.'}</span></div>}
          </article>
        )}
      </section>

      <aside className="research-queue win-panel raised">
        <div className="mini-title">REQUESTED KNOWLEDGE // {sourceLabel}</div>
        <p className="queue-intro">{queueSource === 'cargo' ? 'Live Cargo lifecycle state.' : queueSource === 'wiki-content' ? 'Canonical source-controlled request state; live Cargo has not caught up yet.' : 'Request state is unavailable.'} This is not a second local backlog.</p>
        {queueWarning && <details className="queue-warning"><summary>source status</summary><p>{queueWarning}</p></details>}
        <div className="queue-list sunken">
          {activeQueue.slice(0, 24).map((item) => <button key={item.request} onClick={() => { setRequest(item.reason ? `${item.request}: ${item.reason}` : item.request); setTargetTitle(item.request); setIntent('new-page'); setSourceContext(null); }}><span className={`queue-status ${item.status}`}>{item.status}</span><strong>{item.request}</strong><small>{item.neededDepth || item.candidateDomains?.join(', ') || ''}</small></button>)}
          {!activeQueue.length && <div className="quiet-empty">{queueSource === 'cargo' || queueSource === 'wiki-content' ? 'No active requests returned.' : 'Knowledge-request state unavailable.'}</div>}
        </div>
      </aside>
    </div>
  );
}
