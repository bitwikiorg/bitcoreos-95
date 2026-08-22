import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { USER_API_KEY_COOKIE, readDelegatedCredential } from '@/lib/delegated';
import { listDelegatedConversations } from '@/lib/conversations';
import { listPublicConversations } from '@/lib/public-conversations';

export async function GET(request: NextRequest) {
  const user = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const publicResult = await listPublicConversations().catch((error) => ({
    conversations: [],
    sources: { core: { ok: false, count: 0, error: error instanceof Error ? error.message : 'public_conversation_read_failed' } },
  }));

  if (!user) {
    return NextResponse.json({ viewer: null, delegated: false, conversations: publicResult.conversations, sources: publicResult.sources });
  }

  const credential = readDelegatedCredential(request.cookies.get(USER_API_KEY_COOKIE)?.value);
  if (!credential || credential.username !== user.username) {
    return NextResponse.json({ viewer: user.username, delegated: false, scopes: [], conversations: publicResult.conversations, sources: publicResult.sources });
  }

  try {
    const delegatedResult = await listDelegatedConversations(user.username, credential);
    const conversations = [...publicResult.conversations, ...delegatedResult.conversations]
      .filter((item, index, rows) => rows.findIndex((candidate) => candidate.id === item.id) === index)
      .sort((a, b) => Date.parse(b.lastActivity || '0') - Date.parse(a.lastActivity || '0'));

    return NextResponse.json({
      viewer: user.username,
      delegated: true,
      scopes: credential.scopes,
      conversations,
      sources: { ...publicResult.sources, ...delegatedResult.sources },
    });
  } catch (error) {
    return NextResponse.json({
      viewer: user.username,
      delegated: true,
      scopes: credential.scopes,
      conversations: publicResult.conversations,
      sources: publicResult.sources,
      error: error instanceof Error ? error.message : 'conversation_index_failed',
    }, { status: 502 });
  }
}
