import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import {
  USER_API_HANDSHAKE_COOKIE,
  USER_API_KEY_COOKIE,
  type DelegatedCredential,
  type UserApiHandshake,
} from '@/lib/delegated';
import { seal, unseal } from '@/lib/secure-cookie';

export async function GET(request: NextRequest) {
  const user = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: 'sso_identity_required' }, { status: 401 });

  const payload = request.nextUrl.searchParams.get('payload');
  const handshake = unseal<UserApiHandshake>(request.cookies.get(USER_API_HANDSHAKE_COOKIE)?.value);
  if (!payload || !handshake || handshake.expiresAt < Date.now()) {
    return NextResponse.json({ error: 'invalid_or_expired_user_api_handshake' }, { status: 400 });
  }
  if (handshake.username !== user.username) return NextResponse.json({ error: 'user_api_identity_mismatch' }, { status: 400 });

  try {
    const decrypted = crypto.privateDecrypt(
      { key: handshake.privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
      Buffer.from(payload, 'base64'),
    ).toString('utf8');
    const data = JSON.parse(decrypted);
    if (!data?.key || data?.nonce !== handshake.nonce) return NextResponse.json({ error: 'invalid_user_api_payload' }, { status: 400 });

    const credential: DelegatedCredential = {
      key: String(data.key),
      clientId: handshake.clientId,
      username: user.username,
      scopes: handshake.scopes,
      api: Number(data.api || 0) || undefined,
      createdAt: Date.now(),
    };

    const response = NextResponse.redirect(new URL('/my', request.nextUrl.origin));
    response.cookies.set(USER_API_KEY_COOKIE, seal(credential), {
      httpOnly: true,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      path: '/',
      maxAge: 180 * 24 * 60 * 60,
    });
    response.cookies.delete(USER_API_HANDSHAKE_COOKIE);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'user_api_decrypt_failed' }, { status: 400 });
  }
}
