import { NextRequest, NextResponse } from 'next/server';
import { HUB } from '@/lib/federated';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { USER_API_KEY_COOKIE, readDelegatedCredential } from '@/lib/delegated';
import { getPersonalOverview } from '@/lib/personal';
import { publicHubTopicContext, publicWikiPageContext, type ContextCapsule } from '@/lib/context';
import type { Resource } from '@/lib/resources';

function postContext(username: string, item: any): ContextCapsule {
  const topicId = Number(item?.topicId || 0);
  const postNumber = Number(item?.postNumber || 1);
  return {
    id: `post:${topicId}:${postNumber}`,
    kind: 'Forum reply',
    origin: {
      plane: 'hub',
      substrate: 'forum post',
      api: `/t/${topicId}.json`,
      canonicalRef: `discourse:topic:${topicId}:post:${postNumber}`,
      url: item?.url,
    },
    identity: { viewer: username, author: username },
    authority: { visibility: 'public', mode: 'public-read' },
    provenance: [{ relation: 'belongs-to', targetId: `topic:${topicId}`, targetKind: 'Discussion' }],
    capabilities: ['read', 'ask', 'research'],
    metadata: { topicId, postNumber, createdAt: item?.createdAt },
  };
}

function savedContext(username: string, item: any, scopes: string[]): ContextCapsule {
  const topicId = Number(item?.id || 0);
  const state = String(item?.state || 'saved');
  return {
    id: `saved:${state}:${topicId}`,
    kind: `${state[0]?.toUpperCase() || ''}${state.slice(1)} topic state`,
    origin: {
      plane: 'hub',
      substrate: 'delegated topic-state relation',
      canonicalRef: `discourse:topic:${topicId}`,
      url: item?.url,
    },
    identity: { viewer: username },
    authority: { visibility: 'private', mode: 'delegated-read', scopes },
    state: {
      bookmarked: state === 'bookmark',
      tracked: state === 'tracking',
      watched: state === 'watching',
    },
    provenance: [{ relation: 'references', targetId: `topic:${topicId}`, targetKind: 'Discussion' }],
    capabilities: ['read', 'ask', 'research'],
    metadata: { topicId, state, lastPostedAt: item?.lastPostedAt },
  };
}

function notificationContext(username: string, item: any, scopes: string[]): ContextCapsule {
  return {
    id: `notification:${item?.id}`,
    kind: 'Notification',
    origin: {
      plane: 'hub',
      substrate: 'account notification',
      api: '/notifications.json',
      canonicalRef: `discourse:notification:${item?.id}`,
      url: `${HUB}/u/${encodeURIComponent(username)}/notifications`,
    },
    identity: { viewer: username },
    authority: { visibility: 'private', mode: 'delegated-read', scopes },
    state: { unread: !Boolean(item?.read) },
    capabilities: ['read'],
    metadata: { type: item?.type, createdAt: item?.createdAt },
  };
}

