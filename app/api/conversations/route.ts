import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { USER_API_KEY_COOKIE, readDelegatedCredential } from '@/lib/delegated';
import { listDelegatedConversations } from '@/lib/conversations';

export async function GET(request: NextRequest) {
  const user = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ viewer: null, delegated: false, conversations: [], sources: {} });
  }

  const credential = readDelegatedCredential(request.cookies.get(USER_API_KEY_COOKIE)?.value);
  if (!credential || credential.username !== user.username) {
    return NextResponse.json({ viewer: user.username, delegated: false, scopes: [], conversations: [], sources: {} });
  }

  try {
    const result = await listDelegatedConversations(user.username, credential);
    return NextResponse.json({ viewer: user.username, delegated: true, scopes: credential.scopes, ...result });
  } catch (error) {
    return NextResponse.json({
      viewer: user.username,
      delegated: true,
      scopes: credential.scopes,
      conversations: [],
      sources: {},
      error: error instanceof Error ? error.message : 'conversation_index_failed',
    }, { status: 502 });
  }
}
