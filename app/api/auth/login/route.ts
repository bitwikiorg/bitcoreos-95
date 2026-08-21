import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { discourseSignature, SSO_NONCE_COOKIE } from '@/lib/session';
import { HUB } from '@/lib/federated';

export async function GET(request: NextRequest) {
  if (!process.env.DISCOURSE_SSO_SECRET || !process.env.SESSION_SECRET) {
    return NextResponse.json({ error: 'sso_not_configured', required: ['DISCOURSE_SSO_SECRET', 'SESSION_SECRET'] }, { status: 503 });
  }

  const nonce = crypto.randomBytes(18).toString('hex');
  const callback = new URL('/api/auth/callback', request.nextUrl.origin).toString();
  const payload = new URLSearchParams({ nonce, return_sso_url: callback }).toString();
  const sso = Buffer.from(payload).toString('base64');
  const sig = discourseSignature(sso);
  const target = new URL('/session/sso_provider', HUB);
  target.searchParams.set('sso', sso);
  target.searchParams.set('sig', sig);

  const response = NextResponse.redirect(target);
  response.cookies.set(SSO_NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 300,
  });
  return response;
}