export async function GET(request: NextRequest) {
  const user = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: 'not_authenticated', viewer: null, delegated: false, resources: [] }, { status: 401 });

  const delegated = readDelegatedCredential(request.cookies.get(USER_API_KEY_COOKIE)?.value);
  const credential = delegated?.username === user.username ? delegated : null;

  try {
    const data = await getPersonalOverview(user.username, credential);
    const resources: Resource[] = [];

    for (const item of data.hub.topics || []) {
      const topicId = Number(item?.topicId || 0);
      if (!topicId) continue;
      const context = publicHubTopicContext({ topicId, url: item.url, author: user.username, kind: 'Authored discussion' });
      context.identity = { ...context.identity, viewer: user.username, author: user.username };
      resources.push({
        id: `hub:${topicId}`,
        source: 'hub',
        kind: 'topic',
        title: item.title,
        excerpt: item.excerpt || 'Discussion you started.',
        url: item.url,
        author: user.username,
        metadata: { topicId, createdAt: item.createdAt, mineKind: 'authored-topic' },
        context,
      });
    }

    for (const item of data.hub.posts || []) {
      const topicId = Number(item?.topicId || 0);
      if (!topicId) continue;
      resources.push({
        id: `hub:${topicId}:post:${Number(item?.postNumber || 1)}`,
        source: 'hub',
        kind: 'post',
        title: item.title,
        excerpt: item.excerpt || `Reply ${item?.postNumber || ''}`,
        url: item.url,
        author: user.username,
        metadata: { topicId, postNumber: item.postNumber, createdAt: item.createdAt, mineKind: 'reply' },
        context: postContext(user.username, item),
      });
    }

    for (const badge of data.hub.badges || []) {
      const url = `${HUB}/u/${encodeURIComponent(user.username)}/badges`;
      resources.push({
        id: `hub:badge:${badge.id || badge.badgeId}`,
        source: 'hub',
        kind: 'badge',
        title: badge.name,
        excerpt: badge.description || `${badge.type || 'badge'} earned by @${user.username}`,
        url,
        author: user.username,
        metadata: { badgeId: badge.badgeId, grantedAt: badge.grantedAt, favorite: badge.favorite, count: badge.count, mineKind: 'badge' },
        context: {
          id: `badge:${badge.id || badge.badgeId}`,
          kind: 'Earned badge',
          origin: { plane: 'hub', substrate: 'Discourse badge grant', canonicalRef: `discourse:user-badge:${badge.id || badge.badgeId}`, url },
          identity: { viewer: user.username, author: user.username },
          authority: { visibility: 'public', mode: 'public-read' },
          capabilities: ['read', 'explore-profile'],
          metadata: { badgeId: badge.badgeId, grantedAt: badge.grantedAt, type: badge.type, favorite: badge.favorite, count: badge.count },
        },
      });
    }

    for (const item of data.wiki.contributions || []) {
      const context = publicWikiPageContext({ id: item.pageId || item.title, title: item.title, url: item.url, author: user.username, kind: 'Wiki revision', substrate: 'MediaWiki revision' });
      context.id = `revision:${item.id}`;
      context.origin.canonicalRef = `mediawiki:revision:${item.id}`;
      context.identity = { ...context.identity, viewer: user.username, author: user.username };
      context.provenance = [{ relation: 'revises', targetId: `wiki:${item.pageId || item.title}`, targetKind: 'Knowledge page', label: item.title }];
      context.metadata = { ...context.metadata, revisionId: item.id, timestamp: item.timestamp, sizeDiff: item.sizeDiff, minor: item.minor };
      resources.push({
        id: `wiki:revision:${item.id}`,
        source: 'wiki',
        kind: 'revision',
        title: item.title,
        excerpt: item.comment || `Wiki revision ${item.sizeDiff ? `${item.sizeDiff > 0 ? '+' : ''}${item.sizeDiff} bytes` : ''}`,
        url: item.url,
        author: user.username,
        metadata: { pageId: item.pageId, revisionId: item.id, timestamp: item.timestamp, sizeDiff: item.sizeDiff, mineKind: 'wiki-revision' },
        context,
      });
    }

    if (credential) {
      for (const item of data.delegated.saved || []) {
        resources.push({
          id: `hub:saved:${item.state}:${item.id}`,
          source: 'hub',
          kind: 'bookmark',
          title: item.title,
          excerpt: `${item.state} · ${item.posts || 0} posts · ${item.views || 0} views`,
          url: item.url,
          metadata: { topicId: item.id, state: item.state, lastPostedAt: item.lastPostedAt, mineKind: 'saved' },
          context: savedContext(user.username, item, credential.scopes),
        });
      }

      for (const item of data.delegated.notifications || []) {
        const title = String(item?.data?.topic_title || item?.data?.display_username || `Notification ${item.id}`);
        resources.push({
          id: `hub:notification:${item.id}`,
          source: 'hub',
          kind: 'notification',
          title,
          excerpt: item.read ? 'Read notification' : 'Unread notification',
          url: `${HUB}/u/${encodeURIComponent(user.username)}/notifications`,
          metadata: { notificationId: item.id, type: item.type, read: item.read, createdAt: item.createdAt, mineKind: 'notification' },
          context: notificationContext(user.username, item, credential.scopes),
        });
      }
    }

    resources.sort((a, b) => {
      const aTime = String(a.metadata?.createdAt || a.metadata?.timestamp || a.metadata?.lastPostedAt || a.metadata?.grantedAt || '0');
      const bTime = String(b.metadata?.createdAt || b.metadata?.timestamp || b.metadata?.lastPostedAt || b.metadata?.grantedAt || '0');
      return Date.parse(bTime) - Date.parse(aTime);
    });

    return NextResponse.json({ viewer: user.username, delegated: Boolean(credential), scopes: credential?.scopes || [], resources });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'mine_resources_failed', viewer: user.username, delegated: Boolean(credential), resources: [] }, { status: 502 });
  }
}