'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Resource } from '@/lib/resources';

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
  status: string;
  request: string;
  plan: ResearchPlan;
  evidence: Resource[];
  aiPlanned: boolean;
  execution: string;
};

export function ResearchWorkspace() {
  const [request, setRequest] = useState('');
  const [packet, setPacket] = useState<Packet | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; request: string; title: string; createdAt: string }>>([]);

  useEffect(() => {
    try {
      const seed = sessionStorage.getItem('bitcoreos-research-seed');
      if (seed) {
        sessionStorage.removeItem('bitcoreos-research-seed');
        setRequest(seed);
      }
      const raw = localStorage.getItem('bitcoreos-research-history');
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  async function deploy(event: FormEvent) {
    event.preventDefault();
    const value = request.trim();
    if (!value || loading) return;
    setLoading(true);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ request: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? 'research_failed');
      setPacket(data);
      const entry = { id: data.id, request: value, title: data.plan?.workingTitle ?? value.slice(0, 64), createdAt: new Date().toISOString() };
      setHistory((items) => {
        const next = [entry, ...items.filter((item) => item.id !== entry.id)].slice(0, 12);
        try { localStorage.setItem('bitcoreos-research-history', JSON.stringify(next)); } catch {}
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="research-workspace">
      <aside className="research-history win-panel raised">
        <div className="mini-title">REQUEST REGISTER</div>
        <div className="register-list sunken">
          {history.length === 0 && <div className="register-empty">No local research packets yet.</div>}
          {history.map((item) => (
            <div className="register-row" key={item.id}><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleDateString()}</small></div>
          ))}
        </div>
        <p>Register history is local to this browser. A future execution adapter can assign packets to the swarm without changing this cockpit schema.</p>
      </aside>

      <section className="research-main win-panel raised">
        <div className="panel-heading"><div><span className="signal-dot" />RESEARCH DEPLOYMENT</div><small>planned · evidence-aware · no automatic publishing</small></div>
        <form className="research-form" onSubmit={deploy}>
          <label>
            <span>Research request</span>
            <textarea value={request} onChange={(event) => setRequest(event.target.value)} rows={5} placeholder="Describe the question, conflict, domain, or knowledge gap that should become a well-researched BITwiki page." />
          </label>
          <div className="research-form-footer">
            <div><b>Output:</b> scope + evidence map + article outline + gaps + next actions</div>
            <button className="spectral-button" disabled={loading || !request.trim()} type="submit">{loading ? 'Compiling packet…' : 'Deploy request →'}</button>
          </div>
        </form>

        {!packet && (
          <div className="research-empty codex-field">
            <div className="foreign-geometry" aria-hidden="true"><span /><span /><span /></div>
            <div><div className="mini-title">RESEARCH IS A STATE TRANSITION</div><h2>From question → workcell → evidence → durable memory.</h2><p>The cockpit does not publish speculative text directly. It creates an explicit research packet that can be reviewed, assigned, executed, and eventually promoted into BITwiki.</p></div>
          </div>
        )}

        {packet && (
          <div className="packet-view">
            <header className="packet-header">
              <div><div className="mini-title">PACKET {packet.id.toUpperCase()}</div><h2>{packet.plan.workingTitle}</h2><p>{packet.plan.objective}</p></div>
              <div className="packet-state"><span>STATUS</span><b>{packet.status}</b><span>PLANNER</span><b>{packet.aiPlanned ? 'AI + retrieval' : 'deterministic + retrieval'}</b><span>EXECUTION</span><b>{packet.execution}</b></div>
            </header>
            <div className="packet-columns">
              <PacketList title="Questions" items={packet.plan.researchQuestions} />
              <PacketList title="Wiki structure" items={packet.plan.wikiOutline} />
              <PacketList title="Evidence gaps" items={packet.plan.evidenceGaps} />
              <PacketList title="Next actions" items={packet.plan.nextActions} />
            </div>
          </div>
        )}
      </section>

      <aside className="research-evidence win-panel raised">
        <div className="mini-title">EVIDENCE MAP</div>
        <div className="evidence-list">
          {(packet?.evidence ?? []).map((resource, index) => (
            <a href={resource.url} target="_blank" rel="noreferrer" key={resource.id} className="evidence-card">
              <span className={`source-chip ${resource.source}`}>{resource.source === 'hub' ? `H${index + 1}` : `W${index + 1}`}</span>
              <div><strong>{resource.title}</strong><small>{resource.kind}</small><p>{resource.excerpt || 'Internal source match'}</p></div>
            </a>
          ))}
          {!packet && <div className="inspector-empty">Deploy a request to map existing Hub/Wiki evidence before external research begins.</div>}
        </div>
      </aside>
    </div>
  );
}

function PacketList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="packet-list sunken"><div className="mini-title">{title.toUpperCase()}</div><ol>{(items ?? []).map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol></section>
  );
}
