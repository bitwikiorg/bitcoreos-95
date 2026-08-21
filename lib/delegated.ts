import { HUB } from './federated';
import { unseal } from './secure-cookie';

export const USER_API_KEY_COOKIE = 'bitcoreos_user_api_key';
export const USER_API_HANDSHAKE_COOKIE = 'bitcoreos_user_api_handshake';

export type DelegatedCredential = {
  key: string;
  clientId: string;
  username: string;
  scopes: string[];
  api?: number;
  createdAt: number;
};

export type UserApiHandshake = {
  nonce: string;
  clientId: string;
  privateKey: string;
  username: string;
  scopes: string[];
  expiresAt: number;
};

export function readDelegatedCredential(token?: string | null) {
  const value = unseal<DelegatedCredential>(token);
  if (!value?.key || !value?.clientId || !value?.username) return null;
  return value;
}

export function userApiHeaders(credential: DelegatedCredential) {
  return {
    'User-Api-Key': credential.key,
    'User-Api-Client-Id': credential.clientId,
    accept: 'application/json',
  };
}

export async function discourseAsUser(path: string, credential: DelegatedCredential, init?: RequestInit) {
  const response = await fetch(new URL(path, HUB), {
    ...init,
    headers: { ...userApiHeaders(credential), ...(init?.headers || {}) },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.errors?.[0] || data?.error || `discourse_http_${response.status}`);
  return data;
}
