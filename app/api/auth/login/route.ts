import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authConfigured, discourseSignature, SSO_NONCE_COOKIE } from '@/lib/session';
import { HUB } from '@/lib/federated';

function publicOrigin(request: NextRequest) {
  if (process.env.BITCOREOS_PUBLIC_URL) return process.env.BITCOREOS_PUBLIC_URL.replace(/\/$/, '');
  if (process.env.VERCEL_ENV === 'production') return 'https://bitcoreos-95.vercel.app';
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  if (!authConfigured()) {
    return NextResponse.redirect(new URL('/my?auth=unavailable', publicOrigin(request)));
  }

  const nonce = crypto.randomBytes(18).toString('hex');
  const callback = `${publicOrigin(request)}/api/auth/callback`;
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
    secure: true,
    path: '/',
    maxAge: 300,
  });
  return response;
}
