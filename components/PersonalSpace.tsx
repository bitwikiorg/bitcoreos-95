'use client';

import { useEffect, useMemo, useState } from 'react';

type AuthState = { user: null | { username: string; name?: string; avatarUrl?: string }; configured: boolean };
type Personal = {
  username: string;
  profile: { name?: string; avatarTemplate?: string; trustLevel: number; topicCount: number; postCount: number; likesReceived: number; likesGiven: number; daysVisited: number };
  hub: { topics: any[]; posts: any[] };
  wiki: { namespace: { exists: boolean; title: string; url: string }; contributions: any[] };
  delegated: { connected: boolean; scopes: string[]; notifications: any[]; saved: any[] };
};

type Tab = 'trail' | 'wiki' | 'inbox';

function avatarUrl(template?: string) {
  if (!template) return '';
  const path = template.replace('{size}', '120');
  return path.startsWith('http') ? path : `https://hub.bitwiki.org${path}`;
}

export function PersonalSpace() {
  const [auth, setAuth] = useState<AuthState>({ user: null, configured: false });
  const [data, setData] = useState<Personal | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('trail');

  async function load() {
    setLoading(true);
    try {
      const authResponse = await fetch('/api/auth/me', { credentials: 'include' });
      const authData = authResponse.ok ? await authResponse.json() : { user: null, configured: false };
      setAuth(authData);
      if (authData?.user) {
        const response = await fetch('/api/me/overview', { credentials: 'include', cache: 'no-store' });
        if (response.ok) setData(await response.json());
      } else {
        setData(null);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const activity = useMemo(() => [...(data?.hub.topics || []), ...(data?.hub.posts || [])]
    .sort((a, b) => Date.parse(b.createdAt || '0') - Date.parse(a.createdAt || '0')), [data]);

  async function disconnect() {
    await fetch('/api/auth/user-key/disconnect', { method: 'POST', credentials: 'include' });
    await load();
  }

  if (loading) return <div className="personal-loading">Loading workspace…</div>;

  if (!auth.user) {
    return (
      <div className="personal-space anonymous-space">
        <header className="personal-header win-panel raised">
          <div className="personal-identity">
            <div className="avatar-fallback anonymous-avatar">◇</div>
            <div><div className="mini-title">MY BITHUB // PUBLIC SESSION</div><h1>Anonymous</h1><p>@anonymous · public access</p></div>
          </div>
          <div className="personal-metrics" aria-label="Anonymous access state">
            <StatusToken label="Access" value="PUBLIC" />
            <StatusToken label="Mode" value="READ" />
            <StatusToken label="Identity" value="GUEST" />
          </div>
        </header>

        <section className="personal-body win-panel raised anonymous-body">
          <div className="anonymous-primary">
            <div className="mini-title">ANONYMOUS WORKSPACE</div>
            <h2>Use the public ecosystem immediately.</h2>
            <p>Ask across BIThub and BITwiki, research missing knowledge, browse discussions and system surfaces, or sign in to attach your BIThub identity and organize your own work.</p>
            <div className="anonymous-actions">
              <a className="spectral-button inline-action" href="/api/auth/login">Sign in with BIThub</a>
              <a className="inline-action" href="/ask">Ask</a>
              <a className="inline-action" href="/research">Research</a>
              <a className="inline-action" href="/explorer">Explore</a>
            </div>
          </div>
          <div className="anonymous-capabilities">
            <div><b>Available now</b><span>Public search, source reading, Ask, Research, feeds, spaces, agents, and knowledge graph.</span></div>
            <div><b>After BIThub sign-in</b><span>Your topics, replies, contribution trail, BITwiki identity projection, saved work, and user-scoped state.</span></div>
          </div>
        </section>
      </div>
    );
  }

  if (!data) return <div className="personal-gate win-panel raised">Unable to load your workspace.</div>;

  const avatar = avatarUrl(data.profile.avatarTemplate) || auth.user.avatarUrl || '';
  const mix = { topics: data.hub.topics.length, replies: data.hub.posts.length, wiki: data.wiki.contributions.length };
  const mixTotal = Math.max(1, mix.topics + mix.replies + mix.wiki);
  const saved = Array.isArray(data.delegated.saved) ? data.delegated.saved : [];

  return (
    <div className="personal-space">
      <header className="personal-header win-panel raised">
        <div className="personal-identity">
          {avatar ? <img src={avatar} alt="" /> : <div className="avatar-fallback">@</div>}
          <div><div className="mini-title">MY BITHUB // PERSONAL WORKSPACE</div><h1>{data.profile.name || `@${data.username}`}</h1><p>@{data.username} · trust level {data.profile.trustLevel}</p></div>
        </div>
        <div className="personal-metrics" aria-label="Contribution metrics">
          <Metric label="Topics" value={data.profile.topicCount} />
          <Metric label="Replies" value={data.profile.postCount} />
          <Metric label="Likes received" value={data.profile.likesReceived} />
          <Metric label="Days visited" value={data.profile.daysVisited} />
        </div>
      </header>

      <nav className="personal-tabs" aria-label="Personal workspace views">
        <button data-active={tab === 'trail'} onClick={() => setTab('trail')}>Contribution trail</button>
        <button data-active={tab === 'wiki'} onClick={() => setTab('wiki')}>BITwiki</button>
        <button data-active={tab === 'inbox'} onClick={() => setTab('inbox')}>Saved + inbox</button>
      </nav>

      <section className="personal-body win-panel raised">
        {tab === 'trail' && (
          <div className="trail-view">
            <div className="contribution-mix" aria-label="Recent contribution mix">
              <div className="mix-copy"><b>Recent contribution mix</b><span>Retrieved activity, not an XP score.</span></div>
              <div className="mix-track">
                <span className="mix-topic" style={{ width: `${(mix.topics / mixTotal) * 100}%` }} />
                <span className="mix-reply" style={{ width: `${(mix.replies / mixTotal) * 100}%` }} />
                <span className="mix-wiki" style={{ width: `${(mix.wiki / mixTotal) * 100}%` }} />
              </div>
              <div className="mix-legend"><span>■ {mix.topics} starts</span><span>■ {mix.replies} replies</span><span>■ {mix.wiki} wiki edits</span></div>
            </div>
            <div className="personal-section-head"><div><b>Recent work</b><span>Topics you started and replies you made, merged by time.</span></div><a href={`https://hub.bitwiki.org/u/${encodeURIComponent(data.username)}/activity`} target="_blank" rel="noreferrer">Full activity ↗</a></div>
            <div className="trail-list">
              {activity.slice(0, 24).map((item) => <ActivityRow key={item.id} item={item} />)}
              {!activity.length && <div className="quiet-empty">No public activity returned.</div>}
            </div>
          </div>
        )}

        {tab === 'wiki' && (
          <div className="wiki-personal-view">
            <div className="namespace-card">
              <div className="mini-title">MATCHING USER NAMESPACE</div>
              <h2>{data.wiki.namespace.title}</h2>
              <p>{data.wiki.namespace.exists ? 'A public MediaWiki User: page exists under the same username. This remains a username match until BIThub and BITwiki share a verified identity bridge.' : 'No public User: page exists under the same username. A unified Hub/Wiki identity can later make this a durable user-owned knowledge surface.'}</p>
              <a href={data.wiki.namespace.url} target="_blank" rel="noreferrer">Open namespace ↗</a>
            </div>
            <div className="wiki-contrib-list">
              <div className="personal-section-head"><div><b>Matching wiki contributions</b><span>MediaWiki contribution history for the same username.</span></div></div>
              {data.wiki.contributions.map((item) => (
                <a className="wiki-contrib-row" href={item.url} target="_blank" rel="noreferrer" key={`${item.id}-${item.title}`}>
                  <strong>{item.title}</strong><span>{item.comment || 'edit'}</span><small>{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}{item.sizeDiff ? ` · ${item.sizeDiff > 0 ? '+' : ''}${item.sizeDiff} bytes` : ''}</small>
                </a>
              ))}
              {!data.wiki.contributions.length && <div className="quiet-empty">No public MediaWiki contributions matched this username.</div>}
            </div>
          </div>
        )}

        {tab === 'inbox' && (
          <div className="private-workspace">
            <div className="delegated-card">
              <div className="mini-title">PRIVATE BITHUB STATE</div>
              {data.delegated.connected ? (
                <div className="delegated-status"><div><h2>Connected as @{data.username}</h2><p>Saved work and notifications are projected from your scoped BIThub access.</p></div><button onClick={disconnect}>Disconnect</button></div>
              ) : (
                <><h2>Public identity connected</h2><p>Connect private state to bring bookmarks, tracking, watching, and notifications into this workspace.</p><a className="spectral-button inline-action" href="/api/auth/user-key/start">Connect private state</a></>
              )}
            </div>

            {data.delegated.connected && (
              <div className="private-columns">
                <section>
                  <div className="personal-section-head"><div><b>Saved work</b><span>Bookmarks, tracked topics, and watched topics.</span></div><small>{saved.length}</small></div>
                  <div className="saved-topic-list">
                    {saved.slice(0, 24).map((item) => <a className="saved-topic-row" href={item.url} target="_blank" rel="noreferrer" key={`${item.state}-${item.id}`}><span className={`saved-state ${item.state}`}>{item.state}</span><div><strong>{item.title}</strong><small>{item.posts || 0} posts · {item.views || 0} views</small></div></a>)}
                    {!saved.length && <div className="quiet-empty">No bookmarked, tracked, or watched topics returned.</div>}
                  </div>
                </section>

                <section>
                  <div className="personal-section-head"><div><b>Inbox</b><span>Recent BIThub notifications.</span></div><small>{data.delegated.notifications.length}</small></div>
                  <div className="notification-list">
                    {data.delegated.notifications.map((item) => <div className="notification-row" key={item.id}><b>{item.read ? 'read' : 'new'}</b><span>{item.data?.topic_title || item.data?.display_username || `Notification ${item.id}`}</span><small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</small></div>)}
                    {!data.delegated.notifications.length && <div className="quiet-empty">No recent notifications.</div>}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric-token"><b>{value.toLocaleString()}</b><span>{label}</span></div>;
}

function StatusToken({ label, value }: { label: string; value: string }) {
  return <div className="metric-token status-token"><b>{value}</b><span>{label}</span></div>;
}

function ActivityRow({ item }: { item: any }) {
  return (
    <a className="activity-row" href={item.url} target="_blank" rel="noreferrer">
      <span className={`activity-kind ${item.kind}`}>{item.kind === 'topic' ? 'START' : 'POST'}</span>
      <div><strong>{item.title}</strong><p>{item.excerpt || 'Open this activity on BIThub.'}</p></div>
      <small>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</small>
    </a>
  );
}
