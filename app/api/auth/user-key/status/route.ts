import { NextRequest, NextResponse } from 'next/server';
import { USER_API_KEY_COOKIE, readDelegatedCredential } from '@/lib/delegated';
import { HUB } from '@/lib/federated';

export async function GET(request: NextRequest) {
  const credential = readDelegatedCredential(request.cookies.get(USER_API_KEY_COOKIE)?.value);
  let apiVersion: string | null = null;
  try {
    const response = await fetch(new URL('/user-api-key/new', HUB), { method: 'HEAD', cache: 'no-store' });
    apiVersion = response.headers.get('Auth-Api-Version');
  } catch {}
  return NextResponse.json({
    connected: Boolean(credential),
    username: credential?.username ?? null,
    scopes: credential?.scopes ?? [],
    api: credential?.api ?? apiVersion,
    available: apiVersion !== null,
  });
}
