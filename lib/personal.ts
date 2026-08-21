import { HUB, WIKI, stripHtml } from './federated';
import type { DelegatedCredential } from './delegated';
import { discourseAsUser } from './delegated';

const WIKI_UA = { 'user-agent': 'BITCOREOS-95/0.5 (+https://bitwiki.org)' };

async function json(url: URL | string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.errors?.[0] || data?.error || `HTTP ${response.status}`);
  return data;
}

function normalizeAction(item: any, kind: 'topic' | 'post') {
  const topicId = Number(item?.topic_id || item?.target_topic_id);
  const postNumber = Number(item?.post_number || item?.target_post_number || 1);
  const slug = String(item?.slug || item?.topic_slug || 'topic');
  return {
    id: `${kind}:${item?.id || `${topicId}-${postNumber}`}`,
    kind,
    actionType: Number(item?.action_type || (kind === 'topic' ? 4 : 5)),
    title: String(item?.title || item?.topic_title || 'Untitled'),
    excerpt: stripHtml(String(item?.excerpt || item?.cooked || '')).slice(0, 380),
    createdAt: item?.created_at,
    topicId,
    postNumber,
    url: topicId ? `${HUB}/t/${slug}/${topicId}/${postNumber}` : `${HUB}/u/${encodeURIComponent(String(item?.username || ''))}/activity`,
  };
}

async function userActions(username: string, filter: 4 | 5, limit = 20) {
  const url = new URL('/user_actions.json', HUB);
  url.searchParams.set('username', username);
  url.searchParams.set('filter', String(filter));
  url.searchParams.set('offset', '0');
  const data = await json(url, { next: { revalidate: 45 } } as RequestInit);
  return (Array.isArray(data?.user_actions) ? data.user_actions : []).slice(0, limit).map((item: any) => normalizeAction(item, filter === 4 ? 'topic' : 'post'));
}

async function wikiUser(username: string) {
  const url = new URL('/w/api.php', WIKI);
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('list', 'usercontribs');
  url.searchParams.set('ucuser', username);
  url.searchParams.set('uclimit', '25');
  url.searchParams.set('ucprop', 'ids|title|timestamp|comment|flags|sizediff');
  url.searchParams.set('prop', 'info');
  url.searchParams.set('titles', `User:${username}`);
  url.searchParams.set('inprop', 'url');
  const data = await json(url, { headers: WIKI_UA, next: { revalidate: 60 } } as RequestInit);
  const page = Array.isArray(data?.query?.pages) ? data.query.pages.find((candidate: any) => candidate?.missing === undefined && candidate?.pageid) : null;
  const contributions = (Array.isArray(data?.query?.usercontribs) ? data.query.usercontribs : []).map((item: any) => ({
    id: Number(item?.revid || item?.old_revid || 0),
    pageId: Number(item?.pageid || 0),
    title: String(item?.title || 'Untitled'),
    timestamp: item?.timestamp,
    comment: String(item?.comment || ''),
    sizeDiff: Number(item?.sizediff || 0),
    minor: Boolean(item?.minor),
    url: `${WIKI}/${encodeURIComponent(String(item?.title || '').replace(/ /g, '_'))}`,
  }));
  return {
    namespace: page ? { exists: true, title: String(page.title), pageId: Number(page.pageid), url: page.fullurl || `${WIKI}/User:${encodeURIComponent(username)}` } : { exists: false, title: `User:${username}`, url: `${WIKI}/User:${encodeURIComponent(username)}` },
    contributions,
  };
}

function normalizeSearch(data: any, state: 'bookmark' | 'tracking' | 'watching') {
  const topics = Array.isArray(data?.topics) ? data.topics : [];
  return topics.slice(0, 30).map((topic: any) => ({
    id: Number(topic?.id || 0),
    title: String(topic?.title || 'Untitled'),
    slug: String(topic?.slug || 'topic'),
    posts: Number(topic?.posts_count || 0),
    views: Number(topic?.views || 0),
    lastPostedAt: topic?.last_posted_at,
    state,
    url: `${HUB}/t/${topic?.slug || 'topic'}/${topic?.id}`,
  })).filter((topic: any) => topic.id > 0);
}

async function delegatedTopicSet(credential: DelegatedCredential, filter: 'bookmarks' | 'tracking' | 'watching') {
  const query = filter === 'bookmarks' ? 'in:bookmarks' : `in:${filter}`;
  const data = await discourseAsUser(`/search.json?q=${encodeURIComponent(query)}`, credential);
  return normalizeSearch(data, filter === 'bookmarks' ? 'bookmark' : filter);
}

export async function getPersonalOverview(username: string, delegated?: DelegatedCredential | null) {
  const [profileResult, topicsResult, postsResult, wikiResult, notificationsResult, bookmarksResult, trackingResult, watchingResult] = await Promise.allSettled([
    json(new URL(`/u/${encodeURIComponent(username)}.json`, HUB), { next: { revalidate: 45 } } as RequestInit),
    userActions(username, 4),
    userActions(username, 5),
    wikiUser(username),
    delegated ? discourseAsUser('/notifications.json?limit=20', delegated) : Promise.resolve(null),
    delegated ? delegatedTopicSet(delegated, 'bookmarks') : Promise.resolve([]),
    delegated ? delegatedTopicSet(delegated, 'tracking') : Promise.resolve([]),
    delegated ? delegatedTopicSet(delegated, 'watching') : Promise.resolve([]),
  ]);

  const profile = profileResult.status === 'fulfilled' ? profileResult.value?.user || {} : {};
  const topics = topicsResult.status === 'fulfilled' ? topicsResult.value : [];
  const posts = postsResult.status === 'fulfilled' ? postsResult.value : [];
  const wiki = wikiResult.status === 'fulfilled' ? wikiResult.value : { namespace: { exists: false, title: `User:${username}`, url: `${WIKI}/User:${encodeURIComponent(username)}` }, contributions: [] };
  const notifications = notificationsResult.status === 'fulfilled' && Array.isArray(notificationsResult.value?.notifications)
    ? notificationsResult.value.notifications.slice(0, 20).map((item: any) => ({ id: item.id, type: item.notification_type, read: Boolean(item.read), createdAt: item.created_at, data: item.data || {} }))
    : [];
  const savedSets = [bookmarksResult, trackingResult, watchingResult]
    .flatMap((result) => result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []);
  const saved = Array.from(new Map(savedSets.map((item: any) => [`${item.state}:${item.id}`, item])).values());

  return {
    username,
    profile: {
      name: profile?.name,
      avatarTemplate: profile?.avatar_template,
      trustLevel: Number(profile?.trust_level || 0),
      topicCount: Number(profile?.topic_count ?? profile?.user_stat?.topic_count ?? topics.length),
      postCount: Number(profile?.post_count ?? profile?.user_stat?.post_count ?? posts.length),
      likesReceived: Number(profile?.likes_received ?? profile?.user_stat?.likes_received ?? 0),
      likesGiven: Number(profile?.likes_given ?? profile?.user_stat?.likes_given ?? 0),
      daysVisited: Number(profile?.days_visited ?? profile?.user_stat?.days_visited ?? 0),
    },
    hub: { topics, posts },
    wiki,
    delegated: {
      connected: Boolean(delegated),
      scopes: delegated?.scopes || [],
      notifications,
      saved,
    },
  };
}
