import crypto from 'crypto';

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured');
  return crypto.createHash('sha256').update(secret).digest();
}

export function seal(value: unknown) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
}

export function unseal<T>(token?: string | null): T | null {
  if (!token) return null;
  try {
    const [ivPart, tagPart, bodyPart] = token.split('.');
    if (!ivPart || !tagPart || !bodyPart) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(bodyPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    return JSON.parse(plaintext) as T;
  } catch {
    return null;
  }
}
