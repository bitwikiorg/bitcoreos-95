import { NextRequest, NextResponse } from 'next/server';
import { authConfigured, SESSION_COOKIE, verifySession } from '@/lib/session';
import { HUB } from '@/lib/federated';

export async function GET(request: NextRequest) {
  const user = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ user: null, configured: authConfigured() });

  let profile = null;
  try {
    const response = await fetch(`${HUB}/u/${encodeURIComponent(user.username)}.json`, { next: { revalidate: 60 } });
    if (response.ok) {
      const data = await response.json();
      const source = data?.user ?? data;
      profile = {
        username: source?.username,
        name: source?.name,
        avatarTemplate: source?.avatar_template,
        trustLevel: source?.trust_level,
        postCount: source?.post_count,
        topicCount: source?.topic_count,
        likesReceived: source?.likes_received,
        daysVisited: source?.days_visited,
      };
    }
  } catch {
    profile = null;
  }

  return NextResponse.json({ user, profile, configured: true });
}
