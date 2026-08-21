import { NextRequest, NextResponse } from 'next/server';
import { USER_API_KEY_COOKIE, readDelegatedCredential, userApiHeaders } from '@/lib/delegated';
import { HUB } from '@/lib/federated';

export async function POST(request: NextRequest) {
  const credential = readDelegatedCredential(request.cookies.get(USER_API_KEY_COOKIE)?.value);
  if (credential) {
    await fetch(new URL('/user-api-key/revoke', HUB), {
      method: 'POST',
      headers: userApiHeaders(credential),
      cache: 'no-store',
    }).catch(() => null);
  }
  const response = NextResponse.json({ disconnected: true });
  response.cookies.delete(USER_API_KEY_COOKIE);
  return response;
}
