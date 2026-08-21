import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { USER_API_KEY_COOKIE, readDelegatedCredential } from '@/lib/delegated';
import { getPersonalOverview } from '@/lib/personal';

export async function GET(request: NextRequest) {
  const user = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });

  const delegated = readDelegatedCredential(request.cookies.get(USER_API_KEY_COOKIE)?.value);
  try {
    return NextResponse.json(await getPersonalOverview(user.username, delegated));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'personal_overview_failed' }, { status: 502 });
  }
}
