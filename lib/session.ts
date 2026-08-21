import crypto from 'crypto';

export const SESSION_COOKIE = 'bitcoreos_session';
export const SSO_NONCE_COOKIE = 'bitcoreos_sso_nonce';

export type SessionUser = {
  externalId?: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  admin?: boolean;
  groups?: string[];
};

type SignedPayload = {
  user: SessionUser;
  iat: number;
  exp: number;
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error('SESSION_SECRET is not configured');
  return value;
}

function base64url(value: Buffer | string) {
  return Buffer.from(value).toString('base64url');
}

function signature(value: string) {
  return crypto.createHmac('sha256', secret()).update(value).digest('base64url');
}

export function signSession(user: SessionUser) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SignedPayload = { user, iat: now, exp: now + 7 * 24 * 60 * 60 };
  const body = base64url(JSON.stringify(payload));
  return `${body}.${signature(body)}`;
}

export function verifySession(token?: string | null): SessionUser | null {
  if (!token) return null;
  try {
    const [body, supplied] = token.split('.');
    if (!body || !supplied) return null;
    const expected = signature(body);
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SignedPayload;
    if (!payload?.user?.username || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.user;
  } catch {
    return null;
  }
}

export function discourseSignature(payload: string) {
  const value = process.env.DISCOURSE_SSO_SECRET;
  if (!value) throw new Error('DISCOURSE_SSO_SECRET is not configured');
  return crypto.createHmac('sha256', value).update(payload).digest('hex');
}

export function secureEqualHex(a: string, b: string) {
  try {
    const x = Buffer.from(a, 'hex');
    const y = Buffer.from(b, 'hex');
    return x.length === y.length && crypto.timingSafeEqual(x, y);
  } catch {
    return false;
  }
}

export function authConfigured() {
  return Boolean(process.env.DISCOURSE_SSO_SECRET && process.env.SESSION_SECRET);
}
