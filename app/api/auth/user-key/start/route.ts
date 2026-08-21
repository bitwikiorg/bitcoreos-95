import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { HUB } from '@/lib/federated';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { USER_API_HANDSHAKE_COOKIE, type UserApiHandshake } from '@/lib/delegated';
import { seal } from '@/lib/secure-cookie';

export async function GET(request: NextRequest) {
  const user = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: 'sso_identity_required' }, { status: 401 });
  if (!process.env.SESSION_SECRET) return NextResponse.json({ error: 'SESSION_SECRET is not configured' }, { status: 503 });

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const nonce = crypto.randomBytes(18).toString('hex');
  const clientId = `bitcoreos95-${crypto.randomBytes(12).toString('hex')}`;
  const scopes = ['read', 'session_info'];
  const callback = new URL('/api/auth/user-key/callback', request.nextUrl.origin).toString();

  const handshake: UserApiHandshake = {
    nonce,
    clientId,
    privateKey,
    username: user.username,
    scopes,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  const target = new URL('/user-api-key/new', HUB);
  target.searchParams.set('auth_redirect', callback);
  target.searchParams.set('application_name', 'BITCOREOS-95');
  target.searchParams.set('client_id', clientId);
  target.searchParams.set('nonce', nonce);
  target.searchParams.set('scopes', scopes.join(','));
  target.searchParams.set('public_key', publicKey);
  target.searchParams.set('padding', 'oaep');

  const response = NextResponse.redirect(target);
  response.cookies.set(USER_API_HANDSHAKE_COOKIE, seal(handshake), {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 10 * 60,
  });
  return response;
}
