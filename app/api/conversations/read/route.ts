import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { USER_API_KEY_COOKIE, readDelegatedCredential } from '@/lib/delegated';
import { readDelegatedConversation, type ConversationKind } from '@/lib/conversations';

const KINDS = new Set<ConversationKind>(['pm', 'construct', 'chat-dm', 'chat-channel', 'chat-thread', 'topic', 'core-run', 'node-run', 'mas']);

export async function GET(request: NextRequest) {
  const user = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: 'sign_in_required' }, { status: 401 });

  const credential = readDelegatedCredential(request.cookies.get(USER_API_KEY_COOKIE)?.value);
  if (!credential || credential.username !== user.username) {
    return NextResponse.json({ error: 'conversation_access_required' }, { status: 403 });
  }

  const kind = request.nextUrl.searchParams.get('kind') as ConversationKind | null;
  const id = Number(request.nextUrl.searchParams.get('id'));
  const channelIdRaw = request.nextUrl.searchParams.get('channelId');
  const channelId = channelIdRaw ? Number(channelIdRaw) : undefined;

  if (!kind || !KINDS.has(kind) || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'invalid_conversation_ref' }, { status: 400 });
  }
  if (channelId !== undefined && (!Number.isInteger(channelId) || channelId <= 0)) {
    return NextResponse.json({ error: 'invalid_channel_ref' }, { status: 400 });
  }

  try {
    return NextResponse.json(await readDelegatedConversation({ kind, id, channelId }, user.username, credential));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'conversation_read_failed' }, { status: 502 });
  }
}
