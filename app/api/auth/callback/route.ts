import { NextRequest, NextResponse } from 'next/server';
import {
  discourseSignature,
  secureEqualHex,
  SESSION_COOKIE,
  signSession,
  SSO_NONCE_COOKIE,
  type SessionUser,
} from '@/lib/session';

function publicOrigin(request: NextRequest) {
  if (process.env.BITCOREOS_PUBLIC_URL) return process.env.BITCOREOS_PUBLIC_URL.replace(/\/$/, '');
  if (process.env.VERCEL_ENV === 'production') return 'https://bitcoreos-95.vercel.app';
  return request.nextUrl.origin;
}

function fail(request: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/my?auth=${encodeURIComponent(code)}`, publicOrigin(request)));
}

export async function GET(request: NextRequest) {
  const sso = request.nextUrl.searchParams.get('sso');
  const sig = request.nextUrl.searchParams.get('sig');
  if (!sso || !sig) return fail(request, 'incomplete');

  try {
    const expected = discourseSignature(sso);
    if (!secureEqualHex(expected, sig)) return fail(request, 'invalid');

    const decoded = Buffer.from(sso, 'base64').toString('utf8');
    const params = new URLSearchParams(decoded);
    const nonce = request.cookies.get(SSO_NONCE_COOKIE)?.value;
    if (!nonce || params.get('nonce') !== nonce) return fail(request, 'expired');

    const username = params.get('username');
    if (!username) return fail(request, 'invalid');

    const user: SessionUser = {
      externalId: params.get('external_id') ?? undefined,
      username,
      name: params.get('name') ?? undefined,
      avatarUrl: params.get('avatar_url') ?? undefined,
      admin: params.get('admin') === 'true',
      groups: (params.get('groups') ?? '').split(',').map((group) => group.trim()).filter(Boolean),
    };

    const response = NextResponse.redirect(new URL('/my', publicOrigin(request)));
    response.cookies.set(SESSION_COOKIE, signSession(user), {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.delete(SSO_NONCE_COOKIE);
    return response;
  } catch {
    return fail(request, 'failed');
  }
}
