import { NextRequest, NextResponse } from 'next/server';
import {
  discourseSignature,
  secureEqualHex,
  SESSION_COOKIE,
  signSession,
  SSO_NONCE_COOKIE,
  type SessionUser,
} from '@/lib/session';

export async function GET(request: NextRequest) {
  const sso = request.nextUrl.searchParams.get('sso');
  const sig = request.nextUrl.searchParams.get('sig');
  if (!sso || !sig) return NextResponse.json({ error: 'missing_sso_payload' }, { status: 400 });

  try {
    const expected = discourseSignature(sso);
    if (!secureEqualHex(expected, sig)) return NextResponse.json({ error: 'invalid_sso_signature' }, { status: 400 });

    const decoded = Buffer.from(sso, 'base64').toString('utf8');
    const params = new URLSearchParams(decoded);
    const nonce = request.cookies.get(SSO_NONCE_COOKIE)?.value;
    if (!nonce || params.get('nonce') !== nonce) return NextResponse.json({ error: 'invalid_sso_nonce' }, { status: 400 });

    const username = params.get('username');
    if (!username) return NextResponse.json({ error: 'missing_username' }, { status: 400 });

    const user: SessionUser = {
      externalId: params.get('external_id') ?? undefined,
      username,
      name: params.get('name') ?? undefined,
      avatarUrl: params.get('avatar_url') ?? undefined,
      admin: params.get('admin') === 'true',
      groups: (params.get('groups') ?? '').split(',').map((group) => group.trim()).filter(Boolean),
    };

    const response = NextResponse.redirect(new URL('/', request.nextUrl.origin));
    response.cookies.set(SESSION_COOKIE, signSession(user), {
      httpOnly: true,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.delete(SSO_NONCE_COOKIE);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'sso_callback_failed' }, { status: 500 });
  }
}
