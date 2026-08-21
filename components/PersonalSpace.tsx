'use client';

import { useEffect, useMemo, useState } from 'react';

type AuthState = { user: null | { username: string; name?: string; avatarUrl?: string }; configured: boolean };
type Personal = {
  username: string;
  profile: { name?: string; avatarTemplate?: string; trustLevel: number; topicCount: number; postCount: number; likesReceived: number; likesGiven: number; daysVisited: number };
  hub: { topics: any[]; posts: any[] };
  wiki: { namespace: { exists: boolean; title: string; url: string }; contributions: any[] };
  delegated: { connected: boolean; scopes: string[]; notifications: any[] };
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
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const activity = useMemo(() => [...(data?.hub.topics || []), ...(data?.hub.posts || [])]
    .sort((a, b) => Date.parse(b.createdAt || '0') - Date.parse(a.createdAt || '0')), [data]);

  async function disconnect() {
    await fetch('/api/auth/user-key/disconnect', { method: 'POST', credentials: 'include' });
    await load();
  }

  if (loading) return <div className="personal-loading">Loading your workspace…</div>;

  if (!auth.user) {
    return (
      <div className="personal-gate win-panel raised">
        <div className="mini-title">MY BITHUB</div>
        <h1>Your work, without the forum maze.</h1>
        <p>Topics, replies, BITwiki contributions, and delegated private state are organized here around your identity.</p>
        {auth.configured
          ? <a className="spectral-button inline-action" href="/api/auth/login">Sign in with BIThub</a>
          : <div className="gate-note">Identity wiring is implemented, but the production DiscourseConnect secrets are not configured yet.</div>}
      </div>
    );
  }

  if (!data) return <div className="personal-gate win-panel raised">Unable to load the personal projection.</div>;

  const avatar = avatarUrl(data.profile.avatarTemplate) || auth.user.avatarUrl || '';

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
        <button data-active={tab === 'inbox'} onClick={() => setTab('inbox')}>Inbox</button>
      </nav>

      <section className="personal-body win-panel raised">
        {tab === 'trail' && (
          <div className="trail-view">
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
              <div className="mini-title">USER NAMESPACE</div>
              <h2>{data.wiki.namespace.title}</h2>
              <p>{data.wiki.namespace.exists ? 'A public MediaWiki user-namespace page exists for this identity.' : 'No matching public User: page exists yet. Once Hub/Wiki identity is unified, this namespace can become a durable user-owned knowledge surface.'}</p>
              <a href={data.wiki.namespace.url} target="_blank" rel="noreferrer">Open namespace ↗</a>
            </div>
            <div className="wiki-contrib-list">
              <div className="personal-section-head"><div><b>Recent wiki contributions</b><span>Direct MediaWiki contribution history for the same username.</span></div></div>
              {data.wiki.contributions.map((item) => (
                <a className="wiki-contrib-row" href={item.url} target="_blank" rel="noreferrer" key={`${item.id}-${item.title}`}>
                  <strong>{item.title}</strong><span>{item.comment || 'edit'}</span><small>{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ''}{item.sizeDiff ? ` · ${item.sizeDiff > 0 ? '+' : ''}${item.sizeDiff} bytes` : ''}</small>
                </a>
              ))}
              {!data.wiki.contributions.length && <div className="quiet-empty">No matching public MediaWiki contributions.</div>}
            </div>
          </div>
        )}

        {tab === 'inbox' && (
          <div className="inbox-view">
            <div className="delegated-card">
              <div className="mini-title">DELEGATED BITHUB ACCESS</div>
              {data.delegated.connected ? (
                <><h2>Connected as @{data.username}</h2><p>BITCOREOS-95 has a scoped user API key for this browser session family: {data.delegated.scopes.join(', ') || 'read'}.</p><button onClick={disconnect}>Disconnect + revoke</button></>
              ) : (
                <><h2>Public projection only</h2><p>Your public posts already work through native APIs. Connect scoped access to surface notifications and other user-only state without using an administrator key.</p><a className="spectral-button inline-action" href="/api/auth/user-key/start">Connect scoped BIThub access</a></>
              )}
            </div>
            <div className="notification-list">
              {data.delegated.notifications.map((item) => <div className="notification-row" key={item.id}><b>{item.read ? 'read' : 'new'}</b><span>{item.data?.topic_title || item.data?.display_username || `Notification ${item.id}`}</span><small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</small></div>)}
              {data.delegated.connected && !data.delegated.notifications.length && <div className="quiet-empty">No notifications returned for the delegated scope.</div>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric-token"><b>{value.toLocaleString()}</b><span>{label}</span></div>;
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
