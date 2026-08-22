import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { HUB } from '@/lib/federated';
import { authConfigured, SESSION_COOKIE, verifySession } from '@/lib/session';
import { USER_API_HANDSHAKE_COOKIE, type UserApiHandshake } from '@/lib/delegated';
import { seal } from '@/lib/secure-cookie';

function safeReturnPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/my';
  return value.slice(0, 300);
}

export async function GET(request: NextRequest) {
  const user = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: 'sso_identity_required' }, { status: 401 });
  if (!authConfigured()) return NextResponse.json({ error: 'authentication_unavailable' }, { status: 503 });

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  const nonce = crypto.randomBytes(18).toString('hex');
  const clientId = `bitcoreos95-${crypto.randomBytes(12).toString('hex')}`;
  const scopes = ['read', 'session_info'];
  const returnPath = safeReturnPath(request.nextUrl.searchParams.get('return'));
  const publicOrigin = process.env.BITCOREOS_PUBLIC_URL?.replace(/\/$/, '') || (process.env.VERCEL_ENV === 'production' ? 'https://bitcoreos-95.vercel.app' : request.nextUrl.origin);
  const callback = `${publicOrigin}/api/auth/user-key/callback`;

  const handshake: UserApiHandshake = {
    nonce,
    clientId,
    privateKey,
    username: user.username,
    scopes,
    expiresAt: Date.now() + 10 * 60 * 1000,
    returnPath,
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
    secure: true,
    path: '/',
    maxAge: 10 * 60,
  });
  return response;
}
